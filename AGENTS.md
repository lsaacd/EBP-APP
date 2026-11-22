# AGENTS.md — Himnario El Buen Pastor

Shared notes for every coding agent on this project: **Codex, Antigravity and Claude**. Codex and Antigravity both read this file automatically; Claude reads [CLAUDE.md](CLAUDE.md), which holds the full handoff (live state, rules, exact commands). Read CLAUDE.md before changing anything.

> **Last updated:** November 22, 2026 (after iOS Build 31 and OTA `d351bb27`).

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
- **Never call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS**, keep all three `patch-package` patches, and never run `eas submit` after `--auto-submit`.
- **Ask the owner before** `eas update`, any `production` build, any Cloudflare deploy, or any change to the live database. Say what you published afterwards, with its ID, and record it in [EAS.md](EAS.md).

## Open work any agent can take

| Task | Where to read | Notes |
| --- | --- | --- |
| **Expo SDK 54 → 58 for Xcode 27** | [docs/guides/SDK-58-UPGRADE-PLAN.md](docs/guides/SDK-58-UPGRADE-PLAN.md) | Deferred by the owner. Deadline April 2027. Must be done on its own branch with a new `runtimeVersion`. |
| Android native rebuild | CLAUDE.md section 5 | Android is still on runtime `2.0.0-securestore-1` and has none of the November work. |
| Device check of the churches redesign | CLAUDE.md section 5 | Built without a simulator; only the owner's phone has seen it. |
| Remaining inline strings | `git grep -n "es$" himnario/app himnario/components` | A few dozen strings with interpolated values are still inline `es ? … : …` pairs. |
| Split `himnario/app/churches.tsx` | ARCHITECTURE.md "Churches screen" | About 4,000 lines in one component. |

## Working alongside other agents

- One agent per branch at a time. If two agents edit the same branch in different folders, the second `eas update` or push overwrites the first.
- Leave a dated entry in [docs/guides/APP-EDITING-ANALYSIS.md](docs/guides/APP-EDITING-ANALYSIS.md) when you finish: what changed, what you published, what you could not verify.
- Do not rewrite another agent's unfinished work. If the working tree has changes you did not make, stop and ask the owner.

## Quick links

- **Current handoff and rules:** [CLAUDE.md](CLAUDE.md)
- **Project overview:** [README.md](README.md)
- **Architecture and file map:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Builds, runtimes and OTA record:** [EAS.md](EAS.md)
- **Current editing handoff:** [docs/guides/APP-EDITING-ANALYSIS.md](docs/guides/APP-EDITING-ANALYSIS.md)
- **Older editing history:** [docs/guides/APP-EDITING-HISTORY.md](docs/guides/APP-EDITING-HISTORY.md)
- **Cloudflare deployment:** [docs/guides/CLOUDFLARE-DEPLOYMENT.md](docs/guides/CLOUDFLARE-DEPLOYMENT.md)
