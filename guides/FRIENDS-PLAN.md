# Friends ("Hermanos") — build plan

> **Status (November 23, 2026):** phase 1 is built and tested in the repository but **not deployed**: migration `0009_friends.sql` has not been applied to the live database, the Worker with the friends routes is not deployed, the privacy/terms text is not published, and no OTA carries the screens. Phases 2–4 are not started.
> Any agent may build it, one phase at a time, with the owner's go-ahead before each live step.

## What the owner decided

- **Friends, not followers.** Mutual: one person asks, the other accepts.
- **Friends get all four of:** (1) each other's full profile, (2) each other's favourite hymns, (3) playlists shared between them, (4) suggestions of people from the same church.
- **Look:** Liquid Glass on iOS and the native tonal surface on Android. `components/GlassSurface.tsx` already does both; use it rather than a new surface.
- In the app the word is **"Hermanos"** (Spanish) / **"Friends"** (English).

## What already exists

- Public profile: `GET /users/:id/public-profile` returns name, initials, ministry, choir, and church/location only when `show_church_location = 1` (`workers/ebp-auth-sync/community.js`).
- It is shown when a commenter's name is tapped in `himnario/components/VerseDiscussionSheet.tsx`.
- Blocking (`/users/:id/block`), reporting, suspension, the UGC-terms gate (`participant(user)`), per-user and per-IP quotas (`quota()`).
- Favourites, playlists and recents live in each user's sync document (`user_data`), merged by `PUT /sync`.
- The test harness in `scripts/test-verse-community.cjs` runs the real Worker against an in-memory SQLite database built from `schema.sql`. Every new route gets a test there.

## Rules the design must keep

1. **Nothing becomes more public than today.** Strangers see exactly what they see now. Only an *accepted* friend sees more.
2. **A block always wins.** Blocking removes any friendship or pending request in both directions and prevents new ones. A blocked person gets the same response as "user not found".
3. **"Member since" is month and year of account creation** (`users.created_at`), e.g. "Miembro desde noviembre de 2026". The server does not know when the app was downloaded, and an exact date is more than people expect to be public.
4. **No push notifications.** The app has no notification module; adding one needs a native build. Requests show as a badge inside the app.
5. **Suspended and deleted accounts disappear** from friend lists, requests and suggestions. Account deletion removes their rows (foreign keys with `ON DELETE CASCADE`).
6. **Rate-limit everything that writes**, per user and per IP, like the existing routes.
7. **Privacy text first.** `docs/privacy.html` and `docs/terms.html` (both languages) must describe friends, what they can see, and how to stop sharing, and be deployed before the feature reaches users. Keep the administrator anonymous in those pages.

## Data — migration `0009_friends.sql`

```sql
-- One row per pair, whichever direction the request went.
CREATE TABLE IF NOT EXISTS friendships (
  user_low   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
  created_at INTEGER NOT NULL,
  responded_at INTEGER,
  PRIMARY KEY(user_low, user_high),
  CHECK(user_low < user_high)
);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships(user_high, status);

-- Sharing switches, both on by default *for accepted friends only*.
ALTER TABLE users ADD COLUMN share_favorites_with_friends INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN suggest_to_church_members INTEGER NOT NULL DEFAULT 1;

-- A playlist sent to one friend. A copy, not a live link.
CREATE TABLE IF NOT EXISTS shared_playlists (
  id TEXT PRIMARY KEY,
  from_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hymn_ids_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  seen_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_shared_playlists_to ON shared_playlists(to_user, created_at DESC);
```

Add the same statements to `schema.sql` (the tests build from it). Apply remotely with `wrangler d1 execute --remote --file`, not `d1 migrations apply` (see `CLAUDE.md`).

## Server routes

| Route | Who | Does |
| --- | --- | --- |
| `POST /friends/requests` `{ userId }` | participant | Creates a pending request. If the other person already asked, accepts instead. Refuses self, blocked either way, suspended, or already friends. |
| `POST /friends/requests/:userId/accept` | participant | Accepts a request *they received*. |
| `DELETE /friends/:userId` | signed in | Declines, cancels or unfriends — one route, since each just deletes the pair's row. |
| `GET /friends` | signed in | `{ friends, incoming, outgoing }`, each with the public-profile fields. |
| `GET /friends/suggestions` | signed in | Up to 20 people with the same `church_id`, who have `suggest_to_church_members = 1`, are not blocked, not already friends or pending. Empty when the caller has no verified church. |
| `GET /users/:id/public-profile` (extended) | anyone | Adds `memberSince` (`"2026-11"`) and, for a signed-in caller, `friendStatus`: `none`, `outgoing`, `incoming`, `friends`. For friends, church and location are returned even when hidden publicly. |
| `GET /friends/:userId/favorites` | friend only | The friend's favourite hymn ids, if they have sharing on. `403` otherwise. |
| `POST /friends/:userId/playlists` `{ name, hymnIds }` | friend only | Sends a copy of a playlist. Validate ids against `^[A-Za-z0-9 ]{1,8}$`, cap at 200 hymns, 60-character name. |
| `GET /playlists/shared` | signed in | Playlists received, newest first. `POST /playlists/shared/:id/seen` clears the badge; `DELETE` removes one. |
| `PUT /auth/profile` (extended) | signed in | Accepts the two new switches. |

Suggested quotas: 20 requests per user per hour and 60 per IP; 10 shared playlists per user per hour.

## App

- **`components/MemberProfileSheet.tsx`** (new): the profile card, lifted out of `VerseDiscussionSheet.tsx` so it can open from comments, the friends list and suggestions. Shows name, ministry, choir, church (through `churchDisplayName()`), "Miembro desde …", and one button whose label follows `friendStatus`: *Agregar hermano* → *Solicitud enviada* → *Aceptar* → *Hermanos ✓*. Block and report stay where they are.
- **Account sheet** (`components/AuthSheet.tsx`): one new row, "Hermanos", with a count badge for incoming requests and unseen shared playlists. It opens a page with three sections: *Solicitudes*, *Mis hermanos*, *De mi iglesia* (suggestions).
- **A friend's page:** their profile, then *Favoritos* (tapping a hymn opens it) and *Listas compartidas*.
- **Playlists** (`app/playlist/[id].tsx`): "Compartir con un hermano" → pick a friend → sent. The recipient can open it or "Guardar en mis listas", which copies it into their own playlists.
- **Settings/profile:** the two switches, with one line each explaining what they do.
- **State:** a small `utils/friendsApi.ts` on top of `useCommunityApi()`; refresh the badge when the app returns to the foreground. No polling.
- **Strings** in `context/LanguageContext.tsx`, fonts through `theme/fonts.ts`, surfaces through `GlassSurface`.

## Phases — each ends in something the owner can try

1. **Requests and profiles.** Migration, the request/accept/remove/list routes, the extended profile, `MemberProfileSheet`, the "Hermanos" row and page, privacy text. *Done when two test accounts can become friends and see each other's church.*
2. **Favourites.** The favourites route, the switch, the friend's page.
3. **Shared playlists.** The table, the three routes, sending from a playlist, the badge.
4. **Church suggestions.** The suggestions route, the switch, the *De mi iglesia* section.

Per phase, in this order: tests → D1 migration (if any) → Worker deploy → Cloudflare Pages deploy (if the privacy text changed) → OTA. The server always ships before the app that calls it, and the app must treat a missing route as "feature not available yet" rather than an error.

## Phase 1 as built (differences from the plan above)

- The migration creates only `friendships`. The two sharing switches and `shared_playlists` belong to phases 2–4 and are added then.
- The profile card was not lifted into a separate `MemberProfileSheet`. The existing card in `VerseDiscussionSheet.tsx` gained "Miembro desde …" and `components/FriendButton.tsx`, which is the one control for a friendship wherever a person is shown.
- The friends page is `components/FriendsPanel.tsx`, shown as the `friends` sub-page of the account sheet; shared state is `utils/friendsStore.ts`, pure helpers are `utils/friends.ts`.
- For now a person can only be found through the comments (tap their name). Suggestions arrive in phase 4.
- Server tests: seven cases at the end of `scripts/test-verse-community.cjs`.

**To take phase 1 live, in this order, each with the owner's go-ahead:**
1. `npx wrangler d1 execute ebp-himnario-db --remote --file "migrations/0009_friends.sql"` (from `workers/ebp-auth-sync`).
2. `npx wrangler deploy`.
3. `scripts/deploy-cloudflare.ps1 -AudioBaseUrl "https://audio.himnarioebp.com" -SkipAudioUpload` for the privacy and terms text.
4. `eas update --branch production --platform ios`.

## Not in scope

Messaging between friends, an activity feed, push notifications, and friend counts on public profiles. Each can be considered later; none is needed for the four agreed benefits.
