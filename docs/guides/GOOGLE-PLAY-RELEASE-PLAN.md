# Google Play status

Updated November 2, 2026.

Android music playback works properly. Notification controls and the player fix are complete; no further playback repair is currently requested.

The current active milestone is the 14-day Google Play closed testing period:
- Tester Google Group (Step 1): `https://groups.google.com/g/himnario-app-testers`
- Closed testing opt-in URL (Step 2): `https://play.google.com/apps/testing/com.elbuenpastor.himnario`
- Public store listing URL (Post-production): `https://play.google.com/store/apps/details?id=com.elbuenpastor.himnario`
- Requirement: At least 12 testers opted in and active for 14 consecutive days.
- **Website Tester Onboarding**: Google Play returns 404 / "App not available" if a user visits the opt-in URL before their account is a member of the authorized Google Group. Therefore, clicking the Google Play badge or the "Conviértete en tester" caption on `docs/index.html` and `docs/js/mockups.js` opens an interactive 2-step onboarding dialog that guides users to:
  1. Join the Google Group first (`himnario-app-testers`).
  2. Accept the invitation and download on Google Play.

Once the required 14-day test completes, finish the production-access/review steps shown in Play Console and apply for production access to publish the approved release.

The latest PDF/share/UI changes have now been included in an installable preview-arm64 APK; see [EAS.md](../../EAS.md) for the latest build and download. This test APK does not replace or publish the Google Play testing release.
