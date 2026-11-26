/**
 * ModerationScreen (Android Material 3 Expressive Jetpack Compose) — Admin Command Center.
 *
 * Parity with iOS `ModerationScreen.ios.tsx`:
 * - Native Compose `PullToRefreshBox` + `LazyColumn` + `ListItem` + `SingleChoiceSegmentedButtonRow`
 * - Calm 4-metric live KPI summary (`Pending`, `Comments`, `Accounts`)
 * - 4 clean tabs: Inbox | Comments | Members | Insights
 * - Live Comments Inspector (`GET /mod/comments`): search, filter Active/Hidden/All,
 *   filter by specific member ("View Comments"), jump to Hymn or Profile, and Hide/Restore
 * - Member Inspector with comment counts + 1-tap View Comments / Verify / Clear Photo / Suspend
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Column,
  FilledTonalButton,
  Host,
  LazyColumn,
  ListItem,
  OutlinedButton,
  PullToRefreshBox,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Spacer,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
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
import { showSuccessToast } from '../../utils/toast';
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
  avatarUrl?: string | null;
  emailVerified?: boolean;
  ministry: string | null;
  choir: string | null;
  churchName?: string | null;
  badge_verified: number;
  badgeVerified?: boolean;
  suspended_at: number | null;
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
const CARD_SHAPE = Shapes.RoundedCorner(20);

export default function ModerationScreenAndroid({
  onOpenMember,
  onOpenChurch,
  onOpenHymn,
}: ModerationScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const { bySlug: choirsBySlug, refresh: refreshApprovedChoirs } = useApprovedChoirs();
  const api = useCommunityApi();
  const materialColors = useMaterialColors();

  const es = language !== 'en';
  const langKey: 'es' | 'en' = es ? 'es' : 'en';
  const isAdmin =
    user?.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL;
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const [activeTab, setActiveTab] = useState<ModTab>('inbox');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<ModOverview | null>(null);
  const [reports, setReports] = useState<ModReport[]>([]);
  const [churches, setChurches] = useState<ModChurch[]>([]);
  const [choirs, setChoirs] = useState<ModChoir[]>([]);
  const [reactions, setReactions] = useState<HymnReactionStat[]>([]);

  const [members, setMembers] = useState<ModMember[]>([]);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('recent');
  const [memberQuery, setMemberQuery] = useState('');

  const [comments, setComments] = useState<ModComment[]>([]);
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('active');
  const [commentQuery, setCommentQuery] = useState('');
  const [commentUserFilter, setCommentUserFilter] = useState<{ id: string; name: string } | null>(null);

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
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        params.set('filter', filter);
        const res = await api<{ users: ModMember[] }>(`/mod/users?${params.toString()}`);
        setMembers(res.users || []);
      } catch (e) {
        setError(communityError(e, es));
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
      try {
        const params = new URLSearchParams();
        params.set('filter', filter);
        if (q.trim()) params.set('q', q.trim());
        if (userFilter?.id) params.set('userId', userFilter.id);
        const res = await api<{ comments: ModComment[] }>(`/mod/comments?${params.toString()}`);
        setComments(res.comments || []);
      } catch (e) {
        setError(communityError(e, es));
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
    }
  }, [api, es, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
    void loadMembers('', 'recent');
    void loadComments('', 'active', null);
    // Load once when admin opens screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAll(),
        loadMembers(memberQuery, memberFilter),
        loadComments(commentQuery, commentFilter, commentUserFilter),
      ]);
    } finally {
      setRefreshing(false);
    }
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

  const confirmDestructive = (title: string, body: string, onConfirm: () => void) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(title, body, [
      { text: t.cancel, style: 'cancel' },
      { text: title, style: 'destructive', onPress: onConfirm },
    ]);
  };

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

  const openMemberActions = (m: ModMember) => {
    const isVerifiedObispo = m.ministry === 'obispo' && Boolean(m.badge_verified);
    const isSuspended = m.suspended_at != null;
    const commentCount = Number(m.commentsCount ?? 0);
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      { text: t.modViewProfile, onPress: () => onOpenMember(m.id) },
      {
        text: commentCount > 0 ? `${t.modViewComments} (${commentCount})` : t.modViewComments,
        onPress: () => handleInspectUserComments(m.id, m.name),
      },
    ];
    if (m.emailVerified === false) {
      buttons.push({
        text: t.modVerifyEmail,
        onPress: () =>
          void runAction(
            `ver-email-${m.id}`,
            async () => {
              await api(`/mod/users/${m.id}/verify-email`, 'POST', {});
              await Promise.all([loadMembers(memberQuery, memberFilter), loadAll()]);
            },
            t.modEmailVerifiedToast,
          ),
      });
    }
    if (m.ministry === 'obispo') {
      buttons.push({
        text: isVerifiedObispo ? t.profileAdminRevokeObispo : t.profileAdminVerifyObispo,
        onPress: () =>
          void runAction(`obispo-${m.id}`, async () => {
            await api(`/mod/users/${m.id}/verify-obispo`, 'POST', {
              verified: !isVerifiedObispo,
            });
            await Promise.all([loadMembers(memberQuery, memberFilter), loadAll()]);
          }),
      });
    }
    if (m.avatarUrl) {
      buttons.push({
        text: t.modClearAvatar,
        style: 'destructive',
        onPress: () =>
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
          ),
      });
    }
    if (m.id !== user?.id) {
      const act = isSuspended ? 'restore' : 'suspend';
      buttons.push({
        text: isSuspended ? t.profileAdminRestore : t.profileAdminSuspend,
        style: isSuspended ? undefined : 'destructive',
        onPress: () =>
          confirmDestructive(
            isSuspended ? t.profileAdminRestore : t.profileAdminSuspend,
            m.name,
            () => {
              void runAction(`susp-${m.id}`, async () => {
                await api(`/mod/users/${m.id}/${act}`, 'POST', {});
                await Promise.all([loadMembers(memberQuery, memberFilter), loadAll()]);
              });
            },
          ),
      });
    }
    buttons.push({ text: t.cancel, style: 'cancel' });
    Alert.alert(m.name, m.email || undefined, buttons);
  };

  const openCommentActions = (c: ModComment) => {
    const target = describeCommentTarget(c.verseId, langKey, t.modDailyVerseLabel);
    const isHidden = c.hiddenAt != null;
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [];

    if (c.userId) {
      buttons.push({
        text: t.modViewProfile,
        onPress: () => onOpenMember(c.userId!),
      });
      buttons.push({
        text: t.modCommentsByUser.replace('{name}', c.authorName),
        onPress: () => handleInspectUserComments(c.userId!, c.authorName),
      });
    }
    if (target.hymnId) {
      buttons.push({
        text: t.modOpenHymn,
        onPress: () => onOpenHymn(target.hymnId!),
      });
    }
    if (isHidden) {
      buttons.push({
        text: t.modRestoreAction,
        onPress: () =>
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
          ),
      });
    } else {
      buttons.push({
        text: t.modHideAction,
        style: 'destructive',
        onPress: () =>
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
          }),
      });
    }
    buttons.push({ text: t.cancel, style: 'cancel' });
    Alert.alert(c.authorName, target.label, buttons);
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

  if (!isAdmin) return null;

  const pendingChurches = churches.filter((c) => c.status === 'pending');
  const approvedChurches = churches.filter((c) => c.status === 'approved');
  const pendingChoirs = choirs.filter((c) => c.status === 'pending');
  const approvedChoirs = choirs.filter((c) => c.status === 'approved');
  const totalPending = reports.length + pendingChurches.length + pendingChoirs.length;

  const surfaceBg = isDarkMode ? '#141312' : '#FAF5EE';
  const cardBg = isDarkMode ? '#1F1E1C' : '#FFFFFF';
  const primaryInk = isDarkMode ? '#FAF5EE' : '#1E1A17';
  const secondaryInk = isDarkMode ? '#BEB6AC' : '#6A5F55';
  const accentColor = isDarkMode ? '#E5A09E' : '#6e1619';

  const tabs: { key: ModTab; label: string }[] = [
    { key: 'inbox', label: t.modTabInbox },
    { key: 'comments', label: t.modTabComments },
    { key: 'members', label: t.modTabMembers },
    { key: 'insights', label: t.modTabInsights },
  ];

  const memberFilters: { key: MemberFilter; label: string }[] = [
    { key: 'recent', label: t.modFilterRecent },
    { key: 'pending_obispo', label: t.modFilterPendingObispo },
    { key: 'suspended', label: t.modFilterSuspended },
    { key: 'all', label: t.modFilterAll },
  ];

  const commentFilters: { key: CommentFilter; label: string }[] = [
    { key: 'active', label: t.modFilterActive },
    { key: 'hidden', label: t.modFilterHidden },
    { key: 'all', label: t.modFilterAll },
  ];

  const bottomPad = Math.max(insets.bottom, 20) + (hasMiniPlayer ? 92 : 24);

  const renderCommentCard = (c: ModComment) => {
    const target = describeCommentTarget(c.verseId, langKey, t.modDailyVerseLabel);
    const timeAgo = formatModRelativeTime(c.createdAt, es);
    const isHidden = c.hiddenAt != null;
    const headerMeta = [
      timeAgo || null,
      c.likesCount > 0 ? `♥ ${c.likesCount}` : null,
      c.reportsCount > 0 ? `⚑ ${c.reportsCount}` : null,
      isHidden ? t.modHiddenBadge : null,
    ]
      .filter(Boolean)
      .join(' · ');
    const supporting = [
      c.parentAuthorName ? t.modReplyTo.replace('{name}', c.parentAuthorName) : null,
      c.body,
    ]
      .filter(Boolean)
      .join('\n');

    return (
      <ListItem
        key={c.id}
        modifiers={[fillMaxWidth(), clip(CARD_SHAPE), clickable(() => openCommentActions(c))]}
      >
        <ListItem.OverlineContent>
          <Text color={accentColor} style={{ typography: 'labelSmall' }}>
            {target.label}
          </Text>
        </ListItem.OverlineContent>
        <ListItem.HeadlineContent>
          <Text style={{ typography: 'titleSmall' }}>
            {headerMeta ? `${c.authorName} · ${headerMeta}` : c.authorName}
          </Text>
        </ListItem.HeadlineContent>
        <ListItem.SupportingContent>
          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
            {supporting}
          </Text>
        </ListItem.SupportingContent>
      </ListItem>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg }]}>
      {activeTab === 'members' ? (
        <View style={[styles.searchBar, { borderColor: isDarkMode ? '#3B3632' : '#DDD4C8', backgroundColor: cardBg }]}>
          <TextInput
            value={memberQuery}
            onChangeText={setMemberQuery}
            placeholder={t.modSearchMembersPlaceholder}
            placeholderTextColor={secondaryInk}
            returnKeyType="search"
            onSubmitEditing={() => void loadMembers(memberQuery, memberFilter)}
            style={[styles.searchInput, { color: primaryInk }]}
          />
        </View>
      ) : null}

      {activeTab === 'comments' ? (
        <View style={[styles.searchBar, { borderColor: isDarkMode ? '#3B3632' : '#DDD4C8', backgroundColor: cardBg }]}>
          <TextInput
            value={commentQuery}
            onChangeText={setCommentQuery}
            placeholder={t.modSearchCommentsPlaceholder}
            placeholderTextColor={secondaryInk}
            returnKeyType="search"
            onSubmitEditing={() => void loadComments(commentQuery, commentFilter, commentUserFilter)}
            style={[styles.searchInput, { color: primaryInk }]}
          />
        </View>
      ) : null}

      <Host style={styles.host} colorScheme={isDarkMode ? 'dark' : 'light'}>
        <PullToRefreshBox isRefreshing={refreshing} onRefresh={() => void handleRefresh()}>
          <LazyColumn
            modifiers={[fillMaxSize()]}
            verticalArrangement={{ spacedBy: 12 }}
            contentPadding={{ start: 16, end: 16, top: 10, bottom: bottomPad }}
          >
            {/* Compact Live KPI Summary */}
            <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Text style={{ typography: 'titleMedium' }}>
                  {`${totalPending} ${t.modKpiPending} · ${overview?.totalComments ?? comments.length} ${t.modKpiComments}`}
                </Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                  {`${overview?.totalUsers ?? members.length} ${t.modKpiUsers} · ${overview?.approvedChurches ?? approvedChurches.length} ${t.modApprovedChurches}`}
                </Text>
              </ListItem.SupportingContent>
            </ListItem>

            {/* 4-Tab Segmented Switcher */}
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              {tabs.map((tab) => (
                <SegmentedButton
                  key={tab.key}
                  selected={activeTab === tab.key}
                  onClick={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveTab(tab.key);
                  }}
                >
                  <SegmentedButton.Label>
                    <Text style={{ fontSize: 12 }}>{tab.label}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>

            {error ? (
              <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                <ListItem.HeadlineContent>
                  <Text color="#D64545" style={{ typography: 'titleSmall' }}>
                    {t.churchError}
                  </Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                    {error}
                  </Text>
                </ListItem.SupportingContent>
              </ListItem>
            ) : null}

            {/* ── TAB 1: UNIFIED INBOX ── */}
            {activeTab === 'inbox' ? (
              <>
                {totalPending === 0 ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'titleMedium' }}>{t.modAllClearTitle}</Text>
                    </ListItem.HeadlineContent>
                    <ListItem.SupportingContent>
                      <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                        {t.modAllClearInbox}
                      </Text>
                    </ListItem.SupportingContent>
                  </ListItem>
                ) : null}

                {reports.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {`${t.modTabReports.toUpperCase()} (${reports.length})`}
                    </Text>
                    {reports.map((rep) => {
                      const target = rep.verse_id
                        ? describeCommentTarget(rep.verse_id, langKey, t.modDailyVerseLabel)
                        : null;
                      return (
                        <ListItem
                          key={rep.id}
                          modifiers={[
                            fillMaxWidth(),
                            clip(CARD_SHAPE),
                            clickable(() => {
                              if (rep.user_id) onOpenMember(rep.user_id);
                            }),
                          ]}
                        >
                          <ListItem.OverlineContent>
                            <Text color="#D64545" style={{ typography: 'labelSmall' }}>
                              {target ? `${rep.reason} · ${target.label}` : rep.reason}
                            </Text>
                          </ListItem.OverlineContent>
                          <ListItem.HeadlineContent>
                            <Text style={{ typography: 'titleSmall' }}>
                              {rep.name || 'Miembro'}
                            </Text>
                          </ListItem.HeadlineContent>
                          <ListItem.SupportingContent>
                            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                              <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                                {rep.details ? `${rep.body}\n${rep.details}` : rep.body}
                              </Text>
                              <Row horizontalArrangement={{ spacedBy: 8 }}>
                                <OutlinedButton
                                  enabled={busyId === null}
                                  onClick={() =>
                                    void runAction(`dismiss-${rep.id}`, async () => {
                                      await api(`/mod/reports/${rep.id}/dismiss`, 'POST', {});
                                      await loadAll();
                                    })
                                  }
                                >
                                  <Text>{t.modDismissAction}</Text>
                                </OutlinedButton>
                                <FilledTonalButton
                                  enabled={busyId === null}
                                  onClick={() =>
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
                                  <Text color="#D64545">{t.modHideAction}</Text>
                                </FilledTonalButton>
                              </Row>
                            </Column>
                          </ListItem.SupportingContent>
                        </ListItem>
                      );
                    })}
                  </>
                ) : null}

                {pendingChurches.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {`${t.modTabChurches.toUpperCase()} (${pendingChurches.length})`}
                    </Text>
                    {pendingChurches.map((ch) => (
                      <ListItem key={ch.id} modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleSmall' }}>
                            {churchDisplayName(ch.name, ch.city)}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {`${ch.address}, ${ch.city}${ch.state ? `, ${ch.state}` : ''}${ch.pastorName ? ` · ${servantDisplayName(ch.pastorName)}` : ''}`}
                            </Text>
                            <Row horizontalArrangement={{ spacedBy: 8 }}>
                              <FilledTonalButton
                                enabled={busyId === null}
                                onClick={() =>
                                  void runAction(`app-ch-${ch.id}`, async () => {
                                    await api(`/mod/churches/${ch.id}/approve`, 'POST', {});
                                    await loadAll();
                                  })
                                }
                              >
                                <Text>{t.modApproveAction}</Text>
                              </FilledTonalButton>
                              <OutlinedButton
                                enabled={busyId === null}
                                onClick={() =>
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
                                <Text color="#D64545">{t.modRejectAction}</Text>
                              </OutlinedButton>
                            </Row>
                          </Column>
                        </ListItem.SupportingContent>
                      </ListItem>
                    ))}
                  </>
                ) : null}

                {pendingChoirs.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {`${t.modTabChoirs.toUpperCase()} (${pendingChoirs.length})`}
                    </Text>
                    {pendingChoirs.map((c) => (
                      <ListItem key={c.slug} modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleSmall' }}>
                            {es ? c.nameEs : c.nameEn}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {[c.churchContext, c.submittedByName].filter(Boolean).join(' · ')}
                            </Text>
                            <Row horizontalArrangement={{ spacedBy: 8 }}>
                              <FilledTonalButton
                                enabled={busyId === null}
                                onClick={() =>
                                  void runAction(`app-co-${c.slug}`, async () => {
                                    await api(`/mod/choirs/${c.slug}/approve`, 'POST', {});
                                    await Promise.all([loadAll(), refreshApprovedChoirs()]);
                                  })
                                }
                              >
                                <Text>{t.modApproveAction}</Text>
                              </FilledTonalButton>
                              <OutlinedButton
                                enabled={busyId === null}
                                onClick={() =>
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
                                <Text color="#D64545">{t.modRejectAction}</Text>
                              </OutlinedButton>
                            </Row>
                          </Column>
                        </ListItem.SupportingContent>
                      </ListItem>
                    ))}
                  </>
                ) : null}

                <Text
                  color={accentColor}
                  style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                >
                  {t.modRecentCommentsTitle.toUpperCase()}
                </Text>
                {comments.length === 0 ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'bodyMedium' }}>{t.modNoCommentsYet}</Text>
                    </ListItem.HeadlineContent>
                  </ListItem>
                ) : (
                  <>
                    {comments.slice(0, 4).map((c) => renderCommentCard(c))}
                    <OutlinedButton onClick={() => setActiveTab('comments')}>
                      <Text>{t.modSeeAllComments}</Text>
                    </OutlinedButton>
                  </>
                )}
              </>
            ) : null}

            {/* ── TAB 2: LIVE COMMENTS INSPECTOR ── */}
            {activeTab === 'comments' ? (
              <>
                {commentUserFilter ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'titleSmall' }}>
                        {t.modCommentsByUser.replace('{name}', commentUserFilter.name)}
                      </Text>
                    </ListItem.HeadlineContent>
                    <ListItem.SupportingContent>
                      <OutlinedButton onClick={handleClearCommentUserFilter}>
                        <Text>{t.modClearUserFilter}</Text>
                      </OutlinedButton>
                    </ListItem.SupportingContent>
                  </ListItem>
                ) : null}

                <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                  {commentFilters.map((f) => (
                    <SegmentedButton
                      key={f.key}
                      selected={commentFilter === f.key}
                      onClick={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setCommentFilter(f.key);
                        void loadComments(commentQuery, f.key, commentUserFilter);
                      }}
                    >
                      <SegmentedButton.Label>
                        <Text style={{ fontSize: 12 }}>{f.label}</Text>
                      </SegmentedButton.Label>
                    </SegmentedButton>
                  ))}
                </SingleChoiceSegmentedButtonRow>

                <FilledTonalButton
                  onClick={() => void loadComments(commentQuery, commentFilter, commentUserFilter)}
                >
                  <Text>{t.modSearchAction}</Text>
                </FilledTonalButton>

                {comments.length === 0 ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'bodyMedium' }}>{t.modNoCommentsYet}</Text>
                    </ListItem.HeadlineContent>
                  </ListItem>
                ) : (
                  comments.map((c) => renderCommentCard(c))
                )}
              </>
            ) : null}

            {/* ── TAB 3: MEMBER INSPECTOR ── */}
            {activeTab === 'members' ? (
              <>
                <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                  {memberFilters.map((f) => (
                    <SegmentedButton
                      key={f.key}
                      selected={memberFilter === f.key}
                      onClick={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setMemberFilter(f.key);
                        void loadMembers(memberQuery, f.key);
                      }}
                    >
                      <SegmentedButton.Label>
                        <Text style={{ fontSize: 11 }}>{f.label}</Text>
                      </SegmentedButton.Label>
                    </SegmentedButton>
                  ))}
                </SingleChoiceSegmentedButtonRow>

                <FilledTonalButton onClick={() => void loadMembers(memberQuery, memberFilter)}>
                  <Text>{t.modSearchAction}</Text>
                </FilledTonalButton>

                {members.length === 0 ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'bodyMedium' }}>{t.hymnsNoResultsFound}</Text>
                    </ListItem.HeadlineContent>
                  </ListItem>
                ) : (
                  members.map((m) => {
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
                      m.suspended_at ? t.modFilterSuspended : null,
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <ListItem
                        key={m.id}
                        modifiers={[fillMaxWidth(), clip(CARD_SHAPE), clickable(() => openMemberActions(m))]}
                      >
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleSmall' }}>{m.name}</Text>
                        </ListItem.HeadlineContent>
                        {meta ? (
                          <ListItem.SupportingContent>
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {meta}
                            </Text>
                          </ListItem.SupportingContent>
                        ) : null}
                      </ListItem>
                    );
                  })
                )}
              </>
            ) : null}

            {/* ── TAB 4: INSIGHTS, DIRECTORY & HYMN REACTIONS ── */}
            {activeTab === 'insights' ? (
              <>
                <Text
                  color={accentColor}
                  style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                >
                  {t.modAnalyticsTitle.toUpperCase()}
                </Text>
                {overview ? (
                  <>
                    <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleSmall' }}>{t.modTotalAccounts}</Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                          {`${overview.totalUsers} · ${t.modVerifiedEmails}: ${overview.verifiedUsers} · ${t.modNewLast7Days}: +${overview.newUsers7d}`}
                        </Text>
                      </ListItem.SupportingContent>
                    </ListItem>
                    <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleSmall' }}>{t.modSignInMethods}</Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                          {`${overview.oauthProviders.apple} Apple · ${overview.oauthProviders.google} Google`}
                        </Text>
                      </ListItem.SupportingContent>
                    </ListItem>
                    <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleSmall' }}>{t.modTotalComments}</Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                          {`${overview.totalComments} · ${t.modPushDevices}: ${overview.activePushDevices}`}
                        </Text>
                      </ListItem.SupportingContent>
                    </ListItem>
                  </>
                ) : null}

                {approvedChurches.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {`${t.modApprovedChurches.toUpperCase()} (${approvedChurches.length})`}
                    </Text>
                    {approvedChurches.map((ch) => (
                      <ListItem
                        key={ch.id}
                        modifiers={[fillMaxWidth(), clip(CARD_SHAPE), clickable(() => onOpenChurch(ch.id))]}
                      >
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleSmall' }}>
                            {churchDisplayName(ch.name, ch.city)}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                            {`${ch.city}${ch.state ? `, ${ch.state}` : ''} · ${ch.country}`}
                          </Text>
                        </ListItem.SupportingContent>
                      </ListItem>
                    ))}
                  </>
                ) : null}

                {approvedChoirs.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {`${t.modApprovedChoirs.toUpperCase()} (${approvedChoirs.length})`}
                    </Text>
                    {approvedChoirs.map((c) => {
                      const label =
                        choirDisplayName(c.slug, es, choirsBySlug) || (es ? c.nameEs : c.nameEn);
                      return (
                        <ListItem
                          key={c.slug}
                          modifiers={[
                            fillMaxWidth(),
                            clip(CARD_SHAPE),
                            ...(!BUILTIN_CHOIRS.has(c.slug)
                              ? [
                                  clickable(() =>
                                    confirmDestructive(t.delete, label, () => {
                                      void runAction(`del-co-${c.slug}`, async () => {
                                        await api(`/mod/choirs/${c.slug}`, 'DELETE');
                                        await Promise.all([loadAll(), refreshApprovedChoirs()]);
                                      });
                                    }),
                                  ),
                                ]
                              : []),
                          ]}
                        >
                          <ListItem.HeadlineContent>
                            <Text style={{ typography: 'titleSmall' }}>{label}</Text>
                          </ListItem.HeadlineContent>
                          <ListItem.SupportingContent>
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {`${c.nameEs} · ${c.nameEn}`}
                            </Text>
                          </ListItem.SupportingContent>
                        </ListItem>
                      );
                    })}
                  </>
                ) : null}

                {topDisliked.length > 0 ? (
                  <>
                    <Text
                      color={accentColor}
                      style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                    >
                      {t.modMostDisliked.toUpperCase()}
                    </Text>
                    {topDisliked.map((stat) => {
                      const hymn = hymnById.get(stat.hymnId);
                      return (
                        <ListItem
                          key={`dis-${stat.hymnId}`}
                          modifiers={[fillMaxWidth(), clip(CARD_SHAPE), clickable(() => onOpenHymn(stat.hymnId))]}
                        >
                          <ListItem.HeadlineContent>
                            <Text style={{ typography: 'titleSmall' }}>
                              {`${hymn?.number || stat.hymnId} · ${hymn?.title || `#${stat.hymnId}`}`}
                            </Text>
                          </ListItem.HeadlineContent>
                          <ListItem.SupportingContent>
                            <Text color="#D64545" style={{ typography: 'bodySmall' }}>
                              {`👎 ${stat.dislikesCount} · 👍 ${stat.likesCount}`}
                            </Text>
                          </ListItem.SupportingContent>
                        </ListItem>
                      );
                    })}
                  </>
                ) : null}

                <Text
                  color={accentColor}
                  style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}
                >
                  {t.modMostLiked.toUpperCase()}
                </Text>
                {topLiked.length === 0 ? (
                  <ListItem modifiers={[fillMaxWidth(), clip(CARD_SHAPE)]}>
                    <ListItem.HeadlineContent>
                      <Text style={{ typography: 'titleSmall' }}>{t.modHymnReactionsTitle}</Text>
                    </ListItem.HeadlineContent>
                    <ListItem.SupportingContent>
                      <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                        {t.modNoReactionsYet}
                      </Text>
                    </ListItem.SupportingContent>
                  </ListItem>
                ) : (
                  topLiked.map((stat) => {
                    const hymn = hymnById.get(stat.hymnId);
                    return (
                      <ListItem
                        key={`like-${stat.hymnId}`}
                        modifiers={[fillMaxWidth(), clip(CARD_SHAPE), clickable(() => onOpenHymn(stat.hymnId))]}
                      >
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleSmall' }}>
                            {`${hymn?.number || stat.hymnId} · ${hymn?.title || `#${stat.hymnId}`}`}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                            {`👍 ${stat.likesCount}`}
                          </Text>
                        </ListItem.SupportingContent>
                      </ListItem>
                    );
                  })
                )}
              </>
            ) : null}

            <Spacer modifiers={[height(8)]} />
          </LazyColumn>
        </PullToRefreshBox>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    height: 40,
    fontSize: 15,
  },
});
