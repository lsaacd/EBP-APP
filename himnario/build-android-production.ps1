# Builds the Google Play release (.aab) for Android on EAS, signed with the app's real key.
# Android only: does not build iOS, publish an update, or submit to Google Play.
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot
eas whoami
if ($LASTEXITCODE -ne 0) { eas login }
Write-Host ""
Write-Host "Building the Android production .aab (all phone types). This takes longer than a test build."
# Android streams its audio, so leave the 1.3 GB audio folder out of this upload only.
# The original .easignore is always restored, because iOS builds need that folder.
$ignorePath = Join-Path $PSScriptRoot '.easignore'
$originalIgnore = [System.IO.File]::ReadAllText($ignorePath)
try {
    [System.IO.File]::WriteAllText($ignorePath, $originalIgnore + "`r`n# temporary: Android build`r`nassets/audio/`r`nassets/audio/**/*`r`n")
    eas build --platform android --profile production
} finally {
    [System.IO.File]::WriteAllText($ignorePath, $originalIgnore)
}
Write-Host ""
Write-Host "Done. Download the .aab from the build page above and upload it in Google Play Console > Testing > Internal testing."
Read-Host "Press Enter to close"
