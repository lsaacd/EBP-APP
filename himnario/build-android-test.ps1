# Builds a quick Android test APK (modern phones only) on EAS. Does not touch production or the Play Store.
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot
eas whoami
if ($LASTEXITCODE -ne 0) { eas login }
eas build --platform android --profile preview-arm64
Write-Host ""
Write-Host "Done. Open the build link above on your Android phone to install the APK."
Read-Host "Press Enter to close"
