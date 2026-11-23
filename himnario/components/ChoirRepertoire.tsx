import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { useCommunityApi } from "../utils/communityApi";
import { choirDisplayName } from "../data/communityRules";
import { useApprovedChoirs } from "../utils/choirsStore";
import { fonts } from "../theme/theme";
export type Repertoire = {
  id: string;
  choir: string;
  title: string;
  notes: string;
  hymnIds: string[];
  updated_at: number;
};
export default function ChoirRepertoire() {
  const { user } = useAuth(),
    { language, t } = useLanguage(),
    { theme } = useTheme(),
    api = useCommunityApi(),
    router = useRouter();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const [items, setItems] = useState<Repertoire[]>([]);
  useEffect(() => {
    let cancelled = false;
    setItems([]);
    if (user?.choir && user.choir !== "otro")
      void api<{ repertoires: Repertoire[] }>(
        `/choirs/repertoire?choir=${encodeURIComponent(user.choir)}`,
      )
        .then((r) => {
          if (!cancelled) setItems(r.repertoires);
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.choir, api]);
  return (
    <>
      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant,
            },
          ]}
        >
          <Text
            style={{
              color: theme.onSurfaceVariant,
              ...fonts.sansSemiBold,
            }}
          >
            {choirDisplayName(item.choir, language === "es", choirsBySlug)}
          </Text>
          <Text style={[styles.title, { color: theme.onSurface }]}>
            {item.title}
          </Text>
          {!!item.notes && (
            <Text style={{ color: theme.onSurface }}>{item.notes}</Text>
          )}
          <View style={styles.ids}>
            {item.hymnIds.map((id) => (
              <Pressable
                accessibilityLabel={`${t.choirOpenHymn} ${id}`}
                key={id}
                onPress={() => router.push(`/hymn/${id}`)}
                style={[
                  styles.hymn,
                  { backgroundColor: theme.surfaceVariants.containerHighest },
                ]}
              >
                <Text style={{ color: theme.primary }}>{id}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  title: { ...fonts.bold, fontSize: 23 },
  ids: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hymn: {
    paddingHorizontal: 15,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 16,
  },
});
