/**
 * ModerationScreen (Android Material 3 Expressive Jetpack Compose) — Admin Command Center.
 *
 * Parity with iOS `ModerationScreen.ios.tsx`:
 * - Native Compose `PullToRefreshBox` + `LazyColumn` + `ListItem` + `SingleChoiceSegmentedButtonRow`
 * - Live Community Analytics KPI strip (`GET /mod/overview`)
 * - 5 tabs: Reports | Churches | Members | Choirs | Insights (Hymn Reactions)
 * - Member search + filter pills (`Recent`, `Pending Obispo`, `Suspended`, `All`)
 * - 1-tap actions: Verify Obispo, Verify Email, Clear Photo, Suspend/Restore, Approve/Reject Churches & Choirs
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
  type MaterialColors,
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
import { choirDisplayName } from '../../data/communityRules';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { churchDisplayName, servantDisplayName } from '../../utils/churchName';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { communityError, useCommunityApi } from '../../utils/communityApi';
import { showSuccessToast } from '../../utils/toast';
import type { ModerationScreenProps } from './ModerationScreen';

type ModTab = 'reports' | 'churches' | 'members' | 'choirs' | 'insights';
type MemberFilter = 'recent' | 'pending_obispo' | 'suspended' | 'all';

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
  user_id: string | null;
  name: string | null;
  body: string;
  reason: string;
  details: string | null;
  created_at: number;
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
  providers?: string[];
};

type HymnReactionStat = {
  hymnId: string;
  likesCount: number;
  dislikesCount: number;
  updatedAt: number;
};

const ADMIN_EMAIL = 'isaacduran167@gmail.com';
const ROW_SHAPE = Shapes.RoundedCorner(20);
const SEED_COLOR = '#6E1619';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ typography: 'labelLarge', fontWeight: '700' }}>
      {title}
    </Text>
  );
}

function EmptyCard({
  title,
  subtitle,
  materialColors,
}: {
  title: string;
  subtitle: string;
  materialColors: MaterialColors;
}) {
  return (
    <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
      <ListItem.HeadlineContent>
        <Text style={{ typography: 'titleMedium' }}>{title}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
          {subtitle}
        </Text>
      </ListItem.SupportingContent>
    </ListItem>
  );
}

export default function ModerationScreenAndroid({
  onOpenMember,
  onOpenChurch,
  onOpenHymn,
}: ModerationScreenProps) {
  const { isDarkMode } = useTheme();
  const { language, hymnLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const { bySlug: choirsBySlug, refresh: refreshApprovedChoirs } = useApprovedChoirs();
  const api = useCommunityApi();
  const insets = useSafeAreaInsets();

  const colorScheme = isDarkMode ? 'dark' : 'light';
  const materialColors = useMaterialColors({
    colorScheme,
    seedColor: SEED_COLOR,
  });

  const es = language !== 'en';
  const isAdmin =
    user?.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL;
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const [activeTab, setActiveTab] = useState<ModTab>('reports');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('recent');
  const [memberQuery, setMemberQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [overview, setOverview] = useState<ModOverview | null>(null);
  const [reports, setReports] = useState<ModReport[]>([]);
  const [churches, setChurches] = useState<ModChurch[]>([]);
  const [choirs, setChoirs] = useState<ModChoir[]>([]);
  const [members, setMembers] = useState<ModMember[]>([]);
  const [reactions, setReactions] = useState<HymnReactionStat[]>([]);

  const hymnLookup = useMemo(() => {
    const map = new Map<string, { title: string; numberLabel: string }>();
    for (const item of [...hymnsData, ...estribillosData]) {
      const loc = getLocalizedHymn(item as any, language === 'en' ? 'en' : hymnLanguage);
      const id = String(item.id);
      map.set(id, {
        title: loc.title || item.title,
        numberLabel: id.toUpperCase().startsWith('E') ? id : `#${item.number ?? id}`,
      });
    }
    return map;
  }, [hymnLanguage, language]);

  const loadMembers = useCallback(
    async (q: string, filter: MemberFilter) => {
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        params.set('filter', filter);
        const res = await api<{ users?: ModMember[] }>(`/mod/users?${params.toString()}`);
        setMembers(Array.isArray(res.users) ? res.users : []);
      } catch {
        // Keep current list on transient error
      }
    },
    [api],
  );

  const loadAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [ov, rep, ch, cr, rx] = await Promise.allSettled([
        api<ModOverview>('/mod/overview'),
        api<{ reports?: ModReport[] }>('/mod/reports'),
        api<{ churches?: ModChurch[] }>('/mod/churches'),
        api<{ choirs?: ModChoir[] }>('/mod/choirs'),
        api<{ reactions?: HymnReactionStat[] }>('/mod/hymns/reactions'),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (rep.status === 'fulfilled') setReports(Array.isArray(rep.value.reports) ? rep.value.reports : []);
      if (ch.status === 'fulfilled') setChurches(Array.isArray(ch.value.churches) ? ch.value.churches : []);
      if (cr.status === 'fulfilled') setChoirs(Array.isArray(cr.value.choirs) ? cr.value.choirs : []);
      if (rx.status === 'fulfilled') setReactions(Array.isArray(rx.value.reactions) ? rx.value.reactions : []);
      await loadMembers(memberQuery, memberFilter);
    } finally {
      setLoading(false);
    }
  }, [api, isAdmin, loadMembers, memberFilter, memberQuery]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      void loadMembers(memberQuery, memberFilter);
    }, 240);
    return () => clearTimeout(timer);
  }, [isAdmin, loadMembers, memberFilter, memberQuery]);

  const runAction = useCallback(
    async (id: string, task: () => Promise<void>, successMessage: string) => {
      setBusyId(id);
      try {
        await task();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showSuccessToast(successMessage);
        await loadAll();
      } catch (err) {
        Alert.alert('Error', communityError(err, es));
      } finally {
        setBusyId(null);
      }
    },
    [es, loadAll],
  );

  if (!isAdmin) {
    return null;
  }

  const pendingChurches = churches.filter((c) => c.status === 'pending');
  const pendingChoirs = choirs.filter((c) => c.status === 'pending');
  const topLiked = [...reactions].filter((r) => r.likesCount > 0).sort((a, b) => b.likesCount - a.likesCount).slice(0, 15);
  const topDisliked = [...reactions].filter((r) => r.dislikesCount > 0).sort((a, b) => b.dislikesCount - a.dislikesCount).slice(0, 15);

  return (
    <View style={[styles.container, { backgroundColor: materialColors.surface }]}>
      {activeTab === 'members' ? (
        <View style={[styles.searchBarWrap, { backgroundColor: materialColors.surface }]}>
          <TextInput
            value={memberQuery}
            onChangeText={setMemberQuery}
            placeholder={es ? 'Buscar por nombre, correo o iglesia…' : 'Search by name, email, or church…'}
            placeholderTextColor={String(materialColors.onSurfaceVariant)}
            style={[
              styles.searchInput,
              {
                color: String(materialColors.onSurface),
                backgroundColor: String(materialColors.surfaceContainerHigh),
              },
            ]}
          />
        </View>
      ) : null}

      <Host style={styles.host} seedColor={SEED_COLOR} colorScheme={colorScheme}>
        <PullToRefreshBox
          isRefreshing={loading}
          onRefresh={() => void loadAll()}
          modifiers={[fillMaxSize()]}
        >
          <LazyColumn
            verticalArrangement={{ spacedBy: 14 }}
            contentPadding={{
              start: 16,
              end: 16,
              top: 12,
              bottom: Math.max(40, insets.bottom + (hasMiniPlayer ? 96 : 28)),
            }}
          >
            {/* ─── Live KPI Summary Strip ─── */}
            {overview ? (
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                <SectionHeader title={es ? 'RESUMEN EN VIVO' : 'LIVE OVERVIEW'} />
                <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
                  <ListItem.HeadlineContent>
                    <Text style={{ typography: 'titleMedium' }}>
                      {es
                        ? `${overview.totalUsers} cuentas (${overview.verifiedUsers} verificadas)`
                        : `${overview.totalUsers} accounts (${overview.verifiedUsers} verified)`}
                    </Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                      {`+${overview.newUsers7d} (7d) · Apple ${overview.oauthProviders.apple} · Google ${overview.oauthProviders.google} · Push ${overview.activePushDevices}`}
                    </Text>
                  </ListItem.SupportingContent>
                </ListItem>
                <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
                  <ListItem.HeadlineContent>
                    <Text style={{ typography: 'titleMedium' }}>
                      {es
                        ? `${overview.openReports} reportes · ${overview.pendingChurches} iglesias · ${overview.pendingChoirs} coros`
                        : `${overview.openReports} reports · ${overview.pendingChurches} churches · ${overview.pendingChoirs} choirs`}
                    </Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                      {es
                        ? `${overview.approvedChurches} iglesias aprobadas · ${overview.approvedChoirs} coros · ${overview.totalComments} comentarios`
                        : `${overview.approvedChurches} approved churches · ${overview.approvedChoirs} choirs · ${overview.totalComments} comments`}
                    </Text>
                  </ListItem.SupportingContent>
                </ListItem>
              </Column>
            ) : null}

            {/* ─── 5-Tab Switcher ─── */}
            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                {(['reports', 'churches', 'members'] as ModTab[]).map((tabKey) => (
                  <SegmentedButton
                    key={tabKey}
                    selected={activeTab === tabKey}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <SegmentedButton.Label>
                      <Text>
                        {tabKey === 'reports'
                          ? es ? `Reportes (${reports.length})` : `Reports (${reports.length})`
                          : tabKey === 'churches'
                            ? es ? `Iglesias (${pendingChurches.length})` : `Churches (${pendingChurches.length})`
                            : es ? 'Miembros' : 'Members'}
                      </Text>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                ))}
              </SingleChoiceSegmentedButtonRow>
              <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                {(['choirs', 'insights'] as ModTab[]).map((tabKey) => (
                  <SegmentedButton
                    key={tabKey}
                    selected={activeTab === tabKey}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <SegmentedButton.Label>
                      <Text>
                        {tabKey === 'choirs'
                          ? es ? `Coros (${pendingChoirs.length})` : `Choirs (${pendingChoirs.length})`
                          : es ? 'Reacciones' : 'Insights'}
                      </Text>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                ))}
              </SingleChoiceSegmentedButtonRow>
            </Column>

            {/* ─── Tab 1: Reports ─── */}
            {activeTab === 'reports' ? (
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                <SectionHeader title={es ? 'REPORTES ABIERTOS' : 'OPEN REPORTS'} />
                {reports.length === 0 ? (
                  <EmptyCard
                    title={es ? 'Todo en orden' : 'All Clear'}
                    subtitle={es ? 'No hay reportes abiertos.' : 'No open reports.'}
                    materialColors={materialColors}
                  />
                ) : (
                  reports.map((rep) => (
                    <ListItem key={rep.id} modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleMedium' }}>
                          {`${rep.name || (es ? 'Miembro' : 'Member')} · ${rep.reason}`}
                        </Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                            {rep.body}
                          </Text>
                          <Row horizontalArrangement={{ spacedBy: 8 }}>
                            <FilledTonalButton
                              enabled={busyId !== rep.id}
                              onClick={() =>
                                void runAction(
                                  rep.id,
                                  async () => {
                                    await api(`/mod/comments/${encodeURIComponent(rep.comment_id)}/hide`, 'POST', {
                                      hidden: true,
                                    });
                                    await api(`/mod/reports/${encodeURIComponent(rep.id)}/resolve`, 'POST', {
                                      action: 'hidden',
                                    });
                                  },
                                  es ? 'Comentario ocultado' : 'Comment hidden',
                                )
                              }
                            >
                              <Text>{es ? 'Ocultar' : 'Hide'}</Text>
                            </FilledTonalButton>
                            <OutlinedButton
                              enabled={busyId !== rep.id}
                              onClick={() =>
                                void runAction(
                                  rep.id,
                                  async () => {
                                    await api(`/mod/reports/${encodeURIComponent(rep.id)}/resolve`, 'POST', {
                                      action: 'dismissed',
                                    });
                                  },
                                  es ? 'Reporte descartado' : 'Report dismissed',
                                )
                              }
                            >
                              <Text>{es ? 'Descartar' : 'Dismiss'}</Text>
                            </OutlinedButton>
                          </Row>
                        </Column>
                      </ListItem.SupportingContent>
                    </ListItem>
                  ))
                )}
              </Column>
            ) : null}

            {/* ─── Tab 2: Pending Churches ─── */}
            {activeTab === 'churches' ? (
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                <SectionHeader title={es ? 'IGLESIAS PENDIENTES' : 'PENDING CHURCHES'} />
                {pendingChurches.length === 0 ? (
                  <EmptyCard
                    title={es ? 'Sin solicitudes pendientes' : 'No Pending Churches'}
                    subtitle={es ? 'Todas las congregaciones fueron revisadas.' : 'All church submissions have been reviewed.'}
                    materialColors={materialColors}
                  />
                ) : (
                  pendingChurches.map((ch) => (
                    <ListItem
                      key={ch.id}
                      modifiers={[fillMaxWidth(), clip(ROW_SHAPE), clickable(() => onOpenChurch(ch.id))]}
                    >
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleMedium' }}>{churchDisplayName(ch.name)}</Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Column verticalArrangement={{ spacedBy: 6 }} modifiers={[fillMaxWidth()]}>
                          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                            {[ch.address, ch.city, ch.state, ch.country].filter(Boolean).join(', ')}
                          </Text>
                          {ch.pastorName ? (
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {servantDisplayName(ch.pastorName)}
                            </Text>
                          ) : null}
                          <Row horizontalArrangement={{ spacedBy: 8 }}>
                            <FilledTonalButton
                              enabled={busyId !== ch.id}
                              onClick={() =>
                                void runAction(
                                  ch.id,
                                  async () => {
                                    await api(`/mod/churches/${encodeURIComponent(ch.id)}/approve`, 'POST');
                                  },
                                  es ? 'Iglesia aprobada' : 'Church approved',
                                )
                              }
                            >
                              <Text>{es ? 'Aprobar' : 'Approve'}</Text>
                            </FilledTonalButton>
                            <OutlinedButton
                              enabled={busyId !== ch.id}
                              onClick={() =>
                                void runAction(
                                  ch.id,
                                  async () => {
                                    await api(`/mod/churches/${encodeURIComponent(ch.id)}/reject`, 'POST');
                                  },
                                  es ? 'Iglesia rechazada' : 'Church rejected',
                                )
                              }
                            >
                              <Text>{es ? 'Rechazar' : 'Reject'}</Text>
                            </OutlinedButton>
                          </Row>
                        </Column>
                      </ListItem.SupportingContent>
                    </ListItem>
                  ))
                )}
              </Column>
            ) : null}

            {/* ─── Tab 3: Members ─── */}
            {activeTab === 'members' ? (
              <Column verticalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
                <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                  {(['recent', 'pending_obispo', 'suspended', 'all'] as MemberFilter[]).map((f) => (
                    <SegmentedButton
                      key={f}
                      selected={memberFilter === f}
                      onClick={() => setMemberFilter(f)}
                    >
                      <SegmentedButton.Label>
                        <Text>
                          {f === 'recent'
                            ? es ? 'Recientes' : 'Recent'
                            : f === 'pending_obispo'
                              ? es ? 'Obispo' : 'Bishop'
                              : f === 'suspended'
                                ? es ? 'Susp.' : 'Susp.'
                                : es ? 'Todos' : 'All'}
                        </Text>
                      </SegmentedButton.Label>
                    </SegmentedButton>
                  ))}
                </SingleChoiceSegmentedButtonRow>

                {members.length === 0 ? (
                  <EmptyCard
                    title={es ? 'Sin resultados' : 'No Members Found'}
                    subtitle={es ? 'Ajusta el filtro o la búsqueda.' : 'Try adjusting your search or filter.'}
                    materialColors={materialColors}
                  />
                ) : (
                  members.map((m) => {
                    const isVerifiedBadge = Boolean(m.badgeVerified ?? m.badge_verified);
                    const isSuspended = Boolean(m.suspended_at);
                    const choirLabel = m.choir ? choirDisplayName(m.choir, es, choirsBySlug) : null;
                    const meta = [m.email, m.churchName ? churchDisplayName(m.churchName) : null, choirLabel]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <ListItem
                        key={m.id}
                        modifiers={[fillMaxWidth(), clip(ROW_SHAPE), clickable(() => onOpenMember(m.id))]}
                      >
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleMedium' }}>
                            {`${m.name}${isVerifiedBadge ? ' ✓' : ''}${isSuspended ? (es ? ' (Suspendido)' : ' (Suspended)') : ''}`}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <Column verticalArrangement={{ spacedBy: 6 }} modifiers={[fillMaxWidth()]}>
                            {meta ? (
                              <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                                {meta}
                              </Text>
                            ) : null}
                            <Row horizontalArrangement={{ spacedBy: 8 }}>
                              {!m.emailVerified ? (
                                <FilledTonalButton
                                  enabled={busyId !== m.id}
                                  onClick={() =>
                                    void runAction(
                                      m.id,
                                      async () => {
                                        await api(`/mod/users/${encodeURIComponent(m.id)}/verify-email`, 'POST');
                                      },
                                      es ? 'Correo verificado' : 'Email verified',
                                    )
                                  }
                                >
                                  <Text>{es ? 'Verificar correo' : 'Verify Email'}</Text>
                                </FilledTonalButton>
                              ) : null}
                              {m.ministry === 'obispo' ? (
                                <OutlinedButton
                                  enabled={busyId !== m.id}
                                  onClick={() =>
                                    void runAction(
                                      m.id,
                                      async () => {
                                        await api(`/mod/users/${encodeURIComponent(m.id)}/badge`, 'POST', {
                                          verified: !isVerifiedBadge,
                                        });
                                      },
                                      isVerifiedBadge
                                        ? (es ? 'Insignia retirada' : 'Badge removed')
                                        : (es ? 'Obispo verificado' : 'Bishop verified'),
                                    )
                                  }
                                >
                                  <Text>{isVerifiedBadge ? (es ? 'Quitar sello' : 'Unverify') : (es ? 'Verificar Obispo' : 'Verify Bishop')}</Text>
                                </OutlinedButton>
                              ) : null}
                              {m.avatarUrl ? (
                                <OutlinedButton
                                  enabled={busyId !== m.id}
                                  onClick={() =>
                                    void runAction(
                                      m.id,
                                      async () => {
                                        await api(`/mod/users/${encodeURIComponent(m.id)}/clear-avatar`, 'POST');
                                      },
                                      es ? 'Foto retirada' : 'Photo removed',
                                    )
                                  }
                                >
                                  <Text>{es ? 'Quitar foto' : 'Clear Photo'}</Text>
                                </OutlinedButton>
                              ) : null}
                              <OutlinedButton
                                enabled={busyId !== m.id}
                                onClick={() =>
                                  void runAction(
                                    m.id,
                                    async () => {
                                      await api(`/mod/users/${encodeURIComponent(m.id)}/suspend`, 'POST', {
                                        suspended: !isSuspended,
                                      });
                                    },
                                    isSuspended
                                      ? (es ? 'Cuenta restaurada' : 'Account restored')
                                      : (es ? 'Cuenta suspendida' : 'Account suspended'),
                                  )
                                }
                              >
                                <Text>{isSuspended ? (es ? 'Restaurar' : 'Restore') : (es ? 'Suspender' : 'Suspend')}</Text>
                              </OutlinedButton>
                            </Row>
                          </Column>
                        </ListItem.SupportingContent>
                      </ListItem>
                    );
                  })
                )}
              </Column>
            ) : null}

            {/* ─── Tab 4: Pending Choirs ─── */}
            {activeTab === 'choirs' ? (
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                <SectionHeader title={es ? 'COROS PENDIENTES' : 'PENDING CHOIRS'} />
                {pendingChoirs.length === 0 ? (
                  <EmptyCard
                    title={es ? 'Sin coros pendientes' : 'No Pending Choirs'}
                    subtitle={es ? 'Todas las sugerencias de coros fueron revisadas.' : 'All choir suggestions have been reviewed.'}
                    materialColors={materialColors}
                  />
                ) : (
                  pendingChoirs.map((cr) => (
                    <ListItem key={cr.slug} modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
                      <ListItem.HeadlineContent>
                        <Text style={{ typography: 'titleMedium' }}>
                          {es ? cr.nameEs : cr.nameEn || cr.nameEs}
                        </Text>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Column verticalArrangement={{ spacedBy: 6 }} modifiers={[fillMaxWidth()]}>
                          {cr.churchContext ? (
                            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                              {cr.churchContext}
                            </Text>
                          ) : null}
                          <Row horizontalArrangement={{ spacedBy: 8 }}>
                            <FilledTonalButton
                              enabled={busyId !== cr.slug}
                              onClick={() =>
                                void runAction(
                                  cr.slug,
                                  async () => {
                                    await api(`/mod/choirs/${encodeURIComponent(cr.slug)}/approve`, 'POST');
                                    await refreshApprovedChoirs();
                                  },
                                  es ? 'Coro aprobado' : 'Choir approved',
                                )
                              }
                            >
                              <Text>{es ? 'Aprobar' : 'Approve'}</Text>
                            </FilledTonalButton>
                            <OutlinedButton
                              enabled={busyId !== cr.slug}
                              onClick={() =>
                                void runAction(
                                  cr.slug,
                                  async () => {
                                    await api(`/mod/choirs/${encodeURIComponent(cr.slug)}/reject`, 'POST');
                                  },
                                  es ? 'Coro rechazado' : 'Choir rejected',
                                )
                              }
                            >
                              <Text>{es ? 'Rechazar' : 'Reject'}</Text>
                            </OutlinedButton>
                          </Row>
                        </Column>
                      </ListItem.SupportingContent>
                    </ListItem>
                  ))
                )}
              </Column>
            ) : null}

            {/* ─── Tab 5: Hymn Reactions Insights ─── */}
            {activeTab === 'insights' ? (
              <Column verticalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
                <SectionHeader title={es ? 'HIMNOS MÁS GUSTADOS' : 'TOP LIKED HYMNS'} />
                {topLiked.length === 0 ? (
                  <EmptyCard
                    title={es ? 'Sin reacciones aún' : 'No Reactions Yet'}
                    subtitle={es ? 'Aquí verás los himnos más gustados.' : 'Top liked hymns will appear here.'}
                    materialColors={materialColors}
                  />
                ) : (
                  topLiked.map((rx) => {
                    const info = hymnLookup.get(rx.hymnId);
                    return (
                      <ListItem
                        key={`like-${rx.hymnId}`}
                        modifiers={[fillMaxWidth(), clip(ROW_SHAPE), clickable(() => onOpenHymn(rx.hymnId))]}
                      >
                        <ListItem.HeadlineContent>
                          <Text style={{ typography: 'titleMedium' }}>
                            {info ? `${info.numberLabel} · ${info.title}` : rx.hymnId}
                          </Text>
                        </ListItem.HeadlineContent>
                        <ListItem.TrailingContent>
                          <Text color={materialColors.primary} style={{ typography: 'labelLarge', fontWeight: '700' }}>
                            {`♥ ${rx.likesCount}`}
                          </Text>
                        </ListItem.TrailingContent>
                      </ListItem>
                    );
                  })
                )}

                {topDisliked.length > 0 ? (
                  <>
                    <Spacer modifiers={[height(8)]} />
                    <SectionHeader title={es ? 'REVISAR AUDIO / LETRA (NO ME GUSTA)' : 'CHECK AUDIO / LYRICS (DISLIKES)'} />
                    {topDisliked.map((rx) => {
                      const info = hymnLookup.get(rx.hymnId);
                      return (
                        <ListItem
                          key={`dislike-${rx.hymnId}`}
                          modifiers={[fillMaxWidth(), clip(ROW_SHAPE), clickable(() => onOpenHymn(rx.hymnId))]}
                        >
                          <ListItem.HeadlineContent>
                            <Text style={{ typography: 'titleMedium' }}>
                              {info ? `${info.numberLabel} · ${info.title}` : rx.hymnId}
                            </Text>
                          </ListItem.HeadlineContent>
                          <ListItem.TrailingContent>
                            <Text color={materialColors.error} style={{ typography: 'labelLarge', fontWeight: '700' }}>
                              {`👎 ${rx.dislikesCount}`}
                            </Text>
                          </ListItem.TrailingContent>
                        </ListItem>
                      );
                    })}
                  </>
                ) : null}
              </Column>
            ) : null}
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
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInput: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
  },
});
