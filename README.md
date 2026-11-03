# Himnario El Buen Pastor

Mobile app in `himnario/`; companion website in `docs/`.

## Status — November 2, 2026

- **Android playback**: Fixed and working, including notification controls (confirmed by Isaac). The release is waiting on the 14-day Google Play testing period, not another music-player fix.
- **iOS 1.1.0 (build 12 & 13)**: Built successfully and submitted to App Store Connect for TestFlight. Includes the Apple Books-inspired Home header, glassmorphic search button, custom Home tab icon, and rotatable Projector mode.
- **Android 1.1.0 (`preview-arm64` APK)**: Finished and ready for testing; includes the custom Home tab icon, bottom tab text labels with Hallow / Apple Books-style bold typography (`PublicSans_700Bold`) positioned tightly beneath icons, dynamic dark/light nav bar switching, simplified `Inicio` screen, and rotatable Projector mode. See [EAS.md](EAS.md) for build and APK download links.
- **Share Sheet & Interactive "Preparar PDF" Editor**:
  - The Share Sheet now features exactly four actions in order: **1. Messages**, **2. WhatsApp**, **3. Crear PDF**, **4. Copiar letra** (nothing more).
  - Tapping "Crear PDF" opens the interactive **Preparar PDF** modal with full website parity: format selector (single portrait Letter vs two-up landscape with dashed cut line), font size stepper (4–28 pt), columns toggle (1 vs 2), "Ajustar a la página" auto-fit, "Incluir título" switch, live paper SVG preview, and "Guardar / Compartir PDF" / "Imprimir" actions.
- **iOS Bottom Tabs & Home Header Spacing**:
  - All four iOS tabs now use matching 28pt template PNG icons (`tab-{home,hymns,favorites,settings}-{outline,filled}`) — the maximum standard size for a 49pt tab bar — with coordinated `UITabBarAppearance` via patch `patches/react-native-screens+4.16.0.patch`, fixing initial unselected label drops and `"Favoritos"` truncation. Android icons are also enlarged to 28pt to match.
  - Spacing between the "Himnario" header / search button and the "Explora Todos Los Himnos" card is tight and clean with `contentInsetAdjustmentBehavior="never"` and `overrideScrollViewContentInsetAdjustmentBehavior: false`.
- **Lyric capitalization fixes (Hymns 6, 204, 222, 248, 249, 409)**: Singular references to `Dios` and Chorus wording in Hymn 409 (`Donde todo vuelve la calma`) were corrected in `himnario/data/alabanzasPaginas.js`, extracted to `docs/data/hymns-data.js`, and regenerated across static hymn pages in `docs/hymn/`.
- **Website PDF export**: Includes the original one-page format and optional two-copy landscape Letter format, a center cut line, and an include-title toggle.
- **For Antigravity and Claude**: Read the [app editing handoff](docs/guides/APP-EDITING-ANALYSIS.md) before changing the UI. Preserve all November 2 UI/UX decisions documented there.

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
