# Notifications ("Notificaciones") — Architecture & Rollout Plan

> **Created:** November 23, 2026
> **Status:** Planned (not started).
> **Applies to:** Mobile app (`himnario/`), Cloudflare Worker (`workers/ebp-auth-sync/`), D1 (`ebp-himnario-db`), and `docs/privacy.html`.

---

## 1. Goals & Events Covered

Notify verified, signed-in members when someone interacts with them in the community:

| Event `type` | Trigger Route | Who gets notified | Example copy (`es` / `en`) | Tap destination |
| --- | --- | --- | --- | --- |
| `comment_like` | `POST /verse-comments/:id/like` (`liked: true`) | Author of the comment/reply | «A {name} le gustó tu comentario» / «{name} liked your comment» | Opens the verse/hymn discussion sheet |
| `comment_reply` | `POST /verses/:id/comments` (with `parentId`) | Author of the parent comment | «{name} respondió a tu comentario» / «{name} replied to your comment» | Opens the verse/hymn discussion sheet |
| `friend_request` | `POST /friends/requests` | Target user | «{name} te envió una solicitud de hermano» / «{name} sent you a friend request» | Opens Account → Hermanos |
| `friend_accepted` | `POST /friends/requests/:id/accept` (or mutual request) | Original requester | «{name} aceptó tu solicitud de hermano» / «{name} accepted your friend request» | Opens Account → Hermanos |
| `shared_playlist` | `POST /friends/:id/playlists` | Recipient friend | «{name} te compartió la lista "{title}"» / «{name} shared the playlist "{title}" with you» | Opens Account → Hermanos → Listas compartidas |

---

## 2. Two-Phase Rollout Strategy (Recommended)

Because the current iOS binaries (`Builds #30 and #31`, runtime `2.0.0-media-3`) do **not** have `expo-notifications` or the iOS `aps-environment` Push entitlement compiled in, splitting into two phases lets members get value right away without waiting for an App Store review:

### Phase 1 — In-App Notification Center (OTA-only, no rebuild required)
- Works immediately on iOS Builds #30 and #31 via D1 migration + Worker deploy + `eas update`.
- Stores all 5 event types in D1 (`notifications` table).
- Shows an unread count badge on the header/Account sheet and a clean **Notificaciones / Notifications** inbox sub-page inside `AuthSheet.tsx` (matching `FriendsPanel.tsx`, Liquid Glass on iOS, native tonal surfaces on Android).
- Includes per-category switches so members control what they want to see.

### Phase 2 — True Lock-Screen Push Notifications (Requires Full Native Rebuild)
- Adds `expo-notifications` (+ `expo-device`) to `himnario/package.json` and bumps `runtimeVersion` (e.g. `2.0.0-media-3` → `2.0.0-notif-4`).
- Registers each device's `ExponentPushToken[...]` on the Worker (`POST /notifications/push-token`) and removes it on sign-out (`DELETE /notifications/push-token`).
- Cloudflare Worker sends push alerts asynchronously via `ctx.waitUntil(...)` to **Expo Push Service** (`https://exp.host/--/api/v2/push/send`), which delivers through **Apple APNs** (iOS) and **Firebase Cloud Messaging v1** (Android) at **\$0 infrastructure cost** and with zero extra servers to manage.
- **Tip:** Bundle Phase 2 with your next planned native build (for example, the Android `2.0.0` native build or the Expo SDK 58 upgrade before April 2027) so you only go through App Store review once.

---

## 3. Database Schema (D1 Migrations)

### Phase 1 — `workers/ebp-auth-sync/migrations/0013_notifications.sql`
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('comment_like','comment_reply','friend_request','friend_accepted','shared_playlist')),
  target_id TEXT NOT NULL,
  context_id TEXT, -- verseId or hymn-<id> for deep linking into discussion
  preview TEXT,    -- short sanitized snippet (max 80 chars, no HTML)
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
-- Prevents duplicate spam (e.g. unliking and re-liking the same comment, or re-requesting)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
  ON notifications(user_id, actor_id, type, target_id)
  WHERE actor_id IS NOT NULL;

ALTER TABLE users ADD COLUMN notify_comment_likes INTEGER NOT NULL DEFAULT 1 CHECK(notify_comment_likes IN (0,1));
ALTER TABLE users ADD COLUMN notify_comment_replies INTEGER NOT NULL DEFAULT 1 CHECK(notify_comment_replies IN (0,1));
ALTER TABLE users ADD COLUMN notify_friends INTEGER NOT NULL DEFAULT 1 CHECK(notify_friends IN (0,1));
```

### Phase 2 — `workers/ebp-auth-sync/migrations/0014_push_tokens.sql`
```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK(platform IN ('ios','android')),
  language TEXT NOT NULL DEFAULT 'es' CHECK(language IN ('es','en')),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
```

*(Mirror both into `workers/ebp-auth-sync/schema.sql` and apply remotely via `wrangler d1 execute ebp-himnario-db --remote --file ...` before deploying the Worker.)*

---

## 4. Worker API & Push Delivery (`workers/ebp-auth-sync/community.js`)

### Phase 1 Routes
| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /notifications` | Signed-in | Returns newest 50 notifications + `unreadCount`, excluding suspended or blocked actors (`Cache-Control: private, no-store`). |
| `POST /notifications/read` | Signed-in | Marks one `{ id }` or all `{ all: true }` unread notifications as read (`read_at = now`). |
| `DELETE /notifications/:id` | Signed-in | Removes a single notification for `user.id`. |
| `PUT /auth/profile` (extended) | Signed-in | Accepts boolean toggles `notifyCommentLikes`, `notifyCommentReplies`, `notifyFriends`. |

### Phase 2 Routes
| Route | Auth | Behavior |
| --- | --- | --- |
| `POST /notifications/push-token` | Signed-in | Validates `/^ExponentPushToken\[[A-Za-z0-9_-]{10,64}\]$/`, upserts `{ token, user_id, platform, language, updated_at }`. Rate-limited per user/IP. |
| `DELETE /notifications/push-token` | Signed-in | Deletes `{ token }` on sign-out or when user disables push permissions so signed-out devices never get alerts. |

### Helper: `notifyUser(env, ctx, { userId, actor, type, targetId, contextId, preview })`
1. **Self-check:** skip if `!userId || userId === actor.id`.
2. **Block & suspension check:** skip if target is suspended or `blockedEitherWay(userId, actor.id)`.
3. **Preference check:** check `notify_comment_likes`, `notify_comment_replies`, or `notify_friends` on target user.
4. **Dedupe insert:** `INSERT INTO notifications(...) VALUES(...) ON CONFLICT DO NOTHING`. Only proceed to send a lock-screen push if `result.meta?.changes > 0` (this automatically stops rapid like/unlike spam!).
5. **Non-blocking push (Phase 2):** inside `ctx.waitUntil(...)`, load target's rows from `push_tokens`, localize title/body per token's `language`, POST to `https://exp.host/--/api/v2/push/send`, and delete any token whose response returns `details.error === "DeviceNotRegistered"`.
6. **Cleanup hooks:**
   - `POST /users/:id/block`: delete notifications between the two users in both directions.
   - `DELETE /auth/account`: delete from `notifications WHERE user_id=?1 OR actor_id=?1` and `push_tokens WHERE user_id=?1`.
   - `POST /mod/comments/:id/hide` & comment `DELETE`: delete notifications referencing that hidden comment (`target_id=?1`).

---

## 5. Mobile App Integration (`himnario/`)

### Phase 1 (OTA)
- `himnario/utils/notifications.ts` + `himnario/utils/notificationsStore.ts`: shared store (same pattern as `friendsStore.ts`) refreshed on mount and foreground (`AppState` active, throttled).
- `himnario/components/NotificationsPanel.tsx`: sub-page inside `AuthSheet.tsx` listing notifications chronologically with unread highlight, "Marcar todo como leído / Mark all read", and the 3 privacy/preference switches.
- Deep link on tap:
  - `friend_request` / `friend_accepted` / `shared_playlist` → switch `AuthSheet` directly to the `friends` sub-page.
  - `comment_like` / `comment_reply` → close `AuthSheet` and navigate to `/hymn/:id` (if `contextId` starts with `hymn-`) or Home verse discussion (for daily verses).
- Bilingual strings in `himnario/context/LanguageContext.tsx`; fonts spread from `himnario/theme/fonts.ts`; no crosses.

### Phase 2 (Native Rebuild)
1. Install packages inside `himnario/`:
   ```powershell
   npx expo install expo-notifications expo-device
   ```
2. Add `"expo-notifications"` plugin to `himnario/app.json` (with custom sound/icon if desired; Android notification icon must be monochrome white-on-transparent and cross-free).
3. Bump `"runtimeVersion"` in `himnario/app.json` (e.g., `"2.0.0-notif-4"`).
4. **Credentials:**
   - **iOS:** EAS automatically creates/manages the Apple Push Notifications (APNs) key on `eas build --platform ios --profile production` once `expo-notifications` is in `app.json`.
   - **Android:** Create a free Firebase project, download `google-services.json` (gitignored or referenced via EAS secret/file env), and upload the FCM v1 Service Account Key to EAS (`eas credentials --platform android`).
5. **Permission UX (Apple Review best practice):**
   - Never ask for push permission cold on app launch.
   - Ask right after the user signs in, posts their first comment, or taps **"Activar notificaciones"** inside Account → Notificaciones (explaining *why* before triggering the system iOS dialog).
6. Register `Notifications.addNotificationResponseReceivedListener(...)` in `app/_layout.tsx` so tapping a lock-screen banner opens the exact hymn/verse/friends screen.

---

## 6. Privacy & Store Compliance Checklist

Before deploying Phase 1 or Phase 2:
- Update `docs/privacy.html` and `docs/terms.html` (both Spanish and English) to explain:
  - What notification records are stored in Cloudflare D1 (actor, event type, target reference, read status).
  - (Phase 2) That device push tokens (`ExponentPushToken`) are stored in Cloudflare D1 and relayed through Expo Push Service / Apple APNs / Google FCM solely to deliver chosen community alerts, never for marketing, and deleted on sign-out or account deletion.
  - Keep the administrator completely anonymous (`"El administrador designado de Himnario El Buen Pastor"`).
- Deploy order every time: **Tests → D1 migration → Worker deploy → Cloudflare Pages deploy → App OTA (Phase 1) / EAS Build (Phase 2)**.
