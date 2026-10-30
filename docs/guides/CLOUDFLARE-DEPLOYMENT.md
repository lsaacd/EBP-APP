# Website deployment

Cloudflare Pages project: `ebp-himnario`. R2 bucket: `ebp-himnario-audio`.
Website: `https://himnarioebp.com/`; audio base used by the native app: `https://audio.himnarioebp.com/`.

## Publish

From the repository root, after reviewing and testing the intended website changes:

```powershell
.\scripts\deploy-cloudflare.ps1 -AudioBaseUrl 'https://audio.himnarioebp.com/' -SkipAudioUpload
```

This is a publishing command. Use it for an authorized release, not as a local check.

The script regenerates share pages and the Apple association file, stages `docs/` without the large audio directory, injects the audio base into staged `js/storage-config.js`, and deploys Pages to branch `main`. Keep credentials out of source.

Omit `-SkipAudioUpload` only when intentionally uploading the local `docs/audio/*.m4a` recordings to R2. Routine HTML/CSS/JS changes do not need another audio upload.

## Verify after deployment

- Check reader, playback, share pages, PDF preview/export and legal links at the public domain.
- Inspect the published Apple association file and generated preview-page audio URLs. Passing the deployment audio base updates staged storage config; it does not guarantee every generator uses that base.
- Test installed-app links on a phone before declaring Universal Links verified.
- A source commit does not deploy Pages. A Pages deployment does not update the native apps.

Staging: `.cloudflare-pages-stage/`; Wrangler cache: `.wrangler-cache/`. These are local deployment artifacts.
