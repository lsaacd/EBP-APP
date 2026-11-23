# Verse community implementation — November 17, 2026

## Local follow-up — verse discussion interaction fixes (unreleased)

Fixed keyboard-visible first taps, emoji/reply posting, and related asynchronous state bugs. The Home scroll owner and discussion list now use persistent keyboard taps; composer Send and emoji buttons have non-overlapping touch targets. Posting uses a synchronous lock and the latest draft, requires completed draft hydration, persists the exact request ID before sending, replaces temporary IDs on acknowledgement, rolls back failed optimistic edits/posts, and releases the composer before background reads complete. Background reads cannot erase pending posts or clear write errors. Reply cancellation retains text; temporary comments cannot be replied to or moderated. Older loaded pages/replies are retained during background refreshes. Closing a member preview invalidates its pending fetch, and system Back closes that preview first. Heart toggles now coalesce/serialize rapid desired states and roll back to the latest acknowledged value, with per-account/verse queue ownership and corrected cache persistence.

**Local only:** version **2.0.0**, runtime **2.0.0-maps-2** unchanged; no native dependencies, API/schema changes, OTA, rebuild, backend/website deployment or Git push for this follow-up. Last published iOS OTA remains `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a` and does **not** include these new chat fixes. Existing backend duplicate/spam/rate limits are preserved and still surface errors rather than being bypassed.

Validation: **115 Node tests passed**, including **14 new discussion/heart tests** exercising the actual sheet with mocked hooks/native controls and asynchronous storage/network requests; TypeScript passed; scoped lint has zero errors (three pre-existing VerseCard warnings). Local iOS/Android Hermes exports pass. Actual touch/keyboard behavior still needs physical-device confirmation; JavaScript tests and bundle exports do not establish native responsiveness.

Source: `components/VerseDiscussionSheet.tsx`, `components/VerseCard.tsx`, `app/(tabs)/home.tsx`, `utils/verseDiscussionState.ts`, `utils/verseLikeQueue.ts`, `utils/communityApi.ts`; regression suite `scripts/test-verse-discussion.cjs`. Preserve user/Antigravity changes elsewhere. React Native describes the tap-to-dismiss behavior and persistent tap options in its [ScrollView documentation](https://reactnative.dev/docs/ScrollView#keyboardshouldpersisttaps).


## Source status and scope

Implemented locally from the user's implementation plan. **No Worker/D1/Pages deployment, EAS Update, native build, Git commit/push, or App Store metadata change has been performed for this work.** Version remains **2.0.0**, runtime **2.0.0-securestore-1**. Do not confuse local source with the live service or existing TestFlight/APK builds. Publishing commands in older documents are not release authorization.

Community belongs exclusively to Verse of the Day. Hymn detail remains lyrics/audio only. No direct messages, public email addresses, photo uploads, WebSockets or new native dependencies. Existing SF Symbols/Material icons, glass primitives, menu module and Expo Modules Core UUID generator are reused.

## Source map

- `himnario/data/communityRules.js` and declarations: ministry/choir labels, text normalization, shared 100-word and 1,000-character caps, basic content filter. The baseline word filter is deliberately limited, not a substitute for active human moderation.
- `workers/ebp-auth-sync/community.js`: profile/terms, summaries, likes, threads/replies, reports, blocks, sole-admin actions, choir repertoires, safe account deletion.
- `migrations/0003_community_verse.sql`: additive profile/community schema and triggers; `schema.sql` also supports a fresh database. Migration promotes only the existing designated Isaac mailbox. A subsequently created replacement admin account requires an operator grant; there is no public role-promotion endpoint.
- `himnario/data/dailyVerses.ts`: permanent verse slugs, existing bilingual text and daily rotation preserved. Never repurpose existing IDs.
- `data/verseBackgrounds.ts` and `assets/images/verse-backgrounds/README.md`: local gradient presets ready for literal image `require()` registration. No image assets have been invented or fetched.
- `components/VerseCard.tsx`: background selector, likes, comments, native share and menu, cached counts, date rollover.
- `VerseDiscussionSheet.tsx`: platform sheet, native menus, one-level replies, cursor pagination including additional reply pages, drafts scoped to account/verse, email/terms gate, reporting/blocking. Drafts never auto-submit. An ambiguous failed send retries the same request ID; changing the text uses a new ID. iOS sign-in handoff waits for the discussion modal to dismiss.
- `CommunityProfile.tsx`, `CommunityModeration.tsx`: embedded in the existing account sheet, without nested modal stacking. Ministry/choir selectors, block management, report review/dismiss/hide, member search, suspension/restore and Bishop verification, repertoire editing.
- `ChoirRepertoire.tsx`: pinned rehearsal hymn links for a member's selected Esmirna/Maranatha choir.
- `utils/communityApi.ts`: bounded request timeout and response rejection when the signed-in token changes.
- `docs/privacy.html`, `docs/terms.html`: bilingual community sections in the existing legal layout, dated November 17. They describe behavior when enabled; publish with the backend before enabling clients.

## Player changes

Hymn detail no longer sets a second native `presentation: modal`. “Go to lyrics” keeps the current route if already correct, replaces another hymn route, and pushes from other screens. The full player is a persistent animated overlay while a hymn is loaded; the MiniPlayer stays mounted beneath it. Closing the full player keeps audio playing. The collapse can be reversed without waiting for native modal teardown. Android Back collapses it, root status-bar appearance follows full-player visibility, progress polling stops while hidden, and artwork geometry is computed from available dimensions. Opening the same loaded track without a queue change does not call `nativePlayer.open` again. Seek UI retains its existing pending-seek protection. Sacred Ink switch track colors replace iOS green; iMessage branding remains green.

## Backend guarantees and limits

- Verified email and accepted terms version `2026-11-17` required for community writes. Existing unverified-account sync remains supported for compatibility.
- Only role `admin` **and** exact designated email **and** verified, unsuspended account can use `/mod/*`. No client field changes role, verification or suspension. Only ministry `obispo` can hold/display the verified badge; leaving that ministry clears it.
- Comments are plain text, limited to 100 words and 1,000 UTF-16 code units, with HTML, common link prefixes, unsafe controls and a small profanity list rejected. Limits and rate checks are server enforced. The filter is not comprehensive semantic moderation.
- Posting uses a per-account unique request ID; likes submit explicit desired state so network retries cannot invert the user's choice. Database triggers keep counts correct under retries/cascades. Reply parent must be visible, top-level and in the same verse. Duplicate text within five minutes is rejected.
- Public root pages and reply pages are bounded to 20; cursors use timestamp plus ID. Block filters apply in both directions to authors and reply parents for authenticated requests. Global summary counts can include blocked authors. Signed-out readers can still see public content.
- Public summary cache is 30 seconds; authenticated responses and other sensitive routes are `no-store`, varying on Origin and Authorization. Counters are approximate during that cache window.
- Reports are durable in D1; notification emails contain an ID, not body/email. Delivery is best effort and failures do not discard reports. Isaac must check the moderation inbox daily and respond promptly. Do not promise an automatic 24-hour SLA.
- Suspension revokes all sessions immediately, hides that author's threads/replies, and prevents new login. Revoked tokens return 401; authenticated suspended-account writes return 403 when a suspension-bearing session still exists. Restoring does not restore sessions or automatically republish hidden content.
- Deleting an account transactionally removes its likes, blocks, submitted reports, auth/sync records and tokens. Comments/replies are retained with null author ID and a generic deleted-account name. Free text is not scrubbed for self-identifying information. Author deletion hides comments plus replies but retains internal bodies/reports. No automatic retention cleanup has been added; legal text says so.
- Endpoints: `/verses/:id/{summary,comments,like,share}`, `/verse-comments/:id` and `/report`, `/users/:id/block`, `/users/blocks`, `/auth/profile`, `/auth/ugc-terms/accept`, `/mod/reports`, `/mod/reports/:id/dismiss`, `/mod/comments/:id/hide`, `/mod/users` search, `/mod/users/:id/{suspend,restore,verify-obispo}`, `/choirs/repertoire`, `/mod/choirs/repertoire`.

## Release order — only after authorization

1. Back up D1 and test migration 0003 on the isolated security database. Never point staging at production D1. Apply the migration once through Wrangler migrations (do not reapply the complete fresh schema to an existing database).
2. Verify the existing designated account and operator grant, email report delivery, quotas and moderation controls in staging. The migration alone cannot prove live sender readiness.
3. Publish legal pages and deploy the migrated Worker before releasing the app UI. The existing live Worker lacks these routes until deployed. Installed profile-name clients send an extra `displayName`; the new backend accepts this matching alias while rejecting privileged fields.
4. Test physical iPhone/iPad and Android: open Hymn 5, expand, skip, view Hymn 14, verify route/top inset/MiniPlayer; immediately reverse collapse/expand repeatedly; test scrubber, Back, safe areas, loading errors, compact screens and landscape. Check community keyboard, native menus, long text, draft recovery, account switch, reply paging, blocks and moderation.
5. Reassess App Store/Play privacy disclosures, UGC/age-rating questionnaires and provide a verified review account. Do not guess a required age number or alter listings without approval. Sources: [Apple 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content), [Google Play developer policies](https://support.google.com/googleplay/android-developer/answer/18265346?hl=en).
6. Source adds no native packages/plugins/permissions. Shared validation lives inside `himnario/data/` so EAS archives rooted at the app directory include it. An OTA is a candidate **only for installed binaries with the existing securestore runtime and menu/glass modules**. Confirm installed runtime/channel and staged device results first. Older 2.0.0 binaries without SecureStore are incompatible. A full rebuild remains an option; neither is released by this task.

The local scratch plan contains a plaintext Cloudflare credential. It remains ignored and was not copied into source, app assets or this handoff. Use the existing local credential mechanism. Credential replacement remains an owner/account operation if that plan is shared elsewhere.

## Local verification results

- `npx tsc --noEmit`: passed.
- Scoped ESLint: zero errors; six pre-existing warnings in root layout/AuthSheet (unused imports/variables and an existing spring dependency). New community/player utility files have no lint warnings.
- Seven Node suites (`test-verse-community.cjs`, `test-player-presentation.cjs`, `test-auth-security.cjs`, `test-auth-storage.cjs`, `test-mobile-auth-email.cjs`, `test-android-playback.cjs`, `test-gesture-motion.cjs`): **95 passed**. New tests exercise actual Worker routes against SQLite with foreign keys enabled, migration upgrade, retry/duplicate behavior, private responses, role/badge rules, limits, blocks, reports, suspension, safe deletion, client profile/session races and player navigation/open behavior.
- `node scripts/test-web-search.js`: passed for all 761 hymns/choruses.
- `npx expo export --platform ios --platform android --output-dir ../scratch/community-export`: both native Hermes bundles and assets exported successfully. This is local bundling, not a native build, TestFlight delivery or OTA publication.
- `wrangler deploy --dry-run`: Worker bundled successfully, no upload/deployment.
- Device-only gesture, native menu, keyboard, accessibility and glass appearance checks remain required. No device results are claimed.
