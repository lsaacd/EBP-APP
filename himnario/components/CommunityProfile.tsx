import { churchDisplayName } from "../utils/churchName";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "../utils/haptics";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { MINISTRIES, CHOIRS, choirDisplayName } from "../data/communityRules";
import { useApprovedChoirs } from "../utils/choirsStore";
import FriendsPanel from "./FriendsPanel";
import NotificationsPanel from "./NotificationsPanel";
import { useFriends } from "../utils/friendsStore";
import { useNotifications } from "../utils/notificationsStore";
import type { NotificationDestination } from "../utils/notifications";
import { communityError, useCommunityApi } from "../utils/communityApi";
import { fonts } from "../theme/theme";
import CommunityModeration from "./CommunityModeration";
import AppMenuIcon from "./AppMenuIcon";
import { AnimatedField } from "./AnimatedField";
import type { ActionToastMessage } from "./ActionToast";

const COUNTRY_OPTIONS: { id: string; es: string; en: string }[] = [
  { id: "us", es: "Estados Unidos", en: "United States" },
  { id: "mx", es: "México", en: "Mexico" },
  { id: "gt", es: "Guatemala", en: "Guatemala" },
  { id: "sv", es: "El Salvador", en: "El Salvador" },
  { id: "hn", es: "Honduras", en: "Honduras" },
  { id: "ca", es: "Canadá", en: "Canada" },
  { id: "co", es: "Colombia", en: "Colombia" },
  { id: "es", es: "España", en: "Spain" },
  { id: "other", es: "Otro", en: "Other" },
];

function parseStoredLocation(loc: string | null | undefined): { countryId: string | null; region: string } {
  const raw = (loc || "").trim();
  if (!raw) return { countryId: null, region: "" };
  const parts = raw.split("·").map((s) => s.trim()).filter(Boolean);
  const first = parts[0] || "";
  const match = COUNTRY_OPTIONS.find(
    (c) =>
      c.es.toLowerCase() === first.toLowerCase() ||
      c.en.toLowerCase() === first.toLowerCase(),
  );
  if (match) {
    return {
      countryId: match.id,
      region: parts.slice(1).join(" · "),
    };
  }
  return { countryId: null, region: raw };
}

export type CommunitySubPage = "ministry" | "choir" | "church-location" | "blocks" | "moderation" | "friends" | "notifications";

export default function CommunityProfile({
  subPage = null,
  onOpenSubPage,
  onBack,
  onOpenChurchesMap,
  onOpenHymn,
  onNotificationNavigate,
}: {
  subPage?: CommunitySubPage | null;
  onOpenSubPage?: (page: CommunitySubPage) => void;
  onBack?: () => void;
  onOpenChurchesMap?: () => void;
  /** Close the sheet and open a hymn (from a friend's favourites). */
  onOpenHymn?: (hymnId: string) => void;
  onNotificationNavigate?: (destination: NotificationDestination) => void;
}) {
  const { user, updateProfile } = useAuth(),
    { theme, isDarkMode } = useTheme(),
    { language, t } = useLanguage(),
    es = language === "es",
    api = useCommunityApi();
  const { lists: friendLists, badgeCount: friendsBadge, refresh: refreshFriends } = useFriends();
  const { unreadCount: notificationsUnread, refresh: refreshNotifications } = useNotifications();
  const { choirs: approvedChoirs, bySlug: choirsBySlug, refresh: refreshApprovedChoirs } = useApprovedChoirs();
  const isAdminUser =
    user?.role === "admin" &&
    user.email.toLowerCase() === "isaacduran167@gmail.com";
  const [choirModalOpen, setChoirModalOpen] = useState(false);
  const [choirNameDraft, setChoirNameDraft] = useState("");
  const [choirNameEnDraft, setChoirNameEnDraft] = useState("");
  const [choirContextDraft, setChoirContextDraft] = useState("");
  const [choirSubmitError, setChoirSubmitError] = useState("");
  const [choirSubmitting, setChoirSubmitting] = useState(false);
  const [choirToast, setChoirToast] = useState<ActionToastMessage | null>(null);
  const choirToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choirNameEnRef = useRef<TextInput>(null);
  const choirContextRef = useRef<TextInput>(null);

  const showChoirToast = useCallback(
    (title: string, subtitle?: string) => {
      if (choirToastTimerRef.current) clearTimeout(choirToastTimerRef.current);
      setChoirToast({ id: Date.now(), title, subtitle, icon: "check" });
      choirToastTimerRef.current = setTimeout(() => {
        setChoirToast(null);
        choirToastTimerRef.current = null;
      }, 2600);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (choirToastTimerRef.current) clearTimeout(choirToastTimerRef.current);
    };
  }, []);

  const resetChoirForm = useCallback(() => {
    setChoirNameDraft("");
    setChoirNameEnDraft("");
    setChoirContextDraft("");
    setChoirSubmitError("");
  }, []);

  const requestCloseChoirModal = useCallback(() => {
    if (choirSubmitting) return;
    const dirty =
      choirNameDraft.trim().length > 0 ||
      choirNameEnDraft.trim().length > 0 ||
      choirContextDraft.trim().length > 0;
    if (!dirty) {
      Keyboard.dismiss();
      setChoirModalOpen(false);
      return;
    }
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t.churchDiscardDraftTitle, t.choirDiscardDraftBody, [
      { text: t.churchKeepEditing, style: "cancel" },
      {
        text: t.churchDiscardAction,
        style: "destructive",
        onPress: () => {
          resetChoirForm();
          setChoirModalOpen(false);
        },
      },
    ]);
  }, [
    choirContextDraft,
    choirNameDraft,
    choirNameEnDraft,
    choirSubmitting,
    resetChoirForm,
    t.choirDiscardDraftBody,
    t.churchDiscardAction,
    t.churchDiscardDraftTitle,
    t.churchKeepEditing,
  ]);

  const handleOpenChoirModal = useCallback(() => {
    Haptics.selectionAsync();
    if (!user) return;
    if (!isAdminUser && !user.emailVerified) {
      Alert.alert(t.churchVerifyYourEmail, t.choirVerifyEmailNote);
      return;
    }
    resetChoirForm();
    setChoirModalOpen(true);
  }, [isAdminUser, resetChoirForm, t.choirVerifyEmailNote, t.churchVerifyYourEmail, user]);

  const handleSubmitChoir = useCallback(async () => {
    if (choirSubmitting) return;
    const cleanName = choirNameDraft.trim();
    if (cleanName.length < 2) {
      setChoirSubmitError(communityError(new Error("invalid_choir"), es));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setChoirSubmitting(true);
    setChoirSubmitError("");
    try {
      const res = await api<{
        ok: boolean;
        status: "approved" | "pending";
        choir: { slug: string; nameEs: string; nameEn: string };
      }>("/choirs/submit", "POST", {
        name: cleanName,
        nameEn: choirNameEnDraft.trim() || undefined,
        churchContext: choirContextDraft.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const displayName = es ? res.choir.nameEs : res.choir.nameEn;
      resetChoirForm();
      setChoirModalOpen(false);
      if (res.status === "approved") {
        await refreshApprovedChoirs();
        showChoirToast(t.choirPublishedToast, displayName);
      } else {
        showChoirToast(t.choirSubmittedToast, displayName);
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
    refreshApprovedChoirs,
    resetChoirForm,
    showChoirToast,
    t.choirPublishedToast,
    t.choirSubmittedToast,
  ]);
  // One fetch when the signed-in account's profile mounts keeps the badges current.
  useEffect(() => {
    if (user?.id && !subPage) {
      void refreshFriends();
      void refreshNotifications();
    }
  }, [refreshFriends, refreshNotifications, subPage, user?.id]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [optimistic, setOptimistic] = useState<{
    ministry?: string | null;
    choir?: string | null;
  }>({});
  const saveSeqRef = useRef<{ ministry: number; choir: number }>({ ministry: 0, choir: 0 });
  const [blocks, setBlocks] = useState<{ id: string; name: string }[] | null>(
    null,
  );
  const [churchDraft, setChurchDraft] = useState(user?.churchName || "");
  const [countryDraft, setCountryDraft] = useState<string | null>(() => parseStoredLocation(user?.location).countryId);
  const [regionDraft, setRegionDraft] = useState<string>(() => parseStoredLocation(user?.location).region);
  const [showPublicDraft, setShowPublicDraft] = useState<boolean>(user?.showChurchLocation === true);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  useEffect(() => {
    setOptimistic({});
    setBlocks(null);
    setError("");
  }, [user?.id]);

  useEffect(() => {
    if (subPage === "church-location" && user) {
      setChurchDraft(user.churchName || "");
      const parsed = parseStoredLocation(user.location);
      setCountryDraft(parsed.countryId);
      setRegionDraft(parsed.region);
      setShowPublicDraft(user.showChurchLocation === true);
      setCountryPickerOpen(false);
      setError("");
    }
  }, [subPage, user?.id, user?.churchName, user?.location, user?.showChurchLocation]);

  useEffect(() => {
    if (subPage !== "blocks" || !user) return;
    let cancelled = false;
    setBusy(true);
    setError("");
    void api<{ users: { id: string; name: string }[] }>("/users/blocks")
      .then((r) => {
        if (!cancelled) setBlocks(r.users);
      })
      .catch((e) => {
        if (!cancelled) setError(communityError(e, es));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, es, subPage, user?.id]);

  if (!user) return null;

  const iconTint = isDarkMode ? "#FFFFFF" : theme.primary;
  const cardBg = isDarkMode ? "#222225" : "#FFFFFF";
  const cardBorder = isDarkMode
    ? "rgba(255,255,255,0.08)"
    : theme.outlineVariant + "50";
  const mutedText = isDarkMode
    ? "rgba(235,235,245,0.58)"
    : theme.onSurfaceVariant;

  const save = async (field: "ministry" | "choir", value: string | null) => {
    const currentVal =
      field in optimistic ? optimistic[field] ?? null : user[field] || null;
    if (currentVal === value) {
      Haptics.selectionAsync();
      return;
    }
    Haptics.selectionAsync();
    const seq = ++saveSeqRef.current[field];
    setOptimistic((prev) => ({ ...prev, [field]: value }));
    setError("");
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
  };

  if (subPage === "ministry" || subPage === "choir") {
    const field = subPage;
    const items: { key: string | null; label: string }[] =
      field === "ministry"
        ? [
            { key: null, label: t.profilePreferNotToShow },
            ...Object.entries(MINISTRIES).map(([k, pair]) => ({
              key: k,
              label: pair[es ? 0 : 1],
            })),
          ]
        : [
            { key: null, label: t.profilePreferNotToShow },
            ...approvedChoirs.map((c) => ({
              key: c.slug,
              label: es ? c.nameEs : c.nameEn,
            })),
            { key: "otro", label: CHOIRS.otro[es ? 0 : 1] },
          ];

    return (
      <View style={{ gap: 12 }}>
        {choirToast && field === "choir" && (
          <View
            style={[
              styles.inlineToastPill,
              {
                backgroundColor: isDarkMode
                  ? "rgba(46, 158, 86, 0.22)"
                  : "rgba(46, 158, 86, 0.12)",
                borderColor: "rgba(46, 158, 86, 0.35)",
              },
            ]}
          >
            <AppMenuIcon
              ios="checkmark.circle.fill"
              android="check-circle"
              color="#2E9E56"
              size={18}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.onSurface,
                  ...fonts.sansSemiBold,
                  fontSize: 13.5,
                }}
              >
                {choirToast.title}
              </Text>
              {!!choirToast.subtitle && (
                <Text
                  style={{
                    color: mutedText,
                    ...fonts.sansRegular,
                    fontSize: 12,
                  }}
                >
                  {choirToast.subtitle}
                </Text>
              )}
            </View>
          </View>
        )}

        <Text
          style={{
            color: mutedText,
            ...fonts.sansRegular,
            fontSize: 13.5,
            lineHeight: 19,
            paddingHorizontal: 4,
          }}
        >
          {field === "ministry"
            ? t.profileChooseYourMinistryOrMembershipTo
            : t.profileChooseYourChoirToShowNext}
        </Text>
        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          {items.map((item, i) => {
            const key = item.key;
            const activeValue =
              field in optimistic
                ? optimistic[field] ?? null
                : user[field] || null;
            const checked = activeValue === key;
            const sectionAnchor =
              field === "ministry" &&
              (key === "obispo" || key === "secretario" || key === "hermano");
            return (
              <React.Fragment key={key || "none"}>
                {i > 0 && !sectionAnchor && (
                  <View
                    style={[
                      styles.optionDivider,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.10)"
                          : theme.outlineVariant,
                      },
                    ]}
                  />
                )}
                {sectionAnchor && (
                  <View
                    style={{
                      paddingHorizontal: 18,
                      paddingTop: 14,
                      paddingBottom: 6,
                      backgroundColor: isDarkMode
                        ? "rgba(0,0,0,0.28)"
                        : theme.surfaceVariants.containerLow,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderColor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : theme.outlineVariant + "60",
                    }}
                  >
                    <Text
                      style={[
                        styles.groupTitle,
                        { color: mutedText },
                      ]}
                    >
                      {key === "obispo"
                        ? t.profilePastoralMinistry
                        : key === "secretario"
                          ? t.profileLocalServiceTeaching
                          : t.profileMembership}
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  onPress={() => void save(field, key)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : theme.surfaceVariants.containerHigh,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...(checked ? fonts.sansSemiBold : fonts.sansMedium),
                      fontSize: 16.5,
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                  {checked && (
                    <AppMenuIcon
                      ios="checkmark"
                      android="check"
                      color={theme.primary}
                      size={19}
                      weight="semibold"
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        {field === "choir" && !choirModalOpen && (
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenChoirModal}
            style={({ pressed }) => [
              styles.suggestChoirCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.suggestChoirIconWell,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.10)"
                    : theme.primary + "14",
                },
              ]}
            >
              <AppMenuIcon
                ios="plus.circle.fill"
                android="add-circle"
                color={theme.primary}
                size={20}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  color: theme.onSurface,
                  ...fonts.sansSemiBold,
                  fontSize: 15,
                }}
              >
                {isAdminUser ? t.choirAdminAddTitle : t.choirSuggestTitle}
              </Text>
              <Text
                style={{
                  color: mutedText,
                  ...fonts.sansRegular,
                  fontSize: 12.5,
                  lineHeight: 17,
                }}
              >
                {isAdminUser ? t.choirAdminAddSubtitle : t.choirSuggestSubtitle}
              </Text>
            </View>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={14}
              weight="semibold"
            />
          </Pressable>
        )}

        {/* Inline Suggest / Add Choir card (avoids nested iOS UIKit Modal inside AuthSheet) */}
        {field === "choir" && choirModalOpen && (
          <View
            style={[
              styles.choirInlineCard,
              {
                backgroundColor: isDarkMode
                  ? "#1A1A1D"
                  : theme.surfaceVariants.containerLow,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.choirModalHeader}>
              <Text
                numberOfLines={1}
                style={[styles.choirInlineTitle, { color: theme.onSurface }]}
              >
                {isAdminUser ? t.choirAdminAddTitle : t.choirSuggestTitle}
              </Text>
              <Pressable
                onPress={requestCloseChoirModal}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                hitSlop={10}
                style={[
                  styles.choirCloseBtn,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <AppMenuIcon
                  ios="xmark"
                  android="close"
                  color={theme.onSurface}
                  size={14}
                  weight="semibold"
                />
              </Pressable>
            </View>

            <View
              style={[
                styles.cardGroup,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <AnimatedField
                grouped
                label={t.choirNameLabel}
                value={choirNameDraft}
                onChangeText={setChoirNameDraft}
                placeholder={t.choirNamePlaceholder}
                maxLength={60}
                autoCapitalize="words"
                editable={!choirSubmitting}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() =>
                  (isAdminUser
                    ? choirNameEnRef.current
                    : choirContextRef.current
                  )?.focus()
                }
              />
              {isAdminUser && (
                <AnimatedField
                  ref={choirNameEnRef}
                  grouped
                  label={t.choirNameEnLabel}
                  value={choirNameEnDraft}
                  onChangeText={setChoirNameEnDraft}
                  placeholder={t.choirNameEnPlaceholder}
                  maxLength={60}
                  autoCapitalize="words"
                  editable={!choirSubmitting}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => choirContextRef.current?.focus()}
                />
              )}
              <AnimatedField
                ref={choirContextRef}
                grouped
                isLast
                label={t.choirChurchContextLabel}
                value={choirContextDraft}
                onChangeText={setChoirContextDraft}
                placeholder={t.choirChurchContextPlaceholder}
                maxLength={100}
                autoCapitalize="words"
                editable={!choirSubmitting}
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmitChoir()}
              />
            </View>

            {!!choirSubmitError && (
              <Text
                accessibilityRole="alert"
                style={{
                  color: "#D64545",
                  ...fonts.sansSemiBold,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {choirSubmitError}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={choirSubmitting}
              onPress={() => void handleSubmitChoir()}
              style={({ pressed }) => [
                styles.choirSubmitBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: choirSubmitting ? 0.6 : pressed ? 0.88 : 1,
                },
              ]}
            >
              {choirSubmitting ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Text
                  style={{
                    color: theme.onPrimary,
                    ...fonts.sansBold,
                    fontSize: 15.5,
                  }}
                >
                  {isAdminUser ? t.choirPublishBtn : t.choirSubmitBtn}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {!!error && (
          <Text accessibilityRole="alert" style={{ color: theme.primary }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (subPage === "friends") {
    return <FriendsPanel onOpenHymn={onOpenHymn} onOpenChurchesMap={onOpenChurchesMap} />;
  }

  if (subPage === "notifications") {
    return <NotificationsPanel onNavigate={onNotificationNavigate} />;
  }

  if (subPage === "blocks") {
    return (
      <View style={{ gap: 10 }}>
        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              padding: blocks?.length ? 0 : 18,
            },
          ]}
        >
          {!blocks?.length ? (
            <Text
              style={{
                color: mutedText,
                ...fonts.sansRegular,
                fontSize: 15,
              }}
            >
              {t.profileNoBlockedUsers}
            </Text>
          ) : (
            blocks.map((b, idx) => (
              <React.Fragment key={b.id}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.optionDivider,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.10)"
                          : theme.outlineVariant,
                      },
                    ]}
                  />
                )}
                <Pressable
                  disabled={busy}
                  style={styles.optionRow}
                  onPress={() => {
                    setBusy(true);
                    void api(`/users/${b.id}/block`, "DELETE")
                      .then(() =>
                        setBlocks(
                          (prev) => prev?.filter((x) => x.id !== b.id) || [],
                        ),
                      )
                      .catch((e) => setError(communityError(e, es)))
                      .finally(() => setBusy(false));
                  }}
                >
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansMedium,
                      fontSize: 16.5,
                      flex: 1,
                    }}
                  >
                    {b.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.primary,
                      ...fonts.sansSemiBold,
                      fontSize: 14.5,
                    }}
                  >
                    {t.profileUnblock}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))
          )}
        </View>
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: theme.primary }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (subPage === "moderation") {
    return <CommunityModeration alwaysExpanded />;
  }

  if (subPage === "church-location") {
    const selectedCountry = COUNTRY_OPTIONS.find((c) => c.id === countryDraft);
    const saveChurchLocation = async () => {
      setBusy(true);
      setError("");
      try {
        const countryLabel =
          selectedCountry && selectedCountry.id !== "other"
            ? es
              ? selectedCountry.es
              : selectedCountry.en
            : "";
        const cleanRegion = regionDraft.trim();
        const combinedLocation =
          countryLabel && cleanRegion
            ? `${countryLabel} · ${cleanRegion}`.slice(0, 80)
            : (countryLabel || cleanRegion || null);
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
        onBack?.();
      } catch (e) {
        setError(communityError(e, es));
      } finally {
        setBusy(false);
      }
    };

    const dividerBg = isDarkMode
      ? "rgba(255,255,255,0.09)"
      : theme.outlineVariant;

    return (
      <View style={{ gap: 18 }}>
        {onOpenChurchesMap && (
          <View style={{ gap: 6 }}>
            <Text style={[styles.sectionHeader, { color: mutedText }]}>
              {t.profileVerifiedDirectory}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onOpenChurchesMap();
              }}
              style={({ pressed }) => [
                styles.cardGroup,
                {
                  backgroundColor: cardBg,
                  borderColor: user.churchId ? theme.primary + "66" : cardBorder,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 13,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? "rgba(181,69,69,0.22)" : theme.primary + "14",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppMenuIcon
                  ios="map.fill"
                  android="map"
                  color={isDarkMode ? "#F0A8A8" : theme.primary}
                  size={19}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 15.5,
                      flexShrink: 1,
                    }}
                  >
                    {user.churchId && user.churchName
                      ? churchDisplayName(user.churchName)
                      : t.profilePickMyChurchOnTheMap}
                  </Text>
                  {!!user.churchId && (
                    <AppMenuIcon
                      ios="checkmark.seal.fill"
                      android="verified"
                      color="#34C759"
                      size={15}
                    />
                  )}
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    color: mutedText,
                    ...fonts.sansRegular,
                    fontSize: 12.5,
                    lineHeight: 17,
                  }}
                >
                  {user.churchId
                    ? t.profileOfficialLinkedChurchTapToView
                    : t.profileTapAVerifiedChurchOnThe}
                </Text>
              </View>
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={mutedText}
                size={13}
                weight="semibold"
              />
            </Pressable>
          </View>
        )}

        {/* Unified iOS Grouped Settings Card: Country, City, Church */}
        <View style={{ gap: 6 }}>
          <Text style={[styles.sectionHeader, { color: mutedText }]}>
            {t.profileChurchLocation}
          </Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {/* Row 1: Collapsible iOS Country Selector */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.profileCountry}: ${selectedCountry ? (es ? selectedCountry.es : selectedCountry.en) : (t.profileOptional)}`}
              accessibilityState={{ expanded: countryPickerOpen, disabled: busy }}
              disabled={busy}
              onPress={() => {
                Haptics.selectionAsync();
                setCountryPickerOpen((prev) => !prev);
              }}
              style={({ pressed }) => [
                styles.navRow,
                pressed && {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.06)"
                    : theme.primary + "0D",
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.label, { color: theme.onSurface, width: 82 }]}
              >
                {t.profileCountry}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.valueText,
                  {
                    color: selectedCountry ? theme.onSurface : mutedText,
                    textAlign: "left",
                  },
                ]}
              >
                {selectedCountry
                  ? es
                    ? selectedCountry.es
                    : selectedCountry.en
                  : t.profileOptional}
              </Text>
              <AppMenuIcon
                ios={countryPickerOpen ? "chevron.up" : "chevron.down"}
                android={countryPickerOpen ? "expand-less" : "expand-more"}
                color={mutedText}
                size={13}
                weight="semibold"
              />
            </Pressable>

            {countryPickerOpen && (
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(0,0,0,0.22)"
                    : theme.surfaceVariants.containerLow,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: dividerBg,
                }}
              >
                {[null, ...COUNTRY_OPTIONS].map((c, idx) => {
                  const active = (c?.id ?? null) === countryDraft;
                  return (
                    <React.Fragment key={c?.id ?? "none"}>
                      {idx > 0 && (
                        <View
                          style={{
                            height: StyleSheet.hairlineWidth,
                            marginLeft: 16,
                            backgroundColor: dividerBg,
                          }}
                        />
                      )}
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active, disabled: busy }}
                        disabled={busy}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCountryDraft(c?.id ?? null);
                          setCountryPickerOpen(false);
                        }}
                        style={({ pressed }) => ({
                          minHeight: 44,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: pressed
                            ? isDarkMode
                              ? "rgba(255,255,255,0.06)"
                              : theme.primary + "0D"
                            : "transparent",
                        })}
                      >
                        <Text
                          style={{
                            color: c ? theme.onSurface : mutedText,
                            ...(active ? fonts.sansSemiBold : fonts.sansRegular),
                            fontSize: 15.5,
                          }}
                        >
                          {c
                            ? es
                              ? c.es
                              : c.en
                            : t.profileNone}
                        </Text>
                        {active && (
                          <AppMenuIcon
                            ios="checkmark"
                            android="check"
                            color={theme.primary}
                            size={16}
                            weight="semibold"
                          />
                        )}
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            )}

            <View
              style={{
                height: StyleSheet.hairlineWidth,
                marginLeft: 16,
                backgroundColor: dividerBg,
              }}
            />

            {/* Row 2: Inline Borderless City / State Field */}
            <View style={styles.navRow}>
              <Text
                numberOfLines={1}
                style={[styles.label, { color: theme.onSurface, width: 82 }]}
              >
                {t.profileCity}
              </Text>
              <TextInput
                accessibilityLabel={t.profileCityAndState}
                value={regionDraft}
                onChangeText={setRegionDraft}
                maxLength={56}
                editable={!busy}
                placeholder={t.profileEGRiverbankCa}
                placeholderTextColor={mutedText}
                style={{
                  flex: 1,
                  color: theme.onSurface,
                  ...fonts.sansRegular,
                  fontSize: 16,
                  paddingVertical: 0,
                }}
              />
            </View>

            <View
              style={{
                height: StyleSheet.hairlineWidth,
                marginLeft: 16,
                backgroundColor: dividerBg,
              }}
            />

            {/* Row 3: Inline Borderless Local Church Field */}
            <View style={styles.navRow}>
              <Text
                numberOfLines={1}
                style={[styles.label, { color: theme.onSurface, width: 82 }]}
              >
                {t.profileChurch}
              </Text>
              <TextInput
                accessibilityLabel={t.profileLocalChurch}
                value={churchDraft}
                onChangeText={setChurchDraft}
                maxLength={80}
                editable={!busy}
                placeholder={t.profileEGElBuenPastor}
                placeholderTextColor={mutedText}
                style={{
                  flex: 1,
                  color: theme.onSurface,
                  ...fonts.sansRegular,
                  fontSize: 16,
                  paddingVertical: 0,
                }}
              />
            </View>
          </View>
        </View>

        {/* Clean Native iOS Privacy Toggle Group */}
        <View style={{ gap: 6 }}>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                paddingHorizontal: 16,
                minHeight: 50,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                color: theme.onSurface,
                ...fonts.sansRegular,
                fontSize: 16.5,
                flex: 1,
              }}
            >
              {t.profileShowOnMyProfile}
            </Text>
            <Switch
              accessibilityLabel={t.profileShowChurchAndLocationOnMy}
              value={showPublicDraft}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                setShowPublicDraft(v);
              }}
              disabled={busy}
              trackColor={{
                false: isDarkMode ? "rgba(255,255,255,0.16)" : theme.outlineVariant,
                true: isDarkMode ? "#8d2d2d" : theme.primary,
              }}
              thumbColor="#ffffff"
              ios_backgroundColor={
                isDarkMode ? "rgba(255,255,255,0.16)" : theme.outlineVariant + "66"
              }
            />
          </View>
          <Text
            style={{
              color: mutedText,
              ...fonts.sansRegular,
              fontSize: 12.5,
              lineHeight: 17,
              paddingHorizontal: 14,
            }}
          >
            {t.profileOptionalOnlyShownWhenSomeoneTaps}
          </Text>
        </View>

        {!!error && (
          <Text accessibilityRole="alert" style={{ color: theme.primary, paddingHorizontal: 4 }}>
            {error}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void saveChurchLocation();
          }}
          style={({ pressed }) => ({
            backgroundColor: theme.primary,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            opacity: busy ? 0.6 : pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              color: theme.onPrimary,
              ...fonts.sansSemiBold,
              fontSize: 16,
            }}
          >
            {busy ? (t.profileSaving) : t.save}
          </Text>
        </Pressable>
      </View>
    );
  }

  const ministryText =
    (user.ministry &&
      (MINISTRIES as Record<string, [string, string]>)[user.ministry]?.[
        es ? 0 : 1
      ]) ||
    (t.profileNone2);
  const choirText =
    (user.choir && choirDisplayName(user.choir, es, choirsBySlug)) ||
    (t.profileNone2);
  const churchLocationText =
    (user.churchName ? churchDisplayName(user.churchName) : "") ||
    user.location ||
    (onOpenChurchesMap ? t.churchPickOnMap : t.profileOptional);

  const isAdmin =
    user.role === "admin" &&
    user.email.toLowerCase() === "isaacduran167@gmail.com";

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Text style={[styles.sectionHeader, { color: mutedText }]}>
          {t.profileCommunity}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("ministry")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="person.badge.shield.checkmark"
              android="verified-user"
              color={iconTint}
              size={22}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface }]}
            >
              {t.profileMinistry}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.valueText, { color: mutedText }]}
            >
              {ministryText}
            </Text>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.09)"
                  : theme.outlineVariant,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("choir")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="music.note.list"
              android="queue-music"
              color={iconTint}
              size={22}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface }]}
            >
              {t.profileChoir}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.valueText, { color: mutedText }]}
            >
              {choirText}
            </Text>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.09)"
                  : theme.outlineVariant,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              if (onOpenChurchesMap) onOpenChurchesMap();
              else onOpenSubPage?.("church-location");
            }}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="building.columns"
              android="account-balance"
              color={iconTint}
              size={20}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface }]}
            >
              {t.profileMyChurch}
            </Text>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 5,
              }}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  ...fonts.sansRegular,
                  fontSize: 15,
                  color: mutedText,
                  flexShrink: 1,
                  textAlign: "right",
                }}
              >
                {churchLocationText}
              </Text>
              {!!user.churchId && (
                <AppMenuIcon
                  ios="checkmark.seal.fill"
                  android="verified"
                  color="#34C759"
                  size={15}
                />
              )}
            </View>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>


          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.09)"
                  : theme.outlineVariant,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("notifications")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="bell"
              android="notifications-none"
              color={iconTint}
              size={21}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface, flex: 1 }]}
            >
              {t.notificationsTitle}
            </Text>
            {notificationsUnread > 0 ? (
              <View
                accessibilityLabel={`${notificationsUnread} ${t.friendsNotificationsLabel}`}
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  paddingHorizontal: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#D64545",
                }}
              >
                <Text style={{ ...fonts.sansBold, fontSize: 12.5, color: "#FFFFFF" }}>
                  {notificationsUnread}
                </Text>
              </View>
            ) : null}
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.09)"
                  : theme.outlineVariant,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("friends")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="person.2"
              android="group"
              color={iconTint}
              size={21}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface, flex: 1 }]}
            >
              {t.friendsTitle}
            </Text>
            {friendsBadge > 0 ? (
              <View
                accessibilityLabel={`${friendsBadge} ${t.friendsNotificationsLabel}`}
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  paddingHorizontal: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#D64545",
                }}
              >
                <Text style={{ ...fonts.sansBold, fontSize: 12.5, color: "#FFFFFF" }}>
                  {friendsBadge}
                </Text>
              </View>
            ) : friendLists.friends.length > 0 ? (
              <Text style={{ ...fonts.sansRegular, fontSize: 15, color: mutedText }}>
                {friendLists.friends.length}
              </Text>
            ) : null}
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.09)"
                  : theme.outlineVariant,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("blocks")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="hand.raised"
              android="block"
              color={iconTint}
              size={21}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface, flex: 1 }]}
            >
              {t.profileBlocked}
            </Text>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>
        </View>
      </View>

      {isAdmin && (
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSubPage?.("moderation")}
            style={({ pressed }) => [
              styles.navRow,
              pressed && {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : theme.primary + "0D",
              },
            ]}
          >
            <AppMenuIcon
              ios="shield.lefthalf.filled"
              android="admin-panel-settings"
              color={iconTint}
              size={21}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: theme.onSurface, flex: 1 }]}
            >
              {t.profileModeration}
            </Text>
            <AppMenuIcon
              ios="chevron.right"
              android="chevron-right"
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    ...fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.9,
    paddingHorizontal: 14,
  },
  navRow: {
    minHeight: 49,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  label: {
    ...fonts.sansRegular,
    fontSize: 16.5,
    flexShrink: 0,
  },
  valueText: {
    ...fonts.sansRegular,
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 53,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  groupTitle: {
    ...fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  optionRow: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  inlineToastPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestChoirCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestChoirIconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choirInlineCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  choirModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  choirInlineTitle: {
    flex: 1,
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
  choirCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  choirSubmitBtn: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
