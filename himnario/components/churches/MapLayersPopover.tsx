/**
 * MapLayersPopover — Moonlitt-inspired floating iOS 26 Liquid Glass map style picker.
 *
 * Shows 3 crisp Apple-Maps-style rounded-square map thumbnails side-by-side
 * (`Standard`, `Night 3D`, `Satellite`) with a top-right circular Liquid Glass
 * checkmark dismiss button and active ring border (zero crosses anywhere).
 */
import React from "react";
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { fonts } from "../../theme/theme";
import * as Haptics from "../../utils/haptics";
import AppMenuIcon from "../AppMenuIcon";
import GlassSurface from "../GlassSurface";

export type ChurchMapLayer = "standard" | "night3d" | "satellite";

const LAYER_THUMBNAILS: Record<ChurchMapLayer, ImageSourcePropType> = {
  standard: require("../../assets/images/map-layer-standard.jpg"),
  night3d: require("../../assets/images/map-layer-night3d.jpg"),
  satellite: require("../../assets/images/map-layer-satellite.jpg"),
};

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

export default function MapLayersPopover({
  visible,
  value,
  onChange,
  onClose,
  forceDark,
}: MapLayersPopoverProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const isIOS = Platform.OS === "ios";
  const darkChrome = forceDark ?? isDarkMode;

  if (!visible) return null;

  const options: {
    id: ChurchMapLayer;
    label: string;
    source: ImageSourcePropType;
  }[] = [
    {
      id: "standard",
      label: t.mapLayerStandard,
      source: LAYER_THUMBNAILS.standard,
    },
    {
      id: "night3d",
      label: t.mapLayerNight3D,
      source: LAYER_THUMBNAILS.night3d,
    },
    {
      id: "satellite",
      label: t.mapLayerSatellite,
      source: LAYER_THUMBNAILS.satellite,
    },
  ];

  const titleColor = darkChrome ? "#FFFFFF" : "#1C1A19";
  const subColor = darkChrome ? "rgba(255,255,255,0.84)" : "#5C534E";
  const activeRingColor = darkChrome ? "#FFFFFF" : "#6e1619";

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
        tonalColor={darkChrome ? "rgba(24,24,26,0.94)" : "rgba(255,255,255,0.92)"}
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
                          ? "rgba(255,255,255,0.18)"
                          : "rgba(0,0,0,0.10)",
                      borderWidth: selected ? 2.5 : 1,
                    },
                  ]}
                >
                  <Image
                    source={opt.source}
                    resizeMode="cover"
                    fadeDuration={0}
                    style={styles.previewImage}
                  />
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
  previewImage: {
    width: "100%",
    height: "100%",
  },
  tileLabel: {
    fontSize: 12.5,
    textAlign: "center",
  },
});
