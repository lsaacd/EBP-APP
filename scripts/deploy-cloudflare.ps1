param(
    [Parameter(Mandatory = $true)]
    [string]$AudioBaseUrl,
    [string]$R2Bucket = 'ebp-himnario-audio',
    [string]$PagesProject = 'ebp-himnario',
    [switch]$SkipAudioUpload
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$env:WRANGLER_CACHE_DIR = Join-Path $repoRoot '.wrangler-cache'
$docsPath = Join-Path $repoRoot 'docs'
$audioPath = Join-Path $docsPath 'audio'
$stagePath = Join-Path $repoRoot '.cloudflare-pages-stage'
$expectedStagePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.cloudflare-pages-stage'))
$resolvedStagePath = [System.IO.Path]::GetFullPath($stagePath)

if ($resolvedStagePath -ne $expectedStagePath -or -not $resolvedStagePath.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to use an unexpected staging path: $resolvedStagePath"
}
if (-not (Test-Path -LiteralPath $docsPath -PathType Container)) { throw "Site folder not found: $docsPath" }
if (-not (Test-Path -LiteralPath $audioPath -PathType Container)) { throw "Audio folder not found: $audioPath" }
if ($PagesProject -notmatch '^[a-z0-9][a-z0-9-]{0,57}$') { throw 'Pages project name must use lowercase letters, numbers, and hyphens.' }
if ($R2Bucket -notmatch '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$') { throw 'R2 bucket name must use lowercase letters, numbers, and hyphens.' }

$audioUri = $null
if (-not [Uri]::TryCreate($AudioBaseUrl, [UriKind]::Absolute, [ref]$audioUri) -or $audioUri.Scheme -ne 'https' -or $audioUri.Query -or $audioUri.Fragment) {
    throw 'AudioBaseUrl must be an HTTPS public R2 URL with no query string or fragment.'
}
$publicAudioBase = $AudioBaseUrl.TrimEnd('/') + '/'

Write-Host 'Checking Cloudflare authentication...'
& npx --yes wrangler whoami
if ($LASTEXITCODE -ne 0) { throw 'Cloudflare authentication is required. Run: npx wrangler login' }

if (-not $SkipAudioUpload) {
    $audioFiles = @(Get-ChildItem -LiteralPath $audioPath -File -Filter '*.m4a')
    Write-Host "Uploading $($audioFiles.Count) recordings to R2 bucket '$R2Bucket'..."
    $index = 0
    foreach ($file in $audioFiles) {
        $index++
        Write-Progress -Activity 'Uploading recordings to Cloudflare R2' -Status "$index / $($audioFiles.Count): $($file.Name)" -PercentComplete (($index / $audioFiles.Count) * 100)
        & npx --yes wrangler r2 object put "$R2Bucket/$($file.Name)" "--file=$($file.FullName)" --content-type audio/mp4 --remote
        if ($LASTEXITCODE -ne 0) { throw "R2 upload failed for $($file.Name). The site has not been deployed." }
    }
    Write-Progress -Activity 'Uploading recordings to Cloudflare R2' -Completed
}

Write-Host 'Preparing the static Pages deployment (recordings stay in R2)...'
if (Test-Path -LiteralPath $resolvedStagePath) {
    Remove-Item -LiteralPath $resolvedStagePath -Recurse -Force
}
New-Item -ItemType Directory -Path $resolvedStagePath | Out-Null
& robocopy $docsPath $resolvedStagePath /E /XD $audioPath /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) { throw "Could not prepare the Pages staging copy (robocopy exit code $LASTEXITCODE)." }

$configPath = Join-Path $resolvedStagePath 'js\storage-config.js'
if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) { throw "Audio configuration file missing from staging copy: $configPath" }
$escapedAudioBase = $publicAudioBase.Replace("'", "\'")
Set-Content -LiteralPath $configPath -Value "window.EBP_AUDIO_BASE_URL = '$escapedAudioBase';" -Encoding utf8

Write-Host "Publishing Pages project '$PagesProject'..."
& npx --yes wrangler pages deploy $resolvedStagePath --project-name $PagesProject --branch main
if ($LASTEXITCODE -ne 0) { throw 'Cloudflare Pages deployment failed. R2 recordings remain uploaded.' }

Write-Host 'Deployment complete.'
