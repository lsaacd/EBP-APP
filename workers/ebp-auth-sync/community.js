import { RequestError, parseJsonBody, checkRateLimit } from "./security.js";
import {
  MINISTRIES,
  CHOIRS,
  normalizeComment,
} from "../../himnario/data/communityRules.js";

export const ADMIN_EMAIL = "isaacduran167@gmail.com";
export const isAdmin = (u) =>
  u?.role === "admin" &&
  u.email?.toLowerCase() === ADMIN_EMAIL &&
  u.email_verified_at != null &&
  u.suspended_at == null;
const fail = (status, code) => {
  throw new RequestError(status, code);
};
const uuid = () => crypto.randomUUID();
const validId = (id) => typeof id === "string" && /^[a-z0-9-]{3,40}$/.test(id);
const validRequestId = (id) =>
  typeof id === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(id);
async function bodyOf(req) {
  return (await parseJsonBody(req)).body;
}
async function quota(env, key, max, ms) {
  const r = await checkRateLimit(env, key, { maxAttempts: max, windowMs: ms });
  if (!r.allowed) {
    const e = new RequestError(429, "rate_limited");
    e.retryAfterSeconds = r.retryAfterSeconds;
    throw e;
  }
}
// Friendships are stored once per pair, smaller id first.
const pairOf = (a, b) => (a < b ? [a, b] : [b, a]);
// "2026-11": month and year only. The exact moment someone joined is more
// than a profile needs to show.
const memberSince = (createdAt) =>
  Number.isFinite(createdAt) && createdAt > 0
    ? new Date(createdAt).toISOString().slice(0, 7)
    : null;
function participant(user) {
  if (!user) fail(401, "unauthorized");
  if (user.suspended_at != null) fail(403, "account_suspended");
  if (user.email_verified_at == null) fail(403, "email_verification_required");
}
function cleanOptionalText(val, maxLen = 80) {
  if (val === null || val === "") return null;
  if (typeof val !== "string") fail(400, "invalid_profile");
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen || /[<>\u0000-\u001f]/u.test(trimmed))
    fail(400, "invalid_profile");
  return trimmed;
}
function profile(body, user) {
  // Installed 2.0.0 clients send displayName alongside name. Accept that alias,
  // but never privileged fields, so backend-first rollout preserves profile edits.
  if (
    Object.keys(body).some(
      (k) =>
        ![
          "name",
          "displayName",
          "ministry",
          "choir",
          "churchId",
          "churchName",
          "location",
          "showChurchLocation",
          "shareFavoritesWithFriends",
          "showFriendsList",
          "suggestToChurchMembers",
          "directoryVisibleToAll",
          "notifyCommentLikes",
          "notifyCommentReplies",
          "notifyFriends",
        ].includes(k),
    )
  )
    fail(400, "invalid_profile");
  const name = body.name ?? body.displayName ?? user.name;
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.length > 100 ||
    /[<>\u0000-\u001f]/u.test(name)
  )
    fail(400, "invalid_name");
  if (
    body.displayName !== undefined &&
    (typeof body.displayName !== "string" ||
      body.displayName.trim() !== name.trim())
  )
    fail(400, "invalid_name");
  const ministry = body.ministry === undefined ? user.ministry : body.ministry;
  const choir = body.choir === undefined ? user.choir : body.choir;
  if (ministry != null && !Object.hasOwn(MINISTRIES, ministry))
    fail(400, "invalid_ministry");
  if (
    choir != null &&
    (typeof choir !== "string" || !/^[a-z0-9_-]{2,40}$/.test(choir))
  )
    fail(400, "invalid_choir");
  const church_id =
    body.churchId === undefined
      ? (user.church_id ?? null)
      : cleanOptionalText(body.churchId, 64);
  if (church_id && !/^[a-zA-Z0-9_-]{3,64}$/.test(church_id))
    fail(400, "invalid_profile");
  const church_name =
    body.churchName === undefined
      ? (user.church_name ?? null)
      : cleanOptionalText(body.churchName, 80);
  const location =
    body.location === undefined
      ? (user.location ?? null)
      : cleanOptionalText(body.location, 80);
  if (
    body.showChurchLocation !== undefined &&
    typeof body.showChurchLocation !== "boolean"
  )
    fail(400, "invalid_profile");
  const show_church_location =
    body.showChurchLocation === undefined
      ? Number(user.show_church_location || 0)
      : body.showChurchLocation
        ? 1
        : 0;
  for (const key of [
    "shareFavoritesWithFriends",
    "showFriendsList",
    "suggestToChurchMembers",
    "directoryVisibleToAll",
    "notifyCommentLikes",
    "notifyCommentReplies",
    "notifyFriends",
  ])
    if (body[key] !== undefined && typeof body[key] !== "boolean")
      fail(400, "invalid_profile");
  return {
    name: name.trim(),
    ministry: ministry ?? null,
    choir: choir ?? null,
    church_id,
    church_name,
    location,
    show_church_location,
    share_favorites_with_friends:
      body.shareFavoritesWithFriends === undefined
        ? Number(user.share_favorites_with_friends ?? 1)
        : body.shareFavoritesWithFriends
          ? 1
          : 0,
    show_friends_list:
      body.showFriendsList === undefined
        ? Number(user.show_friends_list ?? 1)
        : body.showFriendsList
          ? 1
          : 0,
    // Stays NULL ("follow the public church setting") until the person chooses.
    suggest_to_church_members:
      body.suggestToChurchMembers === undefined
        ? (user.suggest_to_church_members ?? null)
        : body.suggestToChurchMembers
          ? 1
          : 0,
    directory_visible_to_all:
      body.directoryVisibleToAll === undefined
        ? Number(user.directory_visible_to_all ?? 0)
        : body.directoryVisibleToAll ? 1 : 0,
    notify_comment_likes:
      body.notifyCommentLikes === undefined
        ? Number(user.notify_comment_likes ?? 1)
        : body.notifyCommentLikes
          ? 1
          : 0,
    notify_comment_replies:
      body.notifyCommentReplies === undefined
        ? Number(user.notify_comment_replies ?? 1)
        : body.notifyCommentReplies
          ? 1
          : 0,
    notify_friends:
      body.notifyFriends === undefined
        ? Number(user.notify_friends ?? 1)
        : body.notifyFriends
          ? 1
          : 0,
  };
}
const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .filter(Boolean)
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("")
    .toUpperCase()
    .slice(0, 2);
function publicComment(row) {
  const name = row.user_id ? row.name : "Cuenta eliminada";
  return {
    id: row.id,
    verseId: row.verse_id,
    parentId: row.parent_id,
    userId: row.user_id,
    authorName: name,
    authorInitials: row.user_id ? initials(name) : "—",
    authorAvatarUrl: row.user_id ? (row.avatar_url ?? null) : null,
    ministry: row.user_id ? row.ministry : null,
    choir: row.user_id ? row.choir : null,
    badgeVerified:
      row.user_id != null &&
      row.ministry === "obispo" &&
      row.badge_verified === 1,
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    likesCount: Number(row.likes_count || 0),
    likedByMe: Boolean(row.liked_by_me),
  };
}
const publicSelect = `SELECT c.*,u.name,u.avatar_url,u.ministry,u.choir,u.badge_verified,(SELECT count(*) FROM verse_comment_likes l WHERE l.comment_id=c.id) AS likes_count,EXISTS(SELECT 1 FROM verse_comment_likes l WHERE l.comment_id=c.id AND l.user_id=?2) AS liked_by_me FROM verse_comments c LEFT JOIN users u ON u.id=c.user_id`;
const visibility = `c.hidden_at IS NULL AND (c.parent_id IS NULL OR EXISTS(SELECT 1 FROM verse_comments p WHERE p.id=c.parent_id AND p.hidden_at IS NULL AND NOT EXISTS(SELECT 1 FROM user_blocks pb WHERE (pb.blocker_user_id=?2 AND pb.blocked_user_id=p.user_id) OR (pb.blocked_user_id=?2 AND pb.blocker_user_id=p.user_id))))
 AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?2 AND b.blocked_user_id=c.user_id) OR (b.blocked_user_id=?2 AND b.blocker_user_id=c.user_id))`;

const AVATAR_ORIGIN = "https://audio.himnarioebp.com/";
const AVATAR_PREFIX = "https://audio.himnarioebp.com/avatars/";
const MAX_AVATAR_BYTES = 524_288; // 512 KB decoded
const MAX_AVATAR_JSON_BYTES = 760_000; // ~512 KB base64 + JSON envelope

function detectAvatarFormat(bytes) {
  if (!bytes || bytes.byteLength < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

async function readBoundedBytes(request, maxBytes) {
  const cl = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(cl) && cl > maxBytes) fail(413, "photo_too_large");
  const reader = request.body?.getReader?.();
  if (!reader) {
    const ab = await request.arrayBuffer();
    if (ab.byteLength > maxBytes) fail(413, "photo_too_large");
    return new Uint8Array(ab);
  }
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel().catch(() => {});
        fail(413, "photo_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function deleteUserAvatarObject(env, userId, avatarUrl) {
  if (
    !env.MEDIA_BUCKET ||
    typeof env.MEDIA_BUCKET.delete !== "function" ||
    typeof avatarUrl !== "string" ||
    !avatarUrl.startsWith(`${AVATAR_PREFIX}${userId}/`)
  ) {
    return;
  }
  const key = avatarUrl.slice(AVATAR_ORIGIN.length);
  try {
    await env.MEDIA_BUCKET.delete(key);
  } catch {}
}

export async function deleteCommunityAccount(env, id) {
  const existingUser = await env.DB.prepare(
    "SELECT avatar_url FROM users WHERE id=?1",
  )
    .bind(id)
    .first()
    .catch(() => null);
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE verse_comments SET user_id=NULL,author_name_snapshot='Cuenta eliminada' WHERE user_id=?1",
    ).bind(id),
    env.DB.prepare("DELETE FROM verse_likes WHERE user_id=?1").bind(id),
    env.DB.prepare("DELETE FROM verse_comment_likes WHERE user_id=?1").bind(id),
    env.DB.prepare(
      "DELETE FROM user_blocks WHERE blocker_user_id=?1 OR blocked_user_id=?1",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM verse_comment_reports WHERE reporter_user_id=?1",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM friendships WHERE user_low=?1 OR user_high=?1",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM shared_playlists WHERE from_user=?1 OR to_user=?1",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM notifications WHERE user_id=?1 OR actor_id=?1",
    ).bind(id),
    env.DB.prepare("DELETE FROM push_tokens WHERE user_id=?1").bind(id),
    ...["user_data", "sessions", "email_tokens", "hymn_reactions", "oauth_identities"].map((t) =>
      env.DB.prepare(`DELETE FROM ${t} WHERE user_id=?1`).bind(id),
    ),
    env.DB.prepare("DELETE FROM users WHERE id=?1").bind(id),
  ]);
  await deleteUserAvatarObject(env, id, existingUser?.avatar_url ?? null);
}

const VALID_EXPO_PUSH_TOKEN = /^ExponentPushToken\[[A-Za-z0-9_-]{10,64}\]$/;

function formatPushCopy(type, actorName, preview, lang) {
  const es = lang !== "en";
  const who = actorName || (es ? "Alguien" : "Someone");
  const snip = preview ? preview.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  if (type === "comment_like") {
    return es
      ? {
          title: "Nuevo me gusta",
          body: snip
            ? `A ${who} le gustó tu comentario: «${snip}»`
            : `A ${who} le gustó tu comentario.`,
        }
      : {
          title: "New Like",
          body: snip
            ? `${who} liked your comment: "${snip}"`
            : `${who} liked your comment.`,
        };
  }
  if (type === "comment_reply") {
    return es
      ? {
          title: "Nueva respuesta",
          body: snip
            ? `${who} respondió: «${snip}»`
            : `${who} respondió a tu comentario.`,
        }
      : {
          title: "New Reply",
          body: snip
            ? `${who} replied: "${snip}"`
            : `${who} replied to your comment.`,
        };
  }
  if (type === "friend_request") {
    return es
      ? {
          title: "Solicitud de hermano",
          body: `${who} te envió una solicitud de hermano.`,
        }
      : {
          title: "Friend Request",
          body: `${who} sent you a friend request.`,
        };
  }
  if (type === "friend_accepted") {
    return es
      ? {
          title: "Nuevo hermano",
          body: `${who} aceptó tu solicitud de hermano.`,
        }
      : {
          title: "New Friend",
          body: `${who} accepted your friend request.`,
        };
  }
  return es
    ? {
        title: "Lista compartida",
        body: snip
          ? `${who} te compartió la lista «${snip}».`
          : `${who} te compartió una lista de reproducción.`,
      }
    : {
        title: "Shared Playlist",
        body: snip
          ? `${who} shared the playlist "${snip}" with you.`
          : `${who} shared a playlist with you.`,
      };
}

async function sendExpoPushMessages(env, messages) {
  if (!messages.length) return;
  try {
    let payload;
    if (typeof env.PUSH_SEND === "function") {
      payload = await env.PUSH_SEND(messages);
    } else {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) return;
      payload = await res.json().catch(() => null);
    }
    const tickets = Array.isArray(payload?.data) ? payload.data : [];
    const deadTokens = [];
    for (let i = 0; i < tickets.length && i < messages.length; i++) {
      if (
        tickets[i]?.status === "error" &&
        tickets[i]?.details?.error === "DeviceNotRegistered"
      ) {
        deadTokens.push(messages[i].to);
      }
    }
    for (const dead of deadTokens) {
      await env.DB.prepare("DELETE FROM push_tokens WHERE token=?1")
        .bind(dead)
        .run()
        .catch(() => {});
    }
  } catch {
    /* Push delivery is best-effort and must never break the triggering API call. */
  }
}

export async function handleCommunity(
  request,
  env,
  ctx,
  { path, authenticate, serializeUser, json },
) {
  if (
    !/^\/(verses|verse-comments|users|mod|choirs|churches|hymns|friends|playlists|notifications)(\/|$)/.test(
      path,
    ) &&
    !["/auth/profile", "/auth/ugc-terms/accept", "/auth/avatar"].includes(path)
  )
    return null;
  const method = request.method,
    url = new URL(request.url);
  const user = await authenticate(request, env);
  if (request.headers.has("Authorization") && !user) fail(401, "unauthorized");
  if (user?.suspended_at != null) fail(403, "account_suspended");
  const admin = isAdmin(user),
    now = Date.now(),
    ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const all = async (sql, ...args) =>
    (
      await env.DB.prepare(sql)
        .bind(...args)
        .all()
    ).results;
  const blockedEitherWay = async (a, b) =>
    Boolean(
      await env.DB.prepare(
        "SELECT 1 FROM user_blocks WHERE (blocker_user_id=?1 AND blocked_user_id=?2) OR (blocker_user_id=?2 AND blocked_user_id=?1)",
      )
        .bind(a, b)
        .first(),
    );
  const notifyUser = async ({
    userId: targetUserId,
    actor,
    type,
    targetId,
    contextId = null,
    preview = null,
  }) => {
    if (!targetUserId || !actor?.id || targetUserId === actor.id) return;
    const [targetRow, blocked] = await Promise.all([
      env.DB.prepare(
        "SELECT suspended_at,notify_comment_likes,notify_comment_replies,notify_friends FROM users WHERE id=?1",
      )
        .bind(targetUserId)
        .first(),
      blockedEitherWay(targetUserId, actor.id),
    ]);
    if (!targetRow || targetRow.suspended_at != null || blocked) return;
    if (type === "comment_like" && targetRow.notify_comment_likes === 0) return;
    if (type === "comment_reply" && targetRow.notify_comment_replies === 0)
      return;
    if (
      (type === "friend_request" ||
        type === "friend_accepted" ||
        type === "shared_playlist") &&
      targetRow.notify_friends === 0
    )
      return;
    const cleanPreview =
      typeof preview === "string"
        ? preview.replace(/\s+/g, " ").trim().slice(0, 80) || null
        : null;
    const res = await env.DB.prepare(
      "INSERT INTO notifications(id,user_id,actor_id,type,target_id,context_id,preview,created_at,read_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,NULL) ON CONFLICT DO NOTHING",
    )
      .bind(
        uuid(),
        targetUserId,
        actor.id,
        type,
        String(targetId),
        contextId ? String(contextId) : null,
        cleanPreview,
        now,
      )
      .run();
    if (!res.meta?.changes) return;
    const tokens = await all(
      "SELECT token,language FROM push_tokens WHERE user_id=?1 LIMIT 20",
      targetUserId,
    );
    if (!tokens.length) return;
    const messages = tokens.map((t) => {
      const copy = formatPushCopy(type, actor.name, cleanPreview, t.language);
      return {
        to: t.token,
        sound: "default",
        title: copy.title,
        body: copy.body,
        data: {
          type,
          targetId: String(targetId),
          contextId: contextId ? String(contextId) : null,
        },
      };
    });
    const work = sendExpoPushMessages(env, messages);
    if (ctx?.waitUntil) ctx.waitUntil(work);
    else await work;
  };
  if (path.startsWith("/mod/") && !admin) fail(403, "forbidden");
  await quota(env, `community-read:${ip}`, 180, 60000);

  if (path === "/auth/profile" && method === "PUT") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `profile:${user.id}`, 20, 60000);
    const body = await bodyOf(request);
    const p = profile(body, user);
    if (p.choir != null && p.choir !== "otro") {
      const approvedChoir = await env.DB.prepare(
        "SELECT slug FROM choirs WHERE slug=?1 AND status='approved'",
      )
        .bind(p.choir)
        .first();
      if (!approvedChoir) fail(400, "invalid_choir");
    }
    const saved = await env.DB.prepare(
      "UPDATE users SET name=?2,ministry=?3,choir=?4,church_name=?5,location=?6,show_church_location=?7,church_id=CASE WHEN ?14=1 THEN ?8 ELSE church_id END,share_favorites_with_friends=?9,suggest_to_church_members=?10,notify_comment_likes=?11,notify_comment_replies=?12,notify_friends=?13,directory_visible_to_all=?15,show_friends_list=?16,badge_verified=CASE WHEN ministry IS ?3 THEN badge_verified ELSE 0 END WHERE id=?1 RETURNING church_id",
    )
      .bind(
        user.id,
        p.name,
        p.ministry,
        p.choir,
        p.church_name,
        p.location,
        p.show_church_location,
        p.church_id,
        p.share_favorites_with_friends,
        p.suggest_to_church_members,
        p.notify_comment_likes,
        p.notify_comment_replies,
        p.notify_friends,
        body.churchId === undefined ? 0 : 1,
        p.directory_visible_to_all,
        p.show_friends_list,
      )
      .first();
    return json({
      user: serializeUser({
        ...user,
        ...p,
        church_id: saved?.church_id ?? null,
        badge_verified: user.ministry === p.ministry ? user.badge_verified : 0,
      }),
    });
  }
  if (path === "/auth/ugc-terms/accept" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    if (user.email_verified_at == null)
      fail(403, "email_verification_required");
    const body = await bodyOf(request);
    if (body.version !== "2026-11-17") fail(400, "invalid_terms_version");
    await env.DB.prepare(
      "UPDATE users SET ugc_terms_accepted_at=COALESCE(ugc_terms_accepted_at,?2) WHERE id=?1",
    )
      .bind(user.id, now)
      .run();
    return json({
      user: serializeUser({
        ...user,
        ugc_terms_accepted_at: user.ugc_terms_accepted_at ?? now,
      }),
    });
  }
  if (path === "/auth/avatar" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `avatar-upload:${user.id}`, admin ? 40 : 10, 3600000);
    await quota(env, `avatar-upload-ip:${ip}`, 30, 3600000);
    const ct = (request.headers.get("content-type") || "").toLowerCase();
    let bytes;
    if (ct.includes("application/json")) {
      const rawBytes = await readBoundedBytes(request, MAX_AVATAR_JSON_BYTES);
      let parsed;
      try {
        parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBytes));
      } catch {
        fail(400, "invalid_json");
      }
      if (!parsed || typeof parsed.base64 !== "string" || !parsed.base64.trim()) {
        fail(400, "invalid_photo");
      }
      const cleaned = parsed.base64
        .replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
        .replace(/\s+/g, "");
      if (cleaned.length > 710_000) fail(413, "photo_too_large");
      let bin;
      try {
        bin = atob(cleaned);
      } catch {
        fail(400, "invalid_photo");
      }
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = await readBoundedBytes(request, MAX_AVATAR_BYTES);
    }
    if (!bytes || bytes.byteLength < 12) fail(400, "invalid_photo");
    if (bytes.byteLength > MAX_AVATAR_BYTES) fail(413, "photo_too_large");
    const fmt = detectAvatarFormat(bytes);
    if (!fmt) fail(400, "invalid_photo_format");
    if (!env.MEDIA_BUCKET || typeof env.MEDIA_BUCKET.put !== "function") {
      fail(503, "avatar_storage_unavailable");
    }
    const key = `avatars/${user.id}/${crypto.randomUUID()}.${fmt.ext}`;
    await env.MEDIA_BUCKET.put(key, bytes, {
      httpMetadata: {
        contentType: fmt.mime,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    const newAvatarUrl = `${AVATAR_ORIGIN}${key}`;
    const previousAvatarUrl = user.avatar_url ?? null;
    await env.DB.prepare("UPDATE users SET avatar_url=?2 WHERE id=?1")
      .bind(user.id, newAvatarUrl)
      .run();
    if (previousAvatarUrl && previousAvatarUrl !== newAvatarUrl) {
      await deleteUserAvatarObject(env, user.id, previousAvatarUrl);
    }
    return json({
      ok: true,
      avatarUrl: newAvatarUrl,
      user: serializeUser({ ...user, avatar_url: newAvatarUrl }),
    });
  }
  if (path === "/auth/avatar" && method === "DELETE") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `avatar-delete:${user.id}`, 20, 3600000);
    const previousAvatarUrl = user.avatar_url ?? null;
    await env.DB.prepare("UPDATE users SET avatar_url=NULL WHERE id=?1")
      .bind(user.id)
      .run();
    if (previousAvatarUrl) {
      await deleteUserAvatarObject(env, user.id, previousAvatarUrl);
    }
    return json({
      ok: true,
      avatarUrl: null,
      user: serializeUser({ ...user, avatar_url: null }),
    });
  }
  const verseRoute = path.match(
    /^\/verses\/([a-z0-9-]+)\/(summary|comments|like|share)$/,
  );
  if (verseRoute) {
    const [, verseId, action] = verseRoute;
    if (!validId(verseId)) fail(400, "invalid_verse");
    if (action === "summary" && method === "GET") {
      const row = await env.DB.prepare(
        "SELECT * FROM verse_stats WHERE verse_id=?1",
      )
        .bind(verseId)
        .first();
      const liked =
        user &&
        (await env.DB.prepare(
          "SELECT 1 FROM verse_likes WHERE verse_id=?1 AND user_id=?2",
        )
          .bind(verseId, user.id)
          .first());
      return json(
        {
          likesCount: row?.likes_count || 0,
          commentsCount: row?.comments_count || 0,
          sharesCount: row?.shares_count || 0,
          likedByMe: !!liked,
        },
        200,
        user ? {} : { "Cache-Control": "public, max-age=30" },
      );
    }
    if (action === "comments" && method === "GET") {
      const requestedLimit = url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : 20;
      if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1)
        fail(400, "invalid_limit");
      const limit = Math.min(20, requestedLimit);
      const parent = url.searchParams.get("parentId");
      if (parent && !validId(parent)) fail(400, "invalid_parent");
      let time = Number.MAX_SAFE_INTEGER,
        id = "~";
      const cursor = url.searchParams.get("cursor");
      if (cursor) {
        const parts = cursor.split(":");
        time = Number(parts[0]);
        id = parts[1];
        if (parts.length !== 2 || !Number.isSafeInteger(time) || !validId(id))
          fail(400, "invalid_cursor");
      }
      const sort = url.searchParams.get("sort") === "top" ? "top" : "newest";
      const orderBy =
        sort === "top" && !parent && !cursor
          ? "((SELECT count(*) FROM verse_comment_likes l WHERE l.comment_id=c.id) + (SELECT count(*) FROM verse_comments r WHERE r.parent_id=c.id AND r.hidden_at IS NULL)) DESC, c.created_at DESC, c.id DESC"
          : "c.created_at DESC,c.id DESC";
      const rows = await all(
        `${publicSelect} WHERE c.verse_id=?1 AND ${visibility} AND ${parent ? "c.parent_id=?3" : "c.parent_id IS NULL AND ?3 IS NULL"} AND (c.created_at<?4 OR (c.created_at=?4 AND c.id<?5)) ORDER BY ${orderBy} LIMIT ?6`,
        verseId,
        user?.id ?? "",
        parent,
        time,
        id,
        limit + 1,
      );
      const more = rows.length > limit,
        selected = rows.slice(0, limit);
      const comments = [];
      for (const row of selected) {
        const comment = publicComment(row);
        if (!parent) {
          const replies = await all(
            `${publicSelect} WHERE c.verse_id=?1 AND ${visibility} AND c.parent_id=?3 ORDER BY c.created_at DESC,c.id DESC LIMIT 21`,
            verseId,
            user?.id ?? "",
            row.id,
          );
          comment.replies = replies.slice(0, 20).map(publicComment);
          const tail = comment.replies.at(-1);
          comment.repliesCursor =
            replies.length > 20 ? `${tail.createdAt}:${tail.id}` : null;
        }
        comments.push(comment);
      }
      const tail = comments.at(-1);
      return json({
        comments,
        nextCursor: more ? `${tail.createdAt}:${tail.id}` : null,
      });
    }
    participant(user);
    const body = await bodyOf(request);
    if (action === "like" && method === "POST") {
      await quota(env, `like:${user.id}`, 40, 60000);
      await quota(env, `like-ip:${ip}`, 120, 60000);
      if (typeof body.liked !== "boolean") fail(400, "invalid_like");
      await env.DB.prepare(
        body.liked
          ? "INSERT INTO verse_likes(user_id,verse_id,created_at) VALUES(?1,?2,?3) ON CONFLICT DO NOTHING"
          : "DELETE FROM verse_likes WHERE user_id=?1 AND verse_id=?2 AND ?3>=0",
      )
        .bind(user.id, verseId, now)
        .run();
      return json({ ok: true });
    }
    if (action === "share" && method === "POST") {
      await quota(env, `share:${user.id}:${verseId}`, 1, 3600000);
      await env.DB.prepare(
        "INSERT INTO verse_stats(verse_id,shares_count,updated_at) VALUES(?1,1,?2) ON CONFLICT(verse_id) DO UPDATE SET shares_count=shares_count+1,updated_at=?2",
      )
        .bind(verseId, now)
        .run();
      return json({ ok: true });
    }
    if (action === "comments" && method === "POST") {
      let text;
      try {
        text = normalizeComment(body.body);
      } catch (e) {
        fail(400, e.message);
      }
      if (!validRequestId(body.clientRequestId))
        fail(400, "invalid_request_id");
      const parent = body.parentId ?? null;
      if (parent && !validId(parent)) fail(400, "invalid_parent");
      const previous = await env.DB.prepare(
        "SELECT * FROM verse_comments WHERE user_id=?1 AND client_request_id=?2",
      )
        .bind(user.id, body.clientRequestId)
        .first();
      if (previous) {
        if (
          previous.verse_id !== verseId ||
          previous.body !== text ||
          previous.parent_id !== parent
        )
          fail(409, "idempotency_conflict");
        return json({ id: previous.id });
      }
      await quota(env, `comment:${user.id}`, 5, 600000);
      await quota(env, `comment-ip:${ip}`, 20, 3600000);
      let parentOwnerId = null;
      if (parent) {
        const p = await env.DB.prepare(
          `SELECT c.id,c.user_id FROM verse_comments c WHERE c.id=?3 AND c.verse_id=?1 AND c.parent_id IS NULL AND ${visibility}`,
        )
          .bind(verseId, user.id, parent)
          .first();
        if (!p) fail(400, "invalid_parent");
        parentOwnerId = p.user_id ?? null;
      }
      const duplicate = await env.DB.prepare(
        "SELECT id FROM verse_comments WHERE user_id=?1 AND body=?2 AND created_at>?3 AND IFNULL(parent_id,'')=IFNULL(?4,'')",
      )
        .bind(user.id, text, now - 15000, parent)
        .first();
      if (duplicate) fail(409, "duplicate_comment");
      const id = uuid();
      await env.DB.prepare(
        `INSERT INTO verse_comments(id,verse_id,parent_id,user_id,author_name_snapshot,body,created_at,client_request_id)
        SELECT ?1,?2,?3,?4,?5,?6,?7,?8
        WHERE NOT EXISTS(SELECT 1 FROM verse_comments WHERE user_id=?4 AND body=?6 AND created_at>?9 AND IFNULL(parent_id,'')=IFNULL(?3,''))
        AND (?3 IS NULL OR EXISTS(SELECT 1 FROM verse_comments p WHERE p.id=?3 AND p.verse_id=?2 AND p.parent_id IS NULL AND p.hidden_at IS NULL
          AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?4 AND b.blocked_user_id=p.user_id) OR (b.blocked_user_id=?4 AND b.blocker_user_id=p.user_id))))
        ON CONFLICT DO NOTHING`,
      )
        .bind(
          id,
          verseId,
          parent,
          user.id,
          user.name,
          text,
          now,
          body.clientRequestId,
          now - 15000,
        )
        .run();
      // Resolve simultaneous retries through the unique index, not a pre-read alone.
      const saved = await env.DB.prepare(
        "SELECT id,body,parent_id,verse_id FROM verse_comments WHERE user_id=?1 AND client_request_id=?2",
      )
        .bind(user.id, body.clientRequestId)
        .first();
      if (!saved) fail(409, "duplicate_comment");
      if (
        saved.body !== text ||
        saved.parent_id !== parent ||
        saved.verse_id !== verseId
      )
        fail(409, "idempotency_conflict");
      if (parent && parentOwnerId) {
        await notifyUser({
          userId: parentOwnerId,
          actor: user,
          type: "comment_reply",
          targetId: saved.id,
          contextId: verseId,
          preview: text,
        });
      }
      return json({ id: saved.id }, 201);
    }
  }
  const commentRoute = path.match(
    /^\/verse-comments\/([a-z0-9-]+)(?:\/(report|like))?$/,
  );
  if (commentRoute) {
    participant(user);
    const [, id, action] = commentRoute;
    const row = await env.DB.prepare(
      "SELECT * FROM verse_comments WHERE id=?1 AND hidden_at IS NULL",
    )
      .bind(id)
      .first();
    if (!row) fail(404, "not_found");
    if (action === "like" && method === "POST") {
      if (row.user_id && (await blockedEitherWay(user.id, row.user_id)))
        fail(404, "not_found");
      if (row.parent_id) {
        const parentRow = await env.DB.prepare(
          "SELECT user_id,hidden_at FROM verse_comments WHERE id=?1",
        )
          .bind(row.parent_id)
          .first();
        if (
          !parentRow ||
          parentRow.hidden_at != null ||
          (parentRow.user_id && (await blockedEitherWay(user.id, parentRow.user_id)))
        )
          fail(404, "not_found");
      }
      await quota(env, `comment-like:${user.id}`, 60, 60000);
      await quota(env, `comment-like-ip:${ip}`, 180, 60000);
      const body = await bodyOf(request);
      if (typeof body.liked !== "boolean") fail(400, "invalid_like");
      if (body.liked) {
        await env.DB.prepare(
          "INSERT INTO verse_comment_likes(user_id,comment_id,created_at) VALUES(?1,?2,?3) ON CONFLICT DO NOTHING",
        )
          .bind(user.id, id, now)
          .run();
        if (row.user_id) {
          await notifyUser({
            userId: row.user_id,
            actor: user,
            type: "comment_like",
            targetId: id,
            contextId: row.verse_id,
            preview: row.body,
          });
        }
      } else {
        await env.DB.prepare(
          "DELETE FROM verse_comment_likes WHERE user_id=?1 AND comment_id=?2",
        )
          .bind(user.id, id)
          .run();
      }
      const countRow = await env.DB.prepare(
        "SELECT count(*) AS n FROM verse_comment_likes WHERE comment_id=?1",
      )
        .bind(id)
        .first();
      return json({
        ok: true,
        liked: body.liked,
        likesCount: Number(countRow?.n || 0),
      });
    }
    if (action === "report" && method === "POST") {
      await quota(env, `report:${user.id}`, 10, 3600000);
      await quota(env, `report-ip:${ip}`, 30, 3600000);
      const body = await bodyOf(request);
      if (!["abuse", "spam", "unsafe", "other"].includes(body.reason))
        fail(400, "invalid_report");
      const details = body.details ?? "";
      if (typeof details !== "string" || details.length > 500)
        fail(400, "invalid_report");
      const result = await env.DB.prepare(
        "INSERT INTO verse_comment_reports(id,comment_id,reporter_user_id,reason,details,created_at) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT DO NOTHING",
      )
        .bind(uuid(), id, user.id, body.reason, details, now)
        .run();
      if (result.meta?.changes && env.EMAIL_ENABLED === "true" && env.EMAIL) {
        const send = async () => {
          try {
            await env.EMAIL.send({
              from: env.EMAIL_FROM,
              to: ADMIN_EMAIL,
              subject: "Himnario: community report",
              text: `A comment was reported. Open the in-app moderation panel. Reported comment ID: ${id}`,
            });
          } catch {
            /* Report stays in moderation inbox even if email fails. */
          }
        };
        if (ctx?.waitUntil) ctx.waitUntil(send());
        else await send();
      }
      return json({ ok: true });
    }
    if (!action) {
      if (row.user_id !== user.id && !admin) fail(403, "forbidden");
      await quota(env, `comment-edit:${user.id}`, 20, 600000);
      if (method === "PUT") {
        let body;
        try {
          body = normalizeComment((await bodyOf(request)).body);
        } catch (e) {
          if (e instanceof RequestError) throw e;
          fail(400, e.message);
        }
        await env.DB.prepare(
          "UPDATE verse_comments SET body=?2,edited_at=?3 WHERE id=?1 AND hidden_at IS NULL",
        )
          .bind(id, body, now)
          .run();
        return json({ ok: true });
      }
      if (method === "DELETE") {
        await hideComment(env, id, user.id, now);
        return json({ ok: true });
      }
    }
  }
  const blockRoute = path.match(/^\/users\/([a-z0-9-]+)\/block$/);
  if (blockRoute) {
    participant(user);
    const id = blockRoute[1];
    if (id === user.id) fail(400, "invalid_block");
    await quota(env, `block:${user.id}`, 40, 3600000);
    if (method === "POST") {
      if (
        !(await env.DB.prepare("SELECT id FROM users WHERE id=?1")
          .bind(id)
          .first())
      )
        fail(404, "not_found");
      const [blockLow, blockHigh] = pairOf(user.id, id);
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO user_blocks VALUES(?1,?2,?3) ON CONFLICT DO NOTHING",
        ).bind(user.id, id, now),
        env.DB.prepare(
          "DELETE FROM friendships WHERE user_low=?1 AND user_high=?2",
        ).bind(blockLow, blockHigh),
        env.DB.prepare(
          "DELETE FROM shared_playlists WHERE (from_user=?1 AND to_user=?2) OR (from_user=?2 AND to_user=?1)",
        ).bind(user.id, id),
        env.DB.prepare(
          "DELETE FROM notifications WHERE (user_id=?1 AND actor_id=?2) OR (user_id=?2 AND actor_id=?1)",
        ).bind(user.id, id),
      ]);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      await env.DB.prepare(
        "DELETE FROM user_blocks WHERE blocker_user_id=?1 AND blocked_user_id=?2",
      )
        .bind(user.id, id)
        .run();
      return json({ ok: true });
    }
  }
  const publicProfileRoute = path.match(
    /^\/users\/([a-z0-9-]+)\/public-profile$/,
  );
  if (publicProfileRoute && method === "GET") {
    const targetId = publicProfileRoute[1];
    const target = await env.DB.prepare(
      "SELECT id,name,avatar_url,ministry,choir,church_id,church_name,location,show_church_location,show_friends_list,share_favorites_with_friends,badge_verified,suspended_at,created_at FROM users WHERE id=?1",
    )
      .bind(targetId)
      .first();
    if (!target || target.suspended_at != null) fail(404, "not_found");
    // none | self | outgoing (I asked) | incoming (they asked) | friends.
    // Only a signed-in caller gets a status; a block reads as "none".
    let friendStatus = null;
    let blocked = false;
    if (user) {
      friendStatus = "none";
      if (user.id === target.id) friendStatus = "self";
      else {
        blocked = await blockedEitherWay(user.id, target.id);
        if (!blocked) {
          const [low, high] = pairOf(user.id, target.id);
          const row = await env.DB.prepare(
            "SELECT status,requested_by FROM friendships WHERE user_low=?1 AND user_high=?2",
          )
            .bind(low, high)
            .first();
          if (row?.status === "accepted") friendStatus = "friends";
          else if (row) friendStatus = row.requested_by === user.id ? "outgoing" : "incoming";
        }
      }
    }
    // An accepted friend sees church and location even when they are hidden
    // from everyone else. Nobody else sees more than before.
    const showExtra =
      !blocked &&
      (target.show_church_location === 1 ||
        friendStatus === "friends" ||
        friendStatus === "self");
    const friendCountRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM friendships f JOIN users u
       ON u.id=CASE WHEN f.user_low=?1 THEN f.user_high ELSE f.user_low END
       WHERE f.status='accepted' AND (f.user_low=?1 OR f.user_high=?1) AND u.suspended_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))`,
    ).bind(target.id).first();
    return json({
      user: {
        memberSince: memberSince(target.created_at),
        friendCount: Number(friendCountRow?.total ?? 0),
        showFriendsList: !blocked && (target.show_friends_list !== 0 || friendStatus === "self"),
        friendStatus,
        id: target.id,
        name: target.name,
        displayName: target.name,
        initials: initials(target.name),
        avatarUrl: blocked ? null : (target.avatar_url ?? null),
        ministry: target.ministry ?? null,
        choir: target.choir ?? null,
        badgeVerified:
          target.ministry === "obispo" && target.badge_verified === 1,
        churchId: showExtra ? (target.church_id ?? null) : null,
        churchName: showExtra ? (target.church_name ?? null) : null,
        location: showExtra ? (target.location ?? null) : null,
      },
    });
  }
  // ── Friends ("Hermanos"), phase 1 ────────────────────────────────────────
  const friendSummary = (row, full) => ({
    id: row.id,
    name: row.name,
    initials: initials(row.name),
    avatarUrl: row.avatar_url ?? null,
    ministry: row.ministry ?? null,
    choir: row.choir ?? null,
    badgeVerified: row.ministry === "obispo" && row.badge_verified === 1,
    memberSince: memberSince(row.created_at),
    churchId: full || row.show_church_location === 1 ? (row.church_id ?? null) : null,
    churchName: full || row.show_church_location === 1 ? (row.church_name ?? null) : null,
    location: full || row.show_church_location === 1 ? (row.location ?? null) : null,
  });
  const userFriendsRoute = path.match(/^\/users\/([a-z0-9-]+)\/friends$/);
  if (userFriendsRoute && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const targetId = userFriendsRoute[1];
    if (!validId(targetId)) fail(400, "invalid_friend");
    const target = await env.DB.prepare(
      "SELECT id,show_friends_list,suspended_at FROM users WHERE id=?1",
    )
      .bind(targetId)
      .first();
    if (!target || target.suspended_at != null) fail(404, "not_found");
    if (user.id !== targetId && (await blockedEitherWay(user.id, targetId))) {
      return json(
        { visible: false, count: 0, friends: [] },
        200,
        { "Cache-Control": "private, no-store" },
      );
    }
    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM friendships f JOIN users u
       ON u.id=CASE WHEN f.user_low=?1 THEN f.user_high ELSE f.user_low END
       WHERE f.status='accepted' AND (f.user_low=?1 OR f.user_high=?1) AND u.suspended_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))`,
    )
      .bind(targetId)
      .first();
    const totalCount = Number(countRow?.total ?? 0);
    if (target.show_friends_list === 0 && user.id !== targetId) {
      return json(
        { visible: false, count: totalCount, friends: [] },
        200,
        { "Cache-Control": "private, no-store" },
      );
    }
    const rows = await all(
      `SELECT u.id,u.name,u.avatar_url,u.ministry,u.choir,u.badge_verified,u.church_id,u.church_name,u.location,u.show_church_location,u.created_at,
              vf.status AS vf_status, vf.requested_by AS vf_requested_by
       FROM friendships f
       JOIN users u ON u.id=CASE WHEN f.user_low=?1 THEN f.user_high ELSE f.user_low END
       LEFT JOIN friendships vf ON (vf.user_low=CASE WHEN ?2<u.id THEN ?2 ELSE u.id END AND vf.user_high=CASE WHEN ?2<u.id THEN u.id ELSE ?2 END) AND ?2<>u.id
       WHERE f.status='accepted' AND (f.user_low=?1 OR f.user_high=?1) AND u.suspended_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))
         AND NOT EXISTS(SELECT 1 FROM user_blocks b2 WHERE (b2.blocker_user_id=?2 AND b2.blocked_user_id=u.id) OR (b2.blocked_user_id=?2 AND b2.blocker_user_id=u.id))
       ORDER BY u.name COLLATE NOCASE ASC LIMIT 200`,
      targetId,
      user.id,
    );
    const friends = rows.map((row) => {
      const friendStatus =
        row.id === user.id
          ? "self"
          : row.vf_status === "accepted"
            ? "friends"
            : row.vf_status === "pending"
              ? row.vf_requested_by === user.id
                ? "outgoing"
                : "incoming"
              : "none";
      return {
        ...friendSummary(row, friendStatus === "friends" || friendStatus === "self"),
        friendStatus,
      };
    });
    return json(
      { visible: true, count: totalCount, friends },
      200,
      { "Cache-Control": "private, no-store" },
    );
  }
  if (path === "/friends" && method === "GET") {
    if (!user) fail(401, "unauthorized");
    // The other person of each pair, leaving out suspended accounts and
    // anyone blocked in either direction.
    const rows = await all(
      `SELECT f.status,f.requested_by,f.created_at AS requested_at,u.id,u.name,u.avatar_url,u.ministry,u.choir,u.badge_verified,u.church_id,u.church_name,u.location,u.show_church_location,u.created_at
       FROM friendships f JOIN users u ON u.id=CASE WHEN f.user_low=?1 THEN f.user_high ELSE f.user_low END
       WHERE (f.user_low=?1 OR f.user_high=?1) AND u.suspended_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))
       ORDER BY f.created_at DESC LIMIT 500`,
      user.id,
    );
    const out = { friends: [], incoming: [], outgoing: [] };
    for (const row of rows) {
      if (row.status === "accepted") out.friends.push(friendSummary(row, true));
      else if (row.requested_by === user.id) out.outgoing.push(friendSummary(row, false));
      else out.incoming.push(friendSummary(row, false));
    }
    out.friends.sort((a, b) => a.name.localeCompare(b.name));
    return json(out, 200, { "Cache-Control": "private, no-store" });
  }
  if (path === "/friends/requests" && method === "POST") {
    participant(user);
    await quota(env, `friend-request:${user.id}`, 20, 3600000);
    await quota(env, `friend-request-ip:${ip}`, 60, 3600000);
    const targetId = (await bodyOf(request)).userId;
    if (!validId(targetId) || targetId === user.id) fail(400, "invalid_friend");
    const target = await env.DB.prepare(
      "SELECT id,suspended_at FROM users WHERE id=?1",
    )
      .bind(targetId)
      .first();
    // A blocked person gets the same answer as a missing one.
    if (!target || target.suspended_at != null || (await blockedEitherWay(user.id, targetId)))
      fail(404, "not_found");
    const [low, high] = pairOf(user.id, targetId);
    const existing = await env.DB.prepare(
      "SELECT status,requested_by FROM friendships WHERE user_low=?1 AND user_high=?2",
    )
      .bind(low, high)
      .first();
    if (existing?.status === "accepted") return json({ friendStatus: "friends" });
    if (existing && existing.requested_by === user.id)
      return json({ friendStatus: "outgoing" });
    if (existing) {
      // They had already asked: asking back is the same as accepting.
      const accepted = await env.DB.prepare(
        "UPDATE friendships SET status='accepted',responded_at=?3 WHERE user_low=?1 AND user_high=?2 AND status='pending'",
      )
        .bind(low, high, now)
        .run();
      if (accepted.meta?.changes) {
        await notifyUser({
          userId: targetId,
          actor: user,
          type: "friend_accepted",
          targetId: user.id,
        });
      }
      return json({ friendStatus: "friends" });
    }
    const inserted = await env.DB.prepare(
      "INSERT INTO friendships(user_low,user_high,requested_by,status,created_at) VALUES(?1,?2,?3,'pending',?4) ON CONFLICT DO NOTHING",
    )
      .bind(low, high, user.id, now)
      .run();
    if (inserted.meta?.changes) {
      await notifyUser({
        userId: targetId,
        actor: user,
        type: "friend_request",
        targetId: user.id,
      });
    }
    return json({ friendStatus: "outgoing" });
  }
  // Phase 4: people who linked the same verified church. Only those who chose
  // to be suggested, or who already show their church publicly.
  const resolveUserChurchId = async () => {
    if (!user) return null;
    if (user.church_id) {
      const linked = await env.DB.prepare(
        "SELECT id FROM churches WHERE id=?1 AND status='approved' AND verified=1",
      ).bind(user.church_id).first();
      return linked?.id ?? null;
    }
    const rawName = typeof user?.church_name === "string" ? user.church_name.trim() : "";
    if (!rawName) return null;
    const matches = await all(
      "SELECT id FROM churches WHERE status='approved' AND verified=1 AND (LOWER(name)=LOWER(?1) OR LOWER(city)=LOWER(?1)) LIMIT 2",
      rawName,
    );
    if (matches.length !== 1) return null;
    const repaired = await env.DB.prepare(
      "UPDATE users SET church_id=?2 WHERE id=?1 AND church_id IS NULL AND church_name=?3 RETURNING church_id",
    ).bind(user.id, matches[0].id, user.church_name).first();
    return repaired?.church_id ?? null;
  };
  const listChurchMembers = async (churchId, offset, sameChurch) => {
    const visibilityCondition = sameChurch
      ? "(COALESCE(u.suggest_to_church_members,u.show_church_location)=1 OR u.directory_visible_to_all=1)"
      : "u.directory_visible_to_all=1";
    const visibleMembers = `FROM users u
       WHERE u.church_id=?2 AND u.suspended_at IS NULL AND u.email_verified_at IS NOT NULL
         AND ${visibilityCondition}
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))`;
    const [rows, countRow] = await Promise.all([all(
      `SELECT u.id,u.name,u.avatar_url,u.ministry,u.choir,u.badge_verified,u.church_id,u.church_name,u.location,u.show_church_location,u.created_at,
              f.status AS f_status, f.requested_by AS f_requested_by
       FROM users u
       LEFT JOIN friendships f
         ON (f.user_low=?1 AND f.user_high=u.id) OR (f.user_high=?1 AND f.user_low=u.id)
       WHERE u.church_id=?2 AND u.suspended_at IS NULL AND u.email_verified_at IS NOT NULL
         AND ${visibilityCondition}
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))
       ORDER BY u.name COLLATE NOCASE ASC, u.id ASC LIMIT 51 OFFSET ?3`,
      user.id,
      churchId,
      offset,
    ), env.DB.prepare(`SELECT COUNT(*) AS total ${visibleMembers}`).bind(user.id, churchId).first()]);
    const members = rows.slice(0, 50).map((row) => {
      const friendStatus =
        row.id === user.id
          ? "self"
          : row.f_status === "accepted"
          ? "friends"
          : row.f_status === "pending"
            ? row.f_requested_by === user.id
              ? "outgoing"
              : "incoming"
            : "none";
      return {
        ...friendSummary(row, friendStatus === "friends" || friendStatus === "self"),
        friendStatus,
      };
    });
    return { members, total: Number(countRow?.total ?? 0), nextOffset: rows.length > 50 ? offset + 50 : null };
  };
  const churchMembersOffset = () => {
    const offset = Number(url.searchParams.get("offset") ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0) fail(400, "invalid_offset");
    return offset;
  };
  if (path === "/friends/suggestions" && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const resolvedChurchId = await resolveUserChurchId();
    if (!resolvedChurchId)
      return json({ users: [], hasChurch: false }, 200, { "Cache-Control": "private, no-store" });
    const [rows, directory, churchRow] = await Promise.all([
      all(
        `SELECT u.id,u.name,u.avatar_url,u.ministry,u.choir,u.badge_verified,u.church_id,u.church_name,u.location,u.show_church_location,u.created_at
         FROM users u
         WHERE u.church_id=?2 AND u.id<>?1 AND u.suspended_at IS NULL AND u.email_verified_at IS NOT NULL
           AND (COALESCE(u.suggest_to_church_members,u.show_church_location)=1 OR u.directory_visible_to_all=1)
           AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))
           AND NOT EXISTS(SELECT 1 FROM friendships f WHERE (f.user_low=?1 AND f.user_high=u.id) OR (f.user_high=?1 AND f.user_low=u.id))
         ORDER BY u.name COLLATE NOCASE ASC LIMIT 20`,
        user.id,
        resolvedChurchId,
      ),
      listChurchMembers(resolvedChurchId, churchMembersOffset(), true),
      env.DB.prepare("SELECT name FROM churches WHERE id=?1 LIMIT 1")
        .bind(resolvedChurchId)
        .first(),
    ]);
    return json(
      {
        users: rows.map((row) => friendSummary(row, false)),
        hasChurch: true,
        churchId: resolvedChurchId,
        churchName: churchRow?.name || user.church_name || null,
        churchMembers: directory.members,
        churchMembersNextOffset: directory.nextOffset,
      },
      200,
      { "Cache-Control": "private, no-store" },
    );
  }
  const churchMembersMatch = path.match(/^\/churches\/([a-zA-Z0-9_-]{3,64})\/members$/);
  if (churchMembersMatch && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const churchId = churchMembersMatch[1];
    const churchRow = await env.DB.prepare("SELECT name FROM churches WHERE id=?1 AND status='approved' AND verified=1 LIMIT 1")
      .bind(churchId).first();
    if (!churchRow) fail(404, "church_not_found");
    const ownChurchId = await resolveUserChurchId();
    const directory = await listChurchMembers(churchId, churchMembersOffset(), ownChurchId === churchId);
    return json(
      {
        churchId,
        churchName: churchRow.name,
        ...directory,
      },
      200,
      { "Cache-Control": "private, no-store" },
    );
  }
  // Phase 2: an accepted friend's favourite hymns, if they share them.
  const friendFavorites = path.match(/^\/friends\/([a-z0-9-]+)\/favorites$/);
  if (friendFavorites && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const otherId = friendFavorites[1];
    if (!validId(otherId) || otherId === user.id) fail(400, "invalid_friend");
    const [low, high] = pairOf(user.id, otherId);
    const [link, target, blocked] = await Promise.all([
      env.DB.prepare(
        "SELECT status FROM friendships WHERE user_low=?1 AND user_high=?2",
      )
        .bind(low, high)
        .first(),
      env.DB.prepare(
        "SELECT share_favorites_with_friends,suspended_at FROM users WHERE id=?1",
      )
        .bind(otherId)
        .first(),
      blockedEitherWay(user.id, otherId),
    ]);
    // Anyone who is not an accepted friend gets the same answer, whatever the reason.
    if (!target || target.suspended_at != null || blocked || link?.status !== "accepted")
      fail(403, "not_friends");
    if (target.share_favorites_with_friends === 0)
      return json({ shared: false, favorites: [] }, 200, { "Cache-Control": "private, no-store" });
    const data = await env.DB.prepare(
      "SELECT favorites_json FROM user_data WHERE user_id=?1",
    )
      .bind(otherId)
      .first();
    let favorites = [];
    try {
      const parsed = JSON.parse(data?.favorites_json || "[]");
      if (Array.isArray(parsed))
        favorites = parsed
          .filter((id) => (typeof id === "string" || typeof id === "number") && String(id).length <= 12)
          .map(String)
          .slice(0, 1000);
    } catch {
      favorites = [];
    }
    return json({ shared: true, favorites }, 200, { "Cache-Control": "private, no-store" });
  }
  // Phase 3: sending a copy of a playlist to an accepted friend.
  const friendPlaylists = path.match(/^\/friends\/([a-z0-9-]+)\/playlists$/);
  if (friendPlaylists && method === "POST") {
    participant(user);
    const otherId = friendPlaylists[1];
    if (!validId(otherId) || otherId === user.id) fail(400, "invalid_friend");
    const body = await bodyOf(request);
    if (typeof body.name !== "string") fail(400, "invalid_playlist");
    const cleanName = body.name.replace(/\s+/g, " ").trim();
    if (
      !cleanName ||
      cleanName.length > 60 ||
      /[<>\u0000-\u001f]/u.test(cleanName)
    )
      fail(400, "invalid_playlist");
    if (
      !Array.isArray(body.hymnIds) ||
      body.hymnIds.length < 1 ||
      body.hymnIds.length > 200
    )
      fail(400, "invalid_playlist");
    const deduped = [];
    for (const rawId of body.hymnIds) {
      if (typeof rawId !== "string") fail(400, "invalid_playlist");
      const trimmedId = rawId.trim();
      if (!/^[A-Za-z0-9 ]{1,8}$/.test(trimmedId)) fail(400, "invalid_playlist");
      if (!deduped.includes(trimmedId)) deduped.push(trimmedId);
    }
    if (deduped.length < 1 || deduped.length > 200)
      fail(400, "invalid_playlist");
    await quota(env, `share-playlist:${user.id}`, 10, 3600000);
    await quota(env, `share-playlist-ip:${ip}`, 30, 3600000);
    const [low, high] = pairOf(user.id, otherId);
    const [link, target, blocked] = await Promise.all([
      env.DB.prepare(
        "SELECT status FROM friendships WHERE user_low=?1 AND user_high=?2",
      )
        .bind(low, high)
        .first(),
      env.DB.prepare("SELECT id,suspended_at FROM users WHERE id=?1")
        .bind(otherId)
        .first(),
      blockedEitherWay(user.id, otherId),
    ]);
    if (!target || target.suspended_at != null || blocked || link?.status !== "accepted")
      fail(403, "not_friends");
    const id = uuid();
    await env.DB.prepare(
      "INSERT INTO shared_playlists(id,from_user,to_user,name,hymn_ids_json,created_at,seen_at) VALUES(?1,?2,?3,?4,?5,?6,NULL)",
    )
      .bind(id, user.id, otherId, cleanName, JSON.stringify(deduped), now)
      .run();
    await notifyUser({
      userId: otherId,
      actor: user,
      type: "shared_playlist",
      targetId: id,
      preview: cleanName,
    });
    return json({ ok: true, id }, 201);
  }
  if (path === "/playlists/shared" && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const rows = await all(
      `SELECT s.id,s.from_user,s.name,s.hymn_ids_json,s.created_at,s.seen_at,u.name AS from_name,u.avatar_url AS from_avatar_url
       FROM shared_playlists s
       JOIN users u ON u.id=s.from_user
       WHERE s.to_user=?1 AND u.suspended_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))
       ORDER BY s.created_at DESC, s.id DESC LIMIT 50`,
      user.id,
    );
    const playlists = rows.map((r) => {
      let hymnIds = [];
      try {
        const parsed = JSON.parse(r.hymn_ids_json || "[]");
        if (Array.isArray(parsed)) {
          hymnIds = parsed
            .filter(
              (x) => typeof x === "string" && /^[A-Za-z0-9 ]{1,8}$/.test(x),
            )
            .slice(0, 200);
        }
      } catch {}
      return {
        id: r.id,
        fromUserId: r.from_user,
        fromName: r.from_name,
        fromInitials: initials(r.from_name),
        fromAvatarUrl: r.from_avatar_url ?? null,
        name: r.name,
        hymnIds,
        createdAt: r.created_at,
        seen: r.seen_at != null,
      };
    });
    return json({ playlists }, 200, { "Cache-Control": "private, no-store" });
  }
  const sharedSeenRoute = path.match(/^\/playlists\/shared\/([a-z0-9-]+)\/seen$/);
  if (sharedSeenRoute && method === "POST") {
    if (!user) fail(401, "unauthorized");
    const sharedId = sharedSeenRoute[1];
    if (!validId(sharedId)) fail(400, "invalid_playlist");
    await quota(env, `shared-playlist-act:${user.id}`, 120, 3600000);
    await env.DB.prepare(
      "UPDATE shared_playlists SET seen_at=COALESCE(seen_at,?3) WHERE id=?1 AND to_user=?2",
    )
      .bind(sharedId, user.id, now)
      .run();
    return json({ ok: true });
  }
  const sharedDeleteRoute = path.match(/^\/playlists\/shared\/([a-z0-9-]+)$/);
  if (sharedDeleteRoute && method === "DELETE") {
    if (!user) fail(401, "unauthorized");
    const sharedId = sharedDeleteRoute[1];
    if (!validId(sharedId)) fail(400, "invalid_playlist");
    await quota(env, `shared-playlist-act:${user.id}`, 120, 3600000);
    await env.DB.prepare(
      "DELETE FROM shared_playlists WHERE id=?1 AND to_user=?2",
    )
      .bind(sharedId, user.id)
      .run();
    return json({ ok: true });
  }
  const friendAccept = path.match(/^\/friends\/requests\/([a-z0-9-]+)\/accept$/);
  if (friendAccept && method === "POST") {
    participant(user);
    await quota(env, `friend-accept:${user.id}`, 60, 3600000);
    const otherId = friendAccept[1];
    if (!validId(otherId) || otherId === user.id) fail(400, "invalid_friend");
    if (await blockedEitherWay(user.id, otherId)) fail(404, "not_found");
    const [low, high] = pairOf(user.id, otherId);
    // Only the person who received the request can accept it.
    const result = await env.DB.prepare(
      "UPDATE friendships SET status='accepted',responded_at=?4 WHERE user_low=?1 AND user_high=?2 AND status='pending' AND requested_by=?3",
    )
      .bind(low, high, otherId, now)
      .run();
    if (!result.meta?.changes) {
      const row = await env.DB.prepare(
        "SELECT status FROM friendships WHERE user_low=?1 AND user_high=?2",
      )
        .bind(low, high)
        .first();
      if (row?.status !== "accepted") fail(404, "not_found");
    } else {
      await notifyUser({
        userId: otherId,
        actor: user,
        type: "friend_accepted",
        targetId: user.id,
      });
    }
    return json({ friendStatus: "friends" });
  }
  // ── Notifications (Phase 1 inbox + Phase 2 Expo push tokens) ─────────────
  if (path === "/notifications" && method === "GET") {
    if (!user) fail(401, "unauthorized");
    const [rows, unreadRow] = await Promise.all([
      all(
        `SELECT n.id,n.actor_id,n.type,n.target_id,n.context_id,n.preview,n.created_at,n.read_at,u.name AS actor_name,u.avatar_url AS actor_avatar_url
         FROM notifications n
         LEFT JOIN users u ON u.id=n.actor_id
         WHERE n.user_id=?1
           AND (n.actor_id IS NULL OR (u.id IS NOT NULL AND u.suspended_at IS NULL
             AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))))
         ORDER BY n.created_at DESC, n.id DESC LIMIT 50`,
        user.id,
      ),
      env.DB.prepare(
        `SELECT count(*) AS n FROM notifications n
         LEFT JOIN users u ON u.id=n.actor_id
         WHERE n.user_id=?1 AND n.read_at IS NULL
           AND (n.actor_id IS NULL OR (u.id IS NOT NULL AND u.suspended_at IS NULL
             AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?1 AND b.blocked_user_id=u.id) OR (b.blocked_user_id=?1 AND b.blocker_user_id=u.id))))`,
      )
        .bind(user.id)
        .first(),
    ]);
    return json(
      {
        notifications: rows.map((r) => ({
          id: r.id,
          actorId: r.actor_id ?? null,
          actorName: r.actor_name || "Miembro",
          actorInitials: r.actor_name ? initials(r.actor_name) : "—",
          actorAvatarUrl: r.actor_avatar_url ?? null,
          type: r.type,
          targetId: r.target_id,
          contextId: r.context_id ?? null,
          preview: r.preview ?? null,
          createdAt: r.created_at,
          read: r.read_at != null,
        })),
        unreadCount: Number(unreadRow?.n || 0),
      },
      200,
      { "Cache-Control": "private, no-store" },
    );
  }
  if (path === "/notifications/read" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `notif-act:${user.id}`, 120, 3600000);
    const body = await bodyOf(request);
    if (body.all === true) {
      await env.DB.prepare(
        "UPDATE notifications SET read_at=COALESCE(read_at,?2) WHERE user_id=?1 AND read_at IS NULL",
      )
        .bind(user.id, now)
        .run();
      return json({ ok: true });
    }
    if (!validId(body.id)) fail(400, "invalid_notification");
    await env.DB.prepare(
      "UPDATE notifications SET read_at=COALESCE(read_at,?3) WHERE id=?1 AND user_id=?2",
    )
      .bind(body.id, user.id, now)
      .run();
    return json({ ok: true });
  }
  if (path === "/notifications/push-token" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `push-token:${user.id}`, 30, 3600000);
    await quota(env, `push-token-ip:${ip}`, 60, 3600000);
    const body = await bodyOf(request);
    if (
      typeof body.token !== "string" ||
      !VALID_EXPO_PUSH_TOKEN.test(body.token) ||
      !["ios", "android"].includes(body.platform)
    )
      fail(400, "invalid_push_token");
    const lang = body.language === "en" ? "en" : "es";
    await env.DB.prepare(
      "INSERT INTO push_tokens(token,user_id,platform,language,updated_at) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(token) DO UPDATE SET user_id=?2,platform=?3,language=?4,updated_at=?5",
    )
      .bind(body.token, user.id, body.platform, lang, now)
      .run();
    return json({ ok: true });
  }
  if (path === "/notifications/push-token" && method === "DELETE") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `push-token:${user.id}`, 30, 3600000);
    let tokenStr = url.searchParams.get("token");
    if (!tokenStr) {
      try {
        tokenStr = (await bodyOf(request)).token;
      } catch {}
    }
    if (typeof tokenStr !== "string" || !VALID_EXPO_PUSH_TOKEN.test(tokenStr))
      fail(400, "invalid_push_token");
    await env.DB.prepare(
      "DELETE FROM push_tokens WHERE token=?1 AND user_id=?2",
    )
      .bind(tokenStr, user.id)
      .run();
    return json({ ok: true });
  }
  const notifItem = path.match(/^\/notifications\/([a-z0-9-]+)$/);
  if (notifItem && method === "DELETE") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `notif-act:${user.id}`, 120, 3600000);
    const notifId = notifItem[1];
    if (!validId(notifId)) fail(400, "invalid_notification");
    await env.DB.prepare("DELETE FROM notifications WHERE id=?1 AND user_id=?2")
      .bind(notifId, user.id)
      .run();
    return json({ ok: true });
  }
  const friendItem = path.match(/^\/friends\/([a-z0-9-]+)$/);
  if (friendItem && method === "DELETE") {
    // Decline, cancel or unfriend: each simply removes the pair's row.
    if (!user) fail(401, "unauthorized");
    await quota(env, `friend-remove:${user.id}`, 60, 3600000);
    const otherId = friendItem[1];
    if (!validId(otherId) || otherId === user.id) fail(400, "invalid_friend");
    const [low, high] = pairOf(user.id, otherId);
    await env.DB.prepare(
      "DELETE FROM friendships WHERE user_low=?1 AND user_high=?2",
    )
      .bind(low, high)
      .run();
    return json({ friendStatus: "none" });
  }
  if (path === "/users/blocks" && method === "GET") {
    if (!user) fail(401, "unauthorized");
    return json({
      users: await all(
        "SELECT u.id,u.name FROM user_blocks b JOIN users u ON u.id=b.blocked_user_id WHERE b.blocker_user_id=?1 LIMIT 500",
        user.id,
      ),
    });
  }
  if (path === "/mod/reports" && method === "GET") {
    const status = url.searchParams.get("status") || "open";
    if (!["open", "resolved", "dismissed"].includes(status))
      fail(400, "invalid_status");
    const before =
      Number(url.searchParams.get("before")) || Number.MAX_SAFE_INTEGER;
    return json({
      reports: await all(
        "SELECT r.*,c.body,c.user_id,u.name,u.ministry,u.badge_verified,u.suspended_at FROM verse_comment_reports r JOIN verse_comments c ON c.id=r.comment_id LEFT JOIN users u ON u.id=c.user_id WHERE r.status=?1 AND r.created_at<?2 ORDER BY r.created_at DESC LIMIT 50",
        status,
        before,
      ),
    });
  }
  if (path === "/mod/users" && method === "GET") {
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length > 100) fail(400, "invalid_query");
    return json({
      users: await all(
        "SELECT id,name,ministry,choir,badge_verified,suspended_at FROM users WHERE name LIKE ?1 OR id=?2 ORDER BY name LIMIT 50",
        `%${q}%`,
        q,
      ),
    });
  }
  const modComment = path.match(/^\/mod\/comments\/([a-z0-9-]+)\/hide$/);
  if (modComment && method === "POST") {
    await hideComment(env, modComment[1], user.id, now);
    return json({ ok: true });
  }
  const modReport = path.match(/^\/mod\/reports\/([a-z0-9-]+)\/dismiss$/);
  if (modReport && method === "POST") {
    await env.DB.prepare(
      "UPDATE verse_comment_reports SET status='dismissed',resolved_by=?2,resolved_at=?3 WHERE id=?1 AND status='open'",
    )
      .bind(modReport[1], user.id, now)
      .run();
    return json({ ok: true });
  }
  const modUser = path.match(
    /^\/mod\/users\/([a-z0-9-]+)\/(suspend|restore|verify-obispo)$/,
  );
  if (modUser && method === "POST") {
    const [, id, action] = modUser;
    if (id === user.id) fail(400, "cannot_moderate_self");
    const target = await env.DB.prepare("SELECT * FROM users WHERE id=?1")
      .bind(id)
      .first();
    if (!target) fail(404, "not_found");
    if (action === "verify-obispo") {
      const body = await bodyOf(request);
      if (target.ministry !== "obispo" || typeof body.verified !== "boolean")
        fail(400, "invalid_badge");
      await env.DB.prepare(
        "UPDATE users SET badge_verified=?2 WHERE id=?1 AND ministry='obispo'",
      )
        .bind(id, body.verified ? 1 : 0)
        .run();
    } else {
      const body = await bodyOf(request),
        reason = body.reason ?? "Community moderation";
      if (typeof reason !== "string" || reason.length > 500)
        fail(400, "invalid_reason");
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE users SET suspended_at=?2,suspended_reason=?3 WHERE id=?1",
        ).bind(
          id,
          action === "suspend" ? now : null,
          action === "suspend" ? reason : null,
        ),
        env.DB.prepare("DELETE FROM sessions WHERE user_id=?1").bind(id),
      ]);
      if (action === "suspend")
        await env.DB.prepare(
          "UPDATE verse_comments SET hidden_at=?2,hidden_by=?3 WHERE (user_id=?1 OR parent_id IN (SELECT id FROM verse_comments WHERE user_id=?1)) AND hidden_at IS NULL",
        )
          .bind(id, now, user.id)
          .run();
    }
    return json({ ok: true });
  }
  const isApprovedRepertoireChoir = async (slug) => {
    if (typeof slug !== "string" || !/^[a-z0-9_-]{2,40}$/.test(slug) || slug === "otro") {
      return false;
    }
    const row = await env.DB.prepare(
      "SELECT slug FROM choirs WHERE slug=?1 AND status='approved'",
    )
      .bind(slug)
      .first();
    return Boolean(row);
  };
  const parseChoirInput = (rawName, rawNameEn, rawChurchContext) => {
    if (typeof rawName !== "string") fail(400, "invalid_choir");
    const cleaned = rawName.replace(/\s+/g, " ").trim();
    if (
      cleaned.length < 2 ||
      cleaned.length > 60 ||
      /[<>\u0000-\u001f]/u.test(cleaned)
    ) {
      fail(400, "invalid_choir");
    }
    const bare = cleaned
      .replace(/^coro\s+/i, "")
      .replace(/\s+choir$/i, "")
      .trim();
    const slugSource = bare.length >= 2 ? bare : cleaned;
    const slug = slugSource
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
    if (!slug || slug.length < 2 || slug === "otro" || slug === "other") {
      fail(400, "invalid_choir");
    }
    const nameEs = /^coro\s+/i.test(cleaned)
      ? cleaned
      : `Coro ${bare || cleaned}`.slice(0, 60);
    let nameEn = "";
    if (typeof rawNameEn === "string" && rawNameEn.trim()) {
      const cleanedEn = rawNameEn.replace(/\s+/g, " ").trim();
      if (
        cleanedEn.length < 2 ||
        cleanedEn.length > 60 ||
        /[<>\u0000-\u001f]/u.test(cleanedEn)
      ) {
        fail(400, "invalid_choir");
      }
      nameEn = cleanedEn;
    } else {
      nameEn = `${bare || cleaned} Choir`.slice(0, 60);
    }
    let churchContext = null;
    if (rawChurchContext != null && rawChurchContext !== "") {
      if (typeof rawChurchContext !== "string") fail(400, "invalid_choir");
      const cc = rawChurchContext.replace(/\s+/g, " ").trim();
      if (cc.length > 100 || /[<>\u0000-\u001f]/u.test(cc)) {
        fail(400, "invalid_choir");
      }
      churchContext = cc || null;
    }
    return { slug, nameEs, nameEn, churchContext };
  };
  const serializeChoir = (r) => ({
    slug: r.slug,
    nameEs: r.name_es,
    nameEn: r.name_en,
    churchContext: r.church_context || null,
    status: r.status || "approved",
    submittedByName: r.submitted_by_name || null,
    createdAt: Number(r.created_at || 0),
    approvedAt: r.approved_at != null ? Number(r.approved_at) : null,
  });

  if (path === "/choirs" && method === "GET") {
    const rows = await all(
      `SELECT slug, name_es, name_en, status, created_at, approved_at
       FROM choirs
       WHERE status='approved'
       ORDER BY CASE slug WHEN 'esmirna' THEN 0 WHEN 'maranatha' THEN 1 WHEN 'filadelfia' THEN 2 ELSE 3 END, name_es COLLATE NOCASE ASC`,
    );
    return json(
      {
        choirs: rows.map((r) => ({
          slug: r.slug,
          nameEs: r.name_es,
          nameEn: r.name_en,
        })),
      },
      200,
      { "Cache-Control": "public, max-age=120" },
    );
  }
  if (path === "/choirs/submit" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    if (!admin && user.email_verified_at == null) {
      fail(403, "email_verification_required");
    }
    if (user.suspended_at != null) fail(403, "account_suspended");
    await quota(env, `choir-submit-user:${user.id}`, admin ? 30 : 3, 86400000);
    await quota(env, `choir-submit-ip:${ip}`, 10, 3600000);
    const b = await bodyOf(request);
    const parsed = parseChoirInput(b.name, b.nameEn, b.churchContext);
    const existing = await env.DB.prepare(
      "SELECT slug, status FROM choirs WHERE slug=?1",
    )
      .bind(parsed.slug)
      .first();
    if (existing && (existing.status === "approved" || existing.status === "pending")) {
      fail(409, "choir_exists");
    }
    const nextStatus = admin ? "approved" : "pending";
    const approvedAt = admin ? now : null;
    if (existing) {
      await env.DB.prepare(
        "UPDATE choirs SET name_es=?2,name_en=?3,church_context=?4,status=?5,submitted_by=?6,created_at=?7,approved_at=?8 WHERE slug=?1",
      )
        .bind(
          parsed.slug,
          parsed.nameEs,
          parsed.nameEn,
          parsed.churchContext,
          nextStatus,
          user.id,
          now,
          approvedAt,
        )
        .run();
    } else {
      await env.DB.prepare(
        "INSERT INTO choirs(slug,name_es,name_en,church_context,status,submitted_by,created_at,approved_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)",
      )
        .bind(
          parsed.slug,
          parsed.nameEs,
          parsed.nameEn,
          parsed.churchContext,
          nextStatus,
          user.id,
          now,
          approvedAt,
        )
        .run();
    }
    return json({
      ok: true,
      status: nextStatus,
      choir: {
        slug: parsed.slug,
        nameEs: parsed.nameEs,
        nameEn: parsed.nameEn,
        churchContext: parsed.churchContext,
        status: nextStatus,
      },
    });
  }
  if (path === "/mod/choirs" && method === "GET") {
    const rows = await all(
      `SELECT c.slug, c.name_es, c.name_en, c.church_context, c.status, c.created_at, c.approved_at, u.name AS submitted_by_name
       FROM choirs c
       LEFT JOIN users u ON u.id = c.submitted_by
       WHERE c.status IN ('pending', 'approved')
       ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.created_at DESC`,
    );
    return json({ choirs: rows.map(serializeChoir) });
  }
  const modChoirAct = path.match(/^\/mod\/choirs\/([a-z0-9_-]{2,40})\/(approve|reject)$/);
  if (modChoirAct && method === "POST") {
    const slug = modChoirAct[1];
    const act = modChoirAct[2];
    const existing = await env.DB.prepare(
      "SELECT slug, name_es, name_en, church_context, status FROM choirs WHERE slug=?1",
    )
      .bind(slug)
      .first();
    if (!existing) fail(404, "not_found");
    if (act === "approve") {
      const b = await bodyOf(request).catch(() => ({}));
      let nameEs = existing.name_es;
      let nameEn = existing.name_en;
      if (typeof b.nameEs === "string" && b.nameEs.trim()) {
        const cleanEs = b.nameEs.replace(/\s+/g, " ").trim();
        if (cleanEs.length < 2 || cleanEs.length > 60 || /[<>\u0000-\u001f]/u.test(cleanEs)) {
          fail(400, "invalid_choir");
        }
        nameEs = cleanEs;
      }
      if (typeof b.nameEn === "string" && b.nameEn.trim()) {
        const cleanEn = b.nameEn.replace(/\s+/g, " ").trim();
        if (cleanEn.length < 2 || cleanEn.length > 60 || /[<>\u0000-\u001f]/u.test(cleanEn)) {
          fail(400, "invalid_choir");
        }
        nameEn = cleanEn;
      }
      await env.DB.prepare(
        "UPDATE choirs SET name_es=?2,name_en=?3,status='approved',approved_at=COALESCE(approved_at,?4) WHERE slug=?1",
      )
        .bind(slug, nameEs, nameEn, now)
        .run();
      return json({
        ok: true,
        choir: { slug, nameEs, nameEn, status: "approved" },
      });
    }
    await env.DB.prepare("UPDATE choirs SET status='rejected' WHERE slug=?1")
      .bind(slug)
      .run();
    await env.DB.prepare("UPDATE users SET choir=NULL WHERE choir=?1")
      .bind(slug)
      .run();
    return json({ ok: true });
  }
  const modChoirDel = path.match(/^\/mod\/choirs\/([a-z0-9_-]{2,40})$/);
  if (modChoirDel && modChoirDel[1] !== "repertoire" && method === "PUT") {
    const slug = modChoirDel[1];
    const existing = await env.DB.prepare(
      "SELECT slug FROM choirs WHERE slug=?1 AND status='approved'",
    ).bind(slug).first();
    if (!existing) fail(404, "not_found");
    const body = await bodyOf(request);
    if (!body || Object.keys(body).some((key) => !["nameEs", "nameEn"].includes(key)))
      fail(400, "invalid_choir");
    const cleanName = (value) => {
      if (typeof value !== "string") fail(400, "invalid_choir");
      const clean = value.replace(/\s+/g, " ").trim();
      if (clean.length < 2 || clean.length > 60 || /[<>\u0000-\u001f]/u.test(clean))
        fail(400, "invalid_choir");
      return clean;
    };
    const nameEs = cleanName(body.nameEs);
    const nameEn = cleanName(body.nameEn);
    await quota(env, `choir-edit:${user.id}`, 30, 3600000);
    await env.DB.prepare("UPDATE choirs SET name_es=?2,name_en=?3 WHERE slug=?1")
      .bind(slug, nameEs, nameEn).run();
    return json({ ok: true, choir: { slug, nameEs, nameEn, status: "approved" } });
  }
  if (modChoirDel && method === "DELETE") {
    const slug = modChoirDel[1];
    const existing = await env.DB.prepare("SELECT slug FROM choirs WHERE slug=?1")
      .bind(slug)
      .first();
    if (!existing) fail(404, "not_found");
    await env.DB.prepare("DELETE FROM choirs WHERE slug=?1").bind(slug).run();
    await env.DB.prepare("DELETE FROM choir_repertoires WHERE choir=?1")
      .bind(slug)
      .run();
    await env.DB.prepare("UPDATE users SET choir=NULL WHERE choir=?1")
      .bind(slug)
      .run();
    return json({ ok: true });
  }
  if (path === "/choirs/repertoire" && method === "GET") {
    const choir = url.searchParams.get("choir");
    if (!(await isApprovedRepertoireChoir(choir))) fail(400, "invalid_choir");
    const rows = await all(
      "SELECT id,choir,title,notes,hymn_ids_json,updated_at FROM choir_repertoires WHERE choir=?1 ORDER BY updated_at DESC LIMIT 10",
      choir,
    );
    return json({
      repertoires: rows.map((r) => ({
        ...r,
        hymnIds: JSON.parse(r.hymn_ids_json),
        hymn_ids_json: undefined,
      })),
    });
  }
  if (path === "/mod/choirs/repertoire" && method === "PUT") {
    const b = await bodyOf(request);
    if (
      !(await isApprovedRepertoireChoir(b.choir)) ||
      typeof b.title !== "string" ||
      !b.title.trim() ||
      b.title.length > 100 ||
      typeof (b.notes ?? "") !== "string" ||
      (b.notes ?? "").length > 1000 ||
      !Array.isArray(b.hymnIds) ||
      b.hymnIds.length > 100 ||
      b.hymnIds.some(
        (x) => typeof x !== "string" || !/^(E)?\d{1,4}( [AB])?$/.test(x),
      )
    )
      fail(400, "invalid_repertoire");
    await env.DB.prepare(
      "INSERT INTO choir_repertoires(id,choir,title,notes,hymn_ids_json,updated_by,updated_at) VALUES(?1,?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET title=?2,notes=?3,hymn_ids_json=?4,updated_by=?5,updated_at=?6",
    )
      .bind(
        b.choir,
        b.title.trim(),
        b.notes ?? "",
        JSON.stringify([...new Set(b.hymnIds)]),
        user.id,
        now,
      )
      .run();
    return json({ ok: true });
  }
  const UPLOAD_PREFIX = "https://audio.himnarioebp.com/church-photos/uploads/";
  const parsePhotosRow = (r) => {
    const list = [];
    if (typeof r?.photos_json === "string" && r.photos_json.trim()) {
      try {
        const parsed = JSON.parse(r.photos_json);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (
              typeof item === "string" &&
              item.trim() &&
              !list.includes(item.trim())
            ) {
              list.push(item.trim());
            }
          }
        }
      } catch {}
    }
    if (
      typeof r?.photo_url === "string" &&
      r.photo_url.trim() &&
      !list.includes(r.photo_url.trim())
    ) {
      list.unshift(r.photo_url.trim());
    }
    return list;
  };
  const deleteRemovedChurchPhotos = async (oldUrls = [], newUrls = []) => {
    if (!env.MEDIA_BUCKET || typeof env.MEDIA_BUCKET.delete !== "function")
      return;
    const keep = new Set(newUrls);
    const toDelete = oldUrls
      .filter(
        (u) =>
          typeof u === "string" && u.startsWith(UPLOAD_PREFIX) && !keep.has(u),
      )
      .map((u) => u.slice("https://audio.himnarioebp.com/".length));
    for (const key of toDelete) {
      try {
        await env.MEDIA_BUCKET.delete(key);
      } catch {}
    }
  };
  const parseChurchInput = (b, isAdminUser = false) => {
    const clean = (v, max = 120) => {
      if (v === undefined || v === null) return null;
      if (typeof v !== "string") fail(400, "invalid_church");
      const trimmed = v.replace(/\s+/g, " ").trim();
      if (!trimmed) return null;
      if (trimmed.length > max) fail(400, "invalid_church");
      return trimmed;
    };
    const name = clean(b.name, 100);
    const address = clean(b.address, 140);
    const city = clean(b.city, 80);
    const country = clean(b.country, 60);
    const lat = Number(b.lat);
    const lng = Number(b.lng);
    if (
      !name ||
      !address ||
      !city ||
      !country ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    )
      fail(400, "invalid_church");
    const maxPhotos = isAdminUser ? 10 : 5;
    const validatePhotoUrl = (raw) => {
      if (typeof raw !== "string") fail(400, "invalid_church");
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (trimmed.length > 300 || !/^https:\/\/[^\s"'<>]+$/i.test(trimmed))
        fail(400, "invalid_church");
      return trimmed;
    };
    const photos = [];
    if (b.photos !== undefined && b.photos !== null) {
      if (!Array.isArray(b.photos)) fail(400, "invalid_church");
      for (const item of b.photos) {
        const u = validatePhotoUrl(item);
        if (u && !photos.includes(u)) photos.push(u);
      }
    }
    if (b.photoUrl !== undefined && b.photoUrl !== null) {
      const single = validatePhotoUrl(b.photoUrl);
      if (single && !photos.includes(single)) {
        photos.unshift(single);
      }
    }
    if (photos.length > maxPhotos) fail(400, "invalid_church");
    const photoUrl = photos[0] ?? null;
    return {
      name,
      pastorName: clean(b.pastorName, 80),
      address,
      city,
      state: clean(b.state, 60),
      country,
      postalCode: clean(b.postalCode, 24),
      lat,
      lng,
      serviceTimes: clean(b.serviceTimes, 240),
      contactInfo: clean(b.contactInfo, 160),
      photoUrl,
      photos,
      photosJson: JSON.stringify(photos),
    };
  };
  const serializeChurch = (r, includePrivate = false) => {
    const photos = parsePhotosRow(r);
    return {
      id: r.id,
      name: r.name,
      pastorName: r.pastor_name ?? null,
      address: r.address,
      city: r.city,
      state: r.state ?? null,
      country: r.country,
      postalCode: r.postal_code ?? null,
      lat: Number(r.lat),
      lng: Number(r.lng),
      serviceTimes: r.service_times ?? null,
      photoUrl: photos[0] ?? null,
      photos,
      verified: r.verified === 1,
      status: r.status,
      createdAt: r.created_at,
      verifiedAt: r.verified_at ?? null,
      ...(includePrivate
        ? {
            contactInfo: r.contact_info ?? null,
            submittedByName: r.submitted_by_name ?? null,
          }
        : {}),
    };
  };
  if (path === "/churches" && method === "GET") {
    const fold = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = fold((url.searchParams.get("q") || "").trim().slice(0, 60));
    let rows = await all(
      "SELECT id,name,pastor_name,address,city,state,country,postal_code,lat,lng,service_times,photo_url,photos_json,verified,status,created_at,verified_at FROM churches WHERE status='approved' AND verified=1 ORDER BY country ASC, state ASC, city ASC, name ASC LIMIT 500",
    );
    if (q) {
      rows = rows.filter((r) =>
        fold(
          [
            r.name,
            r.pastor_name,
            r.address,
            r.city,
            r.state,
            r.country,
            r.postal_code,
          ].join(" "),
        ).includes(q),
      );
    }
    const cfLat = Number(request.cf?.latitude);
    const cfLng = Number(request.cf?.longitude);
    const viewerCoords =
      Number.isFinite(cfLat) &&
      Number.isFinite(cfLng) &&
      cfLat >= -90 &&
      cfLat <= 90 &&
      cfLng >= -180 &&
      cfLng <= 180
        ? { lat: cfLat, lng: cfLng }
        : null;
    return json({
      churches: rows.map((r) => serializeChurch(r, false)),
      viewerCoords,
    });
  }
  if (path === "/churches/photos/upload" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    if (!user.email_verified_at) fail(403, "email_unverified");
    await quota(env, `church-photo:${user.id}`, admin ? 50 : 15, 86400000);
    await quota(env, `church-photo-ip:${ip}`, 50, 86400000);
    const ct = (request.headers.get("content-type") || "").toLowerCase();
    let bytes;
    if (ct.includes("application/json")) {
      const b = await bodyOf(request);
      if (typeof b.base64 !== "string" || !b.base64.trim())
        fail(400, "invalid_photo");
      const cleaned = b.base64
        .replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
        .replace(/\s+/g, "");
      if (cleaned.length > 4_800_000) fail(413, "photo_too_large");
      let bin;
      try {
        bin = atob(cleaned);
      } catch {
        fail(400, "invalid_photo");
      }
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      const ab = await request.arrayBuffer();
      bytes = new Uint8Array(ab);
    }
    if (!bytes || bytes.byteLength < 12) fail(400, "invalid_photo");
    if (bytes.byteLength > 3_500_000) fail(413, "photo_too_large");
    let ext = null;
    let mime = null;
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      ext = "jpg";
      mime = "image/jpeg";
    } else if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      ext = "png";
      mime = "image/png";
    } else if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      ext = "webp";
      mime = "image/webp";
    } else {
      fail(400, "invalid_photo_format");
    }
    const key = `church-photos/uploads/${crypto.randomUUID()}.${ext}`;
    if (env.MEDIA_BUCKET && typeof env.MEDIA_BUCKET.put === "function") {
      await env.MEDIA_BUCKET.put(key, bytes, {
        httpMetadata: {
          contentType: mime,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
    }
    return json(
      { ok: true, url: `https://audio.himnarioebp.com/${key}`, key },
      201,
    );
  }
  if (path === "/churches/submit" && method === "POST") {
    if (!user) fail(401, "unauthorized");
    if (!user.email_verified_at) fail(403, "email_unverified");
    await quota(env, `church-submit:${user.id}`, 5, 86400000);
    await quota(env, `church-submit-ip:${ip}`, 10, 86400000);
    const parsed = parseChurchInput(await bodyOf(request), admin);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO churches(id,name,pastor_name,address,city,state,country,postal_code,lat,lng,service_times,contact_info,photo_url,photos_json,verified,status,submitted_by,created_at,verified_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,0,'pending',?15,?16,NULL)",
    )
      .bind(
        id,
        parsed.name,
        parsed.pastorName,
        parsed.address,
        parsed.city,
        parsed.state,
        parsed.country,
        parsed.postalCode,
        parsed.lat,
        parsed.lng,
        parsed.serviceTimes,
        parsed.contactInfo,
        parsed.photoUrl,
        parsed.photosJson,
        user.id,
        now,
      )
      .run();
    if (env.EMAIL_ENABLED === "true" && typeof env.EMAIL?.send === "function") {
      const notify = env.EMAIL.send({
        to: ADMIN_EMAIL,
        from: env.EMAIL_FROM,
        subject: `Nueva iglesia pendiente de verificación: ${parsed.name}`,
        text: `Iglesia: ${parsed.name}\nDirección: ${parsed.address}, ${parsed.city}, ${parsed.state || ""} ${parsed.country}\nCoordenadas: ${parsed.lat}, ${parsed.lng}\nMapa: https://www.google.com/maps/search/?api=1&query=${parsed.lat},${parsed.lng}\nPastor: ${parsed.pastorName || "—"}\nHorarios: ${parsed.serviceTimes || "—"}\nFotos (${parsed.photos.length}): ${parsed.photos.join(", ") || "—"}\nContacto: ${parsed.contactInfo || "—"}\nEnviado por: ${user.name} (${user.email})`,
      }).catch(() => {});
      if (ctx?.waitUntil) ctx.waitUntil(notify);
    }
    return json({ ok: true, id, status: "pending" }, 201);
  }
  if (path === "/mod/churches" && method === "GET") {
    const rows = await all(
      "SELECT c.*, u.name AS submitted_by_name FROM churches c LEFT JOIN users u ON u.id=c.submitted_by ORDER BY CASE WHEN c.status='pending' THEN 0 WHEN c.status='approved' THEN 1 ELSE 2 END, c.created_at DESC LIMIT 200",
    );
    return json({ churches: rows.map((r) => serializeChurch(r, true)) });
  }
  if (path === "/mod/churches" && method === "POST") {
    const parsed = parseChurchInput(await bodyOf(request), true);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO churches(id,name,pastor_name,address,city,state,country,postal_code,lat,lng,service_times,contact_info,photo_url,photos_json,verified,status,submitted_by,created_at,verified_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,1,'approved',?15,?16,?16)",
    )
      .bind(
        id,
        parsed.name,
        parsed.pastorName,
        parsed.address,
        parsed.city,
        parsed.state,
        parsed.country,
        parsed.postalCode,
        parsed.lat,
        parsed.lng,
        parsed.serviceTimes,
        parsed.contactInfo,
        parsed.photoUrl,
        parsed.photosJson,
        user.id,
        now,
      )
      .run();
    return json({ ok: true, id, verified: true }, 201);
  }
  const modChurchAction = path.match(
    /^\/mod\/churches\/([a-z0-9-]+)\/(approve|reject)$/,
  );
  if (modChurchAction && method === "POST") {
    const [, churchId, action] = modChurchAction;
    if (action === "approve") {
      await env.DB.prepare(
        "UPDATE churches SET verified=1,status='approved',verified_at=?2 WHERE id=?1",
      )
        .bind(churchId, now)
        .run();
    } else {
      const existing = await env.DB.prepare(
        "SELECT photo_url,photos_json FROM churches WHERE id=?1",
      )
        .bind(churchId)
        .first();
      await env.DB.prepare(
        "UPDATE churches SET verified=0,status='rejected',verified_at=NULL,photo_url=NULL,photos_json='[]' WHERE id=?1",
      )
        .bind(churchId)
        .run();
      if (existing) {
        await deleteRemovedChurchPhotos(parsePhotosRow(existing), []);
      }
    }
    return json({ ok: true });
  }
  const modChurchItem = path.match(/^\/mod\/churches\/([a-z0-9-]+)$/);
  if (modChurchItem && method === "PUT") {
    const churchId = modChurchItem[1];
    const body = await bodyOf(request);
    const parsed = parseChurchInput(body, true);
    const approveNow = body.approve === true;
    const existing = await env.DB.prepare(
      "SELECT photo_url,photos_json FROM churches WHERE id=?1",
    )
      .bind(churchId)
      .first();
    await env.DB.prepare(
      approveNow
        ? "UPDATE churches SET name=?2,pastor_name=?3,address=?4,city=?5,state=?6,country=?7,postal_code=?8,lat=?9,lng=?10,service_times=?11,contact_info=?12,photo_url=?13,photos_json=?14,verified=1,status='approved',verified_at=COALESCE(verified_at,?15) WHERE id=?1"
        : "UPDATE churches SET name=?2,pastor_name=?3,address=?4,city=?5,state=?6,country=?7,postal_code=?8,lat=?9,lng=?10,service_times=?11,contact_info=?12,photo_url=?13,photos_json=?14 WHERE id=?1",
    )
      .bind(
        churchId,
        parsed.name,
        parsed.pastorName,
        parsed.address,
        parsed.city,
        parsed.state,
        parsed.country,
        parsed.postalCode,
        parsed.lat,
        parsed.lng,
        parsed.serviceTimes,
        parsed.contactInfo,
        parsed.photoUrl,
        parsed.photosJson,
        ...(approveNow ? [now] : []),
      )
      .run();
    if (existing) {
      await deleteRemovedChurchPhotos(parsePhotosRow(existing), parsed.photos);
    }
    return json({ ok: true, id: churchId });
  }
  if (modChurchItem && method === "DELETE") {
    const existing = await env.DB.prepare(
      "SELECT photo_url,photos_json FROM churches WHERE id=?1",
    )
      .bind(modChurchItem[1])
      .first();
    await env.DB.prepare("DELETE FROM churches WHERE id=?1")
      .bind(modChurchItem[1])
      .run();
    if (existing) {
      await deleteRemovedChurchPhotos(parsePhotosRow(existing), []);
    }
    return json({ ok: true });
  }
  // Public ranking for the "Más gustados" filter. Likes only: dislike counts
  // stay private to the administrator, and hymns nobody liked are left out
  // rather than ranked last.
  if (path === "/hymns/top" && method === "GET") {
    const rows = await all(
      "SELECT hymn_id,likes_count FROM hymn_stats WHERE likes_count>0 ORDER BY likes_count DESC, updated_at DESC, hymn_id ASC LIMIT 50",
    );
    return json(
      { hymns: rows.map((r) => ({ hymnId: r.hymn_id, likesCount: r.likes_count })) },
      200,
      { "Cache-Control": "public, max-age=120" },
    );
  }
  const hymnRoute = path.match(
    /^\/hymns\/([a-z0-9-]+)\/(summary|reaction)$/,
  );
  if (hymnRoute) {
    const [, hymnId, action] = hymnRoute;
    if (typeof hymnId !== "string" || !/^[a-z0-9-]{1,20}$/.test(hymnId))
      fail(400, "invalid_hymn");
    const commentVerseId = `hymn-${hymnId}`;
    if (action === "summary" && method === "GET") {
      const [hymnRow, commentRow, myRow] = await Promise.all([
        env.DB.prepare("SELECT * FROM hymn_stats WHERE hymn_id=?1")
          .bind(hymnId)
          .first(),
        env.DB.prepare("SELECT comments_count FROM verse_stats WHERE verse_id=?1")
          .bind(commentVerseId)
          .first(),
        user
          ? env.DB.prepare(
              "SELECT reaction FROM hymn_reactions WHERE hymn_id=?1 AND user_id=?2",
            )
              .bind(hymnId, user.id)
              .first()
          : Promise.resolve(null),
      ]);
      return json(
        {
          likesCount: hymnRow?.likes_count || 0,
          dislikesCount: admin ? (hymnRow?.dislikes_count || 0) : null,
          commentsCount: commentRow?.comments_count || 0,
          myReaction: myRow?.reaction || 0,
        },
        200,
        user ? {} : { "Cache-Control": "public, max-age=30" },
      );
    }
    if (action === "reaction" && method === "POST") {
      participant(user);
      await quota(env, `hymn-react:${user.id}`, 60, 60000);
      await quota(env, `hymn-react-ip:${ip}`, 180, 60000);
      const body = await bodyOf(request);
      if (![1, -1, 0].includes(body.reaction)) fail(400, "invalid_reaction");
      if (body.reaction === 0) {
        await env.DB.prepare(
          "DELETE FROM hymn_reactions WHERE user_id=?1 AND hymn_id=?2",
        )
          .bind(user.id, hymnId)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO hymn_reactions(user_id,hymn_id,reaction,created_at) VALUES(?1,?2,?3,?4) ON CONFLICT(user_id,hymn_id) DO UPDATE SET reaction=?3,created_at=?4",
        )
          .bind(user.id, hymnId, body.reaction, now)
          .run();
      }
      return json({ ok: true });
    }
  }
  if (path === "/mod/hymns/reactions" && method === "GET") {
    const rows = await all(
      "SELECT hymn_id,likes_count,dislikes_count,updated_at FROM hymn_stats WHERE likes_count>0 OR dislikes_count>0 ORDER BY dislikes_count DESC, likes_count DESC, updated_at DESC LIMIT 100",
    );
    return json({
      hymns: rows.map((r) => ({
        hymnId: r.hymn_id,
        likesCount: r.likes_count,
        dislikesCount: r.dislikes_count,
        updatedAt: r.updated_at,
      })),
    });
  }
  return json({ error: "not_found" }, 404);
}
async function hideComment(env, id, actor, now) {
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE verse_comments SET hidden_at=?2,hidden_by=?3 WHERE (id=?1 OR parent_id=?1) AND hidden_at IS NULL",
    ).bind(id, now, actor),
    env.DB.prepare(
      "UPDATE verse_comment_reports SET status='resolved',resolved_by=?2,resolved_at=?3 WHERE (comment_id=?1 OR comment_id IN (SELECT id FROM verse_comments WHERE parent_id=?1)) AND status='open'",
    ).bind(id, actor, now),
    env.DB.prepare(
      "DELETE FROM notifications WHERE target_id=?1 OR target_id IN (SELECT id FROM verse_comments WHERE parent_id=?1)",
    ).bind(id),
  ]);
}
