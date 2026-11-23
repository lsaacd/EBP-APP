import { servantDisplayName } from "../utils/churchName";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Linking,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { useCommunityApi, communityError } from "../utils/communityApi";
import { pickAndUploadChurchPhotos } from "../utils/churchPhotoUpload";
import { useApprovedChoirs } from "../utils/choirsStore";
import * as Haptics from "../utils/haptics";
import { AnimatedField } from "./AnimatedField";
import AppMenuIcon from "./AppMenuIcon";
import { fonts } from "../theme/theme";
type Report = {
  id: string;
  comment_id: string;
  user_id: string | null;
  name: string;
  body: string;
  reason: string;
  details: string;
  created_at: number;
};
type Person = {
  id: string;
  name: string;
  ministry: string | null;
  badge_verified: number;
  suspended_at: number | null;
};
type ModChurch = {
  id: string;
  name: string;
  pastorName: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  lat?: number;
  lng?: number;
  photoUrl?: string | null;
  photos?: string[];
  serviceTimes: string | null;
  contactInfo: string | null;
  submittedByName: string | null;
  verified: boolean;
  status: "pending" | "approved" | "rejected";
};
type ModChoir = {
  slug: string;
  nameEs: string;
  nameEn: string;
  churchContext: string | null;
  status: "pending" | "approved" | "rejected";
  submittedByName: string | null;
  createdAt: number;
  approvedAt: number | null;
};
const BUILTIN_CHOIRS = new Set(["esmirna", "maranatha", "filadelfia"]);
export default function CommunityModeration({
  alwaysExpanded = false,
}: {
  alwaysExpanded?: boolean;
}) {
  const { user } = useAuth(),
    { language, t } = useLanguage(),
    es = language === "es",
    { theme, isDarkMode } = useTheme(),
    api = useCommunityApi();
  const { refresh: refreshApprovedChoirs } = useApprovedChoirs();
  const [expanded, setExpanded] = useState(alwaysExpanded),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reports, setReports] = useState<Report[]>([]),
    [people, setPeople] = useState<Person[]>([]),
    [churches, setChurches] = useState<ModChurch[]>([]),
    [modChoirs, setModChoirs] = useState<ModChoir[]>([]),
    [choirDraftNames, setChoirDraftNames] = useState<Record<string, { nameEs: string; nameEn: string }>>({}),
    [modToast, setModToast] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState<"reports" | "members" | "choirs" | "churches">("reports");
  const [choir, setChoir] = useState("esmirna"),
    [title, setTitle] = useState(""),
    [notes, setNotes] = useState(""),
    [hymns, setHymns] = useState("");
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setModToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setModToast(null);
      toastTimerRef.current = null;
    }, 2600);
  };
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);
  const isAdmin =
    user?.role === "admin" &&
    user.email.toLowerCase() === "isaacduran167@gmail.com";
  const l = (en: string, sp: string) => (es ? sp : en);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(communityError(e, es));
    } finally {
      setBusy(false);
    }
  };
  const load = async (more = false) => {
    const before =
      more && reports.length
        ? `?before=${reports[reports.length - 1].created_at}`
        : "";
    const r = await api<{ reports: Report[] }>("/mod/reports" + before);
    setReports((prev) => (more ? [...prev, ...r.reports] : r.reports));
  };
  const loadChurches = async () => {
    const r = await api<{ churches: ModChurch[] }>("/mod/churches");
    setChurches(r.churches || []);
  };
  const loadChoirs = async () => {
    const r = await api<{ choirs: ModChoir[] }>("/mod/choirs");
    const list = r.choirs || [];
    setModChoirs(list);
    setChoirDraftNames((prev) => {
      const next = { ...prev };
      for (const item of list) {
        if (!next[item.slug]) {
          next[item.slug] = { nameEs: item.nameEs, nameEn: item.nameEn };
        }
      }
      return next;
    });
  };
  useEffect(() => {
    if (!isAdmin) return;
    if (alwaysExpanded) {
      setExpanded(true);
      void run(async () => {
        await Promise.all([load(), loadChurches(), loadChoirs()]);
      });
    }
  }, [alwaysExpanded, isAdmin]);
  if (!isAdmin) return null;
  const button = (
    text: string,
    action: () => Promise<void>,
    danger = false,
  ) => (
    <Pressable
      disabled={busy}
      style={[
        styles.button,
        {
          backgroundColor: theme.surfaceVariants.containerHighest,
          opacity: busy ? 0.5 : 1,
        },
      ]}
      onPress={() => {
        if (danger)
          Alert.alert(
            text,
            l(
              "This changes community access immediately.",
              "Esto cambia el acceso a la comunidad inmediatamente.",
            ),
            [
              { text: l("Cancel", "Cancelar"), style: "cancel" },
              {
                text: l("Confirm", "Confirmar"),
                style: "destructive",
                onPress: () => void run(action),
              },
            ],
          );
        else void run(action);
      }}
    >
      <Text style={{ color: theme.primary }}>{text}</Text>
    </Pressable>
  );
  const input = (
    value: string,
    onChangeText: (v: string) => void,
    placeholder: string,
    multiline = false,
  ) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      placeholderTextColor={theme.onSurfaceVariant}
      editable={!busy}
      maxLength={multiline ? 1000 : 100}
      multiline={multiline}
      style={[
        styles.input,
        { color: theme.onSurface, borderColor: theme.outlineVariant },
      ]}
    />
  );
  return (
    <View style={[styles.root, !alwaysExpanded && { borderColor: theme.outlineVariant, borderWidth: 1, borderRadius: 14, padding: 12 }]}>
      {!alwaysExpanded && (
        <Pressable
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}
          onPress={() => {
            setExpanded(!expanded);
            if (!expanded) void run(() => load());
          }}
        >
          <View>
            <Text style={[styles.heading, { color: theme.primary }]}>
              {l("Moderation", "Panel de Moderación")}
            </Text>
            <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, ...fonts.sansRegular }}>
              {l("Admin", "Administrador")}
            </Text>
          </View>
          <Text style={{ color: theme.primary, fontSize: 18, ...fonts.sansSemiBold }}>
            {expanded ? "−" : "+"}
          </Text>
        </Pressable>
      )}
      {(alwaysExpanded || expanded) && (
        <>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            {(
              [
                ["reports", l(`Reports (${reports.length})`, `Reportes (${reports.length})`)],
                ["churches", l(`Churches (${churches.filter((c) => c.status === "pending").length})`, `Iglesias (${churches.filter((c) => c.status === "pending").length})`)],
                ["members", l("Members", "Miembros")],
                [
                  "choirs",
                  (() => {
                    const n = modChoirs.filter((c) => c.status === "pending").length;
                    return n > 0 ? l(`Choirs (${n})`, `Coros (${n})`) : l("Choirs", "Coros");
                  })(),
                ],
              ] as const
            ).map(([key, labelText]) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setTab(key);
                    if (key === "churches" && churches.length === 0) {
                      void run(() => loadChurches());
                    }
                    if (key === "choirs" && modChoirs.length === 0) {
                      void run(() => loadChoirs());
                    }
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: active
                      ? theme.primary
                      : theme.surfaceVariants.containerHigh,
                  }}
                >
                  <Text
                    style={{
                      color: active ? theme.onPrimary : theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 12,
                    }}
                  >
                    {labelText}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {tab === "reports" && (
            <>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>
                {l(
                  "Review reported comments and take action.",
                  "Revisa comentarios reportados y toma acción.",
                )}
              </Text>
              {button(l("Refresh reports", "Actualizar reportes"), () => load())}
              {!reports.length && (
                <Text style={{ color: theme.onSurfaceVariant }}>
                  {l("No open reports.", "No hay reportes abiertos.")}
                </Text>
              )}
          {reports.map((r) => (
            <View
              key={r.id}
              style={[styles.card, { borderColor: theme.outlineVariant }]}
            >
              <Text
                style={{
                  color: theme.onSurface,
                  ...fonts.sansSemiBold,
                }}
              >
                {r.name || l("Deleted account", "Cuenta eliminada")} ·{" "}
                {r.reason}
              </Text>
              <Text selectable style={{ color: theme.onSurface }}>
                {r.body}
              </Text>
              {!!r.details && (
                <Text style={{ color: theme.onSurfaceVariant }}>
                  {r.details}
                </Text>
              )}
              {button(
                l("Hide comment", "Ocultar comentario"),
                async () => {
                  await api(`/mod/comments/${r.comment_id}/hide`, "POST", {});
                  await load();
                },
                true,
              )}
              {button(l("Dismiss report", "Descartar reporte"), async () => {
                await api(`/mod/reports/${r.id}/dismiss`, "POST", {});
                await load();
              })}
              {r.user_id &&
                r.user_id !== user.id &&
                button(
                  l("Suspend author", "Suspender autor"),
                  async () => {
                    await api(`/mod/users/${r.user_id}/suspend`, "POST", {});
                    await load();
                  },
                  true,
                )}
            </View>
          ))}
          {reports.length >= 50 &&
            button(l("Older reports", "Reportes anteriores"), () => load(true))}
            </>
          )}
          {tab === "members" && (
            <>
          <Text style={[styles.heading, { color: theme.onSurface }]}>
            {l(
              "Members & Bishop verification",
              "Miembros y verificación de Obispo",
            )}
          </Text>
          {input(
            query,
            setQuery,
            l(
              "Search display name or account ID",
              "Buscar nombre o ID de cuenta",
            ),
          )}
          {button(l("Search members", "Buscar miembros"), async () => {
            const r = await api<{ users: Person[] }>(
              `/mod/users?q=${encodeURIComponent(query)}`,
            );
            setPeople(r.users);
          })}
          {people.map((p) => (
            <View
              key={p.id}
              style={[styles.card, { borderColor: theme.outlineVariant }]}
            >
              <Text style={{ color: theme.onSurface }}>
                {p.name} · {p.ministry || "—"}{" "}
                {p.suspended_at ? l("(suspended)", "(suspendido)") : ""}
              </Text>
              {p.id !== user.id && (
                <>
                  {button(
                    p.suspended_at
                      ? l("Restore access", "Restaurar acceso")
                      : l("Suspend access", "Suspender acceso"),
                    async () => {
                      await api(
                        `/mod/users/${p.id}/${p.suspended_at ? "restore" : "suspend"}`,
                        "POST",
                        {},
                      );
                      setPeople((prev) =>
                        prev.map((x) =>
                          x.id === p.id
                            ? {
                                ...x,
                                suspended_at: p.suspended_at
                                  ? null
                                  : Date.now(),
                              }
                            : x,
                        ),
                      );
                    },
                    true,
                  )}
                  {p.ministry === "obispo" &&
                    button(
                      p.badge_verified
                        ? l(
                            "Revoke Bishop badge",
                            "Revocar verificación de Obispo",
                          )
                        : l("Verify Bishop", "Verificar Obispo"),
                      async () => {
                        await api(`/mod/users/${p.id}/verify-obispo`, "POST", {
                          verified: !p.badge_verified,
                        });
                        setPeople((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  badge_verified: p.badge_verified ? 0 : 1,
                                }
                              : x,
                          ),
                        );
                      },
                      true,
                    )}
                </>
              )}
            </View>
          ))}
            </>
          )}
          {tab === "choirs" && (
            <>
              {!!modToast && (
                <View
                  style={[
                    styles.modToastBanner,
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
                    size={17}
                  />
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 13.5,
                    }}
                  >
                    {modToast}
                  </Text>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={[styles.heading, { color: theme.onSurface }]}>
                  {t.choirPendingRequests}
                </Text>
                {button(l("Refresh", "Actualizar"), () => loadChoirs())}
              </View>

              {modChoirs.filter((c) => c.status === "pending").length === 0 ? (
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
                  {t.choirNoPendingRequests}
                </Text>
              ) : (
                modChoirs
                  .filter((c) => c.status === "pending")
                  .map((pending) => {
                    const draft = choirDraftNames[pending.slug] || {
                      nameEs: pending.nameEs,
                      nameEn: pending.nameEn,
                    };
                    return (
                      <View
                        key={pending.slug}
                        style={[
                          styles.card,
                          {
                            borderColor: theme.outlineVariant,
                            backgroundColor: theme.surfaceVariants.containerLow,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            ...fonts.sansMedium,
                            fontSize: 12,
                          }}
                        >
                          {[
                            pending.submittedByName
                              ? `${l("Submitted by", "Enviado por")} ${pending.submittedByName}`
                              : null,
                            pending.churchContext,
                          ]
                            .filter(Boolean)
                            .join(" · ") || pending.slug}
                        </Text>

                        <View
                          style={[
                            styles.groupedFieldsCard,
                            {
                              backgroundColor: theme.surfaceVariants.containerLowest,
                              borderColor: isDarkMode
                                ? "rgba(255,255,255,0.12)"
                                : theme.outlineVariant + "60",
                            },
                          ]}
                        >
                          <AnimatedField
                            grouped
                            label={t.choirNameLabel}
                            value={draft.nameEs}
                            onChangeText={(val) =>
                              setChoirDraftNames((prev) => ({
                                ...prev,
                                [pending.slug]: { ...draft, nameEs: val },
                              }))
                            }
                            maxLength={60}
                            editable={!busy}
                          />
                          <AnimatedField
                            grouped
                            isLast
                            label={t.choirNameEnLabel}
                            value={draft.nameEn}
                            onChangeText={(val) =>
                              setChoirDraftNames((prev) => ({
                                ...prev,
                                [pending.slug]: { ...draft, nameEn: val },
                              }))
                            }
                            maxLength={60}
                            editable={!busy}
                          />
                        </View>

                        <View style={styles.row}>
                          {button(t.choirApprove, async () => {
                            await api(
                              `/mod/choirs/${encodeURIComponent(pending.slug)}/approve`,
                              "POST",
                              {
                                nameEs: draft.nameEs.trim(),
                                nameEn: draft.nameEn.trim(),
                              },
                            );
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success,
                            );
                            await Promise.all([loadChoirs(), refreshApprovedChoirs()]);
                            flashToast(t.choirApprovedToast);
                          })}
                          {button(
                            t.choirReject,
                            async () => {
                              await api(
                                `/mod/choirs/${encodeURIComponent(pending.slug)}/reject`,
                                "POST",
                                {},
                              );
                              await loadChoirs();
                              flashToast(t.choirRejectedToast);
                            },
                            true,
                          )}
                        </View>
                      </View>
                    );
                  })
              )}

              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: theme.outlineVariant,
                  marginVertical: 4,
                }}
              />

              <Text style={[styles.heading, { color: theme.onSurface }]}>
                {t.choirPublishedListTitle}
              </Text>
              <View
                style={[
                  styles.groupedFieldsCard,
                  {
                    backgroundColor: theme.surfaceVariants.containerLowest,
                    borderColor: isDarkMode
                      ? "rgba(255,255,255,0.12)"
                      : theme.outlineVariant + "60",
                  },
                ]}
              >
                {(modChoirs.filter((c) => c.status === "approved").length > 0
                  ? modChoirs.filter((c) => c.status === "approved")
                  : [
                      { slug: "esmirna", nameEs: "Coro Esmirna", nameEn: "Esmirna Choir" },
                      { slug: "maranatha", nameEs: "Coro Maranatha", nameEn: "Maranatha Choir" },
                      { slug: "filadelfia", nameEs: "Coro Filadelfia", nameEn: "Filadelfia Choir" },
                    ]
                ).map((item, idx) => {
                  const label = es ? item.nameEs : item.nameEn;
                  const isBuiltin = BUILTIN_CHOIRS.has(item.slug);
                  return (
                    <React.Fragment key={item.slug}>
                      {idx > 0 && (
                        <View
                          style={{
                            height: StyleSheet.hairlineWidth,
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.10)"
                              : theme.outlineVariant + "55",
                            marginLeft: 14,
                          }}
                        />
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 14,
                          paddingVertical: 11,
                          gap: 10,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: theme.onSurface,
                            ...fonts.sansMedium,
                            fontSize: 15,
                            flex: 1,
                          }}
                        >
                          {label}
                        </Text>
                        {isBuiltin ? (
                          <View
                            style={{
                              paddingHorizontal: 9,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: theme.surfaceVariants.containerHigh,
                            }}
                          >
                            <Text
                              style={{
                                color: theme.onSurfaceVariant,
                                ...fonts.sansMedium,
                                fontSize: 11.5,
                              }}
                            >
                              {t.choirBuiltinBadge}
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            disabled={busy}
                            accessibilityRole="button"
                            accessibilityLabel={`${t.choirRemoveAction} ${label}`}
                            onPress={() => {
                              Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Warning,
                              );
                              Alert.alert(
                                t.choirRemoveTitle,
                                t.choirRemoveBody.replace("{name}", label),
                                [
                                  { text: t.cancel, style: "cancel" },
                                  {
                                    text: t.choirRemoveAction,
                                    style: "destructive",
                                    onPress: () =>
                                      void run(async () => {
                                        await api(
                                          `/mod/choirs/${encodeURIComponent(item.slug)}`,
                                          "DELETE",
                                        );
                                        if (choir === item.slug) setChoir("esmirna");
                                        await Promise.all([
                                          loadChoirs(),
                                          refreshApprovedChoirs(),
                                        ]);
                                        Haptics.notificationAsync(
                                          Haptics.NotificationFeedbackType.Success,
                                        );
                                        flashToast(t.choirRemovedToast);
                                      }),
                                  },
                                ],
                              );
                            }}
                            style={({ pressed }) => ({
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 10,
                              backgroundColor: isDarkMode
                                ? "rgba(255, 85, 85, 0.16)"
                                : "rgba(214, 69, 69, 0.10)",
                              opacity: busy ? 0.5 : pressed ? 0.72 : 1,
                            })}
                          >
                            <AppMenuIcon
                              ios="trash"
                              android="delete-outline"
                              color={isDarkMode ? "#FF6B6B" : "#D64545"}
                              size={14}
                            />
                            <Text
                              style={{
                                color: isDarkMode ? "#FF6B6B" : "#D64545",
                                ...fonts.sansSemiBold,
                                fontSize: 12.5,
                              }}
                            >
                              {t.choirRemoveAction}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>

              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: theme.outlineVariant,
                  marginVertical: 4,
                }}
              />

              <Text style={[styles.heading, { color: theme.onSurface }]}>
                {l("Pinned choir repertoire", "Repertorio del coro")}
              </Text>
              <View style={styles.row}>
                {(modChoirs.filter((c) => c.status === "approved").length > 0
                  ? modChoirs.filter((c) => c.status === "approved")
                  : [
                      { slug: "esmirna", nameEs: "Coro Esmirna", nameEn: "Esmirna Choir" },
                      { slug: "maranatha", nameEs: "Coro Maranatha", nameEn: "Maranatha Choir" },
                      { slug: "filadelfia", nameEs: "Coro Filadelfia", nameEn: "Filadelfia Choir" },
                    ]
                ).map((item) => (
                  <Pressable
                    key={item.slug}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: choir === item.slug }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setChoir(item.slug);
                    }}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          choir === item.slug
                            ? theme.primary
                            : theme.surfaceVariants.containerHigh,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          choir === item.slug ? theme.onPrimary : theme.onSurface,
                        ...fonts.sansSemiBold,
                        fontSize: 13,
                      }}
                    >
                      {es ? item.nameEs : item.nameEn}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.row}>
                {button(
                  l("Load current repertoire", "Cargar repertorio actual"),
                  async () => {
                    const r = await api<{
                      repertoires: {
                        title: string;
                        notes: string;
                        hymnIds: string[];
                      }[];
                    }>(`/choirs/repertoire?choir=${encodeURIComponent(choir)}`);
                    const v = r.repertoires[0];
                    setTitle(v?.title || "");
                    setNotes(v?.notes || "");
                    setHymns(v?.hymnIds.join(", ") || "");
                  },
                )}
                {!BUILTIN_CHOIRS.has(choir) &&
                  button(
                    l("Delete choir", "Eliminar coro"),
                    async () => {
                      await api(`/mod/choirs/${encodeURIComponent(choir)}`, "DELETE");
                      setChoir("esmirna");
                      await Promise.all([loadChoirs(), refreshApprovedChoirs()]);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      flashToast(t.choirRemovedToast);
                    },
                    true,
                  )}
              </View>

              <View
                style={[
                  styles.groupedFieldsCard,
                  {
                    backgroundColor: theme.surfaceVariants.containerLowest,
                    borderColor: isDarkMode
                      ? "rgba(255,255,255,0.12)"
                      : theme.outlineVariant + "60",
                  },
                ]}
              >
                <AnimatedField
                  grouped
                  label={l("Rehearsal title", "Título del ensayo")}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  editable={!busy}
                />
                <AnimatedField
                  grouped
                  label={l("Rehearsal notes", "Notas del ensayo")}
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={1000}
                  multiline
                  editable={!busy}
                />
                <AnimatedField
                  grouped
                  isLast
                  label={l("Hymn IDs: 1, 14, E123", "IDs de alabanzas: 1, 14, E123")}
                  value={hymns}
                  onChangeText={setHymns}
                  maxLength={1000}
                  multiline
                  editable={!busy}
                />
              </View>

              {button(l("Save repertoire", "Guardar repertorio"), async () => {
                await api("/mod/choirs/repertoire", "PUT", {
                  choir,
                  title,
                  notes,
                  hymnIds: hymns
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                flashToast(l("Saved", "Guardado"));
              })}
            </>
          )}
          {tab === "churches" && (
            <>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>
                {l(
                  "Approve submitted El Buen Pastor churches to publish them on the verified map.",
                  "Aprueba iglesias El Buen Pastor enviadas para publicarlas en el mapa oficial.",
                )}
              </Text>
              {button(l("Refresh churches", "Actualizar iglesias"), () => loadChurches())}
              {!churches.length && (
                <Text style={{ color: theme.onSurfaceVariant }}>
                  {l("No church submissions yet.", "Aún no hay iglesias enviadas.")}
                </Text>
              )}
              {churches.map((c) => (
                <View
                  key={c.id}
                  style={[styles.card, { borderColor: theme.outlineVariant }]}
                >
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 15,
                    }}
                  >
                    {c.name} ·{" "}
                    {c.status === "approved"
                      ? l("Verified", "Verificada")
                      : c.status === "pending"
                        ? l("Pending", "Pendiente")
                        : l("Rejected", "Rechazada")}
                  </Text>
                  <Text style={{ color: theme.onSurface, fontSize: 13.5 }}>
                    {c.address}, {c.city}
                    {c.state ? `, ${c.state}` : ""}, {c.country}{" "}
                    {c.postalCode || ""}
                  </Text>
                  {!!c.pastorName && (
                    <Text style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
                      {servantDisplayName(c.pastorName)}
                    </Text>
                  )}
                  {!!c.serviceTimes && (
                    <Text style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
                      {l("Schedule:", "Horarios:")} {c.serviceTimes}
                    </Text>
                  )}
                  {!!c.contactInfo && (
                    <Text
                      selectable
                      style={{
                        color: theme.primary,
                        ...fonts.sansMedium,
                        fontSize: 13,
                      }}
                    >
                      {l("Private contact:", "Contacto privado:")} {c.contactInfo}
                    </Text>
                  )}
                  {typeof c.lat === "number" && typeof c.lng === "number" && (
                    <Text selectable style={{ color: theme.onSurfaceVariant, fontSize: 12.5 }}>
                      {l("Coordinates:", "Coordenadas:")} {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                    </Text>
                  )}
                  {(() => {
                    const photos = Array.isArray(c.photos) && c.photos.length
                      ? c.photos
                      : c.photoUrl
                        ? [c.photoUrl]
                        : [];
                    const saveChurchPhotos = async (nextPhotos: string[]) => {
                      await api(`/mod/churches/${c.id}`, "PUT", {
                        name: c.name,
                        pastorName: c.pastorName,
                        address: c.address,
                        city: c.city,
                        state: c.state,
                        country: c.country,
                        postalCode: c.postalCode,
                        lat: c.lat ?? 0,
                        lng: c.lng ?? 0,
                        serviceTimes: c.serviceTimes,
                        contactInfo: c.contactInfo,
                        photos: nextPhotos,
                        photoUrl: nextPhotos[0] || null,
                        approve: c.status === "approved",
                      });
                      await loadChurches();
                    };
                    return (
                      <View style={{ gap: 6 }}>
                        <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>
                          {l(`Photos (${photos.length}/10):`, `Fotos (${photos.length}/10):`)}
                        </Text>
                        {photos.length > 0 && (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8 }}
                          >
                            {photos.map((uri, idx) => (
                              <View
                                key={uri}
                                style={{
                                  width: 96,
                                  height: 72,
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  borderWidth: idx === 0 ? 2 : 1,
                                  borderColor: idx === 0 ? theme.primary : theme.outlineVariant,
                                  position: "relative",
                                }}
                              >
                                <Image
                                  source={{ uri }}
                                  style={{ width: "100%", height: "100%" }}
                                  resizeMode="cover"
                                />
                                {idx > 0 && (
                                  <Pressable
                                    onPress={() =>
                                      void run(async () => {
                                        const next = [...photos];
                                        const [picked] = next.splice(idx, 1);
                                        next.unshift(picked);
                                        await saveChurchPhotos(next);
                                      })
                                    }
                                    style={{
                                      position: "absolute",
                                      bottom: 4,
                                      left: 4,
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 5,
                                      backgroundColor: "rgba(0,0,0,0.68)",
                                    }}
                                  >
                                    <Text style={{ color: "#FFF", fontSize: 10 }}>
                                      {l("★ Cover", "★ Portada")}
                                    </Text>
                                  </Pressable>
                                )}
                                <Pressable
                                  onPress={() =>
                                    void run(async () => {
                                      await saveChurchPhotos(photos.filter((_, i) => i !== idx));
                                    })
                                  }
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 999,
                                    backgroundColor: "rgba(0,0,0,0.72)",
                                  }}
                                >
                                  <Text style={{ color: "#FFF", fontSize: 10 }}>✕</Text>
                                </Pressable>
                              </View>
                            ))}
                          </ScrollView>
                        )}
                        {photos.length < 10 && (
                          <View style={styles.row}>
                            {button(
                              l("+ Photo (Gallery)", "+ Foto (Galería)"),
                              async () => {
                                const urls = await pickAndUploadChurchPhotos({
                                  source: "library",
                                  remainingSlots: 10 - photos.length,
                                  uploadBase64: async (b64) => {
                                    const res = await api<{ url: string }>(
                                      "/churches/photos/upload",
                                      "POST",
                                      { base64: b64 },
                                    );
                                    return res.url;
                                  },
                                  es,
                                });
                                if (urls.length > 0) {
                                  const merged = [...photos];
                                  for (const u of urls) {
                                    if (!merged.includes(u) && merged.length < 10) merged.push(u);
                                  }
                                  await saveChurchPhotos(merged);
                                }
                              },
                            )}
                            {button(
                              l("+ Photo (Camera)", "+ Foto (Cámara)"),
                              async () => {
                                const urls = await pickAndUploadChurchPhotos({
                                  source: "camera",
                                  remainingSlots: 1,
                                  uploadBase64: async (b64) => {
                                    const res = await api<{ url: string }>(
                                      "/churches/photos/upload",
                                      "POST",
                                      { base64: b64 },
                                    );
                                    return res.url;
                                  },
                                  es,
                                });
                                if (urls.length > 0) {
                                  const merged = [...photos];
                                  for (const u of urls) {
                                    if (!merged.includes(u) && merged.length < 10) merged.push(u);
                                  }
                                  await saveChurchPhotos(merged);
                                }
                              },
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })()}
                  {!!c.submittedByName && (
                    <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>
                      {l("Submitted by:", "Enviado por:")} {c.submittedByName}
                    </Text>
                  )}
                  <View style={styles.row}>
                    {typeof c.lat === "number" &&
                      typeof c.lng === "number" &&
                      button(
                        l("View Pin on Maps", "Ver pin en Maps"),
                        async () => {
                          await Linking.openURL(
                            `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`,
                          ).catch(() => {});
                        },
                      )}
                    {c.status !== "approved" &&
                      button(
                        l("Approve & Verify", "Aprobar y verificar"),
                        async () => {
                          await api(`/mod/churches/${c.id}/approve`, "POST", {});
                          await loadChurches();
                        },
                      )}
                    {c.status === "pending" &&
                      button(
                        l("Reject", "Rechazar"),
                        async () => {
                          await api(`/mod/churches/${c.id}/reject`, "POST", {});
                          await loadChurches();
                        },
                        true,
                      )}
                    {button(
                      l("Delete", "Eliminar"),
                      async () => {
                        await api(`/mod/churches/${c.id}`, "DELETE");
                        await loadChurches();
                      },
                      true,
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: theme.primary }}>
              {error}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: 10 },
  heading: { ...fonts.sansSemiBold, fontSize: 17 },
  button: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  groupedFieldsCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  modToastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
