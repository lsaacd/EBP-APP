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
  if (choir != null && !Object.hasOwn(CHOIRS, choir))
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
  return {
    name: name.trim(),
    ministry: ministry ?? null,
    choir: choir ?? null,
    church_id,
    church_name,
    location,
    show_church_location,
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
    ministry: row.user_id ? row.ministry : null,
    choir: row.user_id ? row.choir : null,
    badgeVerified:
      row.user_id != null &&
      row.ministry === "obispo" &&
      row.badge_verified === 1,
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  };
}
const publicSelect = `SELECT c.*,u.name,u.ministry,u.choir,u.badge_verified FROM verse_comments c LEFT JOIN users u ON u.id=c.user_id`;
const visibility = `c.hidden_at IS NULL AND (c.parent_id IS NULL OR EXISTS(SELECT 1 FROM verse_comments p WHERE p.id=c.parent_id AND p.hidden_at IS NULL AND NOT EXISTS(SELECT 1 FROM user_blocks pb WHERE (pb.blocker_user_id=?2 AND pb.blocked_user_id=p.user_id) OR (pb.blocked_user_id=?2 AND pb.blocker_user_id=p.user_id))))
 AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=?2 AND b.blocked_user_id=c.user_id) OR (b.blocked_user_id=?2 AND b.blocker_user_id=c.user_id))`;

export async function deleteCommunityAccount(env, id) {
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE verse_comments SET user_id=NULL,author_name_snapshot='Cuenta eliminada' WHERE user_id=?1",
    ).bind(id),
    env.DB.prepare("DELETE FROM verse_likes WHERE user_id=?1").bind(id),
    env.DB.prepare(
      "DELETE FROM user_blocks WHERE blocker_user_id=?1 OR blocked_user_id=?1",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM verse_comment_reports WHERE reporter_user_id=?1",
    ).bind(id),
    ...["user_data", "sessions", "email_tokens", "hymn_reactions"].map((t) =>
      env.DB.prepare(`DELETE FROM ${t} WHERE user_id=?1`).bind(id),
    ),
    env.DB.prepare("DELETE FROM users WHERE id=?1").bind(id),
  ]);
}

export async function handleCommunity(
  request,
  env,
  ctx,
  { path, authenticate, serializeUser, json },
) {
  if (
    !/^\/(verses|verse-comments|users|mod|choirs|churches|hymns)(\/|$)/.test(path) &&
    !["/auth/profile", "/auth/ugc-terms/accept"].includes(path)
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
  if (path.startsWith("/mod/") && !admin) fail(403, "forbidden");
  await quota(env, `community-read:${ip}`, 180, 60000);

  if (path === "/auth/profile" && method === "PUT") {
    if (!user) fail(401, "unauthorized");
    await quota(env, `profile:${user.id}`, 20, 60000);
    const p = profile(await bodyOf(request), user);
    await env.DB.prepare(
      "UPDATE users SET name=?2,ministry=?3,choir=?4,church_name=?5,location=?6,show_church_location=?7,church_id=?8,badge_verified=CASE WHEN ministry IS ?3 THEN badge_verified ELSE 0 END WHERE id=?1",
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
      )
      .run();
    return json({
      user: serializeUser({
        ...user,
        ...p,
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
          ? "(SELECT count(*) FROM verse_comments r WHERE r.parent_id=c.id AND r.hidden_at IS NULL) DESC, c.created_at DESC, c.id DESC"
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
      if (parent) {
        const p = await env.DB.prepare(
          `SELECT c.id FROM verse_comments c WHERE c.id=?3 AND c.verse_id=?1 AND c.parent_id IS NULL AND ${visibility}`,
        )
          .bind(verseId, user.id, parent)
          .first();
        if (!p) fail(400, "invalid_parent");
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
      return json({ id: saved.id }, 201);
    }
  }
  const commentRoute = path.match(
    /^\/verse-comments\/([a-z0-9-]+)(\/report)?$/,
  );
  if (commentRoute) {
    participant(user);
    const [, id, report] = commentRoute;
    const row = await env.DB.prepare(
      "SELECT * FROM verse_comments WHERE id=?1 AND hidden_at IS NULL",
    )
      .bind(id)
      .first();
    if (!row) fail(404, "not_found");
    if (report && method === "POST") {
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
      await env.DB.prepare(
        "INSERT INTO user_blocks VALUES(?1,?2,?3) ON CONFLICT DO NOTHING",
      )
        .bind(user.id, id, now)
        .run();
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
      "SELECT id,name,ministry,choir,church_id,church_name,location,show_church_location,badge_verified,suspended_at FROM users WHERE id=?1",
    )
      .bind(targetId)
      .first();
    if (!target || target.suspended_at != null) fail(404, "not_found");
    const showExtra = target.show_church_location === 1;
    return json({
      user: {
        id: target.id,
        name: target.name,
        initials: initials(target.name),
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
  if (path === "/choirs/repertoire" && method === "GET") {
    const choir = url.searchParams.get("choir");
    if (!["esmirna", "maranatha"].includes(choir)) fail(400, "invalid_choir");
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
      !["esmirna", "maranatha"].includes(b.choir) ||
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
  ]);
}
