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
export default function CommunityModeration({
  alwaysExpanded = false,
}: {
  alwaysExpanded?: boolean;
}) {
  const { user } = useAuth(),
    { language } = useLanguage(),
    es = language === "es",
    { theme } = useTheme(),
    api = useCommunityApi();
  const [expanded, setExpanded] = useState(alwaysExpanded),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reports, setReports] = useState<Report[]>([]),
    [people, setPeople] = useState<Person[]>([]),
    [churches, setChurches] = useState<ModChurch[]>([]),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState<"reports" | "members" | "choirs" | "churches">("reports");
  const [choir, setChoir] = useState("esmirna"),
    [title, setTitle] = useState(""),
    [notes, setNotes] = useState(""),
    [hymns, setHymns] = useState("");
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
  useEffect(() => {
    if (!isAdmin) return;
    if (alwaysExpanded) {
      setExpanded(true);
      void run(async () => {
        await Promise.all([load(), loadChurches()]);
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
            <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, fontFamily: fonts.sansRegular }}>
              {l("Admin", "Administrador")}
            </Text>
          </View>
          <Text style={{ color: theme.primary, fontSize: 18, fontFamily: fonts.sansSemiBold }}>
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
                ["choirs", l("Choirs", "Coros")],
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
                      fontFamily: fonts.sansSemiBold,
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
                  fontFamily: fonts.sansSemiBold,
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
          <Text style={[styles.heading, { color: theme.onSurface }]}>
            {l("Pinned choir repertoire", "Repertorio del coro")}
          </Text>
          <View style={styles.row}>
            {["esmirna", "maranatha"].map((c) => (
              <Pressable
                key={c}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityState={{ checked: choir === c }}
                onPress={() => setChoir(c)}
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      choir === c
                        ? theme.surfaceVariants.containerHighest
                        : "transparent",
                  },
                ]}
              >
                <Text style={{ color: theme.primary }}>
                  {c === "esmirna" ? "Coro Esmirna" : "Coro Maranatha"}
                </Text>
              </Pressable>
            ))}
          </View>
          {button(
            l("Load current repertoire", "Cargar repertorio actual"),
            async () => {
              const r = await api<{
                repertoires: {
                  title: string;
                  notes: string;
                  hymnIds: string[];
                }[];
              }>(`/choirs/repertoire?choir=${choir}`);
              const v = r.repertoires[0];
              setTitle(v?.title || "");
              setNotes(v?.notes || "");
              setHymns(v?.hymnIds.join(", ") || "");
            },
          )}
          {input(title, setTitle, l("Rehearsal title", "Título del ensayo"))}
          {input(
            notes,
            setNotes,
            l("Rehearsal notes", "Notas del ensayo"),
            true,
          )}
          {input(
            hymns,
            setHymns,
            l("Hymn IDs: 1, 14, E123", "IDs de alabanzas: 1, 14, E123"),
            true,
          )}
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
            Alert.alert(l("Saved", "Guardado"));
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
                      fontFamily: fonts.sansSemiBold,
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
                      {l("Pastor:", "Pastor:")} {c.pastorName}
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
                        fontFamily: fonts.sansMedium,
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
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 17 },
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
