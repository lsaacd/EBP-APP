/**
 * ChurchDetailActionBar — Apple Maps / Oyelo-inspired action bar for the Church Detail sheet.
 *
 * Replaces the old 2-row 4-button layout (which truncated "Mirar alrededor" and "Código QR"
 * and rendered low-contrast green-on-green text on glass) with:
 *   1. One unmistakable full-width primary pill ("Cómo llegar" + live drive time when available)
 *   2. One balanced row of 4 compact icon-over-label Liquid Glass tiles:
 *      - Look Around / Street View
 *      - My Church / Your Church (high-contrast emerald icon badge + crisp primary ink)
 *      - QR Code
 *      - More menu (Copy address, Share church, plus Admin Edit/Delete when applicable)
 */
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import { useTheme } from "../../theme/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { fonts } from "../../theme/theme";
import * as Haptics from "../../utils/haptics";
import AppMenuIcon from "../AppMenuIcon";
import GlassSurface from "../GlassSurface";
import TactilePressable from "../TactilePressable";

const HAS_NATIVE_MENU =
  Platform.OS !== "web" && Boolean(UIManager.hasViewManagerConfig?.("MenuView"));

export interface ChurchDetailActionBarProps {
  /** Formatted drive time such as "19 min" or "1 hr 4 min", if resolved. */
  driveTimeLabel: string | null;
  isMyLinkedChurch: boolean;
  isLookingAround: boolean;
  isSettingMyChurch: boolean;
  isAdmin: boolean;
  isPending: boolean;
  onDirections: () => void;
  onStreetPreview: () => void;
  onToggleMyChurch: () => void;
  onOpenQr: () => void;
  onCopyAddress: () => void;
  onShareChurch: () => void;
  onEditChurch: () => void;
  onDeleteChurch: () => void;
}

export default function ChurchDetailActionBar({
  driveTimeLabel,
  isMyLinkedChurch,
  isLookingAround,
  isSettingMyChurch,
  isAdmin,
  isPending,
  onDirections,
  onStreetPreview,
  onToggleMyChurch,
  onOpenQr,
  onCopyAddress,
  onShareChurch,
  onEditChurch,
  onDeleteChurch,
}: ChurchDetailActionBarProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const isIOS = Platform.OS === "ios";

  const secondaryTileBg = isDarkMode
    ? "rgba(255,255,255,0.10)"
    : theme.surfaceVariants.containerHighest;

  const menuActions = useMemo<MenuAction[]>(() => {
    const actions: MenuAction[] = [
      {
        id: "copy-address",
        title: t.churchCopyAddress,
        image: isIOS ? "doc.on.doc" : undefined,
      },
      {
        id: "share-church",
        title: t.churchShareAction,
        image: isIOS ? "square.and.arrow.up" : undefined,
      },
    ];
    if (isAdmin) {
      actions.push(
        {
          id: "edit-church",
          title: isPending ? t.churchReviewApprove : t.churchEditChurch,
          image: isIOS ? "pencil" : undefined,
        },
        {
          id: "delete-church",
          title: t.delete,
          image: isIOS ? "trash" : undefined,
          attributes: { destructive: true },
        },
      );
    }
    return actions;
  }, [
    isAdmin,
    isIOS,
    isPending,
    t.churchCopyAddress,
    t.churchEditChurch,
    t.churchReviewApprove,
    t.churchShareAction,
    t.delete,
  ]);

  const handleMenuEvent = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (id === "copy-address") onCopyAddress();
    else if (id === "share-church") onShareChurch();
    else if (id === "edit-church") onEditChurch();
    else if (id === "delete-church") onDeleteChurch();
  };

  const openFallbackMoreMenu = () => {
    Haptics.selectionAsync().catch(() => {});
    const buttons: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: t.churchCopyAddress, onPress: onCopyAddress },
      { text: t.churchShareAction, onPress: onShareChurch },
    ];
    if (isAdmin) {
      buttons.push(
        {
          text: isPending ? t.churchReviewApprove : t.churchEditChurch,
          onPress: onEditChurch,
        },
        {
          text: t.delete,
          style: "destructive",
          onPress: onDeleteChurch,
        },
      );
    }
    buttons.push({ text: t.cancel, style: "cancel" });
    Alert.alert(t.churchMoreActions, undefined, buttons);
  };

  const renderTileShell = (
    key: string,
    children: React.ReactNode,
    activeAccent?: boolean,
  ) => {
    if (isIOS) {
      return (
        <GlassSurface
          key={key}
          isInteractive
          glassEffectStyle="regular"
          intensity={58}
          style={[
            styles.tileGlass,
            activeAccent && {
              borderWidth: 1,
              borderColor: "rgba(52, 199, 89, 0.72)",
            },
          ]}
        >
          {children}
        </GlassSurface>
      );
    }
    return (
      <View
        key={key}
        style={[
          styles.tileSolid,
          {
            backgroundColor: secondaryTileBg,
            borderWidth: activeAccent ? 1 : 0,
            borderColor: activeAccent ? "rgba(52, 199, 89, 0.72)" : "transparent",
          },
        ]}
      >
        {children}
      </View>
    );
  };

  const primaryLabel = driveTimeLabel
    ? `${t.churchDirections} · ${driveTimeLabel}`
    : t.churchDirections;

  const moreTileInner = (
    <View style={styles.tileHit}>
      <AppMenuIcon
        ios="ellipsis"
        android="more-horiz"
        color={theme.onSurface}
        size={17}
        weight="semibold"
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[styles.tileLabel, { color: theme.onSurface }]}
      >
        {t.churchMoreActions}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {/* 1. Primary Full-Width Directions CTA */}
      <TactilePressable
        onPress={onDirections}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        style={[
          styles.primaryBtn,
          { backgroundColor: theme.primary },
        ]}
      >
        <AppMenuIcon
          ios="arrow.triangle.turn.up.right.diamond.fill"
          android="directions"
          color={theme.onPrimary}
          size={17}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.primaryLabel,
            { color: theme.onPrimary, fontVariant: ["tabular-nums"] },
          ]}
        >
          {primaryLabel}
        </Text>
      </TactilePressable>

      {/* 2. Balanced Single Row of 4 Icon-Over-Label Tiles */}
      <View style={styles.tilesRow}>
        {/* Look Around / Street View */}
        {renderTileShell(
          "street",
          <Pressable
            disabled={isLookingAround}
            onPress={onStreetPreview}
            accessibilityRole="button"
            accessibilityLabel={isIOS ? t.churchLookAround : t.churchStreetView}
            style={({ pressed }) => [styles.tileHit, pressed && { opacity: 0.76 }]}
          >
            {isLookingAround ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <AppMenuIcon
                  ios="binoculars.fill"
                  android="streetview"
                  color={theme.onSurface}
                  size={17}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={[styles.tileLabel, { color: theme.onSurface }]}
                >
                  {isIOS ? t.churchLookAroundShort : t.churchStreetViewShort}
                </Text>
              </>
            )}
          </Pressable>,
        )}

        {/* My Church / Your Church (high-contrast emerald icon + crisp primary label) */}
        {renderTileShell(
          "my-church",
          <Pressable
            disabled={isSettingMyChurch}
            onPress={onToggleMyChurch}
            accessibilityRole="button"
            accessibilityLabel={
              isMyLinkedChurch ? t.churchYourChurch : t.churchSetAsMyChurch
            }
            style={({ pressed }) => [styles.tileHit, pressed && { opacity: 0.76 }]}
          >
            {isSettingMyChurch ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <AppMenuIcon
                  ios={isMyLinkedChurch ? "checkmark.seal.fill" : "building.columns"}
                  android={isMyLinkedChurch ? "verified" : "account-balance"}
                  color={isMyLinkedChurch ? "#34C759" : theme.onSurface}
                  size={17}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={[styles.tileLabel, { color: theme.onSurface }]}
                >
                  {isMyLinkedChurch ? t.churchYourChurch : t.churchMyChurchShort}
                </Text>
              </>
            )}
          </Pressable>,
          isMyLinkedChurch,
        )}

        {/* QR Code */}
        {renderTileShell(
          "qr",
          <Pressable
            onPress={onOpenQr}
            accessibilityRole="button"
            accessibilityLabel={t.churchQrCodeAction}
            style={({ pressed }) => [styles.tileHit, pressed && { opacity: 0.76 }]}
          >
            <AppMenuIcon
              ios="qrcode"
              android="qr-code-2"
              color={theme.onSurface}
              size={17}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[styles.tileLabel, { color: theme.onSurface }]}
            >
              {t.churchQrShort}
            </Text>
          </Pressable>,
        )}

        {/* More Menu (Copy Address, Share, Admin Edit/Delete) */}
        {renderTileShell(
          "more",
          HAS_NATIVE_MENU ? (
            <MenuView
              title={t.churchMoreActions}
              actions={menuActions}
              onPressAction={(event) => handleMenuEvent(event.nativeEvent.event)}
              style={styles.menuFill}
            >
              {moreTileInner}
            </MenuView>
          ) : (
            <Pressable
              onPress={openFallbackMoreMenu}
              accessibilityRole="button"
              accessibilityLabel={t.churchMoreActions}
              style={({ pressed }) => [styles.tileHit, pressed && { opacity: 0.76 }]}
            >
              {moreTileInner}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderCurve: "continuous",
  },
  primaryLabel: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 8,
  },
  tileGlass: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    borderCurve: "continuous",
  },
  tileSolid: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  menuFill: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  tileHit: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tileLabel: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
    textAlign: "center",
  },
});
