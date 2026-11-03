# Himnario El Buen Pastor

Mobile app in `himnario/`; companion website in `docs/`.

## Status — November 3, 2026

- **Android playback**: Fixed and working, including notification controls (confirmed by Isaac). The release is actively in the 14-day Google Play closed testing period.
- **Google Play Website Integration & Cloudflare Deployment**:
  - The website (`https://himnarioebp.com/`) features a 2-step onboarding flow for Google Play closed testing with a "Conviértete en tester" caption. Clicking the badge opens an interactive modal routing users to join the Google Group (`https://groups.google.com/g/himnario-app-testers`) first before proceeding to the Google Play opt-in link (`https://play.google.com/apps/testing/com.elbuenpastor.himnario`), avoiding 404 / "App not available" errors.
  - Deployed live to Cloudflare Pages (`ebp-himnario`) using `scripts/deploy-cloudflare.ps1` with all 761 static preview pages pointing to `https://audio.himnarioebp.com/`.
- **iOS 1.1.0 (Build 14)**: Built successfully and submitted to App Store Connect for TestFlight (`cba76d98-6f9f-459d-bca0-61c20996f612`). Includes 28pt tab icons, unselected label drop fix via patch `react-native-screens+4.16.0.patch`, Apple Books Home header, 4-item Share Sheet, in-app interactive PDF editor, and rotatable Projector mode.
- **Android 1.1.0 (`preview-arm64` APK)**: Finished and ready for testing (`4ca994b5-54e5-4330-a40c-2e0fa8937bf8`); includes 28pt bottom tab icons, Hallow-style bold typography (`PublicSans_700Bold`) positioned tightly beneath icons, dynamic dark/light nav bar switching, simplified `Inicio` screen, 4-item Share Sheet, and in-app interactive PDF editor. See [EAS.md](EAS.md) for build links.
- **Share Sheet & Interactive "Preparar PDF" Editor**:
  - The Share Sheet now features exactly four actions in order: **1. Messages**, **2. WhatsApp**, **3. Crear PDF**, **4. Copiar letra** (nothing more).
  - Tapping "Crear PDF" opens the interactive **Preparar PDF** modal with full website parity: format selector (single portrait Letter vs two-up landscape with dashed cut line), font size stepper (4–28 pt), columns toggle (1 vs 2), "Ajustar a la página" auto-fit, "Incluir título" switch, live paper SVG preview, and "Guardar / Compartir PDF" / "Imprimir" actions.
- **iOS Bottom Tabs & Home Header Spacing**:
  - All four iOS tabs now use matching 28pt template PNG icons (`tab-{home,hymns,favorites,settings}-{outline,filled}`) — the maximum standard size for a 49pt tab bar — with coordinated `UITabBarAppearance` via patch `patches/react-native-screens+4.16.0.patch`, fixing initial unselected label drops and `"Favoritos"` truncation. Android icons are also enlarged to 28pt to match.
  - Spacing between the "Himnario" header / search button and the "Explora Todos Los Himnos" card is tight and clean with `contentInsetAdjustmentBehavior="never"` and `overrideScrollViewContentInsetAdjustmentBehavior: false`.
- **For Antigravity, Claude, and Codex**: Read the [app editing handoff](docs/guides/APP-EDITING-ANALYSIS.md) before changing the UI. Preserve all November 2–3 UI/UX decisions documented there.

## Development

From `himnario/`, run `npm ci`, then `npx expo start`. Native playback requires a development or release build, rather than Expo Go.

For a website preview, run from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

## Guides

- [Architecture and data](ARCHITECTURE.md)
- [App editing](docs/guides/APP-EDITING-ANALYSIS.md)
- [Native builds and updates](EAS.md)
- [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md)
- [Website maintenance](docs/README.md)
- [Website deployment](docs/guides/CLOUDFLARE-DEPLOYMENT.md)

[Privacy](docs/privacy.html) · [Terms](docs/terms.html)
