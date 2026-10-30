# Builds the iOS release (.ipa) on EAS and auto-submits to App Store Connect / TestFlight.
# Right-click -> Run with PowerShell
Set-Location -LiteralPath $PSScriptRoot
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = $PSScriptRoot
$env:EAS_SKIP_AUTO_FINGERPRINT = '1'

eas whoami
if ($LASTEXITCODE -ne 0) { eas login }

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " STEP 1: Refresh iOS Provisioning Profile (Associated Domains)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "In the menu below:"
Write-Host "  1. Select 'production'"
Write-Host "  2. Select 'Build Credentials: Manage everything needed to build your project'"
Write-Host "  3. Select 'Provisioning Profile: Delete, view, or regenerate...'"
Write-Host "  4. Choose 'Remove Provisioning Profile' (or 'Set up a new Provisioning Profile')"
Write-Host "     and log in with your Apple ID + 2FA when prompted so Expo enables"
Write-Host "     Associated Domains on com.elbuenpastor."
Write-Host "  5. Once updated (or if you only want to build), press Ctrl+C or select 'Go back' -> 'Exit'."
Write-Host ""
$refresh = Read-Host "Do you want to open 'eas credentials -p ios' first to regenerate the profile? (Y/n)"
if ($refresh -eq '' -or $refresh -match '^[Yy]') {
  npx eas-cli credentials -p ios
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " STEP 2: Start iOS Build & Auto-Submit to TestFlight" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
npx eas-cli build --platform ios --profile production --auto-submit

Write-Host ""
Write-Host "Done. Once the build and submission finish, it will appear in TestFlight and App Store Connect."
Read-Host "Press Enter to close"
