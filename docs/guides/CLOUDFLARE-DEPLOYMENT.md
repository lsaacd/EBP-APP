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

## Authentication

Wrangler uses either OAuth login or an API token:
1. **OAuth (Local Terminal)**:
   ```powershell
   npx wrangler login
   ```
2. **API Token (Automated / Headless / CI)**:
   Set the token in the environment before deploying:
   ```powershell
   $env:CLOUDFLARE_API_TOKEN = "<token>"
   .\scripts\deploy-cloudflare.ps1 -AudioBaseUrl 'https://audio.himnarioebp.com/' -SkipAudioUpload
   ```
   Required permissions for the token:
   - Account: `Cloudflare Pages: Edit`
   - Account: `Account Settings: Read`
   - User: `User Details: Read`
   - Account: `Workers R2 Storage: Edit` (if uploading audio)

## AI Agent Integration (Skills & MCP)

Cloudflare agent tooling is configured per official Cloudflare guidelines (`developers.cloudflare.com/agent-setup/prompt.md`):
- **19 Cloudflare Skills**: Installed globally at `~/.agents/skills` (wrangler, cloudflare, workers-best-practices, etc.).
- **Cloudflare Streamable HTTP MCP**: Configured at `https://mcp.cloudflare.com/mcp` in `~/.gemini/config/mcp_config.json`, `~/.codex/config.toml`, `.vscode/mcp.json`, and `.cursor/mcp.json`.

## Verify after deployment

- Check reader, playback, share pages, PDF preview/export and legal links at the public domain: `https://himnarioebp.com/`.
- Inspect the published Apple association file and generated preview-page audio URLs. Passing the deployment audio base updates staged storage config; it does not guarantee every generator uses that base.
- Test installed-app links on a phone before declaring Universal Links verified.
- Note: A source git commit alone does not deploy Pages because large audio files are separated and config is injected at deploy time. Run `deploy-cloudflare.ps1` to publish.

Staging: `.cloudflare-pages-stage/`; Wrangler cache: `.wrangler-cache/`. These are local deployment artifacts.
