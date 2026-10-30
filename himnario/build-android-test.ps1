# Builds a quick Android test APK (modern phones only) on EAS. Does not touch production or the Play Store.
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot
eas whoami
if ($LASTEXITCODE -ne 0) { eas login }
# Android streams its audio, so leave the 1.3 GB audio folder out of this upload only.
# The original .easignore is always restored, because iOS builds need that folder.
$ignorePath = Join-Path $PSScriptRoot '.easignore'
$originalIgnore = [System.IO.File]::ReadAllText($ignorePath)
try {
    [System.IO.File]::WriteAllText($ignorePath, $originalIgnore + "`r`n# temporary: Android build`r`nassets/audio/`r`nassets/audio/**/*`r`n")
    eas build --platform android --profile preview-arm64
} finally {
    [System.IO.File]::WriteAllText($ignorePath, $originalIgnore)
}
Write-Host ""
Write-Host "Done. Open the build link above on your Android phone to install the APK."
Read-Host "Press Enter to close"
