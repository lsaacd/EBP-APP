const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const worker = import(
  pathToFileURL(path.join(root, "workers/ebp-auth-sync/index.js"))
).then((m) => m.default);
const rules = import(
  pathToFileURL(path.join(root, "himnario/data/communityRules.js"))
);
function fixture() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  sql.exec(
    readFileSync(path.join(root, "workers/ebp-auth-sync/schema.sql"), "utf8"),
  );
  const DB = {
    prepare(query) {
      let values = {};
      const s = sql.prepare(query);
      s.setAllowUnknownNamedParameters(true);
      const a = {
        bind(...args) {
          values = Object.fromEntries(args.map((v, i) => [String(i + 1), v]));
          return a;
        },
        async first() {
          return s.get(values) || null;
        },
        async all() {
          return { results: s.all(values) };
        },
        async run() {
          return { meta: { changes: Number(s.run(values).changes) } };
        },
      };
      return a;
    },
    async batch(items) {
      sql.exec("BEGIN");
      try {
        const out = [];
        for (const s of items) out.push(await s.run());
        sql.exec("COMMIT");
        return out;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
  const mediaStore = new Map();
  const MEDIA_BUCKET = {
    async put(key, bytes, opts) {
      mediaStore.set(key, { bytes, opts });
    },
    async delete(key) {
      mediaStore.delete(key);
    },
  };
  const env = { DB, MEDIA_BUCKET };
  let n = 0;
  async function account(extra = {}) {
    const id = crypto.randomUUID(),
      token = (++n).toString(16).padStart(64, "0");
    const hash = require("node:crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");
    sql
      .prepare(
        "INSERT INTO users(id,email,name,password_hash,password_salt,created_at,email_verified_at,ugc_terms_accepted_at,role,ministry) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        id,
        extra.email || `${id}@test.invalid`,
        extra.name || "Test Person",
        "x",
        "y",
        1,
        extra.verified === false ? null : 1,
        extra.terms === false ? null : 1,
        extra.role || "member",
        extra.ministry || null,
      );
    sql
      .prepare("INSERT INTO sessions VALUES(?,?,?,?)")
      .run(hash, id, 1, Date.now() + 1e8);
    return { id, token };
  }
  async function call(route, method = "GET", body, token) {
    const response = await (
      await worker
    ).fetch(
      new Request("https://example.test" + route, {
        method,
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "192.0.2.1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      env,
    );
    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  }
  const post = (
    u,
    body = "Peace to everyone",
    parentId,
    requestId = crypto.randomUUID(),
  ) =>
    call(
      "/verses/juan-14-6/comments",
      "POST",
      { body, parentId, clientRequestId: requestId },
      u.token,
    );
  return { sql, env, mediaStore, account, call, post };
}
test("normalization enforces word/character limits, HTML, links and content filtering", async () => {
  const { normalizeComment, wordCount } = await rules;
  assert.equal(wordCount("one\n two"), 2);
  assert.equal(normalizeComment(" hi\r\n\n\nthere "), "hi\n\nthere");
  assert.doesNotThrow(() => normalizeComment("a ".repeat(100)));
  for (const value of [
    "a ".repeat(101),
    "a".repeat(1001),
    "<script>alert(1)</script>",
    "https://spam.test",
    "fuck",
    "\u202etest",
    "",
  ])
    assert.throws(() => normalizeComment(value));
});
test("migration upgrades an existing verified owner and preserves original user data", async () => {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  sql.exec(
    readFileSync(
      path.join(
        root,
        "workers/ebp-auth-sync/migrations/0001_existing_schema.sql",
      ),
      "utf8",
    ),
  );
  sql.exec(
    readFileSync(
      path.join(root, "workers/ebp-auth-sync/migrations/0002_email_auth.sql"),
      "utf8",
    ),
  );
  sql
    .prepare(
      "INSERT INTO users(id,email,name,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)",
    )
    .run("owner", "isaacduran167@gmail.com", "Isaac Duran", "hash", "salt", 1);
  sql.exec(
    readFileSync(
      path.join(
        root,
        "workers/ebp-auth-sync/migrations/0003_community_verse.sql",
      ),
      "utf8",
    ),
  );
  const u = sql.prepare("SELECT * FROM users").get();
  assert.equal(u.role, "admin");
  assert.equal(u.name, "Isaac Duran");
  assert.equal(u.password_hash, "hash");
  assert.equal(u.badge_verified, 0);
  assert.deepEqual(sql.prepare("PRAGMA foreign_key_check").all(), []);
});
test("legacy installed profile clients stay compatible without accepting privileged fields", async () => {
  const f = fixture(),
    u = await f.account();
  assert.equal(
    (
      await f.call(
        "/auth/profile",
        "PUT",
        { name: "Legacy Name", displayName: "Legacy Name" },
        u.token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.call(
        "/auth/profile",
        "PUT",
        { name: "Legacy Name", displayName: "Mismatch" },
        u.token,
      )
    ).status,
    400,
  );
  for (const field of [
    "role",
    "badge_verified",
    "badgeVerified",
    "suspended_at",
  ])
    assert.equal(
      (
        await f.call(
          "/auth/profile",
          "PUT",
          { name: "Legacy Name", [field]: 1 },
          u.token,
        )
      ).status,
      400,
    );
});
test("simultaneous same-text posts cannot bypass duplicate protection", async () => {
  const f = fixture(),
    a = await f.account();
  const responses = await Promise.all([
    f.post(a, "Repeated text"),
    f.post(a, "Repeated text"),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    f.sql.prepare("SELECT count(*) AS n FROM verse_comments").get().n,
    1,
  );
});
test("report notification failure preserves report, privacy and private cache controls", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
    });
  const p = await f.post(a, "Private report body");
  const deliveries = [];
  f.env.EMAIL_ENABLED = "true";
  f.env.EMAIL_FROM = "Himnario <cuenta@auth.himnarioebp.com>";
  f.env.EMAIL = {
    send: async (message) => {
      deliveries.push(message);
      throw Error("delivery unavailable");
    },
  };
  assert.equal(
    (
      await f.call(
        `/verse-comments/${p.data.id}/report`,
        "POST",
        { reason: "other" },
        b.token,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.call("/mod/reports", "GET", undefined, admin.token)).data.reports
      .length,
    1,
  );
  assert.equal(deliveries.length, 1);
  assert.doesNotMatch(deliveries[0].text, /Private report body|@test.invalid/);
  const list = await f.call(
    "/verses/juan-14-6/comments",
    "GET",
    undefined,
    b.token,
  );
  assert.equal(list.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(JSON.stringify(list.data), /email|password|token_hash/);
});
test("user comment and IP quotas reject excess work; blocked parents are filtered on reply pages", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account();
  const parent = await f.post(a, "Root comment");
  await f.post(b, "Child comment", parent.data.id);
  await f.call(`/users/${a.id}/block`, "POST", {}, b.token);
  assert.equal(
    (
      await f.call(
        `/verses/juan-14-6/comments?parentId=${parent.data.id}`,
        "GET",
        undefined,
        b.token,
      )
    ).data.comments.length,
    0,
  );
  for (let i = 0; i < 4; i++)
    assert.equal((await f.post(a, "Comment " + i)).status, 201);
  assert.equal((await f.post(a, "Too many")).status, 429);
});
test("guests may read; verification and terms gate participation", async () => {
  const f = fixture();
  assert.equal((await f.call("/verses/juan-14-6/comments")).status, 200);
  assert.equal(
    (await f.call("/verses/juan-14-6/summary")).headers.get("Cache-Control"),
    "public, max-age=30",
  );
  const a = await f.account({ verified: false }),
    b = await f.account({ terms: false });
  assert.equal((await f.post(a)).data.error, "email_verification_required");
  assert.equal((await f.post(b, "Segundo comentario")).status, 201);
  assert.equal(
    (
      await f.call(
        "/auth/ugc-terms/accept",
        "POST",
        { version: "2026-11-17" },
        b.token,
      )
    ).status,
    200,
  );
});
test("retry IDs prevent duplicates and mismatched replay; depth and verse scope enforced", async () => {
  const f = fixture(),
    a = await f.account(),
    key = crypto.randomUUID();
  const p = await f.post(a, "Parent", undefined, key);
  assert.equal(p.status, 201);
  assert.equal((await f.post(a, "Parent", undefined, key)).data.id, p.data.id);
  assert.equal((await f.post(a, "Changed", undefined, key)).status, 409);
  const r = await f.post(a, "Reply", p.data.id);
  assert.equal(r.status, 201);
  assert.equal((await f.post(a, "Too deep", r.data.id)).status, 400);
  assert.equal(
    (
      await f.call(
        "/verses/salmo-23-1/comments",
        "POST",
        {
          body: "Wrong verse",
          parentId: p.data.id,
          clientRequestId: crypto.randomUUID(),
        },
        a.token,
      )
    ).status,
    400,
  );
  assert.equal(
    f.sql.prepare("SELECT comments_count FROM verse_stats").get()
      .comments_count,
    2,
  );
});
test("profile allowlist and sole admin plus verified Obispo restrictions", async () => {
  const f = fixture(),
    a = await f.account(),
    rogue = await f.account({ role: "admin" }),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
    });
  for (const u of [a, rogue])
    assert.equal(
      (await f.call("/mod/reports", "GET", undefined, u.token)).status,
      403,
    );
  assert.equal(
    (await f.call("/auth/profile", "PUT", { role: "admin" }, a.token)).status,
    400,
  );
  assert.equal(
    (await f.call("/auth/profile", "PUT", { ministry: "exhortador" }, a.token))
      .status,
    400,
  );
  assert.equal(
    (await f.call("/auth/profile", "PUT", { ministry: "instructor" }, a.token))
      .status,
    200,
  );
  assert.equal(
    (
      await f.call(
        `/mod/users/${a.id}/verify-obispo`,
        "POST",
        { verified: true },
        admin.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (await f.call("/auth/profile", "PUT", { ministry: "obispo" }, a.token))
      .status,
    200,
  );
  assert.equal(
    (
      await f.call(
        `/mod/users/${a.id}/verify-obispo`,
        "POST",
        { verified: true },
        admin.token,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.call("/auth/me", "GET", undefined, a.token)).data.user
      .badgeVerified,
    true,
  );
  await f.call("/auth/profile", "PUT", { ministry: "pastor" }, a.token);
  assert.equal(
    (await f.call("/auth/me", "GET", undefined, a.token)).data.user
      .badgeVerified,
    false,
  );
  assert.throws(() =>
    f.sql.prepare("UPDATE users SET badge_verified=1 WHERE id=?").run(a.id),
  );
});
test("blocks filter authors and replies; moderation hides threads and resolves reports", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
    });
  const p = await f.post(a);
  await f.post(b, "Reply", p.data.id);
  await f.call(`/users/${a.id}/block`, "POST", {}, b.token);
  assert.equal(
    (await f.call("/verses/juan-14-6/comments", "GET", undefined, b.token)).data
      .comments.length,
    0,
  );
  await f.call(`/users/${a.id}/block`, "DELETE", undefined, b.token);
  await f.call(
    `/verse-comments/${p.data.id}/report`,
    "POST",
    { reason: "abuse" },
    b.token,
  );
  assert.equal(
    (await f.call("/mod/reports", "GET", undefined, admin.token)).data.reports
      .length,
    1,
  );
  await f.call(`/mod/comments/${p.data.id}/hide`, "POST", {}, admin.token);
  assert.equal(
    (await f.call("/verses/juan-14-6/comments")).data.comments.length,
    0,
  );
  assert.equal(
    (await f.call("/verses/juan-14-6/summary")).data.commentsCount,
    0,
  );
  assert.equal(
    (await f.call("/mod/reports", "GET", undefined, admin.token)).data.reports
      .length,
    0,
  );
});
test("suspension revokes tokens, hides posts, stops sync and cannot be self-applied", async () => {
  const f = fixture(),
    a = await f.account(),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
    });
  await f.post(a);
  assert.equal(
    (await f.call(`/mod/users/${admin.id}/suspend`, "POST", {}, admin.token))
      .status,
    400,
  );
  await f.call(`/mod/users/${a.id}/suspend`, "POST", {}, admin.token);
  assert.equal(
    f.sql
      .prepare("SELECT count(*) AS n FROM sessions WHERE user_id=?")
      .get(a.id).n,
    0,
  );
  assert.equal((await f.post(a)).status, 401);
  assert.equal((await f.call("/sync", "GET", undefined, a.token)).status, 401);
  assert.equal(
    (await f.call("/verses/juan-14-6/comments")).data.comments.length,
    0,
  );
  await f.call(`/mod/users/${a.id}/restore`, "POST", {}, admin.token);
  assert.equal(
    f.sql.prepare("SELECT suspended_at FROM users WHERE id=?").get(a.id)
      .suspended_at,
    null,
  );
});
test("account deletion anonymizes discussion and cascades likes, blocks and reports safely", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account();
  const p = await f.post(a);
  await f.post(b, "Reply stays", p.data.id);
  await f.call("/verses/juan-14-6/like", "POST", { liked: true }, a.token);
  await f.call(
    `/verse-comments/${p.data.id}/report`,
    "POST",
    { reason: "other" },
    a.token,
  );
  await f.call(`/users/${b.id}/block`, "POST", {}, a.token);
  assert.equal(
    (await f.call("/auth/account", "DELETE", undefined, a.token)).status,
    200,
  );
  const list = (await f.call("/verses/juan-14-6/comments")).data.comments;
  assert.equal(list[0].authorName, "Cuenta eliminada");
  assert.equal(list[0].userId, null);
  assert.equal(list[0].replies.length, 1);
  assert.equal((await f.call("/verses/juan-14-6/summary")).data.likesCount, 0);
  assert.deepEqual(f.sql.prepare("PRAGMA foreign_key_check").all(), []);
});
test("cursor pages are stable at identical timestamps and likes are retry safe", async () => {
  const f = fixture(),
    a = await f.account();
  for (let i = 0; i < 25; i++)
    f.sql
      .prepare(
        "INSERT INTO verse_comments(id,verse_id,user_id,body,created_at) VALUES(?,?,?,?,?)",
      )
      .run(crypto.randomUUID(), "juan-14-6", a.id, "Test " + i, 1);
  const p = (await f.call("/verses/juan-14-6/comments")).data;
  assert.equal(p.comments.length, 20);
  const q = (await f.call("/verses/juan-14-6/comments?cursor=" + p.nextCursor))
    .data;
  assert.equal(q.comments.length, 5);
  assert.equal(
    new Set([...p.comments, ...q.comments].map((x) => x.id)).size,
    25,
  );
  await f.call("/verses/juan-14-6/like", "POST", { liked: true }, a.token);
  await f.call("/verses/juan-14-6/like", "POST", { liked: true }, a.token);
  assert.equal((await f.call("/verses/juan-14-6/summary")).data.likesCount, 1);
  assert.equal(
    (await f.call("/verses/juan-14-6/comments?cursor=broken")).status,
    400,
  );
  for (const limit of ["2.5", "-1", "NaN"])
    assert.equal(
      (await f.call("/verses/juan-14-6/comments?limit=" + limit)).status,
      400,
    );
});
test("church and location profile fields are private by default and visible in public profile only when toggle is on", async () => {
  const f = fixture(),
    a = await f.account({ name: "Isaac Duran" });
  const savedHidden = await f.call(
    "/auth/profile",
    "PUT",
    {
      churchName: "IDDV El Buen Pastor — Central",
      location: "Estados Unidos · California",
      showChurchLocation: false,
    },
    a.token,
  );
  assert.equal(savedHidden.status, 200);
  assert.equal(savedHidden.data.user.churchName, "IDDV El Buen Pastor — Central");
  assert.equal(savedHidden.data.user.location, "Estados Unidos · California");
  assert.equal(savedHidden.data.user.showChurchLocation, false);

  const pubHidden = await f.call(`/users/${a.id}/public-profile`, "GET");
  assert.equal(pubHidden.status, 200);
  assert.equal(pubHidden.data.user.churchName, null);
  assert.equal(pubHidden.data.user.location, null);

  const savedVisible = await f.call(
    "/auth/profile",
    "PUT",
    {
      showChurchLocation: true,
    },
    a.token,
  );
  assert.equal(savedVisible.status, 200);
  assert.equal(savedVisible.data.user.showChurchLocation, true);

  const pubVisible = await f.call(`/users/${a.id}/public-profile`, "GET");
  assert.equal(pubVisible.status, 200);
  assert.equal(pubVisible.data.user.churchName, "IDDV El Buen Pastor — Central");
  assert.equal(pubVisible.data.user.location, "Estados Unidos · California");
});
test("church submissions stay hidden until admin approves and contact info remains admin-only", async () => {
  const f = fixture(),
    member = await f.account({ name: "Hermano Juan" }),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
      name: "Isaac Duran",
    });

  const sub = await f.call(
    "/churches/submit",
    "POST",
    {
      name: "IDDV El Buen Pastor — San José",
      pastorName: "Pastor Carlos",
      address: "1234 Main St",
      city: "San José",
      state: "CA",
      country: "Estados Unidos",
      postalCode: "95112",
      lat: 37.3382,
      lng: -121.8863,
      serviceTimes: "Domingos 10:00 AM · Miércoles 7:00 PM",
      contactInfo: "pastor@example.com",
    },
    member.token,
  );
  assert.equal(sub.status, 201);
  assert.equal(sub.data.status, "pending");

  // Pending church must not appear in public directory yet
  const publicBefore = await f.call("/churches", "GET");
  assert.equal(publicBefore.status, 200);
  assert.equal(publicBefore.data.churches.length, 0);

  // Non-admin cannot view /mod/churches
  assert.equal((await f.call("/mod/churches", "GET", undefined, member.token)).status, 403);

  // Admin sees pending church including private contactInfo and approves it
  const modList = await f.call("/mod/churches", "GET", undefined, admin.token);
  assert.equal(modList.status, 200);
  assert.equal(modList.data.churches.length, 1);
  assert.equal(modList.data.churches[0].contactInfo, "pastor@example.com");

  const approve = await f.call(`/mod/churches/${sub.data.id}/approve`, "POST", {}, admin.token);
  assert.equal(approve.status, 200);

  // Approved church now appears publicly without contactInfo
  const publicAfter = await f.call("/churches?q=jose", "GET");
  assert.equal(publicAfter.status, 200);
  assert.equal(publicAfter.data.churches.length, 1);
  assert.equal(publicAfter.data.churches[0].verified, true);
  assert.equal("contactInfo" in publicAfter.data.churches[0], false);
});
test("hymn like and dislike reactions update counts and hide dislike count from non-admins", async () => {
  const f = fixture(),
    a = await f.account({ name: "Hermano A" }),
    b = await f.account({ name: "Hermano B" }),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
      name: "Isaac Duran",
    });

  // User A likes hymn 1, User B dislikes hymn 1
  assert.equal(
    (await f.call("/hymns/1/reaction", "POST", { reaction: 1 }, a.token)).status,
    200,
  );
  assert.equal(
    (await f.call("/hymns/1/reaction", "POST", { reaction: -1 }, b.token)).status,
    200,
  );
  // User A also posts a comment on hymn-1
  assert.equal(
    (
      await f.call(
        "/verses/hymn-1/comments",
        "POST",
        { body: "Hermosa alabanza", clientRequestId: crypto.randomUUID() },
        a.token,
      )
    ).status,
    201,
  );

  // Regular member sees likesCount and commentsCount, but dislikesCount is null
  const memberSummary = await f.call("/hymns/1/summary", "GET", undefined, a.token);
  assert.equal(memberSummary.status, 200);
  assert.equal(memberSummary.data.likesCount, 1);
  assert.equal(memberSummary.data.dislikesCount, null);
  assert.equal(memberSummary.data.commentsCount, 1);
  assert.equal(memberSummary.data.myReaction, 1);

  // Admin sees exact dislikesCount
  const adminSummary = await f.call("/hymns/1/summary", "GET", undefined, admin.token);
  assert.equal(adminSummary.status, 200);
  assert.equal(adminSummary.data.likesCount, 1);
  assert.equal(adminSummary.data.dislikesCount, 1);

  // Switching User B from dislike (-1) to like (1) updates both counts via trigger
  assert.equal(
    (await f.call("/hymns/1/reaction", "POST", { reaction: 1 }, b.token)).status,
    200,
  );
  const afterSwitch = await f.call("/hymns/1/summary", "GET", undefined, admin.token);
  assert.equal(afterSwitch.data.likesCount, 2);
  assert.equal(afterSwitch.data.dislikesCount, 0);
});

test("the public hymn ranking lists liked hymns most-liked first and never exposes dislikes", async () => {
  const f = fixture(),
    a = await f.account({ name: "Rank A" }),
    b = await f.account({ name: "Rank B" }),
    c = await f.account({ name: "Rank C" });
  const react = (hymn, reaction, who) =>
    f.call(`/hymns/${hymn}/reaction`, "POST", { reaction }, who.token);
  // hymn 7: three likes · 315-a: one like · 9: only a dislike · e12: liked, then withdrawn
  for (const who of [a, b, c]) assert.equal((await react("7", 1, who)).status, 200);
  assert.equal((await react("315-a", 1, a)).status, 200);
  assert.equal((await react("9", -1, b)).status, 200);
  assert.equal((await react("e12", 1, c)).status, 200);
  assert.equal((await react("e12", 0, c)).status, 200);

  const guest = await f.call("/hymns/top", "GET");
  assert.equal(guest.status, 200);
  assert.deepEqual(guest.data.hymns, [
    { hymnId: "7", likesCount: 3 },
    { hymnId: "315-a", likesCount: 1 },
  ]);
  assert.ok(!JSON.stringify(guest.data).includes("dislike"));
  // The single-hymn routes keep working beside the new path.
  assert.equal((await f.call("/hymns/7/summary", "GET")).data.likesCount, 3);
});

test("admin can edit and approve pending churches with cloud photoUrl, and coordinate/cluster utilities work", async () => {
  const f = fixture(),
    member = await f.account({ name: "Hermano Juan", verified: true }),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
      name: "Isaac Duran",
    });

  // Non-https photoUrl is rejected
  const badPhoto = await f.call(
    "/churches/submit",
    "POST",
    {
      name: "IDDV El Buen Pastor",
      address: "1937 Concourse Dr",
      city: "San Jose",
      country: "United States",
      lat: 37.3812,
      lng: -121.8975,
      photoUrl: "http://insecure.example/photo.jpg",
    },
    member.token,
  );
  assert.equal(badPhoto.status, 400);

  const sub = await f.call(
    "/churches/submit",
    "POST",
    {
      name: "IDDV El Buen Pastor — San José",
      address: "1937 Concourse Dr",
      city: "San Jose",
      state: "CA",
      country: "United States",
      lat: 37.38,
      lng: -121.89,
    },
    member.token,
  );
  assert.equal(sub.status, 201);

  // Admin edits coordinates, adds cloud R2 photoUrl, and approves in one PUT call
  const editRes = await f.call(
    `/mod/churches/${sub.data.id}`,
    "PUT",
    {
      name: "IDDV El Buen Pastor — San José",
      pastorName: "Pastor Local",
      address: "1937 Concourse Dr",
      city: "San Jose",
      state: "CA",
      country: "United States",
      postalCode: "95131",
      lat: 37.381234,
      lng: -121.897543,
      serviceTimes: "Domingos 10:00 AM",
      photoUrl: "https://audio.himnarioebp.com/church-photos/san-jose.jpg",
      approve: true,
    },
    admin.token,
  );
  assert.equal(editRes.status, 200);

  const pub = await f.call("/churches", "GET");
  assert.equal(pub.status, 200);
  assert.equal(pub.data.churches.length, 1);
  assert.equal(
    pub.data.churches[0].photoUrl,
    "https://audio.himnarioebp.com/church-photos/san-jose.jpg",
  );
  assert.equal(pub.data.churches[0].lat, 37.381234);

  // Also test parseCoordsOrMapsInput and buildChurchMapPins
  const fs = require("node:fs");
  const path = require("node:path");
  const ts = require(path.resolve("himnario/node_modules/typescript"));
  const utilsSrc = fs.readFileSync("himnario/utils/churchMapUtils.ts", "utf8");
  const utilsJs = ts.transpileModule(utilsSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "module", utilsJs)(mod.exports, mod);
  const { parseCoordsOrMapsInput, buildChurchMapPins } = mod.exports;

  assert.deepEqual(parseCoordsOrMapsInput("37.3812, -121.8975"), {
    lat: 37.3812,
    lng: -121.8975,
  });
  assert.deepEqual(
    parseCoordsOrMapsInput(
      "https://www.google.com/maps/place/Church/@37.3800,-121.8900,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d37.38125!4d-121.89755",
    ),
    { lat: 37.38125, lng: -121.89755 },
  );
  assert.deepEqual(
    parseCoordsOrMapsInput("https://maps.apple.com/?ll=19.4326,-99.1332&q=Iglesia"),
    { lat: 19.4326, lng: -99.1332 },
  );
  assert.equal(parseCoordsOrMapsInput("not coordinates"), null);

  const sample = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    lat: 37.38 + i * 0.0002,
    lng: -121.89 + i * 0.0002,
  }));
  // Zoomed out -> clusters 5 tightly packed pins into 1 cluster
  const clustered = buildChurchMapPins(sample, {
    latitude: 37.38,
    longitude: -121.89,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  assert.equal(clustered.length, 1);
  assert.equal(clustered[0].type, "cluster");
  assert.equal(clustered[0].count, 5);

  // Zoomed in -> individual church house pins
  const unclustered = buildChurchMapPins(sample, {
    latitude: 37.38,
    longitude: -121.89,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  assert.equal(unclustered.length, 5);
  assert.ok(unclustered.every((p) => p.type === "church"));
});

test("photo uploads, 5/10 photo caps, R2 cleanup on reject/edit, churchId profile link, and sort=top comments work", async () => {
  const f = fixture(),
    member = await f.account({ name: "Hermano Pedro", verified: true }),
    admin = await f.account({
      email: "isaacduran167@gmail.com",
      role: "admin",
      name: "Isaac Duran",
    });

  // 1. Magic-byte verification on POST /churches/photos/upload
  const badBytes = Buffer.from("not-an-image-file-123456").toString("base64");
  const badUpload = await f.call(
    "/churches/photos/upload",
    "POST",
    { base64: badBytes },
    member.token,
  );
  assert.equal(badUpload.status, 400);

  // Valid JPEG magic bytes (0xFF 0xD8 0xFF ...)
  const jpegBuf = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(32, 0x11),
  ]);
  const up1 = await f.call(
    "/churches/photos/upload",
    "POST",
    { base64: jpegBuf.toString("base64") },
    member.token,
  );
  assert.equal(up1.status, 201);
  assert.ok(up1.data.url.startsWith("https://audio.himnarioebp.com/church-photos/uploads/"));
  assert.equal(f.mediaStore.has(up1.data.key), true);

  const up2 = await f.call(
    "/churches/photos/upload",
    "POST",
    { base64: jpegBuf.toString("base64") },
    member.token,
  );
  assert.equal(up2.status, 201);
  assert.equal(f.mediaStore.has(up2.data.key), true);

  // 2. Member is capped at max 5 photos
  const sixPhotos = Array.from(
    { length: 6 },
    (_, i) => `https://audio.himnarioebp.com/church-photos/p${i}.jpg`,
  );
  const overMemberCap = await f.call(
    "/churches/submit",
    "POST",
    {
      name: "IDDV El Buen Pastor — Test",
      address: "100 Main St",
      city: "Riverbank",
      country: "Estados Unidos",
      lat: 37.7361,
      lng: -120.9387,
      photos: sixPhotos,
    },
    member.token,
  );
  assert.equal(overMemberCap.status, 400);

  // Member submits with 2 uploaded photos (within 5-photo cap)
  const validSub = await f.call(
    "/churches/submit",
    "POST",
    {
      name: "IDDV El Buen Pastor — Test",
      address: "100 Main St",
      city: "Riverbank",
      country: "Estados Unidos",
      lat: 37.7361,
      lng: -120.9387,
      photos: [up1.data.url, up2.data.url],
    },
    member.token,
  );
  assert.equal(validSub.status, 201);

  // 3. Admin can edit with up to 10 photos (6 photos succeeds for admin) and removing up1 deletes up1 from R2
  const adminEdit = await f.call(
    `/mod/churches/${validSub.data.id}`,
    "PUT",
    {
      name: "IDDV El Buen Pastor — Test",
      address: "100 Main St",
      city: "Riverbank",
      country: "Estados Unidos",
      lat: 37.7361,
      lng: -120.9387,
      photos: [up2.data.url, ...sixPhotos.slice(0, 5)],
      approve: false,
    },
    admin.token,
  );
  assert.equal(adminEdit.status, 200);
  assert.equal(f.mediaStore.has(up1.data.key), false);
  assert.equal(f.mediaStore.has(up2.data.key), true);

  // 11 photos rejected even for admin
  const elevenPhotos = Array.from(
    { length: 11 },
    (_, i) => `https://audio.himnarioebp.com/church-photos/a${i}.jpg`,
  );
  const overAdminCap = await f.call(
    `/mod/churches/${validSub.data.id}`,
    "PUT",
    {
      name: "IDDV El Buen Pastor — Test",
      address: "100 Main St",
      city: "Riverbank",
      country: "Estados Unidos",
      lat: 37.7361,
      lng: -120.9387,
      photos: elevenPhotos,
    },
    admin.token,
  );
  assert.equal(overAdminCap.status, 400);

  // Rejecting church deletes remaining uploaded R2 photo (up2)
  const rejectRes = await f.call(
    `/mod/churches/${validSub.data.id}/reject`,
    "POST",
    {},
    admin.token,
  );
  assert.equal(rejectRes.status, 200);
  assert.equal(f.mediaStore.has(up2.data.key), false);

  // 4. Linking churchId in profile & public profile visibility
  const profRes = await f.call(
    "/auth/profile",
    "PUT",
    {
      name: "Hermano Pedro",
      churchId: "church-riverbank-ca",
      churchName: "IDDV El Buen Pastor — Riverbank",
      location: "Riverbank, CA, Estados Unidos",
      showChurchLocation: true,
    },
    member.token,
  );
  assert.equal(profRes.status, 200);
  assert.equal(profRes.data.user.churchId, "church-riverbank-ca");

  const pubProf = await f.call(`/users/${member.id}/public-profile`, "GET");
  assert.equal(pubProf.status, 200);
  assert.equal(pubProf.data.user.churchId, "church-riverbank-ca");
  assert.equal(pubProf.data.user.churchName, "IDDV El Buen Pastor — Riverbank");

  // 5. Comments sort=top vs sort=newest
  const c1 = await f.post(member, "Primer comentario sin respuestas");
  const c2 = await f.post(admin, "Segundo comentario con respuesta destacada");
  await f.post(member, "Amén hermano, edificante respuesta", c2.data.id);

  const topList = await f.call("/verses/juan-14-6/comments?sort=top", "GET");
  assert.equal(topList.status, 200);
  assert.equal(topList.data.comments[0].id, c2.data.id);
});

// ── Friends ("Hermanos"), phase 1 ───────────────────────────────────────────
const statusOf = async (f, viewer, target) =>
  (await f.call(`/users/${target.id}/public-profile`, "GET", undefined, viewer?.token)).data.user
    .friendStatus;
const ask = (f, from, to) =>
  f.call("/friends/requests", "POST", { userId: to.id }, from.token);

test("a friend request must be accepted, and only the person who received it can accept", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" }),
    b = await f.account({ name: "Beto Luna" });
  assert.equal(await statusOf(f, a, b), "none");
  assert.equal((await f.call(`/users/${b.id}/public-profile`, "GET")).data.user.friendCount, 0);
  assert.equal(await statusOf(f, null, b), null); // guests get no status
  assert.equal(await statusOf(f, a, a), "self");

  const asked = await ask(f, a, b);
  assert.equal(asked.status, 200);
  assert.equal(asked.data.friendStatus, "outgoing");
  assert.equal((await ask(f, a, b)).data.friendStatus, "outgoing"); // asking twice changes nothing
  assert.equal(await statusOf(f, a, b), "outgoing");
  assert.equal(await statusOf(f, b, a), "incoming");

  // The requester cannot accept their own request.
  assert.equal(
    (await f.call(`/friends/requests/${b.id}/accept`, "POST", {}, a.token)).status,
    404,
  );
  assert.equal(await statusOf(f, a, b), "outgoing");

  const listsBefore = (await f.call("/friends", "GET", undefined, b.token)).data;
  assert.deepEqual(listsBefore.incoming.map((u) => u.name), ["Ana Ruiz"]);
  assert.equal(listsBefore.friends.length, 0);
  assert.deepEqual(
    (await f.call("/friends", "GET", undefined, a.token)).data.outgoing.map((u) => u.name),
    ["Beto Luna"],
  );

  const accepted = await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);
  assert.equal(accepted.data.friendStatus, "friends");
  assert.equal(await statusOf(f, a, b), "friends");
  assert.equal(await statusOf(f, b, a), "friends");
  assert.equal((await f.call(`/users/${b.id}/public-profile`, "GET")).data.user.friendCount, 1);
  // Accepting again, or asking again, is harmless.
  assert.equal(
    (await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token)).data.friendStatus,
    "friends",
  );
  assert.equal((await ask(f, a, b)).data.friendStatus, "friends");
  const lists = (await f.call("/friends", "GET", undefined, a.token)).data;
  assert.deepEqual(lists.friends.map((u) => u.name), ["Beto Luna"]);
  assert.equal(lists.incoming.length + lists.outgoing.length, 0);
});

test("asking someone who already asked you makes you friends at once", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account();
  await ask(f, a, b);
  assert.equal((await ask(f, b, a)).data.friendStatus, "friends");
  assert.equal(await statusOf(f, a, b), "friends");
});

test("friend requests reject guests, unverified accounts, self, bad ids and unknown people", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    unverified = await f.account({ verified: false });
  assert.equal((await f.call("/friends/requests", "POST", { userId: b.id })).status, 401);
  assert.equal((await f.call("/friends", "GET")).status, 401);
  assert.equal((await ask(f, unverified, b)).status, 403);
  assert.equal((await ask(f, a, a)).status, 400);
  assert.equal(
    (await f.call("/friends/requests", "POST", { userId: "../../etc" }, a.token)).status,
    400,
  );
  assert.equal(
    (await f.call("/friends/requests", "POST", { userId: crypto.randomUUID() }, a.token)).status,
    404,
  );
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM friendships").get().n, 0);
});

test("only an accepted friend sees a hidden church; strangers and pending requests see what they saw before", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" }),
    b = await f.account(),
    stranger = await f.account();
  await f.call(
    "/auth/profile",
    "PUT",
    { churchName: "IDDV El Buen Pastor — Central", location: "México · Puebla", showChurchLocation: false },
    a.token,
  );
  const see = async (viewer) =>
    (await f.call(`/users/${a.id}/public-profile`, "GET", undefined, viewer?.token)).data.user;

  await ask(f, b, a);
  for (const viewer of [null, stranger, b]) {
    const profile = await see(viewer);
    assert.equal(profile.churchName, null);
    assert.equal(profile.location, null);
  }
  // A pending request in the list does not reveal it either.
  const pending = (await f.call("/friends", "GET", undefined, b.token)).data.outgoing[0];
  assert.equal(pending.churchName, null);

  await f.call(`/friends/requests/${b.id}/accept`, "POST", {}, a.token);
  const asFriend = await see(b);
  assert.equal(asFriend.churchName, "IDDV El Buen Pastor — Central");
  assert.equal(asFriend.location, "México · Puebla");
  assert.equal((await see(stranger)).churchName, null);
  assert.equal((await see(null)).churchName, null);
  assert.equal(
    (await f.call("/friends", "GET", undefined, b.token)).data.friends[0].churchName,
    "IDDV El Buen Pastor — Central",
  );
  // Member since: month and year only.
  f.sql.prepare("UPDATE users SET created_at=?1 WHERE id=?2").run(Date.UTC(2026, 10, 22, 18, 30), a.id);
  assert.equal((await see(stranger)).memberSince, "2026-11");
});

test("declining, cancelling and unfriending all remove the link", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account();
  const remove = (who, other) => f.call(`/friends/${other.id}`, "DELETE", undefined, who.token);

  await ask(f, a, b);
  assert.equal((await remove(b, a)).data.friendStatus, "none"); // decline
  assert.equal(await statusOf(f, a, b), "none");

  await ask(f, a, b);
  await remove(a, b); // cancel
  assert.equal(await statusOf(f, b, a), "none");

  await ask(f, a, b);
  await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);
  await remove(a, b); // unfriend
  assert.equal(await statusOf(f, a, b), "none");
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM friendships").get().n, 0);
  assert.equal((await f.call(`/friends/${b.id}`, "DELETE")).status, 401);
});

test("blocking ends a friendship and prevents new requests in both directions", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account();
  await ask(f, a, b);
  await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);
  assert.equal(await statusOf(f, a, b), "friends");

  assert.equal((await f.call(`/users/${b.id}/block`, "POST", {}, a.token)).status, 200);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM friendships").get().n, 0);
  assert.equal(await statusOf(f, a, b), "none");
  assert.equal(await statusOf(f, b, a), "none");
  // Same answer as an account that does not exist, for both people.
  assert.equal((await ask(f, a, b)).status, 404);
  assert.equal((await ask(f, b, a)).status, 404);
  assert.equal((await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token)).status, 404);
  assert.equal((await f.call("/friends", "GET", undefined, b.token)).data.friends.length, 0);

  // A request that was pending when the block happened disappears too.
  const c = await f.account();
  await ask(f, c, a);
  await f.call(`/users/${c.id}/block`, "POST", {}, a.token);
  assert.equal((await f.call("/friends", "GET", undefined, a.token)).data.incoming.length, 0);
});

test("suspended and deleted accounts drop out of friend lists and cannot be asked", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    c = await f.account();
  await ask(f, a, b);
  await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);
  await ask(f, c, a);

  f.sql.prepare("UPDATE users SET suspended_at=1 WHERE id=?1").run(b.id);
  const lists = (await f.call("/friends", "GET", undefined, a.token)).data;
  assert.equal(lists.friends.length, 0);
  assert.equal(lists.incoming.length, 1);
  assert.equal((await ask(f, c, b)).status, 404);

  // Deleting an account removes its friendships (foreign keys cascade).
  f.sql.prepare("DELETE FROM sessions WHERE user_id=?1").run(c.id);
  f.sql.prepare("DELETE FROM users WHERE id=?1").run(c.id);
  assert.equal(
    f.sql.prepare("SELECT count(*) AS n FROM friendships WHERE requested_by=?1").get(c.id).n,
    0,
  );
  assert.equal((await f.call("/friends", "GET", undefined, a.token)).data.incoming.length, 0);
});

// ── Friends, phases 2 (favourites) and 4 (church suggestions) ───────────────
const befriend = async (f, a, b) => {
  await ask(f, a, b);
  await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);
};
const saveProfile = (f, who, body) => f.call("/auth/profile", "PUT", body, who.token);
const setFavorites = (f, who, favorites) =>
  f.sql
    .prepare(
      "INSERT INTO user_data(user_id,favorites_json,playlists_json,recents_json,preferences_json,updated_at) VALUES(?1,?2,'[]','[]','{}',1)",
    )
    .run(who.id, typeof favorites === "string" ? favorites : JSON.stringify(favorites));

test("saving another profile field keeps the linked church (it used to be wiped)", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" });
  const linked = await saveProfile(f, a, { churchId: "church-riverbank-ca", churchName: "Riverbank" });
  assert.equal(linked.data.user.churchId, "church-riverbank-ca");
  // A later save that does not mention the church must leave it alone.
  const renamed = await saveProfile(f, a, { name: "Ana R. Ruiz" });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.data.user.churchId, "church-riverbank-ca");
  assert.equal(
    f.sql.prepare("SELECT church_id FROM users WHERE id=?1").get(a.id).church_id,
    "church-riverbank-ca",
  );
  // Unlinking on purpose still works.
  assert.equal((await saveProfile(f, a, { churchId: null })).data.user.churchId, null);
});

test("the two sharing switches default safely and only accept booleans", async () => {
  const f = fixture(),
    a = await f.account();
  const start = (await saveProfile(f, a, { name: "Test Person" })).data.user;
  assert.equal(start.shareFavoritesWithFriends, true);
  assert.equal(start.suggestToChurchMembers, false); // church hidden → not suggested
  // Showing the church publicly turns suggestions on until the person says otherwise.
  assert.equal((await saveProfile(f, a, { showChurchLocation: true })).data.user.suggestToChurchMembers, true);
  assert.equal((await saveProfile(f, a, { suggestToChurchMembers: false })).data.user.suggestToChurchMembers, false);
  assert.equal((await saveProfile(f, a, { shareFavoritesWithFriends: false })).data.user.shareFavoritesWithFriends, false);
  // An explicit choice survives unrelated saves.
  const later = (await saveProfile(f, a, { name: "Test Person 2" })).data.user;
  assert.equal(later.suggestToChurchMembers, false);
  assert.equal(later.shareFavoritesWithFriends, false);
  assert.equal((await saveProfile(f, a, { shareFavoritesWithFriends: "yes" })).status, 400);
  assert.equal((await saveProfile(f, a, { suggestToChurchMembers: 1 })).status, 400);
});

test("only an accepted friend can read favourites, and the owner can switch that off", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    stranger = await f.account();
  setFavorites(f, a, ["7", "315 A", "E12", 42, { evil: true }, "x".repeat(40)]);
  const read = (who) => f.call(`/friends/${a.id}/favorites`, "GET", undefined, who?.token);

  assert.equal((await read(null)).status, 401);
  assert.equal((await read(stranger)).status, 403);
  await ask(f, b, a);
  assert.equal((await read(b)).status, 403); // pending is not enough
  await f.call(`/friends/requests/${b.id}/accept`, "POST", {}, a.token);

  const shared = await read(b);
  assert.equal(shared.status, 200);
  assert.equal(shared.data.shared, true);
  assert.deepEqual(shared.data.favorites, ["7", "315 A", "E12", "42"]); // junk dropped
  assert.equal((await read(stranger)).status, 403);
  assert.equal((await f.call(`/friends/${a.id}/favorites`, "GET", undefined, a.token)).status, 400);

  await saveProfile(f, a, { shareFavoritesWithFriends: false });
  const hidden = await read(b);
  assert.equal(hidden.status, 200);
  assert.deepEqual(hidden.data, { shared: false, favorites: [] });

  await saveProfile(f, a, { shareFavoritesWithFriends: true });
  await f.call(`/users/${b.id}/block`, "POST", {}, a.token);
  assert.equal((await read(b)).status, 403);
});

test("favourites tolerate a friend with nothing saved or a corrupt record", async () => {
  const f = fixture(),
    a = await f.account(),
    b = await f.account(),
    c = await f.account();
  await befriend(f, a, b);
  await befriend(f, c, b);
  assert.deepEqual(
    (await f.call(`/friends/${a.id}/favorites`, "GET", undefined, b.token)).data,
    { shared: true, favorites: [] },
  );
  setFavorites(f, c, "{not json");
  assert.deepEqual(
    (await f.call(`/friends/${c.id}/favorites`, "GET", undefined, b.token)).data,
    { shared: true, favorites: [] },
  );
});

test("church suggestions list only people who chose to be found, from the same church", async () => {
  const f = fixture();
  const me = await f.account({ name: "Yo" });
  const member = async (name, church, profile = {}, extra = {}) => {
    const u = await f.account({ name, ...extra });
    if (extra.verified !== false)
      assert.equal(
        (await saveProfile(f, u, { churchId: church, churchName: "Riverbank", ...profile })).status,
        200,
      );
    else f.sql.prepare("UPDATE users SET church_id=?1,show_church_location=1 WHERE id=?2").run(church, u.id);
    return u;
  };
  const suggest = async () => (await f.call("/friends/suggestions", "GET", undefined, me.token)).data;

  // Without a linked church there is nobody to suggest.
  assert.deepEqual(await suggest(), { users: [], hasChurch: false });
  f.sql.prepare(
    "INSERT OR IGNORE INTO churches (id,name,address,city,country,lat,lng,status,verified,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run("church-riverbank-ca", "Riverbank", "Test address", "Riverbank", "United States", 37.73, -120.93, "approved", 1, Date.now());
  await saveProfile(f, me, { churchId: "church-riverbank-ca", churchName: "Riverbank" });

  const visible = await member("Visible Vera", "church-riverbank-ca", { showChurchLocation: true });
  await member("Hidden Hugo", "church-riverbank-ca"); // church hidden, never chose
  const optedIn = await member("Opted Olga", "church-riverbank-ca", { suggestToChurchMembers: true });
  await member("Optout Omar", "church-riverbank-ca", { showChurchLocation: true, suggestToChurchMembers: false });
  await member("Other Church", "church-modesto-ca", { showChurchLocation: true });
  await member("Unverified Uri", "church-riverbank-ca", {}, { verified: false });
  const suspended = await member("Suspended Sam", "church-riverbank-ca", { showChurchLocation: true });
  f.sql.prepare("UPDATE users SET suspended_at=1 WHERE id=?1").run(suspended.id);
  const blocked = await member("Blocked Bea", "church-riverbank-ca", { showChurchLocation: true });
  await f.call(`/users/${blocked.id}/block`, "POST", {}, me.token);
  const pending = await member("Pending Pia", "church-riverbank-ca", { showChurchLocation: true });
  await ask(f, me, pending);
  const friend = await member("Friend Fito", "church-riverbank-ca", { showChurchLocation: true });
  await befriend(f, me, friend);

  const first = await suggest();
  assert.equal(first.hasChurch, true);
  assert.deepEqual(first.users.map((u) => u.name), ["Opted Olga", "Visible Vera"]);
  // Someone who opted in but hides their church publicly is listed without it.
  const olga = first.users.find((u) => u.id === optedIn.id);
  assert.equal(olga.churchName, null);
  assert.equal(first.users.find((u) => u.id === visible.id).churchName, "Riverbank");

  // Asking a suggested person takes them off the list.
  await ask(f, me, visible);
  assert.deepEqual((await suggest()).users.map((u) => u.name), ["Opted Olga"]);
  assert.equal((await f.call("/friends/suggestions", "GET")).status, 401);
});

// ── Comment likes ───────────────────────────────────────────────────────────
test("members can like and unlike comments and replies, sort=top ranks liked comments first, and blocks/deletes clean up", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" }),
    b = await f.account({ name: "Beto Luna" }),
    c = await f.account({ name: "Carlos Sol" }),
    unverified = await f.account({ name: "Unverified", verified: false });

  const c1 = await f.post(a, "Primer comentario");
  const c2 = await f.post(b, "Segundo comentario");
  const reply = await f.post(a, "Una respuesta edificante", c1.data.id);
  assert.equal(c1.status, 201);
  assert.equal(c2.status, 201);
  assert.equal(reply.status, 201);

  // Guests and unverified accounts cannot like comments.
  assert.equal(
    (await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: true })).status,
    401,
  );
  assert.equal(
    (await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: true }, unverified.token)).status,
    403,
  );
  // Invalid payload rejected.
  assert.equal(
    (await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: "yes" }, a.token)).status,
    400,
  );

  // Two likes on c2 (0 replies) beat c1 (1 reply, 0 likes) in sort=top.
  const l1 = await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: true }, a.token);
  assert.equal(l1.status, 200);
  assert.deepEqual(l1.data, { ok: true, liked: true, likesCount: 1 });
  // Idempotent duplicate like does not double count.
  const l1Dup = await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: true }, a.token);
  assert.deepEqual(l1Dup.data, { ok: true, liked: true, likesCount: 1 });

  const l2 = await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: true }, c.token);
  assert.deepEqual(l2.data, { ok: true, liked: true, likesCount: 2 });

  // Replies can also be liked.
  const rLike = await f.call(`/verse-comments/${reply.data.id}/like`, "POST", { liked: true }, b.token);
  assert.deepEqual(rLike.data, { ok: true, liked: true, likesCount: 1 });

  // GET comments returns likesCount and per-viewer likedByMe.
  const topForA = (await f.call("/verses/juan-14-6/comments?sort=top", "GET", undefined, a.token)).data.comments;
  assert.equal(topForA[0].id, c2.data.id);
  assert.equal(topForA[0].likesCount, 2);
  assert.equal(topForA[0].likedByMe, true);
  assert.equal(topForA[1].id, c1.data.id);
  assert.equal(topForA[1].likesCount, 0);
  assert.equal(topForA[1].likedByMe, false);
  assert.equal(topForA[1].replies[0].likesCount, 1);
  assert.equal(topForA[1].replies[0].likedByMe, false);

  const topForGuest = (await f.call("/verses/juan-14-6/comments?sort=top", "GET")).data.comments;
  assert.equal(topForGuest[0].likesCount, 2);
  assert.equal(topForGuest[0].likedByMe, false);

  // Unlike decrements cleanly.
  const unlike = await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: false }, a.token);
  assert.deepEqual(unlike.data, { ok: true, liked: false, likesCount: 1 });

  // Blocked users cannot like each other's comments (404).
  await f.call(`/users/${b.id}/block`, "POST", {}, c.token);
  assert.equal(
    (await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: true }, c.token)).status,
    404,
  );

  // Deleting an account removes its comment likes.
  const del = await f.call("/auth/account", "DELETE", undefined, c.token);
  assert.equal(del.status, 200);
  const afterDel = (await f.call("/verses/juan-14-6/comments?sort=newest", "GET")).data.comments;
  const c2Row = afterDel.find((x) => x.id === c2.data.id);
  assert.equal(c2Row.likesCount, 0);
});

// ── Friends, phase 3 (shared playlists) ─────────────────────────────────────
test("only accepted friends can send playlist copies, recipient can list, mark seen, and delete; blocks and account deletion clean up", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" }),
    b = await f.account({ name: "Beto Luna" }),
    stranger = await f.account({ name: "Extraño" });

  // Guests cannot list or send.
  assert.equal((await f.call("/playlists/shared", "GET")).status, 401);
  assert.equal(
    (await f.call(`/friends/${b.id}/playlists`, "POST", { name: "Domingo", hymnIds: ["1"] })).status,
    401,
  );

  // Non-friends and pending requests cannot send playlists (403 not_friends).
  assert.equal(
    (await f.call(`/friends/${b.id}/playlists`, "POST", { name: "Domingo", hymnIds: ["1"] }, stranger.token)).status,
    403,
  );
  await ask(f, a, b);
  assert.equal(
    (await f.call(`/friends/${b.id}/playlists`, "POST", { name: "Domingo", hymnIds: ["1"] }, a.token)).status,
    403,
  );

  // Accept friendship.
  await f.call(`/friends/requests/${a.id}/accept`, "POST", {}, b.token);

  // Validation rejects empty name, long name, HTML, empty hymnIds, invalid hymnIds, >200 hymns.
  for (const bad of [
    { name: "   ", hymnIds: ["1"] },
    { name: "x".repeat(61), hymnIds: ["1"] },
    { name: "<script>", hymnIds: ["1"] },
    { name: "Domingo", hymnIds: [] },
    { name: "Domingo", hymnIds: ["../bad"] },
    { name: "Domingo", hymnIds: Array.from({ length: 201 }, (_, i) => String(i + 1)) },
  ]) {
    assert.equal(
      (await f.call(`/friends/${b.id}/playlists`, "POST", bad, a.token)).status,
      400,
    );
  }

  // Send a valid playlist copy (duplicates are deduplicated in order).
  const sent = await f.call(
    `/friends/${b.id}/playlists`,
    "POST",
    { name: "Culto del domingo", hymnIds: ["7", "315 A", "E12", "7"] },
    a.token,
  );
  assert.equal(sent.status, 201);
  assert.equal(sent.data.ok, true);
  assert.ok(sent.data.id);

  // Recipient lists it as unseen.
  const inbox = await f.call("/playlists/shared", "GET", undefined, b.token);
  assert.equal(inbox.status, 200);
  assert.equal(inbox.data.playlists.length, 1);
  assert.equal(inbox.data.playlists[0].id, sent.data.id);
  assert.equal(inbox.data.playlists[0].fromUserId, a.id);
  assert.equal(inbox.data.playlists[0].fromName, "Ana Ruiz");
  assert.equal(inbox.data.playlists[0].name, "Culto del domingo");
  assert.deepEqual(inbox.data.playlists[0].hymnIds, ["7", "315 A", "E12"]);
  assert.equal(inbox.data.playlists[0].seen, false);

  // Someone else cannot mark seen or delete it.
  await f.call(`/playlists/shared/${sent.data.id}/seen`, "POST", {}, a.token);
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, b.token)).data.playlists[0].seen,
    false,
  );
  await f.call(`/playlists/shared/${sent.data.id}`, "DELETE", undefined, a.token);
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, b.token)).data.playlists.length,
    1,
  );

  // Recipient marks seen and then deletes it.
  assert.equal(
    (await f.call(`/playlists/shared/${sent.data.id}/seen`, "POST", {}, b.token)).status,
    200,
  );
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, b.token)).data.playlists[0].seen,
    true,
  );
  assert.equal(
    (await f.call(`/playlists/shared/${sent.data.id}`, "DELETE", undefined, b.token)).status,
    200,
  );
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, b.token)).data.playlists.length,
    0,
  );

  // Blocking removes shared playlists in both directions and prevents new ones.
  const sent2 = await f.call(
    `/friends/${b.id}/playlists`,
    "POST",
    { name: "Coros juveniles", hymnIds: ["E1", "E2"] },
    a.token,
  );
  assert.equal(sent2.status, 201);
  await f.call(`/users/${a.id}/block`, "POST", {}, b.token);
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, b.token)).data.playlists.length,
    0,
  );
  assert.equal(
    (await f.call(`/friends/${b.id}/playlists`, "POST", { name: "Otra", hymnIds: ["1"] }, a.token)).status,
    403,
  );

  // Account deletion removes shared playlists (both sent and received).
  const c = await f.account({ name: "Carlos Sol" });
  await befriend(f, a, c);
  assert.equal(
    (await f.call(`/friends/${c.id}/playlists`, "POST", { name: "Ensayo", hymnIds: ["10"] }, a.token)).status,
    201,
  );
  assert.equal((await f.call("/auth/account", "DELETE", undefined, a.token)).status, 200);
  assert.equal(
    (await f.call("/playlists/shared", "GET", undefined, c.token)).data.playlists.length,
    0,
  );
});

// ── Notifications (Phase 1 inbox + Phase 2 Expo Push tokens) ────────────────
test("notifications fire for comment likes, replies, friend requests/accepts, and shared playlists; dedupe, preferences, Expo Push, and cleanup work", async () => {
  const f = fixture(),
    a = await f.account({ name: "Ana Ruiz" }),
    b = await f.account({ name: "Beto Luna" });
  const pushes = [];
  let failDeadToken = false;
  f.env.PUSH_SEND = async (messages) => {
    pushes.push(...messages);
    return {
      data: messages.map((m) =>
        failDeadToken && m.to.includes("deadToken")
          ? { status: "error", details: { error: "DeviceNotRegistered" } }
          : { status: "ok", id: "ticket-1" },
      ),
    };
  };

  // Guests cannot read notifications or register push tokens.
  assert.equal((await f.call("/notifications", "GET")).status, 401);
  assert.equal(
    (
      await f.call("/notifications/push-token", "POST", {
        token: "ExponentPushToken[validToken12345]",
        platform: "ios",
        language: "es",
      })
    ).status,
    401,
  );

  // Invalid push tokens are rejected.
  assert.equal(
    (
      await f.call(
        "/notifications/push-token",
        "POST",
        { token: "not-a-valid-token", platform: "ios" },
        a.token,
      )
    ).status,
    400,
  );

  // Register valid push tokens for Ana (es) and Beto (en) + a dead token on Ana.
  assert.equal(
    (
      await f.call(
        "/notifications/push-token",
        "POST",
        { token: "ExponentPushToken[anaPhone123456]", platform: "ios", language: "es" },
        a.token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.call(
        "/notifications/push-token",
        "POST",
        { token: "ExponentPushToken[deadToken12345]", platform: "ios", language: "es" },
        a.token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.call(
        "/notifications/push-token",
        "POST",
        { token: "ExponentPushToken[betoPhone12345]", platform: "android", language: "en" },
        b.token,
      )
    ).status,
    200,
  );

  // 1. Self-like and self-reply do NOT notify.
  const c1 = await f.post(a, "Dios es fiel siempre");
  await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: true }, a.token);
  await f.post(a, "Respuesta propia", c1.data.id);
  assert.equal((await f.call("/notifications", "GET", undefined, a.token)).data.notifications.length, 0);
  assert.equal(pushes.length, 0);

  // 2. Beto likes Ana's comment -> 1 notification + Spanish push (deadToken gets pruned).
  failDeadToken = true;
  await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: true }, b.token);
  assert.equal(pushes.length, 2); // sent to both of Ana's tokens
  assert.equal(pushes[0].title, "Nuevo me gusta");
  assert.equal(pushes[0].data.type, "comment_like");
  // Dead token pruned from push_tokens.
  assert.equal(
    f.sql.prepare("SELECT count(*) AS n FROM push_tokens WHERE user_id=?1").get(a.id).n,
    1,
  );

  // Unlike + re-like does NOT create a duplicate notification or second push!
  await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: false }, b.token);
  await f.call(`/verse-comments/${c1.data.id}/like`, "POST", { liked: true }, b.token);
  assert.equal(pushes.length, 2);

  // 3. Beto replies to Ana's comment -> comment_reply notification.
  await f.post(b, "Amén hermana", c1.data.id);
  // 4. Beto sends friend request -> friend_request notification; Ana accepts -> friend_accepted to Beto (in English!).
  await ask(f, b, a);
  await f.call(`/friends/requests/${b.id}/accept`, "POST", {}, a.token);
  // 5. Beto shares a playlist -> shared_playlist notification to Ana.
  await f.call(
    `/friends/${a.id}/playlists`,
    "POST",
    { name: "Culto especial", hymnIds: ["1", "23"] },
    b.token,
  );

  const anaInbox = (await f.call("/notifications", "GET", undefined, a.token)).data;
  assert.equal(anaInbox.unreadCount, 4);
  assert.deepEqual(
    anaInbox.notifications.map((n) => n.type).sort(),
    ["comment_like", "comment_reply", "friend_request", "shared_playlist"],
  );

  const betoInbox = (await f.call("/notifications", "GET", undefined, b.token)).data;
  assert.equal(betoInbox.unreadCount, 1);
  assert.equal(betoInbox.notifications[0].type, "friend_accepted");
  const betoPush = pushes.find((p) => p.to === "ExponentPushToken[betoPhone12345]");
  assert.ok(betoPush);
  assert.equal(betoPush.title, "New Friend");

  // Mark one read, then mark all read.
  const firstId = anaInbox.notifications[0].id;
  await f.call("/notifications/read", "POST", { id: firstId }, a.token);
  assert.equal((await f.call("/notifications", "GET", undefined, a.token)).data.unreadCount, 3);
  await f.call("/notifications/read", "POST", { all: true }, a.token);
  assert.equal((await f.call("/notifications", "GET", undefined, a.token)).data.unreadCount, 0);

  // Preference toggle suppresses future comment likes.
  const prefRes = await saveProfile(f, b, { notifyCommentLikes: false });
  assert.equal(prefRes.status, 200);
  assert.equal(prefRes.data.user.notifyCommentLikes, false);
  const c2 = await f.post(b, "Alabado sea Dios");
  await f.call(`/verse-comments/${c2.data.id}/like`, "POST", { liked: true }, a.token);
  const betoAfter = (await f.call("/notifications", "GET", undefined, b.token)).data;
  assert.equal(betoAfter.notifications.some((n) => n.type === "comment_like"), false);

  // Logout removes the device push token.
  await f.call(
    "/auth/logout",
    "POST",
    { pushToken: "ExponentPushToken[betoPhone12345]" },
    b.token,
  );
  assert.equal(
    f.sql.prepare("SELECT count(*) AS n FROM push_tokens WHERE user_id=?1").get(b.id).n,
    0,
  );

  // Blocking cleans up notifications between the pair.
  await f.call(`/users/${b.id}/block`, "POST", {}, a.token);
  assert.equal((await f.call("/notifications", "GET", undefined, a.token)).data.notifications.length, 0);
});

test("Coro Filadelfia is built in, members can suggest choirs, and admin approval enables profile & repertoire", async () => {
  const f = fixture(),
    admin = await f.account({ email: "isaacduran167@gmail.com", role: "admin", name: "Admin" }),
    member = await f.account({ name: "Hermano Luis" });

  // Built-in choirs include Esmirna, Maranatha, and Filadelfia.
  const initial = await f.call("/choirs", "GET");
  assert.equal(initial.status, 200);
  assert.deepEqual(
    initial.data.choirs.map((c) => c.slug),
    ["esmirna", "maranatha", "filadelfia"],
  );

  // Member can immediately pick Coro Filadelfia.
  const pickFiladelfia = await f.call(
    "/auth/profile",
    "PUT",
    { name: "Hermano Luis", choir: "filadelfia" },
    member.token,
  );
  assert.equal(pickFiladelfia.status, 200);
  assert.equal(pickFiladelfia.data.user.choir, "filadelfia");

  // Member suggests a new choir -> pending & hidden from public list until approved.
  const submit = await f.call(
    "/choirs/submit",
    "POST",
    { name: "Betel", churchContext: "Riverbank, CA" },
    member.token,
  );
  assert.equal(submit.status, 200);
  assert.equal(submit.data.status, "pending");
  assert.equal(submit.data.choir.slug, "betel");
  assert.equal(submit.data.choir.nameEs, "Coro Betel");
  assert.equal(submit.data.choir.nameEn, "Betel Choir");

  // Duplicate submission is rejected cleanly.
  const dup = await f.call(
    "/choirs/submit",
    "POST",
    { name: "Coro Betel" },
    member.token,
  );
  assert.equal(dup.status, 409);
  assert.equal(dup.data.error, "choir_exists");

  // Pending choir cannot be selected on profile yet.
  const beforeApprove = await f.call(
    "/auth/profile",
    "PUT",
    { name: "Hermano Luis", choir: "betel" },
    member.token,
  );
  assert.equal(beforeApprove.status, 400);
  assert.equal(beforeApprove.data.error, "invalid_choir");

  // Non-admin cannot access /mod/choirs.
  assert.equal((await f.call("/mod/choirs", "GET", undefined, member.token)).status, 403);

  // Admin inspects & approves with polished name.
  const modList = await f.call("/mod/choirs", "GET", undefined, admin.token);
  assert.equal(modList.status, 200);
  assert.equal(modList.data.choirs[0].slug, "betel");
  assert.equal(modList.data.choirs[0].status, "pending");

  const approve = await f.call(
    "/mod/choirs/betel/approve",
    "POST",
    { nameEs: "Coro Betel Central", nameEn: "Betel Central Choir" },
    admin.token,
  );
  assert.equal(approve.status, 200);
  assert.equal(approve.data.choir.nameEs, "Coro Betel Central");

  // Approved choir now appears on GET /choirs, can be picked on profile, and supports repertoire.
  const afterApprove = await f.call("/choirs", "GET");
  assert.ok(afterApprove.data.choirs.some((c) => c.slug === "betel" && c.nameEs === "Coro Betel Central"));

  const pickBetel = await f.call(
    "/auth/profile",
    "PUT",
    { name: "Hermano Luis", choir: "betel" },
    member.token,
  );
  assert.equal(pickBetel.status, 200);
  assert.equal(pickBetel.data.user.choir, "betel");

  // Admin can edit approved names without changing the stable slug or member assignments.
  assert.equal((await f.call("/mod/choirs/betel", "PUT", { nameEs: "Coro Betel Nuevo", nameEn: "New Bethel Choir" }, member.token)).status, 403);
  assert.equal((await f.call("/mod/choirs/betel", "PUT", { nameEs: "<script>", nameEn: "Name" }, admin.token)).status, 400);
  const edited = await f.call("/mod/choirs/betel", "PUT", { nameEs: "Coro Betel Nuevo", nameEn: "New Bethel Choir" }, admin.token);
  assert.equal(edited.status, 200);
  assert.equal((await f.call("/choirs", "GET")).data.choirs.find(c => c.slug === "betel").nameEs, "Coro Betel Nuevo");
  assert.equal(f.sql.prepare("SELECT choir FROM users WHERE id=?1").get(member.id).choir, "betel");
  assert.equal((await f.call("/mod/choirs/filadelfia", "PUT", { nameEs: "Coro Filadelfia Unido", nameEn: "United Philadelphia Choir" }, admin.token)).status, 200);

  const repSave = await f.call(
    "/mod/choirs/repertoire",
    "PUT",
    { choir: "filadelfia", title: "Culto Domingo", notes: "Tono Sol", hymnIds: ["1", "E12"] },
    admin.token,
  );
  assert.equal(repSave.status, 200);
  const repRead = await f.call("/choirs/repertoire?choir=filadelfia", "GET");
  assert.equal(repRead.status, 200);
  assert.equal(repRead.data.repertoires[0].title, "Culto Domingo");

  // Non-admins cannot delete choirs; Admin can delete both custom and built-in choirs cleanly.
  assert.equal((await f.call("/mod/choirs/filadelfia", "DELETE", undefined, member.token)).status, 403);
  assert.equal((await f.call("/mod/choirs/betel", "DELETE", undefined, admin.token)).status, 200);
  const memberRow = f.sql.prepare("SELECT choir FROM users WHERE id=?1").get(member.id);
  assert.equal(memberRow.choir, null);
  assert.equal((await f.call("/mod/choirs/filadelfia", "DELETE", undefined, admin.token)).status, 200);
  assert.equal((await f.call("/choirs/repertoire?choir=filadelfia", "GET")).status, 400);
});

test("church members directory self-heals missing church_id and lists opt-in members and friends privately", async () => {
  const f = fixture();
  const me = await f.account({ name: "Isaac" });
  const friend = await f.account({ name: "Isaac V2" });
  const optIn = await f.account({ name: "Marta Lopez" });
  const hidden = await f.account({ name: "Oculto Oscar" });
  const outsider = await f.account({ name: "Otro Templo" });

  // Seed approved Riverbank church
  f.sql
    .prepare(
      "INSERT OR REPLACE INTO churches (id,name,address,city,country,lat,lng,status,verified,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    )
    .run("church-riverbank-ca", "IDDV El Buen Pastor — Riverbank", "3109 Santa Fe St", "Riverbank", "United States", 37.73, -120.93, "approved", 1, Date.now());

  // Simulate legacy user whose church_id was wiped while church_name remained
  f.sql.prepare("UPDATE users SET church_id=NULL, church_name=?1 WHERE id=?2").run("IDDV El Buen Pastor — Riverbank", me.id);
  await saveProfile(f, friend, { churchId: "church-riverbank-ca", churchName: "IDDV El Buen Pastor — Riverbank", suggestToChurchMembers: true });
  await saveProfile(f, optIn, { churchId: "church-riverbank-ca", churchName: "IDDV El Buen Pastor — Riverbank", suggestToChurchMembers: true });
  await saveProfile(f, hidden, { churchId: "church-riverbank-ca", churchName: "IDDV El Buen Pastor — Riverbank", suggestToChurchMembers: false, showChurchLocation: false });
  await saveProfile(f, outsider, { churchId: "church-modesto-ca", churchName: "Modesto", suggestToChurchMembers: true });
  await befriend(f, me, friend);
  await befriend(f, me, hidden);

  // /friends/suggestions self-heals church_id and returns both new suggestions and full churchMembers
  const res = await f.call("/friends/suggestions", "GET", undefined, me.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.hasChurch, true);
  assert.equal(res.data.churchId, "church-riverbank-ca");
  assert.deepEqual(res.data.users.map((u) => u.name), ["Marta Lopez"]);
  assert.deepEqual(
    res.data.churchMembers.map((u) => [u.name, u.friendStatus]),
    [
      ["Isaac V2", "friends"],
      ["Marta Lopez", "none"],
    ],
  );
  // Confirm church_id was persisted in D1
  assert.equal(f.sql.prepare("SELECT church_id FROM users WHERE id=?1").get(me.id).church_id, "church-riverbank-ca");

  // Signed-in visitors can browse opted-in members, even when they belong to another church.
  const dir = await f.call("/churches/church-riverbank-ca/members", "GET", undefined, me.token);
  assert.equal(dir.status, 200);
  assert.deepEqual(
    dir.data.members.map((u) => [u.name, u.friendStatus]),
    [
      ["Isaac V2", "friends"],
      ["Marta Lopez", "none"],
    ],
  );
  assert.equal(dir.data.total, 2);
  const visitorBeforeConsent = await f.call("/churches/church-riverbank-ca/members", "GET", undefined, outsider.token);
  assert.equal(visitorBeforeConsent.data.total, 0);
  await saveProfile(f, friend, { directoryVisibleToAll: true });
  const visitorDir = await f.call("/churches/church-riverbank-ca/members", "GET", undefined, outsider.token);
  assert.equal(visitorDir.status, 200);
  assert.deepEqual(visitorDir.data.members.map(u => u.name), ["Isaac V2"]);
  assert.equal(visitorDir.data.total, 1);
  await f.call(`/users/${friend.id}/block`, "POST", {}, outsider.token);
  assert.equal((await f.call("/churches/church-riverbank-ca/members", "GET", undefined, outsider.token)).data.total, 0);
  assert.equal((await f.call("/churches/church-riverbank-ca/members", "GET")).status, 401);
  assert.equal((await f.call("/churches/not-an-approved-church/members", "GET", undefined, outsider.token)).status, 404);
  assert.deepEqual((await f.call("/churches/church-riverbank-ca/members?offset=1", "GET", undefined, me.token)).data.members.map(u => u.name), ["Marta Lopez"]);
  await saveProfile(f, me, { suggestToChurchMembers: true });
  const withSelf = await f.call("/churches/church-riverbank-ca/members", "GET", undefined, me.token);
  assert.equal(withSelf.data.total, 3);
  assert.equal(withSelf.data.members.find(u => u.id === me.id)?.friendStatus, "self");

  f.sql.prepare(
    "INSERT INTO churches (id,name,address,city,country,lat,lng,status,verified,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run("another-riverbank", "Another church", "Test address", "Riverbank", "United States", 38, -120, "approved", 1, Date.now());
  f.sql.prepare("UPDATE users SET church_id=NULL, church_name='Riverbank' WHERE id=?1").run(me.id);
  assert.equal((await f.call("/friends/suggestions", "GET", undefined, me.token)).data.hasChurch, false);
  assert.equal(f.sql.prepare("SELECT church_id FROM users WHERE id=?1").get(me.id).church_id, null);
});

test("signed-in members can view accepted friend names unless opted out, excluding blocked and suspended users", async () => {
  const f = fixture();
  const alice = await f.account({ name: "Alice Gomez" });
  const bob = await f.account({ name: "Bob Silva" });
  const carla = await f.account({ name: "Carla Ruiz" });
  const viewer = await f.account({ name: "Daniel Paz" });

  await befriend(f, alice, bob);
  await befriend(f, alice, carla);

  // Guests cannot read friend names
  assert.equal((await f.call(`/users/${alice.id}/friends`, "GET")).status, 401);

  // Any signed-in member sees Alice's friend count and names by default
  const initial = await f.call(`/users/${alice.id}/friends`, "GET", undefined, viewer.token);
  assert.equal(initial.status, 200);
  assert.equal(initial.data.visible, true);
  assert.equal(initial.data.count, 2);
  assert.deepEqual(
    initial.data.friends.map((x) => [x.name, x.friendStatus]),
    [
      ["Bob Silva", "none"],
      ["Carla Ruiz", "none"],
    ],
  );

  // If viewer and Bob become friends, Bob's status updates to "friends"
  await befriend(f, viewer, bob);
  const afterMutual = await f.call(`/users/${alice.id}/friends`, "GET", undefined, viewer.token);
  assert.deepEqual(
    afterMutual.data.friends.map((x) => [x.name, x.friendStatus]),
    [
      ["Bob Silva", "friends"],
      ["Carla Ruiz", "none"],
    ],
  );

  // If viewer blocks Carla, Carla is excluded from viewer's view of Alice's friends
  await f.call(`/users/${carla.id}/block`, "POST", {}, viewer.token);
  const afterBlock = await f.call(`/users/${alice.id}/friends`, "GET", undefined, viewer.token);
  assert.deepEqual(afterBlock.data.friends.map((x) => x.name), ["Bob Silva"]);

  // If Alice turns off showFriendsList, non-self viewers get visible: false and empty friends (count remains)
  const savedHide = await saveProfile(f, alice, { showFriendsList: false });
  assert.equal(savedHide.status, 200);
  assert.equal(savedHide.data.user.showFriendsList, false);
  const hidden = await f.call(`/users/${alice.id}/friends`, "GET", undefined, viewer.token);
  assert.equal(hidden.status, 200);
  assert.equal(hidden.data.visible, false);
  assert.equal(hidden.data.count, 2);
  assert.deepEqual(hidden.data.friends, []);

  // Alice herself still sees her own list
  const selfView = await f.call(`/users/${alice.id}/friends`, "GET", undefined, alice.token);
  assert.equal(selfView.data.visible, true);
  assert.equal(selfView.data.friends.length, 2);
});
