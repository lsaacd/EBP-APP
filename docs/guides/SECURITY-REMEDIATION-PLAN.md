# App, website and API security remediation plan

Reviewed November 15, 2026. This is a proposed implementation and verification plan, not a record of completed fixes or a finding that a breach occurred. Preserve the existing release history and unrelated Antigravity work. See [architecture](../../ARCHITECTURE.md), [app editing](APP-EDITING-ANALYSIS.md), and [deployment](CLOUDFLARE-DEPLOYMENT.md).

## Implementation status — first local hardening pass

**Subsequent authorized live containment:** On November 15, 2026, the user requested keeping version **2.0.0** and disabling unsafe password recovery directly. A reset-only patch based on the live Worker (not the full local development source) was deployed as Worker version `b5bc8c5b-5fbe-435f-8f78-a1cd5d793735`, deployment `c843c05e-972a-4941-badb-534ee4abaaec`, at 100% traffic. Both reset URL forms return 503 `recovery_unavailable`; health returns 200 and unauthenticated sync 401. D1 bindings and Worker settings were verified preserved. No database migration, app build, OTA, store or website release occurred. Remaining protections below are still local. This live reset-only exception supersedes blanket statements that nothing has been deployed.

Except for the reset-only containment above, the implementation below is prepared locally and **has not been deployed**. Source remains `2.0.0` at the user's request, with a new `expo-secure-store` dependency/plugin; native rebuilds are required and older test binaries sharing the 2.0.0 label must not receive native-dependent OTA code.

- Worker rejects unsafe name/email recovery without querying or mutating accounts; restricts browser origins; private/error responses use `no-store`, `nosniff` and `no-referrer`; errors no longer expose database details. JSON bodies are bounded by actual streamed bytes and validated structurally. New-account passwords require 12 characters; existing credentials remain usable.
- Atomic SQLite counters enforce fixed-window attempt quotas and database failures fail closed. This replaces earlier progressive failure counters. New sessions expire after 30 days; no mass revocation of existing sessions has occurred.
- Login no longer merges another account's or guest's local collections into an existing cloud account. Regular writes require `expectedRevision`; stale and legacy writers receive `409` without erasing cloud data. Automatic conflict reconciliation/deletion merging and explicit guest-import UX remain unfinished.
- Serialized protected session storage migrates the real legacy key `@himnario_auth_session` to SecureStore `himnario.auth.session.v2`. EAS archive rules exclude additional environment and credential file patterns.
- Mobile auth checks a session epoch on restore/login/profile/delete/sync responses and serializes sync PUTs. Conflicts pause sync while keeping local collections. Before an explicit cloud-authoritative login, local collections/preferences are backed up under `@himnario_auth_local_backup_v1:<prior account or guest>` (no bearer credentials); backup failure stops replacement. The login form explains replacement. A user-facing backup retrieval/reconciliation flow remains pending.
- Bilingual privacy text now distinguishes optional cloud accounts from browser-local data and explains deletion/uninstall and prefilled feedback. Site response-header policy adds basic MIME, referrer, permissions and framing defenses; enforced CSP is still pending compatibility work.
- Added `scripts/test-auth-security.cjs` (real in-memory SQLite with a D1 adapter), `scripts/test-auth-storage.cjs`, and a redacted `scripts/audit-secrets.py`. The targeted source/local-artifact scan found no matching credential patterns in 1,713 scanned files; this is not a complete history or cloud credential audit.
- Updated transitive `tar` to `7.5.23` and `shell-quote` to `1.12.0` within existing dependency constraints. The follow-up production dependency audit reports **37 findings: 0 critical, 16 high, 20 moderate, 1 low**; the full tree still has 46 findings including development dependencies. Other advisory paths remain open; no forced Expo major upgrade was applied.

Validation in this pass: 7 Worker security tests, 3 encrypted-storage/migration ordering tests, and 20 mobile auth regression tests (`scripts/test-mobile-auth.cjs`, using mocked React hooks/storage/network to exercise the actual provider) pass; existing 16 playback/offline/search tests and 10 gesture tests pass (**56 total**); web search passes against 761 entries; TypeScript passes; scoped ESLint has no errors (one existing AuthSheet spring-hook dependency warning). iOS and Android Metro/Hermes exports succeed locally. SQLite-adapter and mocked native-storage/provider tests do not establish production D1 behavior or physical-device Keychain/Keystore behavior; those remain release checks.

**Remaining dependencies:** User has no transactional email service. Recommend a Resend account, verified `auth.himnarioebp.com` sending subdomain, and a sending-only domain-restricted key stored in Worker Secrets. No provider account, DNS change, email sending or secret was created. Email-token recovery and ownership verification remain disabled/unimplemented; the old insecure method must never be re-enabled as a fallback.

**Still open:** full recovery/verification flow, reauthentication for sensitive actions, complete sync conflict UX, security-event retention/cleanup and alerts, edge abuse rules, dependency advisory remediation, full history/credential audit, CSP, store privacy disclosures and physical-device validation. Do not label the entire plan complete or the live system patched.

## Scope and evidence

Reviewed local Worker authentication/sync code, mobile auth storage, website privacy disclosures and response-header configuration, Git status, and the production dependency audit. No production exploit testing, account changes, key rotation, database changes, or deployment was performed. Live cloud settings, access logs, historical secret exposure and device behavior still need verification.

The user-provided screenshots describe another application. Treat their contents as a threat checklist, not evidence that EBP has those exact vulnerabilities. EBP currently uses random bearer sessions, not JWTs; no user file-upload endpoint was found in this Worker. Public Expo project IDs, app bundle IDs, D1 database IDs and Google Form IDs are identifiers, not administrative credentials. CORS is a browser response-sharing policy, not authentication; wildcard CORS alone does not grant another website access to a native app's stored token.

## 1. Urgent account recovery containment

- Replace `POST /auth/reset-password` email-and-name verification: knowing someone's name and email must never authorize a password change.
- First prepare a server rejection of the unsafe recovery flow and matching bilingual client messaging. This can be deployed independently of a native build; source changes alone do not protect the live endpoint.
- Implement emailed, cryptographically random, short-lived, single-use recovery tokens; store only their hashes; consume tokens atomically; revoke sessions after a successful reset. Use generic request responses and abuse controls. Configure a transactional email service and verified sending domain before enabling recovery.
- Require appropriate reauthentication for account deletion and sensitive account changes. Verify email ownership for new accounts and handle existing unverified accounts explicitly.
- Review available security events for unexpected resets or account access. A vulnerability is not proof of exploitation. If evidence of compromise appears, preserve evidence and determine containment, affected accounts and notification obligations.
- Acceptance: email + full name cannot reset an account; expired, reused, forged and concurrently redeemed recovery tokens fail; unrelated accounts remain unchanged.

## 2. Authorization, sessions and data integrity

- Keep every private query scoped to the authenticated user's server-derived ID. Add cross-account tests for sync, profile, logout and deletion.
- Move bearer credentials from AsyncStorage into platform-protected storage, migrating existing sessions without changing favorite/playlist storage keys. `expo-secure-store` is absent from the current package manifest; adding it requires a compatible native rebuild.
- Replace one-year bearer sessions with a documented expiry/renewal and revocation policy. Keep credentials out of URLs, logs, crash reports and exported content.
- Repair sync before describing it as safe cross-device reconciliation: current regular PUTs replace server state; startup GET does not apply fetched collections; Sync Now only pushes. Introduce revision/conflict handling, deletion semantics, safe account switching and explicit rules for importing guest collections.
- Protect asynchronous restore/login/profile responses against logout or account-switch races, not only sync PUT responses.
- Acceptance: two devices editing concurrently do not silently erase each other's work; deletions remain deleted; signing into a second account does not silently import the first account's data; logout cannot be undone by an outstanding request.

## 3. API abuse, bots and resource limits

- Replace read-then-write rate counters with a concurrency-safe enforcement design; test parallel requests and database failures. Current rate-limit helpers fail open. Protect expensive password hashing and account-recovery routes with layered edge and application limits, accounting for shared-network users and distributed attackers.
- Bound request-body bytes while reading rather than buffering an unbounded body before checking JavaScript string length. Require the expected content type; reject malformed JSON and invalid structures.
- Validate and cap nested playlist IDs/names/items, favorites, recent entries and preference fields on all write paths, including initial registration/login imports. Reject unexpected values instead of persisting arbitrary JSON.
- Return generic server errors; keep sanitized diagnostic details server-side. Use `Cache-Control: no-store` on private/auth responses.
- Restrict browser origins to intended sites, return `Vary: Origin` where needed, and preserve native requests without Origin. Do not trust `X-EBP-Client` or an embedded app API key as proof of identity.
- Evaluate server-verified Turnstile challenges for abusive signup/recovery traffic. Native integration needs a supported browser flow; never put an unconditional browser challenge on mobile sync/audio endpoints.
- Configure alerts and bounded retention for failed logins, resets, invalid tokens, rate-limit failures and spending. Avoid logging raw passwords, bearer/recovery tokens or full sync payloads.

## 4. Website and hosting

- Inventory actual live headers and redirects on the site, Worker, R2 audio and share pages. `docs/_headers` currently declares caching and association headers, without a general security-header policy.
- Add appropriate `nosniff`, referrer and permissions policies and framing restrictions. Build a Content Security Policy from the real script/font/media/Google Forms dependencies; validate in report-only mode before enforcement. Test reader, PDFs, projector, feedback forms, QR and app links.
- Audit untrusted strings and URLs reaching HTML/SVG/DOM sinks. Existing literal `innerHTML` icon templates are not automatically an exploitable XSS finding; trace controllable input before assigning severity.
- Verify HTTPS enforcement and HSTS scope before enabling long-lived subdomain policies. Preserve public audio access and association-file behavior.
- Keep R2/D1 administration private; separate development and production resources and credentials; enable usable backups and test restoration. If uploads are introduced later, design content validation, isolation and safe delivery before launch.

## 5. Keys, dependencies and delivery pipeline

- Run a redacted secret scan over tracked/untracked source, Git history, Pages staging, EAS archives, generated bundles and deployment scripts. Existing ignore rules do not prove that secrets never entered history or an artifact.
- Inventory Cloudflare, Expo, Apple, Google and email-provider credentials by owner and scope without printing secret values. Store server credentials in secret bindings/CI secret stores. Rotate verified exposed credentials and revoke old ones after replacement is tested.
- Review administrator access and MFA, use narrowly scoped deployment tokens, and enable secret scanning in CI. Never embed administrative secrets in mobile or browser code; clients can be inspected.
- `npm audit --omit=dev` reported 39 package findings: 2 critical, 16 high, 20 moderate, 1 low. These are package-tree findings, not 39 proven production exploits. Trace advisory paths and runtime/build-time exposure; prioritize reachable risks. Do not run a blind `npm audit fix --force` or jump Expo SDK major versions without native compatibility checks.
- Pin and review dependency changes; run existing playback/search/gesture checks plus meaningful auth and multi-device tests. Capture all required new files in the eventual reviewed commit.

## 6. Privacy policy and documentation

- Update both Spanish and English sections of `docs/privacy.html` using the existing `legal.css`, fonts, cards, navigation, theme and table-of-contents structure.
- Clearly distinguish browser-local website data from optional mobile account data: email, display name, password hashes, session data, favorites, playlists, recents, reading preferences and security rate-limit records processed through Cloudflare.
- Explain purposes, providers, local/offline behavior, account deletion, security logs and retention, backup handling and contact options. Confirm actual retention and provider configuration before publishing specific promises. Explain that uninstalling does not delete a cloud account.
- Correct feedback disclosures: Google Forms receives prefilled hymn context, and reporting can use the web form rather than only an email app. Include the chosen recovery email/challenge provider only when implemented.
- Update in-app notices and store privacy disclosures to reflect the shipped implementation. Saved worship history and religious context warrant data minimization and careful access controls.
- Amend architecture, EAS and handoff guides with verified behavior, pending work, release IDs and tests. Correct the auth-key/version inconsistencies while retaining historical information.

## Rollout and completion criteria

1. Prepare/test the unsafe-recovery containment, then separately deploy the authorized Worker fix; delaying the mobile build must not imply that a local fix protects production.
2. Implement and validate account recovery, authorization, session lifecycle, sync and privacy changes against isolated test data.
3. Deploy compatible backend and website changes through their own release workflows. New native storage/dependency changes require Android APK and iOS TestFlight builds; OTA cannot add absent native code. Check actual runtime and channel mappings before any OTA.
4. Test new and upgraded installs, two-device conflicts, offline reconnection, logout races, account deletion, replayed reset links, cross-account access, parallel rate-limit bypasses and website policy compatibility.
5. Record deployment evidence and remaining risks. No security measure guarantees immunity; maintain monitoring, updates and recovery procedures. No release is performed by this planning document.

## Reference guidance

- [OWASP password recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare mobile Turnstile](https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/)


## Deployment, Verification & Next Steps Record (November 15, 2026)

- **Cloudflare D1 Production Migration (`ebp-himnario-db` / `ed683396-bfd7-43ff-b69e-f82cf4621c55`):** Applied `migrations/0002_email_auth.sql` (`email_verified_at` column on `users`, `email_tokens` table + indexes).
- **Cloudflare Email Sending (`auth.himnarioebp.com`):** Onboarded and enabled on `himnarioebp.com` (`MX`, `SPF`, `DKIM`, `DMARC` records configured & verified live).
- **Cloudflare Worker (`ebp-himnario-sync`):** Deployed version `6e056043-383c-44e6-9187-22ee9aad0c52` to `https://ebp-himnario-sync.himnario.workers.dev` with `send_email` binding (`EMAIL` -> `cuenta@auth.himnarioebp.com`) and `ACCOUNT_ACTION_URL` (`https://himnarioebp.com/account.html`). Live `POST /auth/recovery/request` probe returned `200 {"ok":true}`.
- **Cloudflare Pages (`ebp-himnario`):** Deployed `docs/account.html`, `docs/css/account.css`, `docs/js/account.js`, `docs/_headers`, and `docs/privacy.html` (`https://f21d7e62.ebp-himnario.pages.dev` / `https://himnarioebp.com/account.html`).
- **EAS Native Rebuilds (`runtimeVersion: "2.0.0-securestore-1"`):**
  - **Android (`preview-arm64` APK):** `45c31c43-e36e-4952-a15a-238ac2c1521c` (`https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/45c31c43-e36e-4952-a15a-238ac2c1521c`)
  - **iOS (`production`, Build `22`):** `a72551f5-58d3-403c-b8d6-589f048c0ad6` (`https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/a72551f5-58d3-403c-b8d6-589f048c0ad6`), App Store Connect auto-submit `c1d9bbc6-4df7-4301-bb98-965a42c4d974` (`https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/c1d9bbc6-4df7-4301-bb98-965a42c4d974`).
- **Post-Build-22 OTA Update (`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`):** Published to `production` & `preview` (`2.0.0-securestore-1`) with the `AuthSheet` Font Size slider fix, iOS `UISwitch` tinting, classic profile avatar colors, `HomeHeaderActions` glass bubble separation, and removal of `assets/fonts/ios/` (`ITMS-91182`). Next native binary (`Build 23+`) will clear `ITMS-91182` cleanly.
