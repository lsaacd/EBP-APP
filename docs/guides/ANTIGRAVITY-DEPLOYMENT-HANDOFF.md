# Antigravity handoff: deployment and domain

Updated: October 28, 2026 (Pacific time).

## User request

Review the accumulated website changes, understand their purpose, and commit the intended changes after review. Preserve unrelated work. This document is a handoff, not a claim that a Git commit has already been made.

Read `docs/README.md`, `docs/guides/MAINTENANCE.md`, `docs/guides/CLOUDFLARE-DEPLOYMENT.md`, and `docs/guides/FEEDBACK-FORMS-HANDOFF.md` first.

## Published infrastructure

- Working published site: https://ebp-himnario.pages.dev/
- Pages project: `ebp-himnario`, production branch `main`.
- Purchased domain: `himnarioebp.com`, active in Cloudflare.
- Both `himnarioebp.com` and `www.himnarioebp.com` have been attached to the Pages project.
- Both have proxied CNAME records targeting `ebp-himnario.pages.dev`, TTL automatic.
- Verified active: Both `https://himnarioebp.com` and `https://www.himnarioebp.com` are confirmed active, TLS certificates issued, returning HTTP 200 OK.
- R2 bucket: `ebp-himnario-audio`.
- All 656 audio objects were uploaded and their keys and sizes compared with the local files; no mismatches were found. Actual online playback was tested on the pages.dev site.
- Current public audio base: https://pub-81f518709acd4b4c8d0344f474c2d629.r2.dev/
- Audio still needs a production custom hostname, for example `audio.himnarioebp.com`, attached through R2 settings. That hostname has NOT been configured in this task. After configuring it, deploy with the new audio base URL and verify playback and range requests.

These domain and DNS changes live in Cloudflare, not Git. Committing files does not deploy a site or configure DNS.

## Deployment changes to review

- `scripts/deploy-cloudflare.ps1`: uploads audio when requested, stages `docs/` without audio, injects the production audio base into the staging copy, and deploys Pages. Uses a workspace Wrangler cache to avoid the previous system cache permission failure.
- `docs/js/storage-config.js`: empty audio base for local development; deployment replaces only the staged copy.
- `docs/js/audio-player.js`: resolves recordings against the configured public base, with local audio fallback.
- `docs/index.html`: loads storage configuration before the player.
- `.gitignore`: excludes staging and Wrangler cache.
- `docs/guides/CLOUDFLARE-DEPLOYMENT.md` and `docs/README.md`: deployment documentation and entry point.

## Other pending changes

The worktree contains earlier website and app-promotion work in addition to deployment. Inspect `git status --short` and `git diff` before staging. Areas include sharing and PDF export, legal pages, identity page, feedback forms, mockup images, App Store badge, library behavior, and removal of unused QR exports. New files also include Google Forms helper scripts and form IDs. Review these on their own merits; do not attribute all existing changes to this deployment task.

Do not restore the deleted QR files automatically: their removal followed the user's cleanup request. Check references before deciding which files belong in a commit.

## Review and commit workflow

1. Read repository instructions and the guides above; inspect tracked diffs and untracked file contents.
2. Verify no credentials, OAuth token files, private account data, staging output, or caches are staged. Credentials were provided in chat and should be replaced by the account owner; never copy them into this guide or source files.
3. Check local script syntax and relevant website flows. Confirm local playback still works with an empty audio base, and production playback uses R2.
4. Verify both custom domain statuses and HTTPS responses. Record the final result here once activation completes.
5. Stage explicit reviewed paths. Group commits by purpose if appropriate; preserve unrelated or unfinished work.
6. Commit the reviewed changes with descriptive messages. Report commit hashes, validation performed, and anything still pending. Do not push or redeploy solely because a commit was requested.

## Product conventions

Use “Himnario” and “alabanzas” in Spanish UI. Preserve Newsreader/Public Sans typography, existing theme variables, light/dark behavior, and the church logo. Keep the website organized and maintain the existing app-inspired reading experience.
