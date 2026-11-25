/**
 * ProfileSubPages (iOS 26 Native SwiftUI Forms) — Native `@expo/ui/swift-ui`
 * implementations for Ministry, Choir (including full Admin Edit/Delete/Add),
 * My Church (native Liquid Glass Country menu Picker + Toggle), Account Details,
 * and Blocked Users.
 *
 * Keeps 100% parity with backend APIs, cross-free SF Symbols, Sacred Ink Light/Dark
 * tokens, bilingual `LanguageContext` strings, and `churchDisplayName` / `choirDisplayName`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { TextFieldRef } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, computeUserInitials } from '../../context/AuthContext';
import { useAvatarPicker } from '../../utils/useAvatarPicker';
import UserAvatar from '../UserAvatar';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { MINISTRIES, CHOIRS } from '../../data/communityRules';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { churchDisplayName } from '../../utils/churchName';
import { communityError, useCommunityApi } from '../../utils/communityApi';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';

export type NativeProfileSubPage =
  | 'ministry'
  | 'choir'
  | 'church-location'
  | 'account-edit'
  | 'blocks';

export interface ProfileSubPagesProps {
  section: NativeProfileSubPage;
  onBack: () => void;
  onOpenChurchesMap: () => void;
  onConfirmDeleteAccount: () => void;
}

const COUNTRY_OPTIONS: { id: string; es: string; en: string }[] = [
  { id: 'us', es: 'Estados Unidos', en: 'United States' },
  { id: 'mx', es: 'México', en: 'Mexico' },
  { id: 'gt', es: 'Guatemala', en: 'Guatemala' },
  { id: 'sv', es: 'El Salvador', en: 'El Salvador' },
  { id: 'hn', es: 'Honduras', en: 'Honduras' },
  { id: 'ca', es: 'Canadá', en: 'Canada' },
  { id: 'co', es: 'Colombia', en: 'Colombia' },
  { id: 'es', es: 'España', en: 'Spain' },
  { id: 'other', es: 'Otro', en: 'Other' },
];

function parseStoredLocation(loc: string | null | undefined): {
  countryId: string;
  region: string;
} {
  const raw = (loc || '').trim();
  if (!raw) return { countryId: 'none', region: '' };
  const parts = raw
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const first = parts[0] || '';
  const match = COUNTRY_OPTIONS.find(
    (c) =>
      c.es.toLowerCase() === first.toLowerCase() ||
      c.en.toLowerCase() === first.toLowerCase(),
  );
  if (match) {
    return {
      countryId: match.id,
      region: parts.slice(1).join(' · '),
    };
  }
  return { countryId: 'none', region: raw };
}

export default function ProfileSubPagesIOS({
  section,
  onBack,
  onOpenChurchesMap,
  onConfirmDeleteAccount,
}: ProfileSubPagesProps) {
  const swiftUI = getExpoSwiftUI();
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const {
    user,
    updateProfile,
    updateProfileName,
    requestEmailVerification,
    refreshUser,
  } = useAuth();
  const { favoriteIds } = useFavorites();
  const { playlists } = usePlaylists();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const {
    choirs: approvedChoirs,
    bySlug: choirsBySlug,
    refresh: refreshApprovedChoirs,
  } = useApprovedChoirs();
  const api = useCommunityApi();
  const { updatingAvatar, openAvatarMenu, runRemove } = useAvatarPicker();

  const es = language !== 'en';
  const isAdminUser =
    user?.role === 'admin' &&
    user.email.toLowerCase() === 'isaacduran167@gmail.com';
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  // ── Shared / Optimistic state for Ministry & Choir ──
  const [optimistic, setOptimistic] = useState<{
    ministry?: string | null;
    choir?: string | null;
  }>({});
  const saveSeqRef = useRef<{ ministry: number; choir: number }>({
    ministry: 0,
    choir: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<{ title: string; subtitle?: string } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Choir Admin Edit & Suggest/Add Form state ──
  const [choirFormOpen, setChoirFormOpen] = useState(false);
  const [choirNameDraft, setChoirNameDraft] = useState('');
  const [choirNameEnDraft, setChoirNameEnDraft] = useState('');
  const [choirContextDraft, setChoirContextDraft] = useState('');
  const [choirSubmitting, setChoirSubmitting] = useState(false);
  const [choirSubmitError, setChoirSubmitError] = useState<string | null>(null);
  const [deletingChoirSlug, setDeletingChoirSlug] = useState<string | null>(null);
  const [editingChoirSlug, setEditingChoirSlug] = useState<string | null>(null);
  const [editChoirEs, setEditChoirEs] = useState('');
  const [editChoirEn, setEditChoirEn] = useState('');
  const [savingChoirEdit, setSavingChoirEdit] = useState(false);
  const editChoirEsRef = useRef<TextFieldRef>(null);
  const editChoirEnRef = useRef<TextFieldRef>(null);
  const addChoirNameRef = useRef<TextFieldRef>(null);
  const addChoirNameEnRef = useRef<TextFieldRef>(null);
  const addChoirContextRef = useRef<TextFieldRef>(null);

  // ── Church & Location state ──
  const [churchDraft, setChurchDraft] = useState(user?.churchName || '');
  const [countryDraft, setCountryDraft] = useState<string>(
    () => parseStoredLocation(user?.location).countryId,
  );
  const [regionDraft, setRegionDraft] = useState<string>(
    () => parseStoredLocation(user?.location).region,
  );
  const [showPublicDraft, setShowPublicDraft] = useState<boolean>(
    user?.showChurchLocation === true,
  );
  const [savingChurch, setSavingChurch] = useState(false);
  const regionInputRef = useRef<TextFieldRef>(null);
  const churchInputRef = useRef<TextFieldRef>(null);

  // ── Account Edit state ──
  const [nameDraft, setNameDraft] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [emailAction, setEmailAction] = useState<'verification' | 'refresh' | null>(null);
  const nameInputRef = useRef<TextFieldRef>(null);

  // ── Blocked Users state ──
  const [blocks, setBlocks] = useState<{ id: string; name: string }[] | null>(null);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const flashBanner = useCallback((title: string, subtitle?: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setInfoBanner({ title, subtitle });
    bannerTimerRef.current = setTimeout(() => {
      setInfoBanner(null);
      bannerTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setError(null);
    setInfoBanner(null);
  }, [section, user?.id]);

  // Sync Church & Location fields on mount / user update
  useEffect(() => {
    if (section !== 'church-location' || !user) return;
    const parsed = parseStoredLocation(user.location);
    setChurchDraft(user.churchName || '');
    setCountryDraft(parsed.countryId);
    setRegionDraft(parsed.region);
    setShowPublicDraft(user.showChurchLocation === true);
    const tId = setTimeout(() => {
      regionInputRef.current?.setText(parsed.region).catch(() => {});
      churchInputRef.current?.setText(user.churchName || '').catch(() => {});
    }, 40);
    return () => clearTimeout(tId);
  }, [section, user]);

  // Sync Account Edit display name field
  useEffect(() => {
    if (section !== 'account-edit' || !user) return;
    const nextName = user.displayName || '';
    setNameDraft(nextName);
    const tId = setTimeout(() => {
      nameInputRef.current?.setText(nextName).catch(() => {});
    }, 40);
    return () => clearTimeout(tId);
  }, [section, user]);

  // Sync Admin inline choir edit inputs when switching choir
  useEffect(() => {
    if (!editingChoirSlug) return;
    const tId = setTimeout(() => {
      editChoirEsRef.current?.setText(editChoirEs).catch(() => {});
      editChoirEnRef.current?.setText(editChoirEn).catch(() => {});
    }, 40);
    return () => clearTimeout(tId);
    // Intentionally sync only when opening editor for a new choir slug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingChoirSlug]);

  // Load Blocked Users
  const loadBlocks = useCallback(async () => {
    if (!user) return;
    setLoadingBlocks(true);
    setError(null);
    try {
      const res = await api<{ users: { id: string; name: string }[] }>('/users/blocks');
      setBlocks(res.users || []);
    } catch (e) {
      setError(communityError(e, es));
    } finally {
      setLoadingBlocks(false);
    }
  }, [api, es, user]);

  useEffect(() => {
    if (section === 'blocks' && user) {
      void loadBlocks();
    }
  }, [loadBlocks, section, user]);

  // Group ministries into their 3 native SwiftUI sections
  const ministryGroups = useMemo(() => {
    const groups: { title: string; items: { key: string; label: string }[] }[] = [];
    let current: { title: string; items: { key: string; label: string }[] } | null = null;
    for (const [k, pair] of Object.entries(MINISTRIES)) {
      if (k === 'obispo') {
        current = { title: t.profilePastoralMinistry, items: [] };
        groups.push(current);
      } else if (k === 'secretario') {
        current = { title: t.profileLocalServiceTeaching, items: [] };
        groups.push(current);
      } else if (k === 'hermano') {
        current = { title: t.profileMembership, items: [] };
        groups.push(current);
      } else if (!current) {
        current = { title: t.profileMinistry, items: [] };
        groups.push(current);
      }
      current.items.push({ key: k, label: pair[es ? 0 : 1] });
    }
    return groups;
  }, [es, t.profileLocalServiceTeaching, t.profileMembership, t.profileMinistry, t.profilePastoralMinistry]);

  const handleSaveSelection = useCallback(
    async (field: 'ministry' | 'choir', value: string | null) => {
      if (!user) return;
      const currentVal =
        field in optimistic ? (optimistic[field] ?? null) : user[field] || null;
      if (currentVal === value) {
        Haptics.selectionAsync().catch(() => {});
        return;
      }
      Haptics.selectionAsync().catch(() => {});
      const seq = ++saveSeqRef.current[field];
      setOptimistic((prev) => ({ ...prev, [field]: value }));
      setError(null);
      try {
        await updateProfile({ [field]: value });
        if (seq === saveSeqRef.current[field]) {
          setOptimistic((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      } catch (e) {
        if (seq === saveSeqRef.current[field]) {
          setOptimistic((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
          setError(communityError(e, es));
        }
      }
    },
    [es, optimistic, updateProfile, user],
  );

  const handleStartEditChoir = useCallback(
    (slug: string) => {
      if (!isAdminUser || savingChoirEdit) return;
      Haptics.selectionAsync().catch(() => {});
      if (editingChoirSlug === slug) {
        setEditingChoirSlug(null);
        return;
      }
      const existing = choirsBySlug[slug];
      setEditChoirEs(existing?.nameEs || '');
      setEditChoirEn(existing?.nameEn || '');
      setError(null);
      setEditingChoirSlug(slug);
    },
    [choirsBySlug, editingChoirSlug, isAdminUser, savingChoirEdit],
  );

  const handleSaveEditChoir = useCallback(
    async (slug: string) => {
      if (!isAdminUser || savingChoirEdit) return;
      const cleanEs = editChoirEs.trim();
      const cleanEn = (editChoirEn.trim() || cleanEs).trim();
      if (cleanEs.length < 2 || cleanEn.length < 2) {
        setError(communityError(new Error('invalid_choir'), es));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setSavingChoirEdit(true);
      setError(null);
      try {
        await api(`/mod/choirs/${encodeURIComponent(slug)}`, 'PUT', {
          nameEs: cleanEs,
          nameEn: cleanEn,
        });
        await refreshApprovedChoirs();
        setEditingChoirSlug(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        flashBanner(t.choirSavedToast, es ? cleanEs : cleanEn);
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(communityError(e, es));
      } finally {
        setSavingChoirEdit(false);
      }
    },
    [
      api,
      editChoirEn,
      editChoirEs,
      es,
      flashBanner,
      isAdminUser,
      refreshApprovedChoirs,
      savingChoirEdit,
      t.choirSavedToast,
    ],
  );

  const handleDeleteChoir = useCallback(
    (slug: string, label: string) => {
      if (!isAdminUser || deletingChoirSlug) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t.choirRemoveTitle,
        t.choirRemoveBody.replace('{name}', label),
        [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.choirRemoveAction,
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setDeletingChoirSlug(slug);
                setError(null);
                try {
                  await api(`/mod/choirs/${encodeURIComponent(slug)}`, 'DELETE');
                  if (editingChoirSlug === slug) setEditingChoirSlug(null);
                  if (user?.choir === slug) {
                    setOptimistic((prev) => {
                      const next = { ...prev };
                      delete next.choir;
                      return next;
                    });
                    await Promise.all([refreshApprovedChoirs(), refreshUser()]);
                  } else {
                    await refreshApprovedChoirs();
                  }
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  flashBanner(t.choirRemovedToast, label);
                } catch (e) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  setError(communityError(e, es));
                } finally {
                  setDeletingChoirSlug(null);
                }
              })();
            },
          },
        ],
      );
    },
    [
      api,
      deletingChoirSlug,
      editingChoirSlug,
      es,
      flashBanner,
      isAdminUser,
      refreshApprovedChoirs,
      refreshUser,
      t.cancel,
      t.choirRemoveAction,
      t.choirRemoveBody,
      t.choirRemoveTitle,
      t.choirRemovedToast,
      user?.choir,
    ],
  );

  const handleOpenChoirForm = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (!user) return;
    if (!isAdminUser && !user.emailVerified) {
      Alert.alert(t.churchVerifyYourEmail, t.choirVerifyEmailNote);
      return;
    }
    setChoirNameDraft('');
    setChoirNameEnDraft('');
    setChoirContextDraft('');
    setChoirSubmitError(null);
    setChoirFormOpen(true);
  }, [isAdminUser, t.choirVerifyEmailNote, t.churchVerifyYourEmail, user]);

  const handleSubmitChoir = useCallback(async () => {
    if (choirSubmitting) return;
    const cleanName = choirNameDraft.trim();
    if (cleanName.length < 2) {
      setChoirSubmitError(communityError(new Error('invalid_choir'), es));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setChoirSubmitting(true);
    setChoirSubmitError(null);
    try {
      const res = await api<{
        ok: boolean;
        status: 'approved' | 'pending';
        choir: { slug: string; nameEs: string; nameEn: string };
      }>('/choirs/submit', 'POST', {
        name: cleanName,
        nameEn: choirNameEnDraft.trim() || undefined,
        churchContext: choirContextDraft.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const displayName = es ? res.choir.nameEs : res.choir.nameEn;
      setChoirNameDraft('');
      setChoirNameEnDraft('');
      setChoirContextDraft('');
      setChoirFormOpen(false);
      if (res.status === 'approved') {
        await refreshApprovedChoirs();
        flashBanner(t.choirPublishedToast, displayName);
      } else {
        flashBanner(t.choirSubmittedToast, displayName);
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setChoirSubmitError(communityError(e, es));
    } finally {
      setChoirSubmitting(false);
    }
  }, [
    api,
    choirContextDraft,
    choirNameDraft,
    choirNameEnDraft,
    choirSubmitting,
    es,
    flashBanner,
    refreshApprovedChoirs,
    t.choirPublishedToast,
    t.choirSubmittedToast,
  ]);

  const handleSaveChurchLocation = useCallback(async () => {
    if (!user || savingChurch) return;
    setSavingChurch(true);
    setError(null);
    try {
      const selectedCountry = COUNTRY_OPTIONS.find((c) => c.id === countryDraft);
      const countryLabel =
        selectedCountry && selectedCountry.id !== 'other'
          ? es
            ? selectedCountry.es
            : selectedCountry.en
          : '';
      const cleanRegion = regionDraft.trim();
      const combinedLocation =
        countryLabel && cleanRegion
          ? `${countryLabel} · ${cleanRegion}`.slice(0, 80)
          : countryLabel || cleanRegion || null;
      const cleanChurch = churchDraft.trim().slice(0, 80) || null;
      const nextChurchId =
        cleanChurch && cleanChurch === (user.churchName || null)
          ? user.churchId
          : null;
      await updateProfile({
        churchId: nextChurchId,
        churchName: cleanChurch,
        location: combinedLocation,
        showChurchLocation: showPublicDraft,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onBack();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(communityError(e, es));
    } finally {
      setSavingChurch(false);
    }
  }, [
    churchDraft,
    countryDraft,
    es,
    onBack,
    regionDraft,
    savingChurch,
    showPublicDraft,
    updateProfile,
    user,
  ]);

  const handleSaveName = useCallback(async () => {
    if (!user || savingName) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === (user.displayName || '').trim()) return;
    setSavingName(true);
    setError(null);
    try {
      await updateProfileName(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      flashBanner(t.authProfileSaved);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.message || t.churchError);
    } finally {
      setSavingName(false);
    }
  }, [flashBanner, nameDraft, savingName, t.authProfileSaved, t.churchError, updateProfileName, user]);

  const handleEmailVerification = useCallback(
    async (kind: 'verification' | 'refresh') => {
      if (!user || emailAction) return;
      setEmailAction(kind);
      setError(null);
      try {
        if (kind === 'verification') {
          await requestEmailVerification();
          flashBanner(t.authVerificationRequested);
        } else {
          const refreshed = await refreshUser();
          flashBanner(
            refreshed.emailVerified ? t.authEmailVerified : t.authVerificationPending,
          );
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err?.message || t.churchError);
      } finally {
        setEmailAction(null);
      }
    },
    [
      emailAction,
      flashBanner,
      refreshUser,
      requestEmailVerification,
      t.authEmailVerified,
      t.authVerificationPending,
      t.authVerificationRequested,
      t.churchError,
      user,
    ],
  );

  const handleUnblock = useCallback(
    async (blockedId: string) => {
      if (unblockingId) return;
      Haptics.selectionAsync().catch(() => {});
      setUnblockingId(blockedId);
      setError(null);
      try {
        await api(`/users/${blockedId}/block`, 'DELETE');
        setBlocks((prev) => prev?.filter((x) => x.id !== blockedId) || []);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        setError(communityError(e, es));
      } finally {
        setUnblockingId(null);
      }
    },
    [api, es, unblockingId],
  );

  if (!swiftUI || !user) return null;

  const {
    Button,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    Picker,
    ProgressView,
    RNHostView,
    Section,
    Spacer,
    Text,
    TextField,
    Toggle,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    accessibilityLabel,
    buttonBorderShape,
    buttonStyle,
    contentShape,
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
    multilineTextAlignment,
    padding,
    pickerStyle,
    refreshable,
    scrollDismissesKeyboard,
    scrollEdgeEffectStyle,
    shapes,
    submitLabel,
    tag,
    textContentType,
    textInputAutocapitalization,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const prominentFill = isDarkMode ? '#fdf9f2' : '#6e1619';
  const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
  const toggleTint = isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary;
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const bottomPad = hasMiniPlayer ? 92 : 28;

  const chevron = (
    <SwiftUIImage
      systemName="chevron.right"
      size={13}
      modifiers={[foregroundStyle(tertiaryStyle)]}
    />
  );

  const renderTintedIcon = (systemImage: SFSymbol, size?: number) => (
    <SwiftUIImage
      systemName={systemImage}
      size={size}
      modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
    />
  );

  const renderLeadingFieldIcon = (systemImage: SFSymbol) => (
    <SwiftUIImage
      systemName={systemImage}
      size={16}
      modifiers={[
        foregroundStyle(secondaryStyle),
        frame({ width: 22, alignment: 'center' }),
      ]}
    />
  );

  const renderStatusBanner = () =>
    infoBanner ? (
      <Section>
        <HStack alignment="center" spacing={10}>
          <SwiftUIImage
            systemName="checkmark.circle.fill"
            size={18}
            modifiers={[foregroundStyle({ type: 'color', color: '#2E9E56' })]}
          />
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' })]}>
              {infoBanner.title}
            </Text>
            {infoBanner.subtitle ? (
              <Text
                modifiers={[
                  font({ textStyle: 'footnote' }),
                  foregroundStyle(secondaryStyle),
                ]}
              >
                {infoBanner.subtitle}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </Section>
    ) : null;

  const renderErrorSection = () =>
    error ? (
      <Section>
        <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle('#D64545')]}>
          {error}
        </Text>
      </Section>
    ) : null;

  // ── 1. MINISTRY SUB-PAGE ──────────────────────────────────────────────────
  if (section === 'ministry') {
    const activeMinistry =
      'ministry' in optimistic ? (optimistic.ministry ?? null) : user.ministry || null;

    const renderMinistryRow = (key: string | null, label: string) => {
      const checked = activeMinistry === key;
      return (
        <Button
          key={key || 'none'}
          modifiers={[foregroundStyle(primaryStyle)]}
          onPress={() => void handleSaveSelection('ministry', key)}
        >
          <HStack
            alignment="center"
            spacing={10}
            modifiers={[contentShape(shapes.rectangle())]}
          >
            <Text
              modifiers={[
                font({ textStyle: 'body', weight: checked ? 'semibold' : 'regular' }),
              ]}
            >
              {label}
            </Text>
            <Spacer />
            {checked ? (
              <SwiftUIImage
                systemName="checkmark"
                size={15}
                modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
              />
            ) : null}
          </HStack>
        </Button>
      );
    };

    return (
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollEdgeEffectStyle('soft', 'all'),
          ]}
        >
          <Section
            modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
            footer={<Text>{t.profileChooseYourMinistryOrMembershipTo}</Text>}
          >
            {renderMinistryRow(null, t.profilePreferNotToShow)}
          </Section>

          {ministryGroups.map((group, idx) => (
            <Section
              key={group.title}
              title={group.title}
              footer={
                idx === ministryGroups.length - 1 ? (
                  <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                    <Text> </Text>
                  </VStack>
                ) : undefined
              }
            >
              {group.items.map((item) => renderMinistryRow(item.key, item.label))}
            </Section>
          ))}

          {renderErrorSection()}
        </Form>
      </Host>
    );
  }

  // ── 2. CHOIR SUB-PAGE (WITH FULL ADMIN EDIT / DELETE / ADD ACCESS) ────────
  if (section === 'choir') {
    const activeChoir =
      'choir' in optimistic ? (optimistic.choir ?? null) : user.choir || null;
    const otherLabel = CHOIRS.otro[es ? 0 : 1];

    return (
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollDismissesKeyboard('interactively'),
            scrollEdgeEffectStyle('soft', 'all'),
          ]}
        >
          {renderStatusBanner()}

          <Section
            modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
            footer={<Text>{t.profileChooseYourChoirToShowNext}</Text>}
          >
            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => void handleSaveSelection('choir', null)}
            >
              <HStack
                alignment="center"
                spacing={10}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Text
                  modifiers={[
                    font({
                      textStyle: 'body',
                      weight: activeChoir === null ? 'semibold' : 'regular',
                    }),
                  ]}
                >
                  {t.profilePreferNotToShow}
                </Text>
                <Spacer />
                {activeChoir === null ? (
                  <SwiftUIImage
                    systemName="checkmark"
                    size={15}
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                  />
                ) : null}
              </HStack>
            </Button>

            {approvedChoirs.map((c) => {
              const label = es ? c.nameEs : c.nameEn;
              const checked = activeChoir === c.slug;
              const isDeletingThis = deletingChoirSlug === c.slug;
              const isEditingThis = isAdminUser && editingChoirSlug === c.slug;

              if (!isAdminUser) {
                return (
                  <Button
                    key={c.slug}
                    modifiers={[foregroundStyle(primaryStyle)]}
                    onPress={() => void handleSaveSelection('choir', c.slug)}
                  >
                    <HStack
                      alignment="center"
                      spacing={10}
                      modifiers={[contentShape(shapes.rectangle())]}
                    >
                      <Text
                        modifiers={[
                          font({
                            textStyle: 'body',
                            weight: checked ? 'semibold' : 'regular',
                          }),
                        ]}
                      >
                        {label}
                      </Text>
                      <Spacer />
                      {checked ? (
                        <SwiftUIImage
                          systemName="checkmark"
                          size={15}
                          modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                        />
                      ) : null}
                    </HStack>
                  </Button>
                );
              }

              return (
                <HStack key={c.slug} alignment="center" spacing={10}>
                  <Button
                    modifiers={[
                      buttonStyle('borderless'),
                      foregroundStyle(primaryStyle),
                      disabled(Boolean(deletingChoirSlug || savingChoirEdit)),
                    ]}
                    onPress={() => void handleSaveSelection('choir', c.slug)}
                  >
                    <HStack
                      alignment="center"
                      spacing={8}
                      modifiers={[contentShape(shapes.rectangle())]}
                    >
                      <Text
                        modifiers={[
                          font({
                            textStyle: 'body',
                            weight: checked ? 'semibold' : 'regular',
                          }),
                          lineLimit(1),
                          truncationMode('tail'),
                        ]}
                      >
                        {label}
                      </Text>
                      {checked ? (
                        <SwiftUIImage
                          systemName="checkmark"
                          size={14}
                          modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                        />
                      ) : null}
                      <Spacer />
                    </HStack>
                  </Button>

                  <Button
                    modifiers={[
                      buttonStyle('borderless'),
                      disabled(Boolean(deletingChoirSlug || savingChoirEdit)),
                      accessibilityLabel(`${t.choirEditAction} ${label}`),
                    ]}
                    onPress={() => handleStartEditChoir(c.slug)}
                  >
                    <SwiftUIImage
                      systemName={isEditingThis ? 'pencil.circle.fill' : 'pencil'}
                      size={16}
                      modifiers={[
                        foregroundStyle(
                          isEditingThis
                            ? { type: 'color', color: symbolTint }
                            : secondaryStyle,
                        ),
                      ]}
                    />
                  </Button>

                  <Button
                    modifiers={[
                      buttonStyle('borderless'),
                      disabled(Boolean(deletingChoirSlug || savingChoirEdit)),
                      accessibilityLabel(`${t.choirRemoveAction} ${label}`),
                    ]}
                    onPress={() => handleDeleteChoir(c.slug, label)}
                  >
                    {isDeletingThis ? (
                      <ProgressView />
                    ) : (
                      <SwiftUIImage
                        systemName="trash"
                        size={15}
                        modifiers={[
                          foregroundStyle({
                            type: 'color',
                            color: isDarkMode ? '#FF6B6B' : '#D64545',
                          }),
                        ]}
                      />
                    )}
                  </Button>
                </HStack>
              );
            })}

            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => void handleSaveSelection('choir', 'otro')}
            >
              <HStack
                alignment="center"
                spacing={10}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Text
                  modifiers={[
                    font({
                      textStyle: 'body',
                      weight: activeChoir === 'otro' ? 'semibold' : 'regular',
                    }),
                  ]}
                >
                  {otherLabel}
                </Text>
                <Spacer />
                {activeChoir === 'otro' ? (
                  <SwiftUIImage
                    systemName="checkmark"
                    size={15}
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                  />
                ) : null}
              </HStack>
            </Button>
          </Section>

          {/* ── Admin Inline Choir Name Editor ── */}
          {isAdminUser && editingChoirSlug ? (
            <Section title={t.profileChoirEditTitle}>
              <HStack alignment="center" spacing={10}>
                {renderLeadingFieldIcon('music.note')}
                <TextField
                  ref={editChoirEsRef}
                  placeholder={t.choirNameLabel}
                  onTextChange={setEditChoirEs}
                  modifiers={[
                    textInputAutocapitalization('words'),
                    submitLabel('next'),
                    disabled(savingChoirEdit),
                  ]}
                />
              </HStack>
              <HStack alignment="center" spacing={10}>
                {renderLeadingFieldIcon('globe')}
                <TextField
                  ref={editChoirEnRef}
                  placeholder={t.choirNameEnLabel}
                  onTextChange={setEditChoirEn}
                  modifiers={[
                    textInputAutocapitalization('words'),
                    submitLabel('done'),
                    disabled(savingChoirEdit),
                  ]}
                />
              </HStack>
              <HStack alignment="center" spacing={12}>
                <Button
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    tint(prominentFill),
                    disabled(savingChoirEdit),
                  ]}
                  onPress={() => void handleSaveEditChoir(editingChoirSlug)}
                >
                  <HStack alignment="center" spacing={6}>
                    <Spacer />
                    {savingChoirEdit ? (
                      <ProgressView />
                    ) : (
                      <Text
                        modifiers={[
                          font({ textStyle: 'subheadline', weight: 'semibold' }),
                          foregroundStyle({ type: 'color', color: prominentInk }),
                        ]}
                      >
                        {t.choirSaveAction}
                      </Text>
                    )}
                    <Spacer />
                  </HStack>
                </Button>
                <Button
                  modifiers={[
                    buttonStyle('bordered'),
                    buttonBorderShape('capsule'),
                    disabled(savingChoirEdit),
                  ]}
                  onPress={() => setEditingChoirSlug(null)}
                >
                  <Text modifiers={[font({ textStyle: 'subheadline' })]}>{t.cancel}</Text>
                </Button>
              </HStack>
            </Section>
          ) : null}

          {/* ── Add Choir (Admin) / Suggest Choir (Member) ── */}
          {!choirFormOpen ? (
            <Section
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={handleOpenChoirForm}
              >
                <HStack
                  alignment="center"
                  spacing={10}
                  modifiers={[contentShape(shapes.rectangle())]}
                >
                  <Label icon={renderTintedIcon('plus.circle.fill', 20)}>
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                        {isAdminUser ? t.choirAdminAddTitle : t.choirSuggestTitle}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {isAdminUser ? t.choirAdminAddSubtitle : t.choirSuggestSubtitle}
                      </Text>
                    </VStack>
                  </Label>
                  <Spacer />
                  {chevron}
                </HStack>
              </Button>
            </Section>
          ) : (
            <Section
              title={isAdminUser ? t.choirAdminAddTitle : t.choirSuggestTitle}
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  {choirSubmitError ? (
                    <Text modifiers={[foregroundStyle('#D64545')]}>
                      {choirSubmitError}
                    </Text>
                  ) : (
                    <Text>
                      {isAdminUser ? t.choirAdminAddSubtitle : t.choirSuggestSubtitle}
                    </Text>
                  )}
                </VStack>
              }
            >
              <HStack alignment="center" spacing={10}>
                {renderLeadingFieldIcon('music.note')}
                <TextField
                  ref={addChoirNameRef}
                  placeholder={t.choirNamePlaceholder}
                  onTextChange={setChoirNameDraft}
                  modifiers={[
                    textInputAutocapitalization('words'),
                    submitLabel('next'),
                    disabled(choirSubmitting),
                  ]}
                />
              </HStack>
              {isAdminUser ? (
                <HStack alignment="center" spacing={10}>
                  {renderLeadingFieldIcon('globe')}
                  <TextField
                    ref={addChoirNameEnRef}
                    placeholder={t.choirNameEnPlaceholder}
                    onTextChange={setChoirNameEnDraft}
                    modifiers={[
                      textInputAutocapitalization('words'),
                      submitLabel('next'),
                      disabled(choirSubmitting),
                    ]}
                  />
                </HStack>
              ) : null}
              <HStack alignment="center" spacing={10}>
                {renderLeadingFieldIcon('building.columns')}
                <TextField
                  ref={addChoirContextRef}
                  placeholder={t.choirChurchContextPlaceholder}
                  onTextChange={setChoirContextDraft}
                  modifiers={[
                    textInputAutocapitalization('words'),
                    submitLabel('done'),
                    disabled(choirSubmitting),
                  ]}
                />
              </HStack>
              <HStack alignment="center" spacing={12}>
                <Button
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    tint(prominentFill),
                    disabled(choirSubmitting),
                  ]}
                  onPress={() => void handleSubmitChoir()}
                >
                  <HStack alignment="center" spacing={6}>
                    <Spacer />
                    {choirSubmitting ? (
                      <ProgressView />
                    ) : (
                      <Text
                        modifiers={[
                          font({ textStyle: 'subheadline', weight: 'semibold' }),
                          foregroundStyle({ type: 'color', color: prominentInk }),
                        ]}
                      >
                        {isAdminUser ? t.choirPublishBtn : t.choirSubmitBtn}
                      </Text>
                    )}
                    <Spacer />
                  </HStack>
                </Button>
                <Button
                  modifiers={[
                    buttonStyle('bordered'),
                    buttonBorderShape('capsule'),
                    disabled(choirSubmitting),
                  ]}
                  onPress={() => {
                    setChoirFormOpen(false);
                    setChoirSubmitError(null);
                  }}
                >
                  <Text modifiers={[font({ textStyle: 'subheadline' })]}>{t.cancel}</Text>
                </Button>
              </HStack>
            </Section>
          )}

          {renderErrorSection()}
        </Form>
      </Host>
    );
  }

  // ── 3. MY CHURCH & LOCATION SUB-PAGE ──────────────────────────────────────
  if (section === 'church-location') {
    return (
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollDismissesKeyboard('interactively'),
            scrollEdgeEffectStyle('soft', 'all'),
          ]}
        >
          {/* ── Verified Church Directory Map Card ── */}
          <Section
            title={t.profileVerifiedDirectory}
            modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
          >
            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onOpenChurchesMap();
              }}
            >
              <HStack
                alignment="center"
                spacing={10}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Label icon={renderTintedIcon('map.fill')}>
                  <VStack alignment="leading" spacing={2}>
                    <HStack alignment="center" spacing={6}>
                      <Text
                        modifiers={[
                          font({ textStyle: 'body', weight: 'semibold' }),
                          lineLimit(1),
                          truncationMode('tail'),
                        ]}
                      >
                        {user.churchId && user.churchName
                          ? churchDisplayName(user.churchName)
                          : t.profilePickMyChurchOnTheMap}
                      </Text>
                      {user.churchId ? (
                        <SwiftUIImage
                          systemName="checkmark.seal.fill"
                          size={14}
                          modifiers={[foregroundStyle({ type: 'color', color: '#34C759' })]}
                        />
                      ) : null}
                    </HStack>
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {user.churchId
                        ? t.profileOfficialLinkedChurchTapToView
                        : t.profileTapAVerifiedChurchOnThe}
                    </Text>
                  </VStack>
                </Label>
                <Spacer />
                {chevron}
              </HStack>
            </Button>
          </Section>

          {/* ── Native Country Menu Picker + City + Local Church ── */}
          <Section title={t.profileChurchLocation}>
            <Picker
              label={
                <Label
                  title={t.profileCountry}
                  icon={renderTintedIcon('globe')}
                />
              }
              selection={countryDraft}
              onSelectionChange={(next) => {
                if (typeof next === 'string') {
                  Haptics.selectionAsync().catch(() => {});
                  setCountryDraft(next);
                }
              }}
              modifiers={[pickerStyle('menu'), disabled(savingChurch)]}
            >
              <Text modifiers={[tag('none')]}>{t.profileNone}</Text>
              {COUNTRY_OPTIONS.map((c) => (
                <Text key={c.id} modifiers={[tag(c.id)]}>
                  {es ? c.es : c.en}
                </Text>
              ))}
            </Picker>

            <HStack alignment="center" spacing={10}>
              {renderLeadingFieldIcon('mappin.and.ellipse')}
              <TextField
                ref={regionInputRef}
                placeholder={t.profileEGRiverbankCa}
                onTextChange={setRegionDraft}
                modifiers={[
                  textInputAutocapitalization('words'),
                  submitLabel('next'),
                  disabled(savingChurch),
                ]}
              />
            </HStack>

            <HStack alignment="center" spacing={10}>
              {renderLeadingFieldIcon('building.columns')}
              <TextField
                ref={churchInputRef}
                placeholder={t.profileEGElBuenPastor}
                onTextChange={setChurchDraft}
                modifiers={[
                  textInputAutocapitalization('words'),
                  submitLabel('done'),
                  disabled(savingChurch),
                ]}
              />
            </HStack>
          </Section>

          {/* ── Public Visibility Toggle ── */}
          <Section footer={<Text>{t.profileOptionalOnlyShownWhenSomeoneTaps}</Text>}>
            <Toggle
              isOn={showPublicDraft}
              onIsOnChange={(nextOn) => {
                Haptics.selectionAsync().catch(() => {});
                setShowPublicDraft(nextOn);
              }}
              modifiers={[tint(toggleTint), disabled(savingChurch)]}
            >
              <Label
                title={t.profileShowOnMyProfile}
                icon={renderTintedIcon('eye')}
                modifiers={[foregroundStyle(primaryStyle)]}
              />
            </Toggle>
          </Section>

          {renderErrorSection()}

          {/* ── Borderless Prominent Capsule Save CTA ── */}
          <Section
            footer={
              <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                <Text> </Text>
              </VStack>
            }
          >
            <Button
              onPress={() => void handleSaveChurchLocation()}
              modifiers={[
                buttonStyle('borderedProminent'),
                buttonBorderShape('capsule'),
                controlSize('large'),
                tint(prominentFill),
                disabled(savingChurch),
                listRowBackground('clear'),
                listRowInsets({ top: 2, leading: 0, bottom: 2, trailing: 0 }),
              ]}
            >
              <HStack alignment="center" spacing={8}>
                <Spacer />
                {savingChurch ? (
                  <ProgressView />
                ) : (
                  <Text
                    modifiers={[
                      font({ textStyle: 'body', weight: 'semibold' }),
                      foregroundStyle({ type: 'color', color: prominentInk }),
                    ]}
                  >
                    {savingChurch ? t.profileSaving : t.save}
                  </Text>
                )}
                <Spacer />
              </HStack>
            </Button>
          </Section>
        </Form>
      </Host>
    );
  }

  // ── 4. ACCOUNT DETAILS / EDIT PROFILE SUB-PAGE ────────────────────────────
  if (section === 'account-edit') {
    const nameChanged =
      nameDraft.trim().length > 0 &&
      nameDraft.trim() !== (user.displayName || '').trim();
    const statsSummary = `${favoriteIds.length} ${t.tabFavorites.toLowerCase()} · ${playlists.length} ${t.playlistsTabShort.toLowerCase()}`;
    const avatarInitials =
      user.initials || computeUserInitials(user.displayName, user.email);
    const avatarBg = isDarkMode ? '#F3EEE8' : '#6e1619';
    const avatarText = isDarkMode ? '#1A1A1A' : '#FFFFFF';

    return (
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollDismissesKeyboard('interactively'),
            scrollEdgeEffectStyle('soft', 'all'),
          ]}
        >
          {renderStatusBanner()}

          <Section
            modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
            footer={<Text>{t.avatarHint}</Text>}
          >
            {typeof RNHostView === 'function' ? (
              <HStack alignment="center">
                <Spacer />
                <VStack
                  alignment="center"
                  spacing={10}
                  modifiers={[padding({ vertical: 10 })]}
                >
                  <Button
                    modifiers={[buttonStyle('plain'), disabled(updatingAvatar)]}
                    onPress={openAvatarMenu}
                  >
                    <ZStack
                      alignment="center"
                      modifiers={[frame({ width: 78, height: 78 })]}
                    >
                      <RNHostView matchContents>
                        <UserAvatar
                          uri={user.avatarUrl}
                          initials={avatarInitials}
                          size={76}
                          fontSize={28}
                          backgroundColor={avatarBg}
                          textColor={avatarText}
                          showEditBadge
                          editBadgeBg={prominentFill}
                          editBadgeIconColor={prominentInk}
                          editBadgeBorderColor={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
                        />
                      </RNHostView>
                    </ZStack>
                  </Button>
                </VStack>
                <Spacer />
              </HStack>
            ) : null}

            <Button
              modifiers={[foregroundStyle(primaryStyle), disabled(updatingAvatar)]}
              onPress={openAvatarMenu}
            >
              <HStack
                alignment="center"
                spacing={10}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Label
                  title={updatingAvatar ? t.avatarUpdating : t.avatarChangeAction}
                  icon={renderTintedIcon('camera')}
                />
                <Spacer />
                {updatingAvatar ? <ProgressView /> : chevron}
              </HStack>
            </Button>

            {user.avatarUrl ? (
              <Button
                role="destructive"
                modifiers={[disabled(updatingAvatar)]}
                onPress={() => void runRemove()}
              >
                <Label title={t.avatarRemovePhoto} systemImage="trash" />
              </Button>
            ) : null}
          </Section>

          <Section title={t.authNameLabel}>
            <HStack alignment="center" spacing={10}>
              {renderLeadingFieldIcon('person')}
              <TextField
                ref={nameInputRef}
                placeholder={t.authNamePlaceholder}
                onTextChange={setNameDraft}
                modifiers={[
                  textContentType('name'),
                  textInputAutocapitalization('words'),
                  submitLabel('done'),
                  disabled(savingName),
                ]}
              />
            </HStack>

            {nameChanged ? (
              <Button
                modifiers={[
                  buttonStyle('borderedProminent'),
                  buttonBorderShape('capsule'),
                  tint(prominentFill),
                  disabled(savingName),
                ]}
                onPress={() => void handleSaveName()}
              >
                <HStack alignment="center" spacing={8}>
                  <Spacer />
                  {savingName ? (
                    <ProgressView />
                  ) : (
                    <Text
                      modifiers={[
                        font({ textStyle: 'body', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: prominentInk }),
                      ]}
                    >
                      {t.save}
                    </Text>
                  )}
                  <Spacer />
                </HStack>
              </Button>
            ) : null}
          </Section>

          <Section title={t.accountStatus}>
            <LabeledContent label={t.authEmailLabel}>
              <Text
                modifiers={[
                  foregroundStyle(secondaryStyle),
                  lineLimit(1),
                  truncationMode('tail'),
                ]}
              >
                {user.email}
              </Text>
            </LabeledContent>

            <LabeledContent label={t.accountStatus}>
              <Text
                modifiers={[
                  foregroundStyle(
                    user.emailVerified
                      ? { type: 'color', color: '#34C759' }
                      : secondaryStyle,
                  ),
                ]}
              >
                {user.emailVerified ? `${t.accountVerified} · ${statsSummary}` : t.accountUnverified}
              </Text>
            </LabeledContent>

            {!user.emailVerified ? (
              <>
                <Button
                  modifiers={[foregroundStyle(primaryStyle), disabled(Boolean(emailAction))]}
                  onPress={() => void handleEmailVerification('verification')}
                >
                  <HStack
                    alignment="center"
                    spacing={10}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    <Label
                      title={t.authSendVerification}
                      icon={renderTintedIcon('envelope')}
                    />
                    <Spacer />
                    {emailAction === 'verification' ? <ProgressView /> : null}
                  </HStack>
                </Button>

                <Button
                  modifiers={[foregroundStyle(primaryStyle), disabled(Boolean(emailAction))]}
                  onPress={() => void handleEmailVerification('refresh')}
                >
                  <HStack
                    alignment="center"
                    spacing={10}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    <Label
                      title={t.authRefreshVerification}
                      icon={renderTintedIcon('arrow.clockwise')}
                    />
                    <Spacer />
                    {emailAction === 'refresh' ? <ProgressView /> : null}
                  </HStack>
                </Button>
              </>
            ) : null}
          </Section>

          {renderErrorSection()}

          <Section
            title={t.dangerZoneTitle}
            footer={
              <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                <Text modifiers={[foregroundStyle(secondaryStyle)]}>
                  {t.dangerZoneFooter}
                </Text>
              </VStack>
            }
          >
            <Button role="destructive" onPress={onConfirmDeleteAccount}>
              <Label title={t.authDeleteAccount} systemImage="trash" />
            </Button>
          </Section>
        </Form>
      </Host>
    );
  }

  // ── 5. BLOCKED USERS SUB-PAGE ─────────────────────────────────────────────
  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
      <Form
        modifiers={[
          refreshable(loadBlocks),
          tint(symbolTint),
          listSectionSpacing('compact'),
          scrollEdgeEffectStyle('soft', 'all'),
        ]}
      >
        <Section
          modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
          footer={
            <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
              <Text> </Text>
            </VStack>
          }
        >
          {loadingBlocks && !blocks ? (
            <HStack alignment="center">
              <Spacer />
              <ProgressView />
              <Spacer />
            </HStack>
          ) : !blocks?.length ? (
            <HStack alignment="center">
              <Spacer />
              <VStack
                alignment="center"
                spacing={8}
                modifiers={[padding({ vertical: 18, horizontal: 12 })]}
              >
                <SwiftUIImage
                  systemName="hand.raised.slash"
                  size={28}
                  modifiers={[foregroundStyle(secondaryStyle)]}
                />
                <Text
                  modifiers={[
                    font({ textStyle: 'subheadline' }),
                    foregroundStyle(secondaryStyle),
                    multilineTextAlignment('center'),
                  ]}
                >
                  {t.profileNoBlockedUsers}
                </Text>
              </VStack>
              <Spacer />
            </HStack>
          ) : (
            blocks.map((b) => (
              <HStack key={b.id} alignment="center" spacing={10}>
                <Text modifiers={[font({ textStyle: 'body', weight: 'medium' })]}>
                  {b.name}
                </Text>
                <Spacer />
                <Button
                  modifiers={[
                    buttonStyle('bordered'),
                    buttonBorderShape('capsule'),
                    controlSize('small'),
                    tint(symbolTint),
                    disabled(Boolean(unblockingId)),
                  ]}
                  onPress={() => void handleUnblock(b.id)}
                >
                  {unblockingId === b.id ? (
                    <ProgressView />
                  ) : (
                    <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}>
                      {t.profileUnblock}
                    </Text>
                  )}
                </Button>
              </HStack>
            ))
          )}
        </Section>

        {renderErrorSection()}
      </Form>
    </Host>
  );
}
