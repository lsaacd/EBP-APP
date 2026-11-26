# AGENTS.md — Himnario El Buen Pastor

Shared notes for every coding agent on this project: **Codex, Antigravity and Claude**. Codex and Antigravity both read this file automatically; Claude reads [CLAUDE.md](CLAUDE.md), which holds the full handoff (live state, rules, exact commands). Read CLAUDE.md before changing anything.

> **Last updated:** November 25, 2026 (`main`/`app-web-parity`: SDK 54 iOS Build #34 `d1f054c9`, latest OTA `3a5900b7` on `2.0.0-release-5`; **`sdk-58` branch**: SDK 58 / Xcode 27.1 `v2.3.0` (`2.3.0-sdk58-1`) **iOS Build #45 `6fe3cb15` FINISHED & auto-submitted to TestFlight** + **Android `versionCode 4` `784f9b68` FINISHED** — previous iOS Build #43 `6790dff2` on `2.2.0-sdk58-1` OTA #10 `c9927961`; Pages `e313a270`; Worker `16659432`; D1 `0020_google_avatar_recovery`).

## Before you start

1. **Pull first.** `git pull --ff-only` on the branch you are on. `main` and `app-web-parity` were fast-forwarded on November 22, 2026 with the churches redesign, native fonts and cleanup. A checkout from before that is stale.
2. **Never publish an OTA from a stale checkout.** `eas update --branch production` replaces the JavaScript on every installed app with whatever is in your folder. Publishing from old code silently reverts the live app. Confirm `git log -1` matches `origin` before any `eas update`.
3. Read [CLAUDE.md](CLAUDE.md) sections 3 (non-negotiable rules) and 4 (Windows PowerShell commands; the path contains `[03]` brackets).
4. Run the checks in CLAUDE.md section 4 before and after your change. They also run on GitHub for every push (`.github/workflows/ci.yml`).

## Rules that are easy to break

- **No crosses** in any artwork, icon or map pin. Doctrinal rule.
- **No administrator name** in public policy pages or user-facing labels.
- **Fonts:** use the tokens in `himnario/theme/fonts.ts` and spread them: `{ ...fonts.bold, fontSize: 20 }`. Do not write `fontFamily: 'SomeName'`, and never bundle Apple font files (App Store rejection `ITMS-91182`).
- **Text:** user-facing strings go in `himnario/context/LanguageContext.tsx` (both `es` and `en`) and are read as `t.key`. Do not add inline `es ? '…' : '…'` strings.
- **Church names** are displayed through `churchDisplayName()` and leaders through `servantDisplayName()` (`himnario/utils/churchName.ts`): "Riverbank", "SDD Hno Azael Tapia". Do not print `church.name` or `pastorName` directly.
- **Service times** are stored as one text field in the format `utils/churchSchedule.ts` parses. Write them with `serializeSchedule()`; do not invent another format.
- **`docs/` is the live website, not a documents folder.** Everything in it is served publicly at `himnarioebp.com` (and by a GitHub Pages copy). Internal notes, plans and handoffs belong in `guides/` at the repository root. The repository itself is public, so treat anything committed anywhere as readable by anyone.
- **Never call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS**, keep all four `patch-package` patches, and never run `eas submit` after `--auto-submit`.
- **Ask the owner before** `eas update`, any `production` build, any Cloudflare deploy, or any change to the live database. Say what you published afterwards, with its ID, and record it in [EAS.md](EAS.md).

## Open work any agent can take

| Task | Where to read | Notes |
| --- | --- | --- |
| **Expo SDK 54 → 58 for Xcode 27** | [guides/SDK-58-UPGRADE-PLAN.md](guides/SDK-58-UPGRADE-PLAN.md) | `v2.3.0` (`2.3.0-sdk58-1`) **BOTH iOS Build #45 (`6fe3cb15`, TestFlight auto-submitted) & Android `versionCode 4` (`784f9b68`, AAB) FINISHED** on `sdk-58`. Read top of [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md). Physical iOS + Android device sign-off and Play Console upload remain before merging `sdk-58` into `main`. |
| **Friends ("Amistades")** | [guides/FRIENDS-PLAN.md](guides/FRIENDS-PLAN.md) | Requests, profiles, favourites, church suggestions, and friend counts are live on iOS. The plan's shared-playlist phase still needs confirmation; signed-in two-account device verification remains. |
| **Antigravity pickup: November 23 release** | [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md) | Read the top handoff before touching friends, church directory, coro moderation, or publishing another OTA. iOS is released; signed-in device checks and Android rebuild remain. |
| Android native rebuild | CLAUDE.md section 5 | Android is still on runtime `2.0.0-securestore-1` and has none of the November work. |
| Device check of the churches redesign | CLAUDE.md section 5 | Built without a simulator; only the owner's phone has seen it. |
| Remaining inline strings | `git grep -n "es$" himnario/app himnario/components` | A few dozen strings with interpolated values are still inline `es ? … : …` pairs. |
| Split `himnario/app/churches.tsx` | ARCHITECTURE.md "Churches screen" | About 4,000 lines in one component. |

## Working alongside other agents

- One agent per branch at a time. If two agents edit the same branch in different folders, the second `eas update` or push overwrites the first.
- Leave a dated entry in [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md) when you finish: what changed, what you published, what you could not verify.
- Do not rewrite another agent's unfinished work. If the working tree has changes you did not make, stop and ask the owner.

## Quick links

- **Current handoff and rules:** [CLAUDE.md](CLAUDE.md)
- **Project overview:** [README.md](README.md)
- **Architecture and file map:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Builds, runtimes and OTA record:** [EAS.md](EAS.md)
- **Current editing handoff:** [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md)
- **Older editing history:** [guides/APP-EDITING-HISTORY.md](guides/APP-EDITING-HISTORY.md)
- **Cloudflare deployment:** [guides/CLOUDFLARE-DEPLOYMENT.md](guides/CLOUDFLARE-DEPLOYMENT.md)
