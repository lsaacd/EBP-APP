/**
 * ModerationScreen (iOS 26 Native SwiftUI Form) — Admin Command Center.
 *
 * Clean, Apple-native iOS 26 administration hub:
 * - Calm 4-metric live KPI summary strip (`Pending`, `Comments`, `Accounts`, `Churches`)
 * - Roomy 4-tab native segmented control: Inbox | Comments | Members | Insights
 * - Unified Inbox (Open Reports + Pending Churches + Pending Choirs + Recent Comments preview)
 * - Full Comments Inspector (`GET /mod/comments`) across all Daily Verses & Hymns:
 *   search by keyword/member, filter Active/Hidden/All, filter by specific member
 *   ("View Comments" from any member or comment), jump to Hymn or Profile, and Hide/Restore
 * - Member Inspector with comment counts + 1-tap View Comments / Verify / Clear Photo / Suspend
 * - Live Insights with community analytics, verified directory management, and Hymn Reactions
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { TextFieldRef } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { MINISTRIES, choirDisplayName } from '../../data/communityRules';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { churchDisplayName, servantDisplayName } from '../../utils/churchName';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { communityError, useCommunityApi } from '../../utils/communityApi';
import { describeCommentTarget, formatModRelativeTime } from '../../utils/modComments';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { showSuccessToast } from '../../utils/toast';
import UserAvatar from '../UserAvatar';
import type { ModerationScreenProps } from './ModerationScreen';

type ModTab = 'inbox' | 'comments' | 'members' | 'insights';
type MemberFilter = 'recent' | 'pending_obispo' | 'suspended' | 'all';
type CommentFilter = 'active' | 'hidden' | 'all';

type ModOverview = {
  totalUsers: number;
  verifiedUsers: number;
  suspendedUsers: number;
  newUsers7d: number;
  pendingObispo: number;
  oauthProviders: { apple: number; google: number };
  openReports: number;
  pendingChurches: number;
  approvedChurches: number;
  pendingChoirs: number;
  approvedChoirs: number;
  totalComments: number;
  activePushDevices: number;
};

type ModReport = {
  id: string;
  comment_id: string;
  verse_id?: string | null;
  user_id: string | null;
  name: string | null;
  body: string;
  reason: string;
  details: string | null;
  created_at: number;
};

type ModComment = {
  id: string;
  verseId: string;
  parentId: string | null;
  parentAuthorName: string | null;
  parentBody: string | null;
  userId: string | null;
  authorName: string;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
  authorMinistry: string | null;
  authorChurchName: string | null;
  authorSuspended: boolean;
  body: string;
  createdAt: number;
  editedAt: number | null;
  hiddenAt: number | null;
  likesCount: number;
  reportsCount: number;
};

type ModChurch = {
  id: string;
  name: string;
  pastorName: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  submittedByName: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

type ModChoir = {
  slug: string;
  nameEs: string;
  nameEn: string;
  churchContext: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedByName: string | null;
};

type ModMember = {
  id: string;
  name: string;
  email?: string;
  initials?: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  ministry: string | null;
  choir: string | null;
  churchName?: string | null;
  badge_verified: number;
  badgeVerified?: boolean;
  suspended_at: number | null;
  createdAt?: number | null;
  commentsCount?: number;
  providers?: string[];
};

type HymnReactionStat = {
  hymnId: string;
  likesCount: number;
  dislikesCount: number;
  updatedAt: number;
};

const ADMIN_EMAIL = 'isaacduran167@gmail.com';
const BUILTIN_CHOIRS = new Set(['esmirna', 'maranatha', 'filadelfia']);

export default function ModerationScreenIOS({
  onOpenMember,
  onOpenChurch,
  onOpenHymn,
}: ModerationScreenProps) {
  const swiftUI = getExpoSwiftUI();
  const { theme, isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const { bySlug: choirsBySlug, refresh: refreshApprovedChoirs } = useApprovedChoirs();
  const api = useCommunityApi();

  const es = language !== 'en';
  const langKey: 'es' | 'en' = es ? 'es' : 'en';
  const isAdmin =
    user?.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL;
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const [activeTab, setActiveTab] = useState<ModTab>('inbox');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<ModOverview | null>(null);
  const [reports, setReports] = useState<ModReport[]>([]);
  const [churches, setChurches] = useState<ModChurch[]>([]);
  const [choirs, setChoirs] = useState<ModChoir[]>([]);
  const [reactions, setReactions] = useState<HymnReactionStat[]>([]);

  const [members, setMembers] = useState<ModMember[]>([]);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('recent');
  const [memberQuery, setMemberQuery] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [comments, setComments] = useState<ModComment[]>([]);
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('active');
  const [commentQuery, setCommentQuery] = useState('');
  const [commentUserFilter, setCommentUserFilter] = useState<{ id: string; name: string } | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  const memberSearchRef = useRef<TextFieldRef>(null);
  const commentSearchRef = useRef<TextFieldRef>(null);

  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const hymnById = useMemo(() => {
    const map = new Map<string, { id: string; number: string; title: string }>();
    for (const raw of [...hymnsData, ...estribillosData]) {
      const hymn = getLocalizedHymn(raw as any, displayHymnLang) as any;
      map.set(String(raw.id), {
        id: String(raw.id),
        number: String(hymn.number),
        title: String(hymn.title),
      });
    }
    return map;
  }, [displayHymnLang]);

  const loadMembers = useCallback(
    async (q = memberQuery, filter = memberFilter) => {
      if (!isAdmin) return;
      setLoadingMembers(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        params.set('filter', filter);
        const res = await api<{ users: ModMember[] }>(`/mod/users?${params.toString()}`);
        setMembers(res.users || []);
      } catch (e) {
        setError(communityError(e, es));
      } finally {
        setLoadingMembers(false);
      }
    },
    [api, es, isAdmin, memberFilter, memberQuery],
  );

  const loadComments = useCallback(
    async (
      q = commentQuery,
      filter = commentFilter,
      userFilter = commentUserFilter,
    ) => {
      if (!isAdmin) return;
      setLoadingComments(true);
      try {
        const params = new URLSearchParams();
        params.set('filter', filter);
        if (q.trim()) params.set('q', q.trim());
        if (userFilter?.id) params.set('userId', userFilter.id);
        const res = await api<{ comments: ModComment[] }>(`/mod/comments?${params.toString()}`);
        setComments(res.comments || []);
      } catch (e) {
        setError(communityError(e, es));
      } finally {
        setLoadingComments(false);
      }
    },
    [api, commentFilter, commentQuery, commentUserFilter, es, isAdmin],
  );

  const loadAll = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const [ovRes, repRes, chRes, coRes, reactRes] = await Promise.allSettled([
        api<ModOverview>('/mod/overview'),
        api<{ reports: ModReport[] }>('/mod/reports'),
        api<{ churches: ModChurch[] }>('/mod/churches'),
        api<{ choirs: ModChoir[] }>('/mod/choirs'),
        api<{ hymns: HymnReactionStat[] }>('/mod/hymns/reactions'),
      ]);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
      if (chRes.status === 'fulfilled') setChurches(chRes.value.churches || []);
      if (coRes.status === 'fulfilled') setChoirs(coRes.value.choirs || []);
      if (reactRes.status === 'fulfilled') setReactions(reactRes.value.hymns || []);
    } catch (e) {
      setError(communityError(e, es));
    } finally {
      setLoading(false);
    }
  }, [api, es, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
    void loadMembers('', 'recent');
    void loadComments('', 'active', null);
    // Load initial snapshot once when admin opens moderation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      loadAll(),
      loadMembers(memberQuery, memberFilter),
      loadComments(commentQuery, commentFilter, commentUserFilter),
    ]);
  }, [
    commentFilter,
    commentQuery,
    commentUserFilter,
    loadAll,
    loadComments,
    loadMembers,
    memberFilter,
    memberQuery,
  ]);

  const runAction = useCallback(
    async (id: string, task: () => Promise<void>, toastText?: string) => {
      if (busyId) return;
      Haptics.selectionAsync().catch(() => {});
      setBusyId(id);
      setError(null);
      try {
        await task();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (toastText) showSuccessToast(toastText);
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setError(communityError(e, es));
      } finally {
        setBusyId(null);
      }
    },
    [busyId, es],
  );

  const handleMemberFilterChange = useCallback(
    (next: MemberFilter) => {
      Haptics.selectionAsync().catch(() => {});
      setMemberFilter(next);
      void loadMembers(memberQuery, next);
    },
    [loadMembers, memberQuery],
  );

  const handleCommentFilterChange = useCallback(
    (next: CommentFilter) => {
      Haptics.selectionAsync().catch(() => {});
      setCommentFilter(next);
      void loadComments(commentQuery, next, commentUserFilter);
    },
    [commentQuery, commentUserFilter, loadComments],
  );

  const handleInspectUserComments = useCallback(
    (targetId: string, targetName: string) => {
      Haptics.selectionAsync().catch(() => {});
      const nextFilter = { id: targetId, name: targetName };
      setCommentUserFilter(nextFilter);
      setCommentQuery('');
      setCommentFilter('all');
      setActiveTab('comments');
      void loadComments('', 'all', nextFilter);
    },
    [loadComments],
  );

  const handleClearCommentUserFilter = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setCommentUserFilter(null);
    setCommentFilter('active');
    void loadComments(commentQuery, 'active', null);
  }, [commentQuery, loadComments]);

  const confirmDestructive = (title: string, body: string, onConfirm: () => void) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(title, body, [
      { text: t.cancel, style: 'cancel' },
      { text: title, style: 'destructive', onPress: onConfirm },
    ]);
  };

  const topDisliked = useMemo(
    () =>
      [...reactions]
        .filter((r) => r.dislikesCount > 0)
        .sort((a, b) => b.dislikesCount - a.dislikesCount)
        .slice(0, 15),
    [reactions],
  );
  const topLiked = useMemo(
    () =>
      [...reactions]
        .filter((r) => r.likesCount > 0)
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, 15),
    [reactions],
  );

  if (!swiftUI || !isAdmin) return null;

  const {
    Button,
    Circle,
    ContentUnavailableView,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    LabeledContent,
    Menu,
    Picker,
    ProgressView,
    RNHostView,
    Section,
    Spacer,
    SwipeActions,
    Text,
    TextField,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    Animation,
    animation,
    buttonBorderShape,
    buttonStyle,
    contentShape,
    contentTransition,
    controlSize,
    disabled,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    listRowBackground,
    listRowInsets,
    listSectionMargins,
    listSectionSpacing,
    monospacedDigit,
    padding,
    pickerStyle,
    refreshable,
    scrollDismissesKeyboard,
    scrollEdgeEffectStyle,
    shapes,
    submitLabel,
    tag,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const subtleActiveTint = isDarkMode ? '#3A3A3C' : '#6e1619';
  const prominentFill = isDarkMode ? '#fdf9f2' : '#6e1619';
  const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
  const avatarBg = isDarkMode ? '#3A3A3C' : '#6e1619';
  const avatarText = '#FFFFFF';
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const bottomPad = hasMiniPlayer ? 92 : 28;
  const hasRNHost = typeof RNHostView === 'function';

  const pendingChurches = churches.filter((c) => c.status === 'pending');
  const approvedChurches = churches.filter((c) => c.status === 'approved');
  const pendingChoirs = choirs.filter((c) => c.status === 'pending');
  const approvedChoirs = choirs.filter((c) => c.status === 'approved');
  const totalPending = reports.length + pendingChurches.length + pendingChoirs.length;

  const renderKpiTile = (
    key: string,
    icon: SFSymbol,
    label: string,
    count: number,
    targetTab: ModTab,
    alertWhenPositive = false,
  ) => {
    const isAlert = alertWhenPositive && count > 0;
    const active = activeTab === targetTab;
    return (
      <Button
        key={key}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setActiveTab(targetTab);
        }}
        modifiers={[
          buttonStyle(active ? 'borderedProminent' : 'bordered'),
          buttonBorderShape('roundedRectangle'),
          tint(isAlert ? '#D64545' : active ? subtleActiveTint : symbolTint),
        ]}
      >
        <VStack alignment="center" spacing={3} modifiers={[frame({ maxWidth: 9999 }), padding({ vertical: 4 })]}>
          <SwiftUIImage
            systemName={icon}
            size={14}
            modifiers={[
              foregroundStyle({
                type: 'color',
                color: isAlert
                  ? active
                    ? '#FFFFFF'
                    : '#D64545'
                  : active
                    ? '#FFFFFF'
                    : symbolTint,
              }),
            ]}
          />
          <Text
            modifiers={[
              font({ size: 17, weight: 'bold' }),
              monospacedDigit(),
              contentTransition('numericText'),
              animation(Animation.default, count),
              foregroundStyle({
                type: 'color',
                color: isAlert
                  ? active
                    ? '#FFFFFF'
                    : '#D64545'
                  : active
                    ? '#FFFFFF'
                    : isDarkMode
                      ? '#FFFFFF'
                      : '#1A1614',
              }),
            ]}
          >
            {String(count)}
          </Text>
          <Text
            modifiers={[
              font({ size: 10.5, weight: 'medium' }),
              lineLimit(1),
              foregroundStyle(
                active ? { type: 'color', color: 'rgba(255,255,255,0.88)' } : secondaryStyle,
              ),
            ]}
          >
            {label}
          </Text>
        </VStack>
      </Button>
    );
  };

  const renderCommentRow = (c: ModComment, compact = false) => {
    const target = describeCommentTarget(c.verseId, langKey, t.modDailyVerseLabel);
    const timeAgo = formatModRelativeTime(c.createdAt, es);
    const isHidden = c.hiddenAt != null;
    const metaBadges = [
      timeAgo || null,
      c.likesCount > 0 ? `♥ ${c.likesCount}` : null,
      c.reportsCount > 0 ? `⚑ ${c.reportsCount}` : null,
      isHidden ? t.modHiddenBadge : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <SwipeActions key={c.id}>
        <VStack alignment="leading" spacing={5} modifiers={[padding({ vertical: 4 })]}>
          <HStack alignment="center" spacing={6}>
            <Text
              modifiers={[
                font({ textStyle: 'subheadline', weight: 'semibold' }),
                lineLimit(1),
                truncationMode('tail'),
              ]}
            >
              {c.authorName}
            </Text>
            {c.authorSuspended ? (
              <SwiftUIImage
                systemName="nosign"
                size={11}
                modifiers={[foregroundStyle({ type: 'color', color: '#D64545' })]}
              />
            ) : null}
            <Spacer />
            {metaBadges ? (
              <Text
                modifiers={[
                  font({ textStyle: 'caption' }),
                  monospacedDigit(),
                  foregroundStyle(
                    c.reportsCount > 0 || isHidden
                      ? { type: 'color', color: '#D64545' }
                      : secondaryStyle,
                  ),
                ]}
              >
                {metaBadges}
              </Text>
            ) : null}
            {!compact ? (
              <Menu
                label={
                  <SwiftUIImage
                    systemName="ellipsis.circle"
                    size={17}
                    modifiers={[
                      foregroundStyle({ type: 'color', color: symbolTint }),
                      frame({ width: 26, height: 26 }),
                    ]}
                  />
                }
              >
                {c.userId ? (
                  <Button
                    label={t.modViewProfile}
                    systemImage="person.crop.circle"
                    onPress={() => onOpenMember(c.userId!)}
                  />
                ) : null}
                {c.userId ? (
                  <Button
                    label={t.modCommentsByUser.replace('{name}', c.authorName)}
                    systemImage="bubble.left.and.bubble.right"
                    onPress={() => handleInspectUserComments(c.userId!, c.authorName)}
                  />
                ) : null}
                {target.hymnId ? (
                  <Button
                    label={t.modOpenHymn}
                    systemImage="book.pages"
                    onPress={() => onOpenHymn(target.hymnId!)}
                  />
                ) : null}
                {isHidden ? (
                  <Button
                    label={t.modRestoreAction}
                    systemImage="arrow.uturn.backward"
                    onPress={() =>
                      void runAction(
                        `restore-c-${c.id}`,
                        async () => {
                          await api(`/mod/comments/${c.id}/restore`, 'POST', {});
                          await Promise.all([
                            loadComments(commentQuery, commentFilter, commentUserFilter),
                            loadAll(),
                          ]);
                        },
                        t.modCommentRestoredToast,
                      )
                    }
                  />
                ) : (
                  <Button
                    role="destructive"
                    label={t.modHideAction}
                    systemImage="eye.slash"
                    onPress={() =>
                      confirmDestructive(t.modHideAction, c.body.slice(0, 120), () => {
                        void runAction(
                          `hide-c-${c.id}`,
                          async () => {
                            await api(`/mod/comments/${c.id}/hide`, 'POST', {});
                            await Promise.all([
                              loadComments(commentQuery, commentFilter, commentUserFilter),
                              loadAll(),
                            ]);
                          },
                          t.modCommentHiddenToast,
                        );
                      })
                    }
                  />
                )}
              </Menu>
            ) : null}
          </HStack>

          {/* Where they commented (Hymn # or Daily Verse) */}
          <HStack alignment="center" spacing={5}>
            <SwiftUIImage
              systemName={target.kind === 'hymn' ? 'music.note' : 'text.quote'}
              size={11}
              modifiers={[foregroundStyle(secondaryStyle)]}
            />
            <Text
              modifiers={[
                font({ textStyle: 'caption', weight: 'medium' }),
                foregroundStyle(secondaryStyle),
                lineLimit(1),
                truncationMode('tail'),
              ]}
            >
              {target.label}
            </Text>
          </HStack>

          {c.parentAuthorName ? (
            <Text
              modifiers={[
                font({ textStyle: 'caption2' }),
                foregroundStyle(tertiaryStyle),
                lineLimit(1),
                truncationMode('tail'),
              ]}
            >
              {t.modReplyTo.replace('{name}', c.parentAuthorName)}
            </Text>
          ) : null}

          <Text
            modifiers={[
              font({ textStyle: 'body' }),
              lineLimit(compact ? 2 : 6),
              foregroundStyle(isHidden ? secondaryStyle : primaryStyle),
            ]}
          >
            {c.body}
          </Text>
        </VStack>

        <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
          {isHidden ? (
            <Button
              label={t.modRestoreAction}
              systemImage="arrow.uturn.backward"
              onPress={() =>
                void runAction(
                  `restore-c-${c.id}`,
                  async () => {
                    await api(`/mod/comments/${c.id}/restore`, 'POST', {});
                    await Promise.all([
                      loadComments(commentQuery, commentFilter, commentUserFilter),
                      loadAll(),
                    ]);
                  },
                  t.modCommentRestoredToast,
                )
              }
            />
          ) : (
            <Button
              role="destructive"
              label={t.modHideAction}
              systemImage="eye.slash"
              onPress={() =>
                confirmDestructive(t.modHideAction, c.body.slice(0, 120), () => {
                  void runAction(
                    `hide-c-${c.id}`,
                    async () => {
                      await api(`/mod/comments/${c.id}/hide`, 'POST', {});
                      await Promise.all([
                        loadComments(commentQuery, commentFilter, commentUserFilter),
                        loadAll(),
                      ]);
                    },
                    t.modCommentHiddenToast,
                  );
                })
              }
            />
          )}
        </SwipeActions.Actions>
      </SwipeActions>
    );
  };

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
      <Form
        modifiers={[
          refreshable(handleRefresh),
          tint(symbolTint),
          listSectionSpacing('compact'),
          scrollDismissesKeyboard('interactively'),
          scrollEdgeEffectStyle('soft', 'all'),
        ]}
      >
        {/* ── Calm 4-Tile Live KPI Summary + Clean 4-Tab Segmented Switcher ── */}
        <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
          <HStack
            alignment="center"
            spacing={8}
            modifiers={[
              listRowBackground('clear'),
              listRowInsets({ top: 4, leading: 0, bottom: 6, trailing: 0 }),
            ]}
          >
            {renderKpiTile('kpi-pending', 'tray.full.fill', t.modKpiPending, totalPending, 'inbox', true)}
            {renderKpiTile(
              'kpi-comments',
              'bubble.left.and.bubble.right.fill',
              t.modKpiComments,
              overview?.totalComments ?? comments.length,
              'comments',
              false,
            )}
            {renderKpiTile(
              'kpi-users',
              'person.3.fill',
              t.modKpiUsers,
              overview?.totalUsers ?? members.length,
              'members',
              false,
            )}
            {renderKpiTile(
              'kpi-churches',
              'building.columns.fill',
              t.modKpiChurches,
              overview?.approvedChurches ?? approvedChurches.length,
              'insights',
              false,
            )}
          </HStack>

          <Picker
            label={t.profileModeration}
            selection={activeTab}
            onSelectionChange={(next) => {
              if (
                next === 'inbox' ||
                next === 'comments' ||
                next === 'members' ||
                next === 'insights'
              ) {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab(next);
              }
            }}
            modifiers={[
              pickerStyle('segmented'),
              listRowBackground('clear'),
              listRowInsets({ top: 2, leading: 0, bottom: 4, trailing: 0 }),
            ]}
          >
            <Text modifiers={[tag('inbox')]}>{t.modTabInbox}</Text>
            <Text modifiers={[tag('comments')]}>{t.modTabComments}</Text>
            <Text modifiers={[tag('members')]}>{t.modTabMembers}</Text>
            <Text modifiers={[tag('insights')]}>{t.modTabInsights}</Text>
          </Picker>
        </Section>

        {error ? (
          <Section>
            <HStack alignment="center" spacing={8}>
              <SwiftUIImage
                systemName="exclamationmark.triangle.fill"
                size={16}
                modifiers={[foregroundStyle({ type: 'color', color: '#D64545' })]}
              />
              <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle({ type: 'color', color: '#D64545' })]}>
                {error}
              </Text>
            </HStack>
          </Section>
        ) : null}

        {/* ── TAB 1: UNIFIED INBOX (Reports + Pending Churches + Pending Choirs + Recent Comments) ── */}
        {activeTab === 'inbox' ? (
          <>
            {loading && totalPending === 0 && comments.length === 0 ? (
              <Section>
                <HStack alignment="center">
                  <Spacer />
                  <ProgressView />
                  <Spacer />
                </HStack>
              </Section>
            ) : totalPending === 0 ? (
              <Section>
                <ContentUnavailableView
                  title={t.modAllClearTitle}
                  systemImage="checkmark.shield.fill"
                  description={t.modAllClearInbox}
                />
              </Section>
            ) : null}

            {reports.length > 0 ? (
              <Section title={`${t.modTabReports} (${reports.length})`}>
                {reports.map((rep) => {
                  const target = rep.verse_id
                    ? describeCommentTarget(rep.verse_id, langKey, t.modDailyVerseLabel)
                    : null;
                  return (
                    <SwipeActions key={rep.id}>
                      <VStack alignment="leading" spacing={6} modifiers={[padding({ vertical: 4 })]}>
                        <HStack alignment="center" spacing={8}>
                          <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' })]}>
                            {rep.name || 'Miembro'}
                          </Text>
                          <Spacer />
                          <Text
                            modifiers={[
                              font({ textStyle: 'caption', weight: 'semibold' }),
                              foregroundStyle({ type: 'color', color: '#D64545' }),
                            ]}
                          >
                            {rep.reason}
                          </Text>
                        </HStack>
                        {target ? (
                          <Text
                            modifiers={[
                              font({ textStyle: 'caption', weight: 'medium' }),
                              foregroundStyle(secondaryStyle),
                              lineLimit(1),
                              truncationMode('tail'),
                            ]}
                          >
                            {target.label}
                          </Text>
                        ) : null}
                        <Text modifiers={[font({ textStyle: 'body' }), lineLimit(4)]}>
                          {rep.body}
                        </Text>
                        {rep.details ? (
                          <Text
                            modifiers={[
                              font({ textStyle: 'footnote' }),
                              foregroundStyle(secondaryStyle),
                            ]}
                          >
                            {rep.details}
                          </Text>
                        ) : null}
                        <HStack alignment="center" spacing={8} modifiers={[padding({ top: 2 })]}>
                          <Button
                            modifiers={[
                              buttonStyle('bordered'),
                              buttonBorderShape('capsule'),
                              controlSize('small'),
                              disabled(Boolean(busyId)),
                            ]}
                            onPress={() =>
                              void runAction(`dismiss-${rep.id}`, async () => {
                                await api(`/mod/reports/${rep.id}/dismiss`, 'POST', {});
                                await loadAll();
                              })
                            }
                          >
                            <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                              {t.modDismissAction}
                            </Text>
                          </Button>
                          <Button
                            role="destructive"
                            modifiers={[
                              buttonStyle('bordered'),
                              buttonBorderShape('capsule'),
                              controlSize('small'),
                              disabled(Boolean(busyId)),
                            ]}
                            onPress={() =>
                              confirmDestructive(t.modHideAction, rep.body.slice(0, 120), () => {
                                void runAction(
                                  `hide-${rep.id}`,
                                  async () => {
                                    await api(`/mod/comments/${rep.comment_id}/hide`, 'POST', {});
                                    await Promise.all([
                                      loadAll(),
                                      loadComments(commentQuery, commentFilter, commentUserFilter),
                                    ]);
                                  },
                                  t.modCommentHiddenToast,
                                );
                              })
                            }
                          >
                            <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                              {t.modHideAction}
                            </Text>
                          </Button>
                          {rep.user_id ? (
                            <Button
                              modifiers={[
                                buttonStyle('plain'),
                                controlSize('small'),
                                foregroundStyle(secondaryStyle),
                              ]}
                              onPress={() => onOpenMember(rep.user_id!)}
                            >
                              <Text modifiers={[font({ textStyle: 'footnote' })]}>
                                {t.modViewProfile}
                              </Text>
                            </Button>
                          ) : null}
                        </HStack>
                      </VStack>
                      <SwipeActions.Actions edge="leading" allowsFullSwipe={false}>
                        <Button
                          label={t.modDismissAction}
                          systemImage="checkmark"
                          onPress={() =>
                            void runAction(`dismiss-${rep.id}`, async () => {
                              await api(`/mod/reports/${rep.id}/dismiss`, 'POST', {});
                              await loadAll();
                            })
                          }
                        />
                      </SwipeActions.Actions>
                      <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
                        <Button
                          role="destructive"
                          label={t.modHideAction}
                          systemImage="eye.slash"
                          onPress={() =>
                            confirmDestructive(t.modHideAction, rep.body.slice(0, 120), () => {
                              void runAction(
                                `hide-${rep.id}`,
                                async () => {
                                  await api(`/mod/comments/${rep.comment_id}/hide`, 'POST', {});
                                  await Promise.all([
                                    loadAll(),
                                    loadComments(commentQuery, commentFilter, commentUserFilter),
                                  ]);
                                },
                                t.modCommentHiddenToast,
                              );
                            })
                          }
                        />
                      </SwipeActions.Actions>
                    </SwipeActions>
                  );
                })}
              </Section>
            ) : null}

            {pendingChurches.length > 0 ? (
              <Section title={`${t.modTabChurches} (${pendingChurches.length})`}>
                {pendingChurches.map((ch) => (
                  <SwipeActions key={ch.id}>
                    <VStack alignment="leading" spacing={4} modifiers={[padding({ vertical: 4 })]}>
                      <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                        {churchDisplayName(ch.name, ch.city)}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {`${ch.address}, ${ch.city}${ch.state ? `, ${ch.state}` : ''}`}
                      </Text>
                      {ch.pastorName ? (
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {servantDisplayName(ch.pastorName)}
                        </Text>
                      ) : null}
                      <HStack alignment="center" spacing={8} modifiers={[padding({ top: 4 })]}>
                        <Button
                          modifiers={[
                            buttonStyle('borderedProminent'),
                            buttonBorderShape('capsule'),
                            controlSize('small'),
                            tint(prominentFill),
                            disabled(Boolean(busyId)),
                          ]}
                          onPress={() =>
                            void runAction(`app-ch-${ch.id}`, async () => {
                              await api(`/mod/churches/${ch.id}/approve`, 'POST', {});
                              await loadAll();
                            })
                          }
                        >
                          <Text
                            modifiers={[
                              font({ textStyle: 'footnote', weight: 'semibold' }),
                              foregroundStyle({ type: 'color', color: prominentInk }),
                            ]}
                          >
                            {t.modApproveAction}
                          </Text>
                        </Button>
                        <Button
                          role="destructive"
                          modifiers={[
                            buttonStyle('bordered'),
                            buttonBorderShape('capsule'),
                            controlSize('small'),
                            disabled(Boolean(busyId)),
                          ]}
                          onPress={() =>
                            confirmDestructive(
                              t.modRejectAction,
                              churchDisplayName(ch.name, ch.city),
                              () => {
                                void runAction(`rej-ch-${ch.id}`, async () => {
                                  await api(`/mod/churches/${ch.id}/reject`, 'POST', {});
                                  await loadAll();
                                });
                              },
                            )
                          }
                        >
                          <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                            {t.modRejectAction}
                          </Text>
                        </Button>
                      </HStack>
                    </VStack>
                    <SwipeActions.Actions edge="leading" allowsFullSwipe={false}>
                      <Button
                        label={t.modApproveAction}
                        systemImage="checkmark.seal"
                        onPress={() =>
                          void runAction(`app-ch-${ch.id}`, async () => {
                            await api(`/mod/churches/${ch.id}/approve`, 'POST', {});
                            await loadAll();
                          })
                        }
                      />
                    </SwipeActions.Actions>
                    <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
                      <Button
                        role="destructive"
                        label={t.modRejectAction}
                        systemImage="xmark"
                        onPress={() =>
                          confirmDestructive(
                            t.modRejectAction,
                            churchDisplayName(ch.name, ch.city),
                            () => {
                              void runAction(`rej-ch-${ch.id}`, async () => {
                                await api(`/mod/churches/${ch.id}/reject`, 'POST', {});
                                await loadAll();
                              });
                            },
                          )
                        }
                      />
                    </SwipeActions.Actions>
                  </SwipeActions>
                ))}
              </Section>
            ) : null}

            {pendingChoirs.length > 0 ? (
              <Section title={`${t.modTabChoirs} (${pendingChoirs.length})`}>
                {pendingChoirs.map((c) => (
                  <SwipeActions key={c.slug}>
                    <VStack alignment="leading" spacing={4} modifiers={[padding({ vertical: 4 })]}>
                      <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                        {es ? c.nameEs : c.nameEn}
                      </Text>
                      {c.churchContext || c.submittedByName ? (
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {[c.churchContext, c.submittedByName].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                      <HStack alignment="center" spacing={8} modifiers={[padding({ top: 3 })]}>
                        <Button
                          modifiers={[
                            buttonStyle('borderedProminent'),
                            buttonBorderShape('capsule'),
                            controlSize('small'),
                            tint(prominentFill),
                            disabled(Boolean(busyId)),
                          ]}
                          onPress={() =>
                            void runAction(`app-co-${c.slug}`, async () => {
                              await api(`/mod/choirs/${c.slug}/approve`, 'POST', {});
                              await Promise.all([loadAll(), refreshApprovedChoirs()]);
                            })
                          }
                        >
                          <Text
                            modifiers={[
                              font({ textStyle: 'footnote', weight: 'semibold' }),
                              foregroundStyle({ type: 'color', color: prominentInk }),
                            ]}
                          >
                            {t.modApproveAction}
                          </Text>
                        </Button>
                        <Button
                          role="destructive"
                          modifiers={[
                            buttonStyle('bordered'),
                            buttonBorderShape('capsule'),
                            controlSize('small'),
                            disabled(Boolean(busyId)),
                          ]}
                          onPress={() =>
                            confirmDestructive(
                              t.modRejectAction,
                              es ? c.nameEs : c.nameEn,
                              () => {
                                void runAction(`rej-co-${c.slug}`, async () => {
                                  await api(`/mod/choirs/${c.slug}/reject`, 'POST', {});
                                  await Promise.all([loadAll(), refreshApprovedChoirs()]);
                                });
                              },
                            )
                          }
                        >
                          <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                            {t.modRejectAction}
                          </Text>
                        </Button>
                      </HStack>
                    </VStack>
                    <SwipeActions.Actions edge="leading" allowsFullSwipe={false}>
                      <Button
                        label={t.modApproveAction}
                        systemImage="checkmark"
                        onPress={() =>
                          void runAction(`app-co-${c.slug}`, async () => {
                            await api(`/mod/choirs/${c.slug}/approve`, 'POST', {});
                            await Promise.all([loadAll(), refreshApprovedChoirs()]);
                          })
                        }
                      />
                    </SwipeActions.Actions>
                    <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
                      <Button
                        role="destructive"
                        label={t.modRejectAction}
                        systemImage="xmark"
                        onPress={() =>
                          confirmDestructive(
                            t.modRejectAction,
                            es ? c.nameEs : c.nameEn,
                            () => {
                              void runAction(`rej-co-${c.slug}`, async () => {
                                await api(`/mod/choirs/${c.slug}/reject`, 'POST', {});
                                await Promise.all([loadAll(), refreshApprovedChoirs()]);
                              });
                            },
                          )
                        }
                      />
                    </SwipeActions.Actions>
                  </SwipeActions>
                ))}
              </Section>
            ) : null}

            {/* Recent Comments Preview directly on Inbox so Admin always sees live activity */}
            <Section
              title={t.modRecentCommentsTitle}
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              {loadingComments && comments.length === 0 ? (
                <HStack alignment="center">
                  <Spacer />
                  <ProgressView />
                  <Spacer />
                </HStack>
              ) : comments.length === 0 ? (
                <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(secondaryStyle)]}>
                  {t.modNoCommentsYet}
                </Text>
              ) : (
                <>
                  {comments.slice(0, 4).map((c) => renderCommentRow(c, true))}
                  <Button
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setActiveTab('comments');
                    }}
                  >
                    <HStack alignment="center" spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                      <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' })]}>
                        {t.modSeeAllComments}
                      </Text>
                      <Spacer />
                      <SwiftUIImage
                        systemName="chevron.right"
                        size={13}
                        modifiers={[foregroundStyle(tertiaryStyle)]}
                      />
                    </HStack>
                  </Button>
                </>
              )}
            </Section>
          </>
        ) : null}

        {/* ── TAB 2: LIVE COMMENTS INSPECTOR (Daily Verses + Hymns, Filterable by User) ── */}
        {activeTab === 'comments' ? (
          <>
            <Section>
              {commentUserFilter ? (
                <HStack alignment="center" spacing={8}>
                  <SwiftUIImage
                    systemName="person.crop.circle.fill"
                    size={16}
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                  />
                  <Text
                    modifiers={[
                      font({ textStyle: 'subheadline', weight: 'semibold' }),
                      lineLimit(1),
                      truncationMode('tail'),
                    ]}
                  >
                    {t.modCommentsByUser.replace('{name}', commentUserFilter.name)}
                  </Text>
                  <Spacer />
                  <Button
                    modifiers={[
                      buttonStyle('bordered'),
                      buttonBorderShape('capsule'),
                      controlSize('small'),
                    ]}
                    onPress={handleClearCommentUserFilter}
                  >
                    <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' })]}>
                      {t.modClearUserFilter}
                    </Text>
                  </Button>
                </HStack>
              ) : null}

              <HStack alignment="center" spacing={10}>
                <SwiftUIImage
                  systemName="magnifyingglass"
                  size={15}
                  modifiers={[foregroundStyle(secondaryStyle)]}
                />
                <TextField
                  ref={commentSearchRef}
                  placeholder={t.modSearchCommentsPlaceholder}
                  onTextChange={setCommentQuery}
                  modifiers={[submitLabel('search')]}
                />
                <Button
                  modifiers={[
                    buttonStyle('bordered'),
                    buttonBorderShape('capsule'),
                    controlSize('small'),
                    disabled(loadingComments),
                  ]}
                  onPress={() =>
                    void loadComments(commentQuery, commentFilter, commentUserFilter)
                  }
                >
                  <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                    {t.modSearchAction}
                  </Text>
                </Button>
              </HStack>

              <Picker
                label={t.modTabComments}
                selection={commentFilter}
                onSelectionChange={(next) => {
                  if (next === 'active' || next === 'hidden' || next === 'all') {
                    handleCommentFilterChange(next);
                  }
                }}
                modifiers={[pickerStyle('segmented')]}
              >
                <Text modifiers={[tag('active')]}>{t.modFilterActive}</Text>
                <Text modifiers={[tag('hidden')]}>{t.modFilterHidden}</Text>
                <Text modifiers={[tag('all')]}>{t.modFilterAll}</Text>
              </Picker>
            </Section>

            <Section
              title={`${t.modTabComments} (${comments.length})`}
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              {loadingComments && comments.length === 0 ? (
                <HStack alignment="center">
                  <Spacer />
                  <ProgressView />
                  <Spacer />
                </HStack>
              ) : comments.length === 0 ? (
                <ContentUnavailableView
                  title={t.modNoCommentsYet}
                  systemImage="bubble.left.and.bubble.right"
                />
              ) : (
                comments.map((c) => renderCommentRow(c, false))
              )}
            </Section>
          </>
        ) : null}

        {/* ── TAB 3: MEMBER INSPECTOR (with Comment Counts + 1-Tap View Comments) ── */}
        {activeTab === 'members' ? (
          <>
            <Section>
              <HStack alignment="center" spacing={10}>
                <SwiftUIImage
                  systemName="magnifyingglass"
                  size={15}
                  modifiers={[foregroundStyle(secondaryStyle)]}
                />
                <TextField
                  ref={memberSearchRef}
                  placeholder={t.modSearchMembersPlaceholder}
                  onTextChange={setMemberQuery}
                  modifiers={[submitLabel('search')]}
                />
                <Button
                  modifiers={[
                    buttonStyle('bordered'),
                    buttonBorderShape('capsule'),
                    controlSize('small'),
                    disabled(loadingMembers),
                  ]}
                  onPress={() => void loadMembers(memberQuery, memberFilter)}
                >
                  <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                    {t.modSearchAction}
                  </Text>
                </Button>
              </HStack>

              <Picker
                label={t.modTabMembers}
                selection={memberFilter}
                onSelectionChange={(next) => {
                  if (
                    next === 'recent' ||
                    next === 'pending_obispo' ||
                    next === 'suspended' ||
                    next === 'all'
                  ) {
                    handleMemberFilterChange(next);
                  }
                }}
                modifiers={[pickerStyle('segmented')]}
              >
                <Text modifiers={[tag('recent')]}>{t.modFilterRecent}</Text>
                <Text modifiers={[tag('pending_obispo')]}>{t.modFilterPendingObispo}</Text>
                <Text modifiers={[tag('suspended')]}>{t.modFilterSuspended}</Text>
                <Text modifiers={[tag('all')]}>{t.modFilterAll}</Text>
              </Picker>
            </Section>

            <Section
              title={`${t.modTabMembers} (${members.length})`}
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              {loadingMembers && members.length === 0 ? (
                <HStack alignment="center">
                  <Spacer />
                  <ProgressView />
                  <Spacer />
                </HStack>
              ) : members.length === 0 ? (
                <ContentUnavailableView
                  title={t.hymnsNoResultsFound}
                  systemImage="person.crop.circle.badge.questionmark"
                />
              ) : (
                members.map((m) => {
                  const isVerifiedObispo = m.ministry === 'obispo' && Boolean(m.badge_verified);
                  const isSuspended = m.suspended_at != null;
                  const commentCount = Number(m.commentsCount ?? 0);
                  const commentLabel =
                    commentCount > 0
                      ? (commentCount === 1
                          ? t.modCommentsCount_one
                          : t.modCommentsCount_other
                        ).replace('{n}', String(commentCount))
                      : null;
                  const meta = [
                    m.email || null,
                    m.ministry
                      ? (MINISTRIES as Record<string, [string, string]>)[m.ministry]?.[es ? 0 : 1]
                      : null,
                    m.churchName ? churchDisplayName(m.churchName) : null,
                    commentLabel,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <HStack key={m.id} alignment="center" spacing={10} modifiers={[padding({ vertical: 2 })]}>
                      {m.avatarUrl && hasRNHost ? (
                        <ZStack modifiers={[frame({ width: 38, height: 38 })]}>
                          <RNHostView matchContents>
                            <UserAvatar
                              uri={m.avatarUrl}
                              initials={m.initials || m.name.slice(0, 2).toUpperCase()}
                              size={38}
                              fontSize={13}
                              backgroundColor={avatarBg}
                              textColor={avatarText}
                            />
                          </RNHostView>
                        </ZStack>
                      ) : (
                        <ZStack modifiers={[frame({ width: 38, height: 38 })]}>
                          <Circle modifiers={[foregroundStyle({ type: 'color', color: avatarBg })]} />
                          <Text
                            modifiers={[
                              font({ size: 13, weight: 'semibold' }),
                              foregroundStyle({ type: 'color', color: avatarText }),
                            ]}
                          >
                            {m.initials || m.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </ZStack>
                      )}

                      <Button
                        modifiers={[foregroundStyle(primaryStyle)]}
                        onPress={() => onOpenMember(m.id)}
                      >
                        <VStack alignment="leading" spacing={2} modifiers={[contentShape(shapes.rectangle())]}>
                          <HStack alignment="center" spacing={5}>
                            <Text
                              modifiers={[
                                font({ textStyle: 'body', weight: 'semibold' }),
                                lineLimit(1),
                                truncationMode('tail'),
                              ]}
                            >
                              {m.name}
                            </Text>
                            {isVerifiedObispo ? (
                              <SwiftUIImage
                                systemName="checkmark.seal.fill"
                                size={13}
                                modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                              />
                            ) : null}
                            {m.emailVerified ? (
                              <SwiftUIImage
                                systemName="checkmark.circle.fill"
                                size={12}
                                modifiers={[foregroundStyle({ type: 'color', color: '#34C759' })]}
                              />
                            ) : null}
                            {isSuspended ? (
                              <SwiftUIImage
                                systemName="nosign"
                                size={12}
                                modifiers={[foregroundStyle({ type: 'color', color: '#D64545' })]}
                              />
                            ) : null}
                          </HStack>
                          {meta ? (
                            <Text
                              modifiers={[
                                font({ textStyle: 'caption' }),
                                foregroundStyle(secondaryStyle),
                                lineLimit(1),
                                truncationMode('tail'),
                              ]}
                            >
                              {meta}
                            </Text>
                          ) : null}
                        </VStack>
                      </Button>

                      <Spacer />

                      <Menu
                        label={
                          <SwiftUIImage
                            systemName="ellipsis.circle"
                            size={19}
                            modifiers={[
                              foregroundStyle({ type: 'color', color: symbolTint }),
                              frame({ width: 30, height: 30 }),
                            ]}
                          />
                        }
                      >
                        <Button
                          label={t.modViewProfile}
                          systemImage="person.crop.circle"
                          onPress={() => onOpenMember(m.id)}
                        />
                        <Button
                          label={
                            commentCount > 0
                              ? `${t.modViewComments} (${commentCount})`
                              : t.modViewComments
                          }
                          systemImage="bubble.left.and.bubble.right"
                          onPress={() => handleInspectUserComments(m.id, m.name)}
                        />
                        {m.emailVerified === false ? (
                          <Button
                            label={t.modVerifyEmail}
                            systemImage="envelope.badge.fill"
                            onPress={() =>
                              void runAction(
                                `ver-email-${m.id}`,
                                async () => {
                                  await api(`/mod/users/${m.id}/verify-email`, 'POST', {});
                                  await loadMembers(memberQuery, memberFilter);
                                  await loadAll();
                                },
                                t.modEmailVerifiedToast,
                              )
                            }
                          />
                        ) : null}
                        {m.ministry === 'obispo' ? (
                          <Button
                            label={
                              isVerifiedObispo
                                ? t.profileAdminRevokeObispo
                                : t.profileAdminVerifyObispo
                            }
                            systemImage="checkmark.seal"
                            onPress={() =>
                              void runAction(`obispo-${m.id}`, async () => {
                                await api(`/mod/users/${m.id}/verify-obispo`, 'POST', {
                                  verified: !isVerifiedObispo,
                                });
                                await loadMembers(memberQuery, memberFilter);
                                await loadAll();
                              })
                            }
                          />
                        ) : null}
                        {m.avatarUrl ? (
                          <Button
                            role="destructive"
                            label={t.modClearAvatar}
                            systemImage="trash"
                            onPress={() =>
                              confirmDestructive(
                                t.modClearAvatar,
                                t.profileAdminClearAvatarConfirm.replace('{name}', m.name),
                                () => {
                                  void runAction(
                                    `clear-av-${m.id}`,
                                    async () => {
                                      await api(`/mod/users/${m.id}/clear-avatar`, 'POST', {});
                                      await loadMembers(memberQuery, memberFilter);
                                    },
                                    t.modClearAvatarDone,
                                  );
                                },
                              )
                            }
                          />
                        ) : null}
                        {m.id !== user?.id ? (
                          <Button
                            role={isSuspended ? undefined : 'destructive'}
                            label={
                              isSuspended ? t.profileAdminRestore : t.profileAdminSuspend
                            }
                            systemImage={
                              isSuspended
                                ? 'arrow.uturn.backward.circle'
                                : 'person.crop.circle.badge.xmark'
                            }
                            onPress={() => {
                              const act = isSuspended ? 'restore' : 'suspend';
                              confirmDestructive(
                                isSuspended ? t.profileAdminRestore : t.profileAdminSuspend,
                                m.name,
                                () => {
                                  void runAction(`susp-${m.id}`, async () => {
                                    await api(`/mod/users/${m.id}/${act}`, 'POST', {});
                                    await loadMembers(memberQuery, memberFilter);
                                    await loadAll();
                                  });
                                },
                              );
                            }}
                          />
                        ) : null}
                      </Menu>
                    </HStack>
                  );
                })
              )}
            </Section>
          </>
        ) : null}

        {/* ── TAB 4: LIVE INSIGHTS, DIRECTORY & HYMN REACTIONS ── */}
        {activeTab === 'insights' ? (
          <>
            <Section title={t.modAnalyticsTitle}>
              {overview ? (
                <>
                  <LabeledContent label={t.modTotalAccounts}>
                    <Text modifiers={[monospacedDigit(), font({ weight: 'semibold' })]}>
                      {String(overview.totalUsers)}
                    </Text>
                  </LabeledContent>
                  <LabeledContent label={t.modVerifiedEmails}>
                    <Text modifiers={[monospacedDigit(), foregroundStyle({ type: 'color', color: '#34C759' })]}>
                      {String(overview.verifiedUsers)}
                    </Text>
                  </LabeledContent>
                  <LabeledContent label={t.modNewLast7Days}>
                    <Text modifiers={[monospacedDigit(), foregroundStyle(secondaryStyle)]}>
                      {`+${overview.newUsers7d}`}
                    </Text>
                  </LabeledContent>
                  <LabeledContent label={t.modSignInMethods}>
                    <Text modifiers={[monospacedDigit(), foregroundStyle(secondaryStyle)]}>
                      {`${overview.oauthProviders.apple} Apple · ${overview.oauthProviders.google} Google`}
                    </Text>
                  </LabeledContent>
                  <LabeledContent label={t.modTotalComments}>
                    <Text modifiers={[monospacedDigit(), foregroundStyle(secondaryStyle)]}>
                      {String(overview.totalComments)}
                    </Text>
                  </LabeledContent>
                  <LabeledContent label={t.modPushDevices}>
                    <Text modifiers={[monospacedDigit(), foregroundStyle(secondaryStyle)]}>
                      {String(overview.activePushDevices)}
                    </Text>
                  </LabeledContent>
                </>
              ) : (
                <HStack alignment="center">
                  <Spacer />
                  <ProgressView />
                  <Spacer />
                </HStack>
              )}
            </Section>

            {approvedChurches.length > 0 ? (
              <Section title={`${t.modApprovedChurches} (${approvedChurches.length})`}>
                {approvedChurches.map((ch) => (
                  <Button
                    key={ch.id}
                    modifiers={[foregroundStyle(primaryStyle)]}
                    onPress={() => onOpenChurch(ch.id)}
                  >
                    <HStack alignment="center" spacing={10} modifiers={[contentShape(shapes.rectangle())]}>
                      <SwiftUIImage
                        systemName="building.columns.fill"
                        size={15}
                        modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                      />
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body', weight: 'medium' })]}>
                          {churchDisplayName(ch.name, ch.city)}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                            lineLimit(1),
                            truncationMode('tail'),
                          ]}
                        >
                          {`${ch.city}${ch.state ? `, ${ch.state}` : ''} · ${ch.country}`}
                        </Text>
                      </VStack>
                      <Spacer />
                      <SwiftUIImage
                        systemName="chevron.right"
                        size={13}
                        modifiers={[foregroundStyle(tertiaryStyle)]}
                      />
                    </HStack>
                  </Button>
                ))}
              </Section>
            ) : null}

            {approvedChoirs.length > 0 ? (
              <Section title={`${t.modApprovedChoirs} (${approvedChoirs.length})`}>
                {approvedChoirs.map((c) => {
                  const label = choirDisplayName(c.slug, es, choirsBySlug) || (es ? c.nameEs : c.nameEn);
                  const row = (
                    <HStack alignment="center" spacing={10}>
                      <SwiftUIImage
                        systemName="music.note"
                        size={15}
                        modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                      />
                      <VStack alignment="leading" spacing={1}>
                        <Text modifiers={[font({ textStyle: 'body', weight: 'medium' })]}>
                          {label}
                        </Text>
                        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(secondaryStyle)]}>
                          {`${c.nameEs} · ${c.nameEn}`}
                        </Text>
                      </VStack>
                      <Spacer />
                    </HStack>
                  );
                  if (BUILTIN_CHOIRS.has(c.slug)) {
                    return <HStack key={c.slug}>{row}</HStack>;
                  }
                  return (
                    <SwipeActions key={c.slug}>
                      {row}
                      <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
                        <Button
                          role="destructive"
                          label={t.delete}
                          systemImage="trash"
                          onPress={() =>
                            confirmDestructive(t.delete, label, () => {
                              void runAction(`del-co-${c.slug}`, async () => {
                                await api(`/mod/choirs/${c.slug}`, 'DELETE');
                                await Promise.all([loadAll(), refreshApprovedChoirs()]);
                              });
                            })
                          }
                        />
                      </SwipeActions.Actions>
                    </SwipeActions>
                  );
                })}
              </Section>
            ) : null}

            {topDisliked.length > 0 ? (
              <Section title={t.modMostDisliked}>
                {topDisliked.map((stat) => {
                  const hymn = hymnById.get(stat.hymnId);
                  return (
                    <Button
                      key={`dis-${stat.hymnId}`}
                      modifiers={[foregroundStyle(primaryStyle)]}
                      onPress={() => onOpenHymn(stat.hymnId)}
                    >
                      <HStack alignment="center" spacing={10} modifiers={[contentShape(shapes.rectangle())]}>
                        <Text
                          modifiers={[
                            font({ textStyle: 'subheadline', weight: 'bold' }),
                            monospacedDigit(),
                            foregroundStyle({ type: 'color', color: symbolTint }),
                          ]}
                        >
                          {hymn?.number || stat.hymnId}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'body' }),
                            lineLimit(1),
                            truncationMode('tail'),
                          ]}
                        >
                          {hymn?.title || `#${stat.hymnId}`}
                        </Text>
                        <Spacer />
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote', weight: 'semibold' }),
                            monospacedDigit(),
                            foregroundStyle({ type: 'color', color: '#D64545' }),
                          ]}
                        >
                          {`👎 ${stat.dislikesCount} · 👍 ${stat.likesCount}`}
                        </Text>
                      </HStack>
                    </Button>
                  );
                })}
              </Section>
            ) : null}

            <Section
              title={t.modMostLiked}
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              {topLiked.length === 0 ? (
                <ContentUnavailableView
                  title={t.modHymnReactionsTitle}
                  systemImage="hand.thumbsup"
                  description={t.modNoReactionsYet}
                />
              ) : (
                topLiked.map((stat) => {
                  const hymn = hymnById.get(stat.hymnId);
                  return (
                    <Button
                      key={`like-${stat.hymnId}`}
                      modifiers={[foregroundStyle(primaryStyle)]}
                      onPress={() => onOpenHymn(stat.hymnId)}
                    >
                      <HStack alignment="center" spacing={10} modifiers={[contentShape(shapes.rectangle())]}>
                        <Text
                          modifiers={[
                            font({ textStyle: 'subheadline', weight: 'bold' }),
                            monospacedDigit(),
                            foregroundStyle({ type: 'color', color: symbolTint }),
                          ]}
                        >
                          {hymn?.number || stat.hymnId}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'body' }),
                            lineLimit(1),
                            truncationMode('tail'),
                          ]}
                        >
                          {hymn?.title || `#${stat.hymnId}`}
                        </Text>
                        <Spacer />
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote', weight: 'semibold' }),
                            monospacedDigit(),
                            foregroundStyle({ type: 'color', color: '#34C759' }),
                          ]}
                        >
                          {`👍 ${stat.likesCount}`}
                        </Text>
                      </HStack>
                    </Button>
                  );
                })
              )}
            </Section>
          </>
        ) : null}
      </Form>
    </Host>
  );
}
