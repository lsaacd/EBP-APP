# Builds the Google Play release (.aab) for Android on EAS, signed with the app's real key.
# Android only: does not build iOS, publish an update, or submit to Google Play.
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot
eas whoami
if ($LASTEXITCODE -ne 0) { eas login }
Write-Host ""
Write-Host "Building the Android production .aab (all phone types). This takes longer than a test build."
eas build --platform android --profile production
Write-Host ""
Write-Host "Done. Download the .aab from the build page above and upload it in Google Play Console > Testing > Internal testing."
Read-Host "Press Enter to close"
