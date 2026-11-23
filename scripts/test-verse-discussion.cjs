const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("../himnario/node_modules/typescript");
const compile = (file, deps = {}) => {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      allowJs: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      if (!(name in deps)) throw Error("Unexpected dependency " + name);
      return deps[name];
    },
    module,
    module.exports,
  );
  return module.exports;
};
const thread = compile("himnario/utils/verseDiscussionState.ts");
const { createVerseLikeQueue } = compile("himnario/utils/verseLikeQueue.ts");
const rules = compile("himnario/data/communityRules.js");
const { strings } = compile("himnario/context/LanguageContext.tsx", {
  react: { createContext: () => ({}) },
  "@react-native-async-storage/async-storage": { default: {} },
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise(setImmediate);
};
const comment = (id, body = "Original", parentId = null) => ({
  id,
  body,
  parentId,
  verseId: "juan-14-6",
  userId: "u1",
  authorName: "Test Person",
  authorInitials: "TP",
  ministry: null,
  choir: null,
  badgeVerified: false,
  createdAt: 1,
  editedAt: null,
  replies: [],
  repliesCursor: null,
});
function fixture(saved = new Map(), opts = {}) {
  const slots = [],
    effects = [],
    requests = [],
    alerts = [],
    storage = saved;
  let cursor = 0,
    scheduled = false,
    closed = false,
    tree,
    seq = 0,
    focus = 0,
    closes = 0,
    changes = 0,
    acceptCalls = 0;
  let storageFailure = false;
  let auth = {
    user: {
      id: "u1",
      displayName: "Test Person",
      email: "one@example.test",
      initials: "TP",
      emailVerified: true,
      ugcTermsAccepted: opts.ugcTermsAccepted ?? true,
      ministry: null,
      choir: null,
      role: "member",
    },
    token: "token-one",
    openAuthSheet: () => {},
    requestEmailVerification: async () => {},
    refreshUser: async () => {},
    acceptUgcTerms: async () => {
      acceptCalls++;
      auth = {
        ...auth,
        user: { ...auth.user, ugcTermsAccepted: true },
      };
      render();
    },
  };
  const props = {
    visible: true,
    onClose: () => {
      closes++;
    },
    verse: {
      id: "juan-14-6",
      es: { ref: "Juan 14:6", text: "La verdad" },
      en: { ref: "John 14:6", text: "The truth" },
    },
    onChanged: () => {
      changes++;
    },
  };
  const same = (a, b) =>
    a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createElement: (type, props, ...children) => {
      if (type === "TextInput" && props?.ref)
        props.ref.current = {
          focus: () => {
            focus++;
          },
        };
      return { type, props: { ...props, children } };
    },
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) {
        const slot = {
          value: typeof initial === "function" ? initial() : initial,
        };
        slot.set = (next) => {
          const value = typeof next === "function" ? next(slot.value) : next;
          if (!Object.is(value, slot.value)) {
            slot.value = value;
            schedule();
          }
        };
        slots[i] = slot;
      }
      return [slots[i].value, slots[i].set];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ||= { current: initial });
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          slots[i].cleanup = fn();
        });
      }
    },
  };
  react.default = react;
  function schedule() {
    if (scheduled || closed) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      render();
    });
  }
  const api = (path, method = "GET", body) => {
    const gate = deferred();
    requests.push({ path, method, body, ...gate });
    return gate.promise;
  };
  const gesture = new Proxy({}, { get: () => () => gesture });
  const native = {};
  for (const name of [
    "Modal",
    "View",
    "Text",
    "TextInput",
    "Pressable",
    "ScrollView",
    "RefreshControl",
    "KeyboardAvoidingView",
    "ActivityIndicator",
  ])
    native[name] = name;
  Object.assign(native, {
    Platform: { OS: "ios" },
    StyleSheet: { create: (x) => x, hairlineWidth: 1, absoluteFill: {} },
    UIManager: { hasViewManagerConfig: () => true },
    Keyboard: { dismiss: () => {} },
    Linking: { openURL: async () => {} },
    Alert: {
      alert: (title, message, buttons) => {
        alerts.push({ title, message, buttons });
      },
    },
    useWindowDimensions: () => ({ height: 850, width: 393 }),
  });
  const fonts = new Proxy({}, { get: (_, key) => String(key) });
  const deps = {
    react,
    "react-native": native,
    "@react-native-menu/menu": { MenuView: "MenuView" },
    "@react-native-async-storage/async-storage": {
      default: {
        getItem: async (key) => storage.get(key) || null,
        setItem: async (key, value) => {
          if (storageFailure) throw Error("disk full");
          storage.set(key, value);
        },
      },
    },
    "react-native-reanimated": {
      default: { View: "AnimatedView", createAnimatedComponent: (x) => x },
      useSharedValue: (v) => react.useRef({ value: v }).current,
      useAnimatedStyle: (fn) => fn(),
      withSpring: (x) => x,
      withTiming: (x) => x,
      cancelAnimation: () => {},
      Easing: { out: (x) => x, cubic: 0 },
      runOnJS: (fn) => fn,
    },
    "react-native-gesture-handler": {
      Gesture: { Pan: () => gesture },
      GestureDetector: "GestureDetector",
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "expo-modules-core": {
      uuid: { v4: () => `request-${String(++seq).padStart(30, "0")}` },
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ top: 44, bottom: 20 }),
    },
    "../theme/ThemeContext": {
      useTheme: () => ({
        theme: {
          onSurface: "#fff",
          onSurfaceVariant: "#aaa",
          primary: "#eee",
          onPrimary: "#111",
          outlineVariant: "#555",
          surfaceVariants: {
            containerLow: "#111",
            container: "#222",
            containerHigh: "#333",
            containerHighest: "#444",
          },
        },
      }),
    },
    "../context/LanguageContext": { useLanguage: () => ({ language: "es", t: strings.es }) },
    "../context/AuthContext": { useAuth: () => auth },
    "../theme/theme": { fonts },
    "../data/communityRules": rules,
    "../utils/choirsStore": {
      useApprovedChoirs: () => ({ choirs: [], bySlug: {}, loading: false, refresh: async () => {} }),
    },
    "../utils/churchName": {
      churchDisplayName: (n) => n || "",
    },
    "../utils/communityApi": {
      useCommunityApi: () => api,
      communityError: (e) => e.message,
    },
    "../utils/verseDiscussionState": thread,
    "../utils/gestureMotion": { shouldCollapsePlayer: () => false },
    "./GlassSurface": { default: "GlassSurface" },
    "./AppMenuIcon": { default: "AppMenuIcon" },
    "./SheetGrabber": { default: "SheetGrabber" },
    "./FriendButton": { default: "FriendButton" },
    "../utils/friends": {
      memberSinceLabel: () => "",
      parseFriendStatus: (v) => v ?? null,
    },
    "../utils/haptics": {
      impactAsync: () => {},
      selectionAsync: () => {},
      ImpactFeedbackStyle: { Light: 0 },
    },
  };
  const component = compile(
    "himnario/components/VerseDiscussionSheet.tsx",
    deps,
  ).default;
  function render() {
    if (closed) return;
    cursor = 0;
    tree = component(props);
    effects.splice(0).forEach((fn) => fn());
  }
  function all(type) {
    const out = [];
    const visit = (node) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (node && typeof node === "object" && node.props) {
        if (node.type === type) out.push(node);
        visit(node.props.children);
        visit(node.props.refreshControl);
      }
    };
    visit(tree);
    return out;
  }
  function texts(node) {
    if (Array.isArray(node)) return node.map(texts).join("");
    if (typeof node === "string" || typeof node === "number")
      return String(node);
    return node?.props ? texts(node.props.children) : "";
  }
  const button = (title) =>
    all("Pressable").find((node) => texts(node) === title);
  render();
  return {
    requests,
    alerts,
    storage,
    all,
    button,
    texts,
    get acceptCalls() {
      return acceptCalls;
    },
    get tree() {
      return tree;
    },
    get closes() {
      return closes;
    },
    get changes() {
      return changes;
    },
    get focus() {
      return focus;
    },
    failStorage: () => {
      storageFailure = true;
    },
    input: () => all("TextInput")[0],
    emoji: () =>
      all("Pressable").find(
        (n) => n.props.accessibilityLabel === "Insertar emoji ❤️",
      ),
    send: () => button("Enviar") || button("Enviando…"),
    changeAuth(id) {
      auth = { ...auth, user: { ...auth.user, id }, token: "token-" + id };
      render();
    },
    async ready(comments = []) {
      await flush();
      requests
        .find((r) => r.method === "GET")
        .resolve({ comments, nextCursor: null });
      await flush();
    },
    unmount() {
      closed = true;
      slots.forEach((s) => s?.cleanup?.());
    },
  };
}

test("heart insertion followed immediately by Send reads the latest draft, not a stale render", async () => {
  const f = fixture();
  await f.ready([comment("parent")]);
  f.button("Responder").props.onPress();
  await flush();
  f.input().props.onChangeText("Amén");
  await flush();
  const send = f.send();
  f.emoji().props.onPress();
  send.props.onPress();
  send.props.onPress();
  await flush();
  assert.equal(f.requests.filter((r) => r.method === "POST").length, 1);
  const post = f.requests.find((r) => r.method === "POST");
  assert.equal(post.body.body, "Amén ❤️");
  assert.equal(post.body.parentId, "parent");
  assert.equal(f.focus, 2);
  post.resolve({ id: "server-reply" });
  await flush();
  assert.equal(f.input().props.editable, true);
  assert.equal(f.emoji().props.disabled, false);
  assert.equal(f.requests.filter((r) => r.method === "GET").length, 2);
  assert.equal(f.changes, 1);
  assert.equal(
    f.all("View").some((n) => n.props.key === "server-reply"),
    true,
  );
  f.unmount();
});
test("pending self-reply cannot be used as a parent before its server acknowledgement", async () => {
  const f = fixture();
  await f.ready();
  f.input().props.onChangeText("Root");
  await flush();
  f.send().props.onPress();
  await flush();
  const reply = f.button("Responder");
  assert.equal(reply.props.disabled, true);
  reply.props.onPress();
  assert.equal(f.input().props.value, "");
  f.unmount();
});
test("failed sends remove ghost replies and restore the same idempotent retry draft", async () => {
  const f = fixture();
  await f.ready([comment("parent")]);
  f.button("Responder").props.onPress();
  await flush();
  f.emoji().props.onPress();
  await flush();
  f.send().props.onPress();
  await flush();
  const post = f.requests.find((r) => r.method === "POST");
  post.reject(new Error("offline"));
  await flush();
  assert.equal(f.input().props.value, "❤️");
  assert.equal(
    f.all("View").some((n) => String(n.props.key || "").startsWith("temp-")),
    false,
  );
  f.requests
    .at(-1)
    .resolve({ comments: [comment("parent")], nextCursor: null });
  await flush();
  assert.equal(
    f.all("Text").some((n) => f.texts(n) === "offline"),
    true,
  );
  f.send().props.onPress();
  await flush();
  const retry = f.requests.filter((r) => r.method === "POST").at(-1);
  assert.equal(retry.body.clientRequestId, post.body.clientRequestId);
  assert.equal(retry.body.parentId, "parent");
  retry.resolve({ id: "reply" });
  await flush();
  f.unmount();
});
test("a stale read cannot erase a pending post, and an old failure cannot restore another account draft", async () => {
  const f = fixture();
  await f.ready();
  f.all("RefreshControl")[0].props.onRefresh();
  const read = f.requests.at(-1);
  f.input().props.onChangeText("Private draft");
  await flush();
  f.send().props.onPress();
  await flush();
  const post = f.requests.at(-1);
  read.resolve({ comments: [], nextCursor: null });
  await flush();
  assert.equal(
    f.all("Text").some((n) => f.texts(n) === "Private draft"),
    true,
  );
  f.changeAuth("u2");
  await flush();
  f.input().props.onChangeText("New account draft");
  post.reject(new Error("auth_cancelled"));
  await flush();
  assert.equal(f.input().props.value, "New account draft");
  f.unmount();
});
test("the retry draft survives navigating away before a failed request finishes", async () => {
  const f = fixture();
  await f.ready();
  f.input().props.onChangeText("Keep this message");
  await flush();
  f.send().props.onPress();
  await flush();
  const post = f.requests.find((r) => r.method === "POST");
  f.unmount();
  post.reject(new Error("offline"));
  await flush();
  const restored = fixture(f.storage);
  await restored.ready();
  assert.equal(restored.input().props.value, "Keep this message");
  restored.send().props.onPress();
  await flush();
  assert.equal(
    restored.requests.find((r) => r.method === "POST").body.clientRequestId,
    post.body.clientRequestId,
  );
  restored.unmount();
});
test("storage failure retains the text and prevents an unrecorded network send", async () => {
  const f = fixture();
  await f.ready();
  f.input().props.onChangeText("Keep this on disk");
  await flush();
  f.failStorage();
  f.send().props.onPress();
  await flush();
  assert.equal(
    f.requests.some((r) => r.method === "POST"),
    false,
  );
  assert.equal(f.input().props.value, "Keep this on disk");
  assert.equal(
    f.all("Text").some((n) => f.texts(n) === "draft_storage_unavailable"),
    true,
  );
  f.unmount();
});
test("posting before the initial read completes still leaves older pages reachable", async () => {
  const f = fixture();
  await flush();
  const initial = f.requests[0];
  f.input().props.onChangeText("Early post");
  await flush();
  f.send().props.onPress();
  await flush();
  initial.resolve({ comments: [], nextCursor: null });
  const post = f.requests.find((r) => r.method === "POST");
  post.resolve({ id: "server" });
  await flush();
  const background = f.requests.at(-1);
  background.resolve({
    comments: [comment("server", "Early post"), comment("older")],
    nextCursor: "1:older",
  });
  await flush();
  assert.ok(f.button("Cargar más"));
  f.unmount();
});
test("failed edit restores the old row and retains the editable text", async () => {
  const root = comment("parent");
  root.replies = [comment("reply", "Old text", "parent")];
  const f = fixture();
  await f.ready([root]);
  f.all("MenuView")[1].props.onPressAction({ nativeEvent: { event: "edit" } });
  await flush();
  f.input().props.onChangeText("Edited text");
  await flush();
  f.send().props.onPress();
  await flush();
  const put = f.requests.at(-1);
  assert.equal(put.method, "PUT");
  put.reject(new Error("offline"));
  await flush();
  assert.equal(f.input().props.value, "Edited text");
  assert.equal(
    f.all("Text").some((n) => f.texts(n) === "Old text"),
    true,
  );
  f.unmount();
});
test("replying to a comment that no longer exists keeps the text and drops the reply", async () => {
  const f = fixture();
  await f.ready([comment("parent")]);
  f.button("Responder").props.onPress();
  await flush();
  f.input().props.onChangeText("Amen");
  await flush();
  f.send().props.onPress();
  await flush();
  const post = f.requests.find((r) => r.method === "POST");
  assert.equal(post.body.parentId, "parent");
  post.reject(new Error("invalid_parent"));
  await flush();
  f.requests.at(-1).resolve({ comments: [], nextCursor: null });
  await flush();

  // The words are kept, the composer is no longer stuck in "Respondiendo".
  assert.equal(f.input().props.value, "Amen");
  assert.equal(
    f.all("Text").some((n) => f.texts(n) === "Respondiendo · Cancelar"),
    false,
  );
  assert.equal(
    f.all("Text").some((n) => f.texts(n).includes("ya no existe")),
    true,
  );

  // Sending again posts it as a new comment, with a fresh request id.
  f.send().props.onPress();
  await flush();
  const retry = f.requests.filter((r) => r.method === "POST").at(-1);
  assert.equal(retry.body.parentId, undefined);
  assert.equal(retry.body.body, "Amen");
  assert.notEqual(retry.body.clientRequestId, post.body.clientRequestId);
  retry.resolve({ id: "fresh" });
  await flush();
  f.unmount();
});
test("a failed send does not make an empty comment list claim to be offline", async () => {
  const f = fixture();
  await f.ready([]);
  f.input().props.onChangeText("Gloria a Dios");
  await flush();
  f.send().props.onPress();
  await flush();
  f.requests.find((r) => r.method === "POST").reject(new Error("rate_limited"));
  await flush();
  f.requests.at(-1).resolve({ comments: [], nextCursor: null });
  await flush();
  const shown = f.all("Text").map((n) => f.texts(n));
  assert.equal(shown.includes("Comentarios disponibles con conexión"), false);
  assert.equal(shown.includes("No hay comentarios aún"), true);
  f.unmount();
});
test("liking a comment updates optimistically, reconciles with server count, and rolls back on failure", async () => {
  const f = fixture();
  await f.ready([{ ...comment("c1", "Amén"), likesCount: 2, likedByMe: false }]);
  const likeBtn = () =>
    f
      .all("Pressable")
      .find(
        (n) =>
          n.props.accessibilityLabel === "Me gusta" ||
          n.props.accessibilityLabel === "Quitar me gusta",
      );
  assert.equal(likeBtn().props.accessibilityLabel, "Me gusta");
  assert.equal(f.texts(likeBtn()), "2");

  // Optimistic like increments immediately.
  likeBtn().props.onPress();
  await flush();
  assert.equal(likeBtn().props.accessibilityLabel, "Quitar me gusta");
  assert.equal(f.texts(likeBtn()), "3");
  const postLike = f.requests.find((r) => r.path === "/verse-comments/c1/like");
  assert.deepEqual(postLike.body, { liked: true });
  // Server reconciles count to 4 (e.g. another user liked concurrently).
  postLike.resolve({ ok: true, liked: true, likesCount: 4 });
  await flush();
  assert.equal(f.texts(likeBtn()), "4");

  // Failed unlike rolls back to liked=true and count=4.
  likeBtn().props.onPress();
  await flush();
  assert.equal(likeBtn().props.accessibilityLabel, "Me gusta");
  assert.equal(f.texts(likeBtn()), "3");
  const postUnlike = f.requests.filter((r) => r.path === "/verse-comments/c1/like").at(-1);
  postUnlike.reject(new Error("offline"));
  await flush();
  assert.equal(likeBtn().props.accessibilityLabel, "Quitar me gusta");
  assert.equal(f.texts(likeBtn()), "4");
  f.unmount();
});
test("idempotency_conflict regenerates requestId so retrying succeeds without getting stuck", async () => {
  const f = fixture();
  await f.ready([]);
  f.input().props.onChangeText("Aleluya");
  await flush();
  f.send().props.onPress();
  await flush();
  const first = f.requests.find((r) => r.method === "POST");
  first.reject(new Error("idempotency_conflict"));
  await flush();
  f.requests.at(-1).resolve({ comments: [], nextCursor: null });
  await flush();
  assert.equal(f.input().props.value, "Aleluya");
  f.send().props.onPress();
  await flush();
  const retry = f.requests.filter((r) => r.method === "POST").at(-1);
  assert.notEqual(retry.body.clientRequestId, first.body.clientRequestId);
  retry.resolve({ id: "recovered" });
  await flush();
  f.unmount();
});
test("cancelling a reply keeps the typed text and sends it without an obsolete parent", async () => {
  const f = fixture();
  await f.ready([comment("parent")]);
  f.button("Responder").props.onPress();
  await flush();
  f.input().props.onChangeText("Keep my text");
  await flush();
  f.button("Respondiendo · Cancelar").props.onPress();
  await flush();
  assert.equal(f.input().props.value, "Keep my text");
  f.send().props.onPress();
  await flush();
  const post = f.requests.find((r) => r.method === "POST");
  assert.equal(post.body.parentId, undefined);
  assert.equal(post.body.body, "Keep my text");
  f.unmount();
});
test("closing an author preview invalidates its fetch and system Back closes the preview first", async () => {
  const f = fixture();
  await f.ready([comment("parent")]);
  f.all("Pressable")
    .find((n) => n.props.accessibilityLabel?.startsWith("Ver perfil"))
    .props.onPress();
  await flush();
  const request = f.requests.at(-1);
  f.tree.props.onRequestClose();
  await flush();
  assert.equal(f.closes, 0);
  request.resolve({ user: { id: "u1", displayName: "Late profile" } });
  await flush();
  assert.equal(
    f
      .all("Pressable")
      .some((n) => n.props.accessibilityLabel === "Cerrar perfil"),
    false,
  );
  f.unmount();
});
test("extra pages and expanded replies survive background refreshes; ACK retries deduplicate real rows", () => {
  const parent = comment("p");
  parent.replies = [comment("r2"), comment("r1")];
  parent.repliesCursor = "older";
  const fresh = {
    ...comment("p", "Updated"),
    replies: [comment("r2", "Latest")],
    repliesCursor: "new",
  };
  const merged = thread.mergeThreadPage(
    [parent, comment("older-root")],
    [fresh],
  );
  assert.equal(merged.length, 2);
  assert.deepEqual(
    merged[0].replies.map((r) => r.id),
    ["r2", "r1"],
  );
  assert.equal(merged[0].repliesCursor, "older");
  assert.equal(merged[0].body, "Updated");
  const duplicate = thread.confirmComment(
    [comment("server"), comment("temp-key")],
    "temp-key",
    "server",
  );
  assert.deepEqual(
    duplicate.map((c) => c.id),
    ["server"],
  );
});

const summary = {
  likesCount: 10,
  commentsCount: 0,
  sharesCount: 0,
  likedByMe: false,
};
test("rapid heart taps are serialized and coalesced to the final desired state", async () => {
  const gates = [],
    errors = [];
  const queue = createVerseLikeQueue(
    summary,
    (value) => {
      const gate = deferred();
      gates.push({ value, ...gate });
      return gate.promise;
    },
    { onError: (...args) => errors.push(args), onIdle: () => {} },
  );
  queue.request(true);
  queue.request(false);
  queue.request(true);
  assert.equal(gates.length, 1);
  gates[0].resolve();
  await flush();
  assert.equal(gates.length, 1);
  assert.equal(queue.pending(), false);
  assert.equal(errors.length, 0);
});
test("a failed un-heart rolls back to the last successful heart, not the original snapshot", async () => {
  const gates = [],
    errors = [];
  const queue = createVerseLikeQueue(
    summary,
    (value) => {
      const gate = deferred();
      gates.push({ value, ...gate });
      return gate.promise;
    },
    { onError: (...args) => errors.push(args), onIdle: () => {} },
  );
  queue.request(true);
  queue.request(false);
  gates[0].resolve();
  await flush();
  assert.equal(gates[1].value, false);
  gates[1].reject(new Error("offline"));
  await flush();
  assert.equal(errors[0][1].likedByMe, true);
  assert.equal(errors[0][1].likesCount, 11);
});
test("account change/disposal prevents stale heart responses from touching the new queue", async () => {
  const old = deferred(),
    next = deferred(),
    events = [];
  const queue = createVerseLikeQueue(summary, () => old.promise, {
    onError: () => events.push("error"),
    onIdle: () => events.push("idle"),
  });
  queue.request(true);
  queue.dispose();
  queue.activate();
  queue.acceptServer(summary);
  queue.request(false);
  await flush();
  old.reject(new Error("stale"));
  await flush();
  assert.deepEqual(events, ["idle"]);
  assert.equal(queue.pending(), false);
  const other = createVerseLikeQueue(summary, () => next.promise, {
    onError: () => events.push("new-error"),
    onIdle: () => events.push("new-idle"),
  });
  other.request(true);
  assert.equal(other.acceptServer(summary), false);
  next.resolve();
  await flush();
  assert.equal(other.pending(), false);
});

test("users who have not accepted UGC rules see the explicit acceptance gate and cannot post before accepting", async () => {
  const f = fixture(new Map(), { ugcTermsAccepted: false });
  await f.ready([comment("parent")]);
  assert.equal(f.input(), undefined);
  const acceptBtn = f.button(strings.es.ugcAcceptButton);
  assert.ok(acceptBtn, "inline accept button should render");
  assert.ok(f.button(strings.es.ugcViewRules), "community rules link should render");
  // Attempting to like a comment while unaccepted must prompt instead of calling POST
  const likeBtn = f
    .all("Pressable")
    .find((n) => n.props.accessibilityLabel === "Me gusta");
  if (likeBtn) {
    likeBtn.props.onPress();
    await flush();
    assert.equal(f.requests.filter((r) => r.method === "POST").length, 0);
    assert.equal(f.alerts.length, 1);
    assert.equal(f.alerts[0].title, strings.es.ugcAcceptTitle);
  }
  // Accepting unlocks the composer without posting any stray request
  acceptBtn.props.onPress();
  await flush();
  assert.equal(f.acceptCalls, 1);
  assert.equal(f.requests.filter((r) => r.method === "POST").length, 0);
  assert.ok(f.input(), "composer input should unlock after accepting UGC rules");
  f.unmount();
});
