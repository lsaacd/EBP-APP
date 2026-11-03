# Google Play status

Updated November 2, 2026.

Android music playback works properly. Notification controls and the player fix are complete; no further playback repair is currently requested.

The current active milestone is the 14-day Google Play closed testing period:
- Closed testing opt-in URL: `https://play.google.com/apps/testing/com.elbuenpastor.himnario`
- Public store listing URL: `https://play.google.com/store/apps/details?id=com.elbuenpastor.himnario`
- Requirement: At least 12 testers opted in and active for 14 consecutive days.
- The website (`docs/index.html` and `docs/js/mockups.js`) links the Google Play badge directly to the closed testing opt-in URL so testers can join and install the app seamlessly.

Once the required 14-day test completes, finish the production-access/review steps shown in Play Console and apply for production access to publish the approved release.

The latest PDF/share/UI changes have now been included in an installable preview-arm64 APK; see [EAS.md](../../EAS.md) for the latest build and download. This test APK does not replace or publish the Google Play testing release.
