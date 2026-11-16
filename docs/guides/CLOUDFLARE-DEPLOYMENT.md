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

---

## Auth & Cloud Sync Worker + D1 Database (`workers/ebp-auth-sync/`)

Version `2.0.0` of the mobile app includes an optional Account & Cloud Sync backend running on **Cloudflare Workers** + **Cloudflare D1 (SQLite)**:
- **Worker Name**: `ebp-himnario-sync`
- **Production URL**: `https://ebp-himnario-sync.himnario.workers.dev`
- **D1 Database Name**: `ebp-himnario-db`
- **D1 Database ID**: `ed683396-bfd7-43ff-b69e-f82cf4621c55`
- **Source Files**:
  - `workers/ebp-auth-sync/index.js` — Worker API routes (`/health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/reset-password`, `PUT /auth/profile`, `GET /sync`, `PUT /sync`, `POST /auth/logout`, `DELETE /auth/account`).
  - `workers/ebp-auth-sync/schema.sql` — D1 tables (`users`, `sessions`, `user_data`, `rate_limits`).
  - `workers/ebp-auth-sync/wrangler.jsonc` — Worker + D1 binding configuration (`env.DB`).

### Security & Anti-Bot Architecture (`index.js` & `schema.sql`)
1. **Password Hashing**: Uses Web Crypto `PBKDF2-HMAC-SHA256` with `100,000` iterations and a unique `16-byte` random salt per user (`password_salt`, `password_hash`). Raw passwords are never stored or logged. Password verification uses constant-time comparison (`timingSafeEqualHex`).
2. **Session Tokens**: `createSession` generates a `32-byte` (`64-char` hex) random bearer token and stores only its `SHA-256` hash (`token_hash`) in `sessions` (1-year expiry). Resetting a password (`POST /auth/reset-password`) automatically revokes all existing sessions (`DELETE FROM sessions WHERE user_id = ?1`).
3. **Rate Limiting & Brute-Force Lockout (`rate_limits` table)**:
   - Rate-limit bucket keys hash the client IP (`CF-Connecting-IP`) and target identifier with `SHA-256` (`rl:<scope>`).
   - `POST /auth/login`: Max **5 failed attempts** per `(IP, email)` within 15 minutes → progressive lockout (`1 min` → `5 min` → `15 min`), returning HTTP `429` with `Retry-After` and `retryAfterSeconds`. Successful login clears the failure bucket. Also caps total login attempts at **20 per IP per 15 minutes**.
   - `POST /auth/register`: Max **3 account creations** and **8 registration attempts** per IP per hour.
   - `POST /auth/reset-password`: Max **3 failed reset verifications** per `(IP, email)` per hour and **5 reset requests** per IP per hour.
   - `PUT /sync`: Max **60 sync writes** per user per minute.
4. **Payload & Timing Hardening**:
   - Rejects payloads larger than `64 KB` (`MAX_BODY_BYTES = 65536`) with HTTP `413`.
   - Rejects requests that fill the hidden `website` honeypot field with HTTP `429`.
   - Enforces a minimum `120ms` response duration (`ensureMinDuration`) on failed login/register/reset paths to prevent timing-based email enumeration.

### Deploying or Querying D1 from Windows PowerShell
> **Important Windows PowerShell Note for Agents**: Run `npx wrangler` from inside `himnario/` passing `-c "../workers/ebp-auth-sync/wrangler.jsonc"`. Running Wrangler from `workers/ebp-auth-sync/` without a local `node_modules` causes Wrangler to walk up to `C:\` and fail with a permission error on `C:\node_modules\.cache\wrangler`. Also use `[System.IO.Directory]::SetCurrentDirectory(...)` because the project path contains square brackets (`[03]`, `[01]`).

```powershell
$himnarioDir = 'C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\himnario'
Set-Location -LiteralPath $himnarioDir
[System.IO.Directory]::SetCurrentDirectory($himnarioDir)

# Apply schema updates to remote D1:
npx wrangler d1 execute ebp-himnario-db --remote -c "../workers/ebp-auth-sync/wrangler.jsonc" --file="../workers/ebp-auth-sync/schema.sql"

# Deploy the Worker:
npx wrangler deploy -c "../workers/ebp-auth-sync/wrangler.jsonc"

# Inspect registered users (excluding password hashes):
npx wrangler d1 execute ebp-himnario-db --remote -c "../workers/ebp-auth-sync/wrangler.jsonc" --command "SELECT id, email, name, created_at FROM users;"
```

