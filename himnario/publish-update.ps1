param(
    [Parameter(Mandatory = $true)]
    [string]$Message,
    [ValidateSet('production', 'preview', 'development')]
    [string]$Branch = 'production'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot

Write-Host "Publishing EAS Update to branch '$Branch' with message: '$Message'..." -ForegroundColor Cyan
& eas update --branch $Branch --message $Message

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nUpdate published successfully!" -ForegroundColor Green
    Write-Host "Target audience: $(if ($Branch -eq 'production') { 'TestFlight & App Store users' } else { 'Preview APK users' })"
    Write-Host "Users will receive the update automatically next time they reopen the app."
} else {
    Write-Error "EAS Update failed."
}

