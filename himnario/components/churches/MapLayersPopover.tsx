/**
 * MapLayersPopover — Moonlitt-inspired floating iOS 26 Liquid Glass map style picker.
 *
 * Shows 3 visual rounded-square map-style tiles side-by-side (`Standard`, `Night 3D`,
 * `Satellite`) with a top-right circular Liquid Glass checkmark dismiss button and
 * crisp active ring border (zero crosses anywhere).
 */
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { fonts } from "../../theme/theme";
import * as Haptics from "../../utils/haptics";
import AppMenuIcon from "../AppMenuIcon";
import GlassSurface from "../GlassSurface";

export type ChurchMapLayer = "standard" | "night3d" | "satellite";

export const NIGHT_3D_ANDROID_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#152232" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ba6c1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e1722" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#143832" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#23364b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2f4a66" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1b2a" }] },
];

export interface MapLayersPopoverProps {
  visible: boolean;
  value: ChurchMapLayer;
  onChange: (layer: ChurchMapLayer) => void;
  onClose: () => void;
  forceDark?: boolean;
}

function StandardTilePreview({ dark }: { dark: boolean }) {
  const bg = dark ? "#242C36" : "#DCEAD4";
  const park = dark ? "#1E3A30" : "#BFE0B0";
  const water = dark ? "#1A374D" : "#9CD2F2";
  const roadMain = dark ? "#3F4B59" : "#FFFFFF";
  const roadAccent = dark ? "#5A697B" : "#F6D48A";
  const pinDot = "#6e1619";

  return (
    <View style={[styles.previewCanvas, { backgroundColor: bg }]}>
      <View
        style={{
          position: "absolute",
          top: -8,
          right: -12,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: water,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: 8,
          width: 34,
          height: 26,
          borderRadius: 10,
          backgroundColor: park,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 26,
          left: -10,
          right: -10,
          height: 7,
          backgroundColor: roadMain,
          transform: [{ rotate: "-14deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -10,
          bottom: -10,
          left: 36,
          width: 6,
          backgroundColor: roadAccent,
          transform: [{ rotate: "16deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 18,
          right: 18,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: pinDot,
          borderWidth: 2,
          borderColor: "#FFFFFF",
        }}
      />
    </View>
  );
}

function Night3DTilePreview() {
  return (
    <View style={[styles.previewCanvas, { backgroundColor: "#14243A" }]}>
      {/* Diagonal glowing avenues */}
      <View
        style={{
          position: "absolute",
          top: 28,
          left: -12,
          right: -12,
          height: 6,
          backgroundColor: "#243D5E",
          transform: [{ rotate: "-22deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -8,
          bottom: -8,
          left: 34,
          width: 5,
          backgroundColor: "#243D5E",
          transform: [{ rotate: "24deg" }],
        }}
      />
      {/* Isometric-feeling 3D city blocks & green park */}
      <View
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          width: 22,
          height: 16,
          borderRadius: 4,
          backgroundColor: "#29527A",
          borderTopWidth: 3,
          borderTopColor: "#4277A8",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 18,
          right: 10,
          width: 24,
          height: 20,
          borderRadius: 5,
          backgroundColor: "#22466B",
          borderTopWidth: 3,
          borderTopColor: "#3A6E9E",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 12,
          left: 24,
          width: 28,
          height: 22,
          borderRadius: 9,
          backgroundColor: "#145A52",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 18,
          left: 31,
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: "#1D7F72",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 14,
          right: 12,
          width: 18,
          height: 15,
          borderRadius: 4,
          backgroundColor: "#334375",
          borderTopWidth: 3,
          borderTopColor: "#5064A3",
        }}
      />
    </View>
  );
}

function SatelliteTilePreview() {
  return (
    <View style={[styles.previewCanvas, { backgroundColor: "#3E4B3B" }]}>
      {/* Aerial terrain & foliage patches */}
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          width: 44,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#567047",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 20,
          left: 22,
          width: 24,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#6B8655",
        }}
      />
      {/* Aerial streets & crisp rooftops */}
      <View
        style={{
          position: "absolute",
          top: -6,
          bottom: -6,
          right: 22,
          width: 6,
          backgroundColor: "#9A968C",
          transform: [{ rotate: "12deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 14,
          left: -10,
          right: -10,
          height: 6,
          backgroundColor: "#8C897E",
          transform: [{ rotate: "-10deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 13,
          height: 11,
          borderRadius: 2,
          backgroundColor: "#C8C1B4",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 8,
          left: 10,
          width: 15,
          height: 10,
          borderRadius: 2,
          backgroundColor: "#B7AEA0",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 10,
          left: 8,
          width: 11,
          height: 9,
          borderRadius: 2,
          backgroundColor: "#A59E90",
        }}
      />
    </View>
  );
}

export default function MapLayersPopover({
  visible,
  value,
  onChange,
  onClose,
  forceDark,
}: MapLayersPopoverProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const isIOS = Platform.OS === "ios";
  const darkChrome = forceDark ?? isDarkMode;

  if (!visible) return null;

  const options: {
    id: ChurchMapLayer;
    label: string;
    renderPreview: () => React.ReactNode;
  }[] = [
    {
      id: "standard",
      label: t.mapLayerStandard,
      renderPreview: () => <StandardTilePreview dark={isDarkMode} />,
    },
    {
      id: "night3d",
      label: t.mapLayerNight3D,
      renderPreview: () => <Night3DTilePreview />,
    },
    {
      id: "satellite",
      label: t.mapLayerSatellite,
      renderPreview: () => <SatelliteTilePreview />,
    },
  ];

  const titleColor = darkChrome ? "#FFFFFF" : theme.onSurface;
  const subColor = darkChrome ? "rgba(255,255,255,0.82)" : theme.onSurfaceVariant;
  const activeRingColor = darkChrome ? "#FFFFFF" : theme.primary;

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(140)}
      style={styles.outerWrap}
    >
      <GlassSurface
        glassEffectStyle="regular"
        intensity={76}
        forceDark={darkChrome}
        tonalColor={darkChrome ? "rgba(24,24,26,0.94)" : theme.surfaceVariants.containerLow}
        style={[
          styles.card,
          !isIOS && {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: darkChrome ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.title, { color: titleColor }]}>{t.mapLayersTitle}</Text>
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={64}
            forceDark={darkChrome}
            style={styles.doneCircle}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.done}
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={({ pressed }) => [styles.doneCircleHit, pressed && { opacity: 0.72 }]}
            >
              <AppMenuIcon
                ios="checkmark"
                android="check"
                color={titleColor}
                size={16}
                weight="bold"
              />
            </Pressable>
          </GlassSurface>
        </View>

        <View style={styles.tilesRow}>
          {options.map((opt) => {
            const selected = value === opt.id;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(opt.id);
                }}
                style={({ pressed }) => [styles.tileCol, pressed && { opacity: 0.82 }]}
              >
                <View
                  style={[
                    styles.tileFrame,
                    {
                      borderColor: selected
                        ? activeRingColor
                        : darkChrome
                          ? "rgba(255,255,255,0.16)"
                          : "rgba(0,0,0,0.10)",
                      borderWidth: selected ? 2.5 : 1,
                    },
                  ]}
                >
                  {opt.renderPreview()}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tileLabel,
                    {
                      color: selected ? titleColor : subColor,
                      ...(selected ? fonts.sansSemiBold : fonts.sansMedium),
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    marginTop: 2,
  },
  card: {
    borderRadius: 26,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 34,
    height: 34,
  },
  title: {
    ...fonts.sansSemiBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
  },
  doneCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  doneCircleHit: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  tilesRow: {
    flexDirection: "row",
    gap: 10,
  },
  tileCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  tileFrame: {
    width: "100%",
    aspectRatio: 1.06,
    borderRadius: 18,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  previewCanvas: {
    flex: 1,
    overflow: "hidden",
  },
  tileLabel: {
    fontSize: 12.5,
    textAlign: "center",
  },
});
