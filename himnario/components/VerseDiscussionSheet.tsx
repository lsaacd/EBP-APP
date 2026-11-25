import SheetGrabber from "./SheetGrabber";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
  StyleSheet,
  UIManager,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
  Linking,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { shouldCollapsePlayer } from "../utils/gestureMotion";
import { buildSheetPanGesture } from "../utils/useSheetBackdropGesture";
import { seedMemberPreview } from "../utils/memberProfileCache";
import UserAvatar from "./UserAvatar";
import { useRouter } from "expo-router";
import { uuid } from "expo-modules-core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fonts } from "../theme/theme";
import {
  MINISTRIES,
  choirDisplayName,
  normalizeComment,
  wordCount,
} from "../data/communityRules";
import { useApprovedChoirs } from "../utils/choirsStore";
import { churchDisplayName } from "../utils/churchName";
import {
  useCommunityApi,
  communityError,
  type VerseComment,
  type CommentPage,
} from "../utils/communityApi";
import {
  isPendingComment,
  findComment,
  updateComment,
  removeComment,
  confirmComment,
  mergeThreadPage,
} from "../utils/verseDiscussionState";
import type { DailyVerse } from "../data/dailyVerses";
import GlassSurface, { GlassGroup } from "./GlassSurface";
import AppMenuIcon from "./AppMenuIcon";
import FriendButton from "./FriendButton";
import { memberSinceLabel, type FriendStatus } from "../utils/friends";
import * as Haptics from "../utils/haptics";

type Draft = {
  body: string;
  parentId?: string;
  editId?: string;
  requestId: string;
};
const blank = (): Draft => ({ body: "", requestId: uuid.v4() });
const sheetSpring = {
  damping: 28,
  stiffness: 240,
  mass: 1,
  overshootClamping: true,
};
const AnimatedKeyboardView =
  Animated.createAnimatedComponent(KeyboardAvoidingView);
export default function VerseDiscussionSheet({
  visible,
  onClose,
  verse,
  onChanged,
  titleOverride,
  subtitleOverride,
  onVisitMember,
}: {
  visible: boolean;
  onClose: () => void;
  verse: DailyVerse;
  onChanged: () => void;
  titleOverride?: { en: string; es: string };
  subtitleOverride?: string;
  onVisitMember?: () => void;
}) {
  const { theme, isDarkMode } = useTheme(),
    { language, t } = useLanguage(),
    es = language === "es";
  const { user, token, openAuthSheet, requestEmailVerification, refreshUser, acceptUgcTerms } =
    useAuth();
  const api = useCommunityApi(),
    insets = useSafeAreaInsets();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const { height: windowHeight } = useWindowDimensions();
  const [comments, writeComments] = useState<VerseComment[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"top" | "newest">("top");
  const [loading, setLoading] = useState(false),
    [posting, setPosting] = useState(false),
    [acting, setActing] = useState(false),
    [error, setError] = useState("");
  const [draft, writeDraft] = useState<Draft>(blank),
    [readyScope, setReadyScope] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const scope = `@himnario_verse_draft_v1:${user?.id || "guest"}:${verse.id}`;
  const ready = readyScope === scope;
  const generation = useRef(0),
    actionGeneration = useRef(0),
    draftRef = useRef(draft),
    saveQueue = useRef(Promise.resolve());
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const postingRef = useRef<object | null>(null);
  const actingRef = useRef<object | null>(null);
  const likingCommentsRef = useRef<Set<string>>(new Set());
  const commentsRef = useRef(comments);
  const threadVersion = useRef(0);
  const hasLoadedPage = useRef(false);
  const setComments = useCallback(
    (
      change: VerseComment[] | ((previous: VerseComment[]) => VerseComment[]),
    ) => {
      const next =
        typeof change === "function" ? change(commentsRef.current) : change;
      commentsRef.current = next;
      ++threadVersion.current;
      writeComments(next);
    },
    [],
  );
  const setDraft = useCallback(
    (change: Draft | ((previous: Draft) => Draft)) => {
      const next =
        typeof change === "function" ? change(draftRef.current) : change;
      draftRef.current = next;
      writeDraft(next);
    },
    [],
  );
  const invalidate = useCallback(() => {
    ++generation.current;
  }, []);
  const invalidateActions = useCallback(() => {
    ++actionGeneration.current;
  }, []);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const [selectedAuthor, setSelectedAuthor] = useState<{
    id: string;
    name: string;
    initials: string;
    ministry: string | null;
    choir: string | null;
    badgeVerified: boolean;
    churchName: string | null;
    location: string | null;
    memberSince: string | null;
    friendCount: number | null;
    friendStatus: FriendStatus | null;
    loading: boolean;
  } | null>(null);
  // True only when the comment list itself could not be loaded. A failed send
  // sets `error` too, and must not make the list claim to be offline.
  const [loadFailed, setLoadFailed] = useState(false);
  const authorFetchSeq = useRef(0);
  const router = useRouter();
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const authAfterDismiss = useRef(false);
  const memberAfterDismiss = useRef<string | null>(null);
  const requestSignIn = () => {
    authAfterDismiss.current = Platform.OS === "ios";
    onClose();
    if (Platform.OS !== "ios") openAuthSheet();
  };
  const color = theme.onSurface;
  const label = (en: string, sp: string) => (es ? sp : en);
  const travel = Math.max(windowHeight, 600) + 40;

  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - progress.value)),
  }));
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  const openCommunityGuidelines = useCallback(() => {
    Haptics.selectionAsync();
    void Linking.openURL("https://himnarioebp.com/terms.html#community").catch(
      () => {},
    );
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedAuthor(null);
      progress.value = 1;
      progress.value = withSpring(0, sheetSpring);
    } else {
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
  }, [visible, progress]);

  const openAuthorProfile = useCallback(
    (c: VerseComment) => {
      if (!c.userId) return;
      Keyboard.dismiss();
      Haptics.selectionAsync();
      const uid = c.userId;
      onVisitMember?.();
      const isSelf = user?.id === uid;
      seedMemberPreview({
        id: uid,
        name: c.authorName,
        initials: c.authorInitials,
        avatarUrl: c.authorAvatarUrl ?? null,
        ministry: c.ministry,
        choir: c.choir,
        badgeVerified: c.badgeVerified,
        churchId: isSelf && user?.showChurchLocation ? user.churchId : null,
        churchName: isSelf && user?.showChurchLocation ? user.churchName : null,
        location: isSelf && user?.showChurchLocation ? user.location : null,
      });
      if (Platform.OS === "ios") {
        memberAfterDismiss.current = uid;
        onClose();
      } else {
        onClose();
        router.push(`/member/${encodeURIComponent(uid)}` as any);
      }
    },
    [onClose, onVisitMember, router, user],
  );

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const closeAnimated = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withTiming(
      1,
      { duration: 240, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishClose)();
      },
    );
  }, [finishClose, progress]);

  const handlePan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.42,
  });

  const backdropPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.42,
  });

  const bodyPan = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetY(-10)
    .failOffsetX([-22, 22])
    .maxPointers(1)
    .onStart(() => {
      if (scrollOffset.value <= 4) {
        cancelAnimation(progress);
        dragOrigin.value = progress.value;
      }
    })
    .onUpdate((event) => {
      if (scrollOffset.value <= 4 && event.translationY > 0) {
        progress.value = Math.max(
          0,
          Math.min(1, dragOrigin.value + event.translationY / travel),
        );
      }
    })
    .onEnd((event, success) => {
      if (progress.value <= 0) return;
      const collapse =
        success &&
        shouldCollapsePlayer(
          progress.value * travel,
          event.velocityY,
          travel * 0.42,
        );
      if (collapse) {
        const remaining = Math.max(0.05, 1 - progress.value);
        const duration = Math.max(
          110,
          Math.min(240, Math.round(remaining * 240)),
        );
        progress.value = withTiming(
          1,
          { duration, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(finishClose)();
          },
        );
      } else {
        progress.value = withSpring(0, {
          ...sheetSpring,
          velocity: event.velocityY / travel,
        });
      }
    });
  const bodyScrollGesture =
    typeof Gesture.Simultaneous === "function" &&
    typeof Gesture.Native === "function"
      ? Gesture.Simultaneous(bodyPan, Gesture.Native())
      : bodyPan;
  useEffect(() => {
    let cancelled = false;
    setReadyScope(null);
    setDraft(blank());
    setPosting(false);
    setActing(false);
    postingRef.current = null;
    actingRef.current = null;
    likingCommentsRef.current.clear();
    setError("");
    invalidateActions();
    void saveQueue.current
      .then(() => AsyncStorage.getItem(scope))
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const d = JSON.parse(raw);
            if (typeof d.body === "string" && typeof d.requestId === "string")
              setDraft(d);
          } catch {
            /* Ignore damaged local drafts. */
          }
        }
        setReadyScope(scope);
      })
      .catch(() => {
        if (!cancelled) setReadyScope(scope);
      });
    return () => {
      cancelled = true;
      invalidateActions();
      postingRef.current = null;
      actingRef.current = null;
    };
  }, [scope, invalidateActions, setDraft]);
  useEffect(() => {
    if (!ready || postingRef.current) return;
    const value = JSON.stringify(draft);
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(scope, value))
      .catch(() => {});
  }, [scope, draft, ready, posting]);
  const load = useCallback(
    async (more = false, merge = false, sortOverride?: "top" | "newest") => {
      const id = ++generation.current;
      const version = threadVersion.current;
      const activeSort = sortOverride || sortMode;
      setLoading(true);
      if (!merge) setError("");
      try {
        const parts = [`sort=${encodeURIComponent(activeSort)}`];
        if (more && cursorRef.current) {
          parts.push(`cursor=${encodeURIComponent(cursorRef.current)}`);
        }
        const page = await api<CommentPage>(
          `/verses/${verse.id}/comments?${parts.join("&")}`,
        );
        if (
          id !== generation.current ||
          version !== threadVersion.current ||
          postingRef.current
        )
          return;
        setLoadFailed(false);
        setComments((prev) =>
          merge
            ? mergeThreadPage(prev, page.comments)
            : more
              ? [
                  ...prev,
                  ...page.comments.filter(
                    (c) => !prev.some((p) => p.id === c.id),
                  ),
                ]
              : page.comments,
        );
        if (!merge || !hasLoadedPage.current) setCursor(page.nextCursor);
        hasLoadedPage.current = true;
      } catch (e) {
        if (id === generation.current && !merge) {
          setError(communityError(e, es));
          setLoadFailed(true);
        }
      } finally {
        if (id === generation.current) setLoading(false);
      }
    },
    [api, verse.id, es, setComments, sortMode],
  );
  useEffect(() => {
    if (visible) {
      setComments([]);
      setLoadFailed(false);
      hasLoadedPage.current = false;
      setCursor(null);
      setBlocked(new Set());
      void load();
    }
    return invalidate;
  }, [visible, verse.id, token, load, invalidate, setComments]);
  useEffect(() => {
    ++authorFetchSeq.current;
    setSelectedAuthor(null);
  }, [visible, verse.id, token]);
  const participate = () => {
    if (!user) {
      requestSignIn();
      return false;
    }
    if (user.suspended) {
      setError(
        label(
          "Your account is suspended. Contact the administrator.",
          "Tu cuenta está suspendida. Contacta al administrador.",
        ),
      );
      return false;
    }
    if (!user.emailVerified) {
      setError(
        label(
          "Verify your email to participate.",
          "Verifica tu correo para participar.",
        ),
      );
      return false;
    }
    if (!user.ugcTermsAccepted) {
      Alert.alert(t.ugcAcceptTitle, t.ugcAcceptBody, [
        { text: t.ugcViewRules, onPress: openCommunityGuidelines },
        { text: t.cancel, style: "cancel" },
        {
          text: t.ugcAcceptButton,
          onPress: () => {
            void act(() => acceptUgcTerms(), false);
          },
        },
      ]);
      return false;
    }
    return true;
  };
  const act = async (task: () => Promise<unknown>, reload = true) => {
    if (actingRef.current) return;
    const operation = {};
    actingRef.current = operation;
    const id = actionGeneration.current;
    setActing(true);
    setError("");
    try {
      await task();
      if (id === actionGeneration.current) {
        if (reload) void load(false, true);
        onChanged();
      }
    } catch (e) {
      if (id === actionGeneration.current) setError(communityError(e, es));
    } finally {
      if (actingRef.current === operation) {
        actingRef.current = null;
        setActing(false);
      }
    }
  };
  const send = () => {
    if (
      scopeRef.current !== scope ||
      !ready ||
      postingRef.current ||
      !participate() ||
      !user
    )
      return;
    const submitted = { ...draftRef.current };
    if (submitted.parentId?.startsWith("temp-")) {
      setError(
        label(
          "Choose a sent comment to reply to, or cancel the reply.",
          "Elige un comentario enviado para responder, o cancela la respuesta.",
        ),
      );
      return;
    }
    let body: string;
    try {
      body = normalizeComment(submitted.body);
    } catch (e) {
      setError(communityError(e, es));
      return;
    }
    const operation = {};
    const epoch = actionGeneration.current;
    const operationScope = scope;
    const current = () =>
      epoch === actionGeneration.current && scopeRef.current === operationScope;
    postingRef.current = operation;
    setPosting(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const original = submitted.editId
      ? findComment(commentsRef.current, submitted.editId)
      : undefined;
    const now = Date.now();
    const temporaryId = `temp-${submitted.requestId}`;
    setDraft(blank());
    if (submitted.editId) {
      setComments((previous) =>
        updateComment(previous, submitted.editId!, (row) => ({
          ...row,
          body,
          editedAt: now,
        })),
      );
    } else {
      const optimistic: VerseComment = {
        id: temporaryId,
        verseId: verse.id,
        parentId: submitted.parentId || null,
        userId: user.id,
        authorName: user.displayName || user.email.split("@")[0],
        authorInitials: user.initials || "—",
        authorAvatarUrl: user.avatarUrl ?? null,
        ministry: user.ministry || null,
        choir: user.choir || null,
        badgeVerified: Boolean(user.badgeVerified),
        body,
        createdAt: now,
        editedAt: null,
        likesCount: 0,
        likedByMe: false,
        replies: [],
        repliesCursor: null,
      };
      setComments((previous) =>
        submitted.parentId
          ? updateComment(previous, submitted.parentId, (row) => ({
              ...row,
              replies: [optimistic, ...(row.replies || [])],
            }))
          : [optimistic, ...previous],
      );
    }
    const persisted = saveQueue.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.setItem(operationScope, JSON.stringify(submitted)),
      );
    saveQueue.current = persisted.catch(() => {});
    void (async () => {
      try {
        // Retain the exact request ID through navigation, process loss, or an ambiguous timeout.
        try {
          await persisted;
        } catch {
          throw new Error("draft_storage_unavailable");
        }
        if (!current()) return;
        if (submitted.editId)
          await api(`/verse-comments/${submitted.editId}`, "PUT", { body });
        else {
          const result = await api<{ id: string }>(
            `/verses/${verse.id}/comments`,
            "POST",
            {
              body,
              parentId: submitted.parentId,
              clientRequestId: submitted.requestId,
            },
          );
          if (!current()) return;
          setComments((previous) =>
            confirmComment(previous, temporaryId, result.id),
          );
        }
        if (current()) onChanged();
      } catch (e) {
        if (current()) {
          if (submitted.editId && original)
            setComments((previous) =>
              updateComment(previous, submitted.editId!, (row) =>
                row.body === body && row.editedAt === now ? original : row,
              ),
            );
          else setComments((previous) => removeComment(previous, temporaryId));
          const lostParent =
            e instanceof Error &&
            e.message === "invalid_parent" &&
            Boolean(submitted.parentId) &&
            !submitted.editId;
          const staleRequestId =
            e instanceof Error &&
            (e.message === "idempotency_conflict" ||
              e.message === "invalid_request_id") &&
            !submitted.editId;
          const missingEdit =
            e instanceof Error &&
            e.message === "not_found" &&
            Boolean(submitted.editId);
          if (lostParent) {
            // The comment being answered is gone (deleted, hidden, or a reply
            // target restored from an old saved draft). Keep the words, drop
            // the reply, and let the next Send post it as a new comment.
            setDraft({ ...blank(), body: submitted.body });
            setError(
              label(
                "The comment you were replying to no longer exists. Tap Send to post this as a new comment.",
                "El comentario al que respondías ya no existe. Toca Enviar para publicarlo como comentario nuevo.",
              ),
            );
          } else if (missingEdit) {
            setDraft({ ...blank(), body: submitted.body });
            setError(t.commentEditMissing);
          } else if (staleRequestId) {
            setDraft({ ...submitted, requestId: uuid.v4() });
            setError(t.commentRetrySend);
          } else {
            // All draft controls are locked for this write, preserving the exact retry ID.
            setDraft(submitted);
            setError(communityError(e, es));
          }
        }
      } finally {
        if (postingRef.current === operation) {
          postingRef.current = null;
          setPosting(false);
          // A read refresh never keeps the composer locked after the write finishes.
          if (current()) void load(false, true);
        }
      }
    })();
  };
  const toggleCommentLike = (c: VerseComment) => {
    if (
      scopeRef.current !== scope ||
      isPendingComment(c) ||
      likingCommentsRef.current.has(c.id) ||
      !participate()
    )
      return;
    const wasLiked = Boolean(c.likedByMe);
    const nextLiked = !wasLiked;
    const prevCount = Number(c.likesCount || 0);
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    const epoch = actionGeneration.current;
    const operationScope = scope;
    likingCommentsRef.current.add(c.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");
    setComments((previous) =>
      updateComment(previous, c.id, (row) => ({
        ...row,
        likedByMe: nextLiked,
        likesCount: nextCount,
      })),
    );
    void (async () => {
      try {
        const res = await api<{
          ok?: boolean;
          liked?: boolean;
          likesCount?: number;
        }>(`/verse-comments/${c.id}/like`, "POST", { liked: nextLiked });
        if (
          epoch !== actionGeneration.current ||
          scopeRef.current !== operationScope
        )
          return;
        if (typeof res?.likesCount === "number") {
          setComments((previous) =>
            updateComment(previous, c.id, (row) => ({
              ...row,
              likedByMe: typeof res.liked === "boolean" ? res.liked : nextLiked,
              likesCount: res.likesCount,
            })),
          );
        }
      } catch (e) {
        if (
          epoch === actionGeneration.current &&
          scopeRef.current === operationScope
        ) {
          setComments((previous) =>
            updateComment(previous, c.id, (row) => ({
              ...row,
              likedByMe: wasLiked,
              likesCount: prevCount,
            })),
          );
          setError(communityError(e, es));
        }
      } finally {
        likingCommentsRef.current.delete(c.id);
      }
    })();
  };
  const start = (c: VerseComment, edit = false) => {
    if (!ready || postingRef.current || isPendingComment(c)) return;
    setError("");
    setDraft({
      ...blank(),
      body: edit ? c.body : "",
      ...(edit ? { editId: c.id } : { parentId: c.parentId || c.id }),
    });
    input.current?.focus();
  };
  const menuActions = (c: VerseComment): MenuAction[] => {
    const icon = (ios: string, android: string) =>
      Platform.OS === "ios" ? ios : android;
    const actions: MenuAction[] = [];
    if (c.userId === user?.id)
      actions.push(
        {
          id: "edit",
          title: label("Edit", "Editar"),
          image: icon("pencil", "ic_menu_edit"),
          imageColor: color,
        },
        {
          id: "delete",
          title: label("Delete", "Eliminar"),
          image: icon("trash", "ic_menu_delete"),
          imageColor: "#d32f2f",
          attributes: { destructive: true },
        },
      );
    else if (c.userId)
      actions.push(
        {
          title: label(
            "Report comment or author",
            "Reportar comentario o autor",
          ),
          image: icon("flag", "ic_menu_report_image"),
          imageColor: color,
          subactions: ["abuse", "spam", "unsafe", "other"].map((r, i) => ({
            id: "report:" + r,
            title: (es
              ? ["Abuso", "Spam", "Contenido peligroso", "Otro"]
              : ["Abuse", "Spam", "Unsafe content", "Other"])[i],
          })),
        },
        {
          id: "block",
          title: label("Block user", "Bloquear usuario"),
          image: icon("person.slash", "ic_menu_close_clear_cancel"),
          imageColor: "#d32f2f",
          attributes: { destructive: true },
        },
      );
    if (user?.role === "admin") {
      actions.push({
        id: "hide",
        title: label("Hide comment", "Ocultar comentario"),
        image: icon("eye.slash", "ic_menu_delete"),
        imageColor: color,
      });
      if (c.userId && c.userId !== user.id)
        actions.push({
          id: "suspend",
          title: label("Suspend user", "Suspender usuario"),
          image: icon("person.crop.circle.badge.xmark", "ic_menu_delete"),
          imageColor: "#d32f2f",
          attributes: { destructive: true },
        });
    }
    return actions.length
      ? actions
      : [
          {
            id: "none",
            title: label("No actions available", "Sin acciones disponibles"),
            attributes: { disabled: true },
          },
        ];
  };
  const menu = (c: VerseComment, event: string) => {
    if (scopeRef.current !== scope || isPendingComment(c) || postingRef.current)
      return;
    if (event === "edit") {
      start(c, true);
      return;
    }
    if (event === "delete")
      Alert.alert(
        label("Delete comment?", "¿Eliminar comentario?"),
        label(
          "Replies will also be hidden.",
          "También se ocultarán las respuestas.",
        ),
        [
          { text: label("Cancel", "Cancelar"), style: "cancel" },
          {
            text: label("Delete", "Eliminar"),
            style: "destructive",
            onPress: () =>
              void act(async () => {
                await api(`/verse-comments/${c.id}`, "DELETE");
                setComments((previous) => removeComment(previous, c.id));
              }),
          },
        ],
      );
    if (event.startsWith("report:") && participate())
      void act(async () => {
        await api(`/verse-comments/${c.id}/report`, "POST", {
          reason: event.slice(7),
        });
        Alert.alert(label("Report received", "Reporte recibido"));
      });
    if (event === "block" && participate()) {
      if (actingRef.current) return;
      const id = c.userId!;
      setBlocked((prev) => new Set([...prev, id]));
      void act(async () => {
        try {
          await api(`/users/${id}/block`, "POST", {});
        } catch (e) {
          setBlocked((prev) => new Set([...prev].filter((x) => x !== id)));
          throw e;
        }
      });
    }
    if (event === "hide")
      void act(async () => {
        await api(`/mod/comments/${c.id}/hide`, "POST", {});
        setComments((previous) => removeComment(previous, c.id));
      });
    if (event === "suspend")
      Alert.alert(label("Suspend user?", "¿Suspender usuario?"), undefined, [
        { text: label("Cancel", "Cancelar"), style: "cancel" },
        {
          text: label("Suspend", "Suspender"),
          style: "destructive",
          onPress: () =>
            void act(async () => {
              await api(`/mod/users/${c.userId}/suspend`, "POST", {});
              setComments((previous) =>
                previous
                  .filter((row) => row.userId !== c.userId)
                  .map((row) => ({
                    ...row,
                    replies: row.replies?.filter(
                      (reply) => reply.userId !== c.userId,
                    ),
                  })),
              );
            }),
        },
      ]);
  };
  const row = (c: VerseComment, reply = false): React.ReactNode =>
    blocked.has(c.userId || "") ? null : (
      <View
        key={c.id}
        style={[
          styles.row,
          {
            marginLeft: reply ? 28 : 0,
            borderColor: theme.outlineVariant + "55",
          },
        ]}
      >
        <View style={styles.rowHead}>
          <Pressable
            disabled={!c.userId}
            accessibilityRole={c.userId ? "button" : undefined}
            accessibilityLabel={
              c.userId
                ? label(
                    `View ${c.authorName}'s profile`,
                    `Ver perfil de ${c.authorName}`,
                  )
                : undefined
            }
            onPress={() => openAuthorProfile(c)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
                opacity: pressed && c.userId ? 0.72 : 1,
              },
            ]}
          >
            <UserAvatar
              uri={c.userId ? c.authorAvatarUrl : null}
              initials={c.authorInitials}
              size={34}
              fontSize={13}
              backgroundColor={theme.surfaceVariants.containerHighest}
              textColor={color}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Text style={[styles.name, { color, flexShrink: 1 }]}>
                  {c.userId
                    ? c.authorName
                    : label("Deleted account", "Cuenta eliminada")}
                </Text>
                {c.badgeVerified && c.ministry === "obispo" ? (
                  <AppMenuIcon
                    ios="checkmark.seal.fill"
                    android="verified"
                    color={theme.primary}
                    size={16}
                  />
                ) : null}
              </View>
              <Text style={[styles.meta, { color: theme.onSurfaceVariant }]}>
                {[
                  c.ministry ? MINISTRIES[c.ministry]?.[es ? 0 : 1] : null,
                  c.choir ? choirDisplayName(c.choir, es, choirsBySlug) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <Text style={[styles.meta, { color: theme.onSurfaceVariant }]}>
                {isPendingComment(c)
                  ? label("Sending…", "Enviando…")
                  : relativeDate(c.createdAt, es)}
                {c.editedAt ? label(" · edited", " · editado") : ""}
              </Text>
            </View>
          </Pressable>
          {Platform.OS !== "web" &&
          !isPendingComment(c) &&
          Boolean(UIManager.hasViewManagerConfig?.("MenuView")) ? (
            <MenuView
              actions={menuActions(c).map((action) => ({
                ...action,
                attributes: {
                  ...action.attributes,
                  disabled: Boolean(action.attributes?.disabled || posting || acting),
                },
              }))}
              onPressAction={({ nativeEvent }) => menu(c, nativeEvent.event)}
              shouldOpenOnLongPress={false}
              isAnchoredToRight
            >
              <View
                accessible
                accessibilityRole="button"
                accessibilityLabel={label(
                  "Comment actions",
                  "Acciones del comentario",
                )}
                style={styles.icon}
              >
                <AppMenuIcon
                  ios="ellipsis"
                  android="more-vert"
                  size={22}
                  color={color}
                />
              </View>
            </MenuView>
          ) : null}
        </View>
        <Text selectable style={[styles.body, { color }]}>
          {c.body}
        </Text>
        <View style={styles.commentActions}>
          <Pressable
            disabled={isPendingComment(c)}
            accessibilityRole="button"
            accessibilityLabel={c.likedByMe ? t.commentUnlike : t.commentLike}
            accessibilityState={{
              selected: Boolean(c.likedByMe),
              disabled: isPendingComment(c),
            }}
            onPress={() => toggleCommentLike(c)}
            style={({ pressed }) => [
              styles.commentLikeBtn,
              { opacity: isPendingComment(c) ? 0.4 : pressed ? 0.65 : 1 },
            ]}
          >
            <AppMenuIcon
              ios={c.likedByMe ? "heart.fill" : "heart"}
              android={c.likedByMe ? "favorite" : "favorite-border"}
              size={16}
              color={c.likedByMe ? "#FF2D55" : theme.onSurfaceVariant}
            />
            {(c.likesCount || 0) > 0 ? (
              <Text
                style={{
                  color: c.likedByMe ? "#FF2D55" : theme.onSurfaceVariant,
                  ...fonts.sansSemiBold,
                  fontSize: 13,
                }}
              >
                {c.likesCount}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            disabled={isPendingComment(c) || posting || !ready}
            accessibilityState={{
              disabled: isPendingComment(c) || posting || !ready,
            }}
            onPress={() => {
              if (participate()) start(c);
            }}
            style={[
              styles.reply,
              { opacity: isPendingComment(c) || posting || !ready ? 0.4 : 1 },
            ]}
          >
            <Text
              style={{ color: theme.primary, ...fonts.sansSemiBold }}
            >
              {label("Reply", "Responder")}
            </Text>
          </Pressable>
        </View>
        {c.replies?.map((r) => row(r, true))}
        {c.repliesCursor && (
          <Pressable
            style={styles.reply}
            disabled={acting}
            onPress={() =>
              void act(async () => {
                const page = await api<CommentPage>(
                  `/verses/${verse.id}/comments?parentId=${c.id}&cursor=${encodeURIComponent(c.repliesCursor!)}`,
                );
                setComments((prev) =>
                  prev.map((x) =>
                    x.id === c.id
                      ? {
                          ...x,
                          replies: [
                            ...(x.replies || []),
                            ...page.comments.filter(
                              (reply) =>
                                !x.replies?.some(
                                  (existing) => existing.id === reply.id,
                                ),
                            ),
                          ],
                          repliesCursor: page.nextCursor,
                        }
                      : x,
                  ),
                );
              }, false)
            }
          >
            <Text style={{ color: theme.primary }}>
              {label("More replies", "Más respuestas")}
            </Text>
          </Pressable>
        )}
      </View>
    );
  const words = wordCount(draft.body),
    over = words > 100 || draft.body.length > 1000;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (selectedAuthor) {
          ++authorFetchSeq.current;
          setSelectedAuthor(null);
        } else closeAnimated();
      }}
      onDismiss={() => {
        if (authAfterDismiss.current) {
          authAfterDismiss.current = false;
          openAuthSheet();
        } else if (memberAfterDismiss.current) {
          const targetUid = memberAfterDismiss.current;
          memberAfterDismiss.current = null;
          router.push(`/member/${encodeURIComponent(targetUid)}` as any);
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
        <GestureDetector gesture={backdropPan}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.44)" },
              backdropAnimStyle,
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityLabel={label("Close comments", "Cerrar comentarios")}
              onPress={closeAnimated}
            />
          </Animated.View>
        </GestureDetector>
        <Animated.View style={sheetAnimStyle}>
          <SheetGrabber inline />
        </Animated.View>
        <AnimatedKeyboardView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              height: "92%",
            },
            sheetAnimStyle,
          ]}
        >
          <GestureDetector gesture={handlePan}>
            <View>
              <View style={styles.header}>
                <View style={styles.handle} />
                <View style={styles.rowHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color }]}>
                      {titleOverride
                        ? label(titleOverride.en, titleOverride.es)
                        : label("Comments", "Comentarios")}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.onSurfaceVariant,
                        ...fonts.sansRegular,
                        fontSize: 13,
                      }}
                    >
                      {subtitleOverride ?? `${verse[language].ref} RVR09`}
                    </Text>
                  </View>
                  <GlassGroup spacing={6} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <GlassSurface
                      isInteractive
                      glassEffectStyle="regular"
                      intensity={56}
                      style={styles.icon}
                    >
                      <Pressable
                        style={styles.icon}
                        accessibilityRole="button"
                        accessibilityLabel={label(
                          "Community Guidelines & Info",
                          "Normas de la Comunidad e información",
                        )}
                        onPress={openCommunityGuidelines}
                      >
                        <AppMenuIcon
                          ios="info.circle"
                          android="info-outline"
                          color={color}
                          size={19}
                          weight="medium"
                        />
                      </Pressable>
                    </GlassSurface>
                    <GlassSurface
                      isInteractive
                      glassEffectStyle="regular"
                      intensity={56}
                      style={styles.icon}
                    >
                      <Pressable
                        style={styles.icon}
                        accessibilityLabel={label("Close", "Cerrar")}
                        onPress={closeAnimated}
                      >
                        <AppMenuIcon
                          ios="xmark"
                          android="close"
                          color={color}
                          size={17}
                          weight="semibold"
                        />
                      </Pressable>
                    </GlassSurface>
                  </GlassGroup>
                </View>

                {/* YouTube Music Style Sort Pills: Top / Newest */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 2 }}>
                  {(["top", "newest"] as const).map((m) => {
                    const active = sortMode === m;
                    const pillText =
                      m === "top"
                        ? label("Top", "Destacados")
                        : label("Newest", "Más recientes");
                    return (
                      <Pressable
                        key={m}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          if (sortMode === m) return;
                          Haptics.selectionAsync();
                          setSortMode(m);
                          setCursor(null);
                          hasLoadedPage.current = false;
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: active
                            ? isDarkMode
                              ? "#F3EEE8"
                              : theme.primary
                            : isDarkMode
                              ? "rgba(255,255,255,0.09)"
                              : theme.surfaceVariants.containerHigh,
                        }}
                      >
                        <Text
                          style={{
                            color: active
                              ? isDarkMode
                                ? "#141416"
                                : theme.onPrimary
                              : color,
                            ...(active ? fonts.sansSemiBold : fonts.sansMedium),
                            fontSize: 13.5,
                          }}
                        >
                          {pillText}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* YouTube Music Style Respectful Church Community Guidelines Banner */}
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.06)"
                    : theme.surfaceVariants.containerHigh,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.outlineVariant + "44",
                }}
              >
                <Text
                  style={{
                    color: theme.onSurfaceVariant,
                    ...fonts.sansRegular,
                    fontSize: 12.5,
                    lineHeight: 18,
                  }}
                >
                  {t.discussionRememberToKeepCommentsRespectfulAnd}
                  <Text
                    onPress={openCommunityGuidelines}
                    style={{
                      color: isDarkMode ? "#7AB8FF" : theme.primary,
                      ...fonts.sansSemiBold,
                    }}
                  >
                    {t.discussionLearnMore}
                  </Text>
                </Text>
                {user && user.emailVerified && !user.ugcTermsAccepted && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={acting}
                    onPress={() => void act(() => acceptUgcTerms(), false)}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      alignSelf: "flex-start",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: theme.primary,
                      opacity: acting ? 0.6 : pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: theme.onPrimary,
                        ...fonts.sansSemiBold,
                        fontSize: 12.5,
                      }}
                    >
                      {t.ugcAcceptButton}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </GestureDetector>

          <GestureDetector gesture={bodyScrollGesture}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 18,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              scrollEventThrottle={16}
              onScroll={(e) => {
                scrollOffset.value = e.nativeEvent.contentOffset.y;
              }}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={() => void load()}
                />
              }
            >
              {comments.map((c) => row(c))}
              {!loading && !comments.length && (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 48,
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color,
                      ...fonts.sansSemiBold,
                      fontSize: 16.5,
                      textAlign: "center",
                    }}
                  >
                    {loadFailed
                      ? label(
                          "Comments are available online",
                          "Comentarios disponibles con conexión",
                        )
                      : label("No comments yet", "No hay comentarios aún")}
                  </Text>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      ...fonts.sansRegular,
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    {loadFailed
                      ? label(
                          "Check your connection and pull down to retry.",
                          "Revisa tu conexión y desliza para reintentar.",
                        )
                      : label(
                          "Say something uplifting to start the conversation",
                          "Comparte algo edificante para iniciar la conversación",
                        )}
                  </Text>
                </View>
              )}
              {cursor && (
                <Pressable
                  disabled={loading}
                  style={styles.reply}
                  onPress={() => void load(true)}
                >
                  <Text style={{ color: theme.primary }}>
                    {label("Load more", "Cargar más")}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </GestureDetector>
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{
                color: theme.primary,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
            >
              {error}
            </Text>
          )}
          <View
            style={[
              styles.composer,
              {
                backgroundColor: theme.surfaceVariants.containerLow,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.outlineVariant + "60",
              },
            ]}
          >
            {!user ? (
              <Pressable style={styles.reply} onPress={requestSignIn}>
                <Text style={{ color: theme.primary }}>
                  {label(
                    "Sign in to participate",
                    "Inicia sesión para participar",
                  )}
                </Text>
              </Pressable>
            ) : user.suspended ? (
              <Text style={{ color }}>
                {label(
                  "Your account is suspended. Contact the administrator.",
                  "Tu cuenta está suspendida. Contacta al administrador.",
                )}
              </Text>
            ) : !user.emailVerified ? (
              <View>
                <Text style={{ color }}>
                  {label(
                    "Verify email to participate",
                    "Verifica tu correo para participar",
                  )}
                </Text>
                <View style={styles.rowHead}>
                  <Pressable
                    style={styles.reply}
                    disabled={acting}
                    onPress={() => void act(requestEmailVerification)}
                  >
                    <Text style={{ color: theme.primary }}>
                      {label("Resend email", "Reenviar correo")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.reply}
                    disabled={acting}
                    onPress={() => void act(refreshUser)}
                  >
                    <Text style={{ color: theme.primary }}>
                      {label("I verified my email", "Ya verifiqué mi correo")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : !user.ugcTermsAccepted ? (
              <View style={{ paddingBottom: Math.max(insets.bottom, 8), gap: 8 }}>
                <Text style={{ color, ...fonts.sansSemiBold, fontSize: 14 }}>
                  {t.ugcAcceptTitle}
                </Text>
                <Text
                  style={{
                    color: theme.onSurfaceVariant,
                    ...fonts.sansRegular,
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  {t.ugcAcceptBody}
                </Text>
                <View style={[styles.rowHead, { gap: 12, marginTop: 2 }]}>
                  <Pressable
                    style={[
                      styles.reply,
                      {
                        backgroundColor: theme.primary,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 999,
                      },
                    ]}
                    disabled={acting}
                    onPress={() => void act(() => acceptUgcTerms(), false)}
                  >
                    <Text
                      style={{
                        color: theme.onPrimary,
                        ...fonts.sansSemiBold,
                        fontSize: 13.5,
                      }}
                    >
                      {t.ugcAcceptButton}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.reply}
                    disabled={acting}
                    onPress={openCommunityGuidelines}
                  >
                    <Text
                      style={{
                        color: theme.primary,
                        ...fonts.sansMedium,
                        fontSize: 13.5,
                      }}
                    >
                      {t.ugcViewRules}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View
                style={{ paddingBottom: Math.max(insets.bottom, 8), gap: 8 }}
              >
                {(draft.parentId || draft.editId) && (
                  <Pressable
                    disabled={posting || !ready}
                    onPress={() => {
                      if (!postingRef.current)
                        setDraft((previous) =>
                          previous.editId
                            ? blank()
                            : { ...blank(), body: previous.body },
                        );
                    }}
                  >
                    <Text
                      style={{
                        color: theme.primary,
                        ...fonts.sansSemiBold,
                        fontSize: 13,
                      }}
                    >
                      {draft.editId
                        ? label("Editing · Cancel", "Editando · Cancelar")
                        : label("Replying · Cancel", "Respondiendo · Cancelar")}
                    </Text>
                  </Pressable>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 4,
                  }}
                >
                  {["🙏", "❤️", "🔥", "🙌", "👏", "👍"].map((emoji) => (
                    <Pressable
                      key={emoji}
                      accessibilityRole="button"
                      accessibilityLabel={`${label("Insert emoji", "Insertar emoji")} ${emoji}`}
                      disabled={posting || !ready}
                      accessibilityState={{ disabled: posting || !ready }}
                      onPress={() => {
                        if (!ready || postingRef.current) return;
                        setError("");
                        Haptics.selectionAsync();
                        setDraft((d) => ({
                          ...d,
                          body: d.body ? `${d.body} ${emoji}` : emoji,
                          requestId: uuid.v4(),
                        }));
                        input.current?.focus();
                      }}
                      style={({ pressed }) => ({
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 18,
                        backgroundColor: theme.surfaceVariants.containerHigh,
                        opacity: posting || !ready ? 0.4 : pressed ? 0.72 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 17 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: theme.outlineVariant,
                    borderRadius: 24,
                    paddingLeft: 14,
                    paddingRight: 6,
                    paddingVertical: 6,
                    backgroundColor: theme.surfaceVariants.container,
                  }}
                >
                  <TextInput
                    ref={input}
                    value={draft.body}
                    editable={ready && !posting}
                    onChangeText={(body) => {
                      if (!ready || postingRef.current) return;
                      if (error) setError("");
                      setDraft((d) => ({ ...d, body, requestId: uuid.v4() }));
                    }}
                    multiline
                    placeholder={label("Comment…", "Escribe un comentario…")}
                    placeholderTextColor={theme.onSurfaceVariant}
                    style={{
                      flex: 1,
                      color,
                      maxHeight: 96,
                      paddingVertical: 6,
                      ...fonts.sansRegular,
                      fontSize: 15,
                    }}
                    accessibilityLabel={label("Comment", "Comentario")}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: posting || !ready || over || !draft.body.trim(),
                    }}
                    disabled={posting || !ready || over || !draft.body.trim()}
                    onPress={send}
                    style={[
                      styles.send,
                      {
                        backgroundColor: theme.primary,
                        borderRadius: 18,
                        minHeight: 44,
                        minWidth: 64,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        opacity:
                          posting || !ready || over || !draft.body.trim()
                            ? 0.45
                            : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.onPrimary,
                        ...fonts.sansSemiBold,
                        fontSize: 13,
                      }}
                    >
                      {posting
                        ? label("Sending…", "Enviando…")
                        : label("Post", "Enviar")}
                    </Text>
                  </Pressable>
                </View>
                {(over || words > 0) && (
                  <Text
                    style={{
                      color: over ? theme.primary : theme.onSurfaceVariant,
                      fontSize: 11,
                      ...fonts.sansRegular,
                      textAlign: "right",
                    }}
                  >
                    {words}/100 {label("words", "palabras")} ·{" "}
                    {draft.body.length}/1.000
                  </Text>
                )}
              </View>
            )}
          </View>
        </AnimatedKeyboardView>

        {selectedAuthor && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(0,0,0,0.48)",
                justifyContent: "flex-end",
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel={label("Close profile", "Cerrar perfil")}
              onPress={() => {
                ++authorFetchSeq.current;
                setSelectedAuthor(null);
              }}
            />
            <View
              style={{
                backgroundColor: theme.surfaceVariants.containerLow,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: Math.max(insets.bottom, 22),
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.outlineVariant,
                  alignSelf: "center",
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: theme.onSurfaceVariant,
                    ...fonts.sansSemiBold,
                    fontSize: 12,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {label("Member Profile", "Perfil del miembro")}
                </Text>
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={56}
                  style={styles.icon}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={label("Close", "Cerrar")}
                    onPress={() => {
                      ++authorFetchSeq.current;
                      setSelectedAuthor(null);
                    }}
                    style={styles.icon}
                  >
                    <AppMenuIcon
                      ios="xmark"
                      android="close"
                      color={color}
                      size={17}
                      weight="semibold"
                    />
                  </Pressable>
                </GlassSurface>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.onPrimary,
                      ...fonts.sansBold,
                      fontSize: 20,
                    }}
                  >
                    {selectedAuthor.initials}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.onSurface,
                        ...fonts.bold,
                        fontSize: 20,
                        flexShrink: 1,
                      }}
                    >
                      {selectedAuthor.name}
                    </Text>
                    {selectedAuthor.badgeVerified &&
                    selectedAuthor.ministry === "obispo" ? (
                      <AppMenuIcon
                        ios="checkmark.seal.fill"
                        android="verified"
                        color={theme.primary}
                        size={18}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      ...fonts.sansMedium,
                      fontSize: 14,
                    }}
                  >
                    {[
                      selectedAuthor.ministry
                        ? MINISTRIES[selectedAuthor.ministry]?.[es ? 0 : 1]
                        : null,
                      selectedAuthor.choir
                        ? choirDisplayName(selectedAuthor.choir, es, choirsBySlug)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") ||
                      label("Community member", "Miembro de la comunidad")}
                  </Text>
                </View>
              </View>

              {!selectedAuthor.loading && selectedAuthor.friendCount !== null && (
                <Text style={{ ...fonts.sansSemiBold, fontSize: 13.5, color: theme.onSurfaceVariant, alignSelf: 'center' }}>
                  {selectedAuthor.friendCount} {t.friendsCountLabel}
                </Text>
              )}

              {selectedAuthor.loading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={{ paddingVertical: 8 }}
                />
              ) : selectedAuthor.churchName || selectedAuthor.location ? (
                <View
                  style={{
                    backgroundColor: theme.surfaceVariants.container,
                    borderRadius: 16,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.outlineVariant,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    gap: 10,
                  }}
                >
                  {selectedAuthor.churchName ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <AppMenuIcon
                        ios="building.columns"
                        android="account-balance"
                        color={theme.primary}
                        size={19}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            ...fonts.sansRegular,
                            fontSize: 11.5,
                          }}
                        >
                          {label("Local Church", "Iglesia local")}
                        </Text>
                        <Text
                          style={{
                            color: theme.onSurface,
                            ...fonts.sansMedium,
                            fontSize: 15,
                          }}
                        >
                          {churchDisplayName(selectedAuthor.churchName)}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedAuthor.location ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <AppMenuIcon
                        ios="location.fill"
                        android="place"
                        color={theme.primary}
                        size={19}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            ...fonts.sansRegular,
                            fontSize: 11.5,
                          }}
                        >
                          {label("Location", "Ubicación")}
                        </Text>
                        <Text
                          style={{
                            color: theme.onSurface,
                            ...fonts.sansMedium,
                            fontSize: 15,
                          }}
                        >
                          {selectedAuthor.location}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {!selectedAuthor.loading &&
              memberSinceLabel(selectedAuthor.memberSince, es) ? (
                <Text
                  style={{
                    color: theme.onSurfaceVariant,
                    ...fonts.sansRegular,
                    fontSize: 13.5,
                    textAlign: "center",
                  }}
                >
                  {memberSinceLabel(selectedAuthor.memberSince, es)}
                </Text>
              ) : null}

              {/* Add / accept / remove. Hidden for guests and for your own profile. */}
              {!selectedAuthor.loading ? (
                <FriendButton
                  userId={selectedAuthor.id}
                  name={selectedAuthor.name}
                  status={selectedAuthor.friendStatus}
                  onStatusChange={(next) =>
                    setSelectedAuthor((prev) =>
                      prev ? { ...prev, friendStatus: next } : prev,
                    )
                  }
                />
              ) : null}
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
function relativeDate(time: number, es: boolean) {
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return es ? "Ahora" : "Just now";
  if (minutes < 60) return es ? `Hace ${minutes} min` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return es ? `Hace ${hours} h` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return es ? `Hace ${days} días` : `${days} days ago`;
  return new Date(time).toLocaleDateString(es ? "es" : "en");
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
  },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 10,
  },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { ...fonts.bold, fontSize: 22 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quote: {
    ...fonts.regularItalic,
    fontSize: 21,
    lineHeight: 30,
    marginBottom: 18,
  },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginTop: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { ...fonts.sansSemiBold, fontSize: 15 },
  meta: { fontSize: 12, lineHeight: 17 },
  body: {
    ...fonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 44,
    minWidth: 36,
  },
  reply: { paddingVertical: 12, paddingHorizontal: 8, minHeight: 44 },
  composer: { padding: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    minHeight: 70,
    maxHeight: 140,
    textAlignVertical: "top",
  },
  send: { borderRadius: 22, paddingHorizontal: 20, paddingVertical: 12 },
});
