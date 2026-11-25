/**
 * PlaylistDetailScreen — Apple Music–inspired Liquid Glass Playlist Detail.
 *
 * - Liquid Glass Back (<) and Overflow (...) MenuView (Share, Rename, Delete)
 * - Centered Hero Artwork Card + Bold Title + Song Count
 * - 1-Tap Play & Shuffle Pills (wired directly to this playlist's queue)
 * - "+ Agregar himnos" / "+ Add Hymns" row opening a fast searchable multi-select picker sheet
 */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  FlatList,
  Animated,
  Image,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuView } from '@react-native-menu/menu';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { hasHymnAudio } from '../../data/audioRegistry';
import { fonts } from '../../theme/theme';
import * as Haptics from '../../utils/haptics';
import { useFriends } from '../../utils/friendsStore';
import { communityError } from '../../utils/communityApi';
import { churchDisplayName } from '../../utils/churchName';
import AppMenuIcon from '../AppMenuIcon';
import GlassSurface from '../GlassSurface';
import SheetGrabber from '../SheetGrabber';
import HymnRowLink from '../HymnRowLink';
import ListSortMenu, { type ListSortOption } from '../ListSortMenu';
import AnimatedEqualizer from '../AnimatedEqualizer';
import TrackEllipsisMenu from '../TrackEllipsisMenu';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { buildSheetBackdropGesture, buildSheetPanGesture } from '../../utils/useSheetBackdropGesture';

const IS_IOS = Platform.OS === 'ios';
const IS_IPAD = IS_IOS && Boolean((Platform as any).isPad);
const EBP_HYMN_COVER = require('../../assets/images/EBP_HYMN_COVER.png');

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isWideTablet = IS_IPAD || screenWidth >= 700;
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const { currentHymnId, isPlaying, openPlayer } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 196 : 124);

  const {
    playlists,
    deletePlaylist,
    updatePlaylistName,
    addHymnToPlaylist,
    removeHymnFromPlaylist,
  } = usePlaylists();
  const { user, openAuthSheet } = useAuth();
  const { lists: friendLists, loading: friendsLoading, refresh: refreshFriends, sendPlaylist } = useFriends();

  // Share with friend sheet state
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentToIds, setSentToIds] = useState<Record<string, boolean>>({});
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Add Hymns picker sheet state
  const [addHymnsOpen, setAddHymnsOpen] = useState(false);
  const [hymnSearch, setHymnSearch] = useState('');

  // Rename sheet state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [playlistSort, setPlaylistSort] = useState<'manual' | 'number' | 'az'>('manual');

  const playlistSortOptions = useMemo<readonly ListSortOption<'manual' | 'number' | 'az'>[]>(
    () => [
      { value: 'manual', label: t.sortManual, shortLabel: t.sortManualShort, iosIcon: 'list.bullet' },
      { value: 'number', label: t.sortByNumber, shortLabel: t.sortByNumberShort, iosIcon: 'number' },
      { value: 'az', label: t.sortByAZ, shortLabel: t.sortByAZShort, iosIcon: 'textformat.abc' },
    ],
    [t.sortByAZ, t.sortByAZShort, t.sortByNumber, t.sortByNumberShort, t.sortManual, t.sortManualShort],
  );

  const playlist = playlists.find((p) => p.id === id);
  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const allLocalizedHymns = useMemo(() => {
    const combined = [...hymnsData, ...estribillosData];
    return combined.map((h) => ({
      ...getLocalizedHymn(h as any, displayHymnLang),
      _rawTitle: (h as any).title,
      _enTitle: getLocalizedHymn(h as any, 'en').title,
    }));
  }, [displayHymnLang]);

  const hymnMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const h of allLocalizedHymns) m.set(String(h.id), h);
    return m;
  }, [allLocalizedHymns]);

  const playlistHymns = useMemo(() => {
    if (!playlist) return [];
    const base = playlist.hymnIds.map((hId) => hymnMap.get(String(hId))).filter(Boolean);
    if (playlistSort === 'number') {
      return [...base].sort((a: any, b: any) => {
        const aE = String(a.id).startsWith('E') ? 1 : 0;
        const bE = String(b.id).startsWith('E') ? 1 : 0;
        if (aE !== bE) return aE - bE;
        return Number(a.number) - Number(b.number);
      });
    }
    if (playlistSort === 'az') {
      return [...base].sort((a: any, b: any) =>
        String(a.title || '').localeCompare(String(b.title || '')),
      );
    }
    return base;
  }, [playlist, hymnMap, playlistSort]);

  const sortedPlaylistIds = useMemo(
    () => playlistHymns.map((h: any) => String(h.id)),
    [playlistHymns],
  );

  const playableIds = useMemo(
    () => sortedPlaylistIds.filter(hasHymnAudio),
    [sortedPlaylistIds],
  );

  const filteredPickerHymns = useMemo(() => {
    const q = hymnSearch.trim().toLowerCase();
    if (!q) return allLocalizedHymns;
    return allLocalizedHymns.filter(
      (h: any) =>
        String(h.number).toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q) ||
        (h._rawTitle && String(h._rawTitle).toLowerCase().includes(q)) ||
        (h._enTitle && String(h._enTitle).toLowerCase().includes(q)) ||
        (h.categories && h.categories.toLowerCase().includes(q)),
    );
  }, [allLocalizedHymns, hymnSearch]);

  // ── Glorify swipe-down gesture for Add Hymns sheet ────────────────────────
  const pickerTravel = Math.max(420, Math.round(screenHeight * 0.78));
  const pickerProgress = useSharedValue(1);
  const pickerDragOrigin = useSharedValue(0);

  const openAddHymnsSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHymnSearch('');
    pickerProgress.value = 1;
    setAddHymnsOpen(true);
    requestAnimationFrame(() => {
      pickerProgress.value = withSpring(0, { damping: 28, stiffness: 240, mass: 0.9, overshootClamping: true });
    });
  }, [pickerProgress]);

  const finishCloseAddHymns = useCallback(() => {
    setAddHymnsOpen(false);
    setHymnSearch('');
  }, []);

  const closeAddHymnsSheet = useCallback(() => {
    pickerProgress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    setTimeout(finishCloseAddHymns, 220);
  }, [pickerProgress, finishCloseAddHymns]);

  const pickerBackdropPan = useMemo(
    () =>
      buildSheetBackdropGesture({
        progress: pickerProgress,
        dragOrigin: pickerDragOrigin,
        travel: pickerTravel,
        enabled: addHymnsOpen,
        onTapClose: closeAddHymnsSheet,
        onFinishDismiss: finishCloseAddHymns,
      }),
    [pickerProgress, pickerDragOrigin, pickerTravel, addHymnsOpen, closeAddHymnsSheet, finishCloseAddHymns],
  );
  const pickerHeaderPan = useMemo(
    () =>
      buildSheetPanGesture({
        progress: pickerProgress,
        dragOrigin: pickerDragOrigin,
        travel: pickerTravel,
        enabled: addHymnsOpen,
        onFinishDismiss: finishCloseAddHymns,
      }),
    [pickerProgress, pickerDragOrigin, pickerTravel, addHymnsOpen, finishCloseAddHymns],
  );
  const pickerBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pickerProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));
  const pickerSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pickerProgress.value * pickerTravel }],
  }));

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePlayPlaylist = useCallback(
    (shuffle: boolean) => {
      if (!playlist) return;
      if (playableIds.length === 0) {
        Alert.alert(playlist.name, t.favoritesNoAudioAlert);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const startId = shuffle
        ? playableIds[Math.floor(Math.random() * playableIds.length)]
        : playableIds[0];
      openPlayer(startId, sortedPlaylistIds, { label: playlist.name, shuffle });
    },
    [playlist, playableIds, sortedPlaylistIds, openPlayer, t.favoritesNoAudioAlert],
  );

  const handleOpenShareWithFriend = () => {
    Haptics.selectionAsync();
    if (!user) {
      Alert.alert(t.friendsSharePlaylist, t.friendsSharePlaylistSignIn, [
        { text: t.cancel, style: 'cancel' },
        { text: t.authSignIn, onPress: () => openAuthSheet() },
      ]);
      return;
    }
    if (!user.emailVerified) {
      Alert.alert(t.friendsSharePlaylist, t.friendsSharePlaylistSignIn);
      return;
    }
    setShareMessage(null);
    setShareError(null);
    setSentToIds({});
    setSharePickerOpen(true);
    void refreshFriends();
  };

  const handleSendToFriend = async (friendId: string, friendName: string) => {
    if (!playlist || sendingToId || sentToIds[friendId]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSendingToId(friendId);
    setShareError(null);
    setShareMessage(null);
    try {
      await sendPlaylist(friendId, playlist.name, playlist.hymnIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSentToIds((prev) => ({ ...prev, [friendId]: true }));
      setShareMessage(t.friendsSharePlaylistSent.replace('{name}', friendName));
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShareError(communityError(e, language === 'es'));
    } finally {
      setSendingToId(null);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(t.deletePlaylistTitle, t.deletePlaylistConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          if (id) {
            deletePlaylist(String(id));
            router.back();
          }
        },
      },
    ]);
  };

  const handleOpenRename = () => {
    if (!playlist) return;
    setRenameValue(playlist.name);
    setRenameOpen(true);
  };

  const handleSaveRename = () => {
    if (!playlist || !renameValue.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlaylistName(playlist.id, renameValue.trim());
    setRenameOpen(false);
  };

  const handleRemoveHymn = (hymnId: string) => {
    if (id) removeHymnFromPlaylist(String(id), hymnId);
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [150, 210],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (!playlist) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.onSurface, ...fonts.regular, fontSize: 18 }}>{t.playlistNotFound}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary, ...fonts.bold }}>{t.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canvasBg = isDarkMode ? '#000000' : '#FCF9F2';
  const primaryInk = isDarkMode ? '#FDF9F2' : '#1A1614';
  const accentColor = isDarkMode ? '#F4C7C9' : theme.primary;
  const playPillBg = isDarkMode ? '#FDF9F2' : theme.primary;
  const playPillInk = isDarkMode ? '#0D0D0F' : '#FFFFFF';
  const mutedSub = isDarkMode ? 'rgba(235,235,245,0.58)' : '#6C645E';
  const hairline = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(26,22,20,0.09)';
  const cardSurface = isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '45';
  const subtlePillBg = isDarkMode ? 'rgba(255,255,255,0.10)' : theme.primary + '12';
  const playlistIdSet = new Set(playlist.hymnIds);
  const swiftUI = IS_IOS ? getExpoSwiftUI() : null;
  const withAudioText = t.favoritesWithAudioCount.replace('{n}', String(playableIds.length));

  const heroCoverScale = scrollY.interpolate({
    inputRange: [-60, 0, 220],
    outputRange: [1.06, 1, 0.88],
    extrapolate: 'clamp',
  });

  const toCleanCat = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed === trimmed.toUpperCase()) {
      return trimmed
        .toLowerCase()
        .replace(/(^|\s|·|\/)([a-záéíóúñü])/g, (m, p1, p2) => `${p1}${p2.toUpperCase()}`);
    }
    return trimmed;
  };

  return (
    <View style={[styles.root, { backgroundColor: canvasBg }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }} />

      {/* ── Atmospheric Cover Wash ── */}
      <LinearGradient
        colors={
          isDarkMode
            ? ['rgba(122, 24, 30, 0.58)', 'rgba(54, 12, 16, 0.24)', 'rgba(0, 0, 0, 0)']
            : ['rgba(110, 22, 25, 0.14)', 'rgba(110, 22, 25, 0.04)', 'rgba(252, 249, 242, 0)']
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + ipadTopOffset + 360,
        }}
        pointerEvents="none"
      />

      {/* ── Floating Apple Music–style Liquid Glass Top Bar ── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(0,0,0,0.92)' : 'rgba(252,249,242,0.95)',
          isDarkMode ? 'rgba(0,0,0,0.0)' : 'rgba(252,249,242,0.0)',
        ]}
        style={[styles.topScrim, { height: insets.top + ipadTopOffset + 56 }]}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + ipadTopOffset + 8 }]}>
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={62}
          style={[
            styles.circleGlass,
            !IS_IOS && {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : theme.surfaceVariants.containerLow,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: cardBorder,
              overflow: 'hidden',
            },
          ]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel={t.goBack}
            style={({ pressed }) => [styles.circleGlassInner, pressed && { opacity: 0.72 }]}
          >
            <AppMenuIcon
              ios="chevron.left"
              android="arrow-back"
              size={22}
              containerSize={26}
              color={primaryInk}
              weight="semibold"
            />
          </Pressable>
        </GlassSurface>

        <Animated.Text
          numberOfLines={1}
          style={[styles.floatingHeaderTitle, { color: primaryInk, opacity: headerTitleOpacity }]}
        >
          {playlist.name}
        </Animated.Text>

        {/* Apple Music Unified Top-Right Capsule: [ Share | ··· ] */}
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={62}
          style={[
            { height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 4 },
            !IS_IOS && {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : theme.surfaceVariants.containerLow,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: cardBorder,
              overflow: 'hidden',
            },
          ]}
        >
          {playlistHymns.length > 0 ? (
            <Pressable
              onPress={handleOpenShareWithFriend}
              accessibilityRole="button"
              accessibilityLabel={t.friendsSharePlaylist}
              style={({ pressed }) => [
                { width: 44, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
                pressed && { opacity: 0.72 },
              ]}
            >
              <AppMenuIcon
                ios="square.and.arrow.up"
                android="share"
                size={22}
                containerSize={26}
                scale="large"
                color={primaryInk}
                weight="medium"
              />
            </Pressable>
          ) : null}

          {swiftUI?.ui.Menu ? (() => {
            const { Button: SwiftButton, Host, Image: SwiftImage, Menu: SwiftMenu, Section: SwiftSection } = swiftUI.ui;
            const { font, foregroundStyle, frame } = swiftUI.modifiers;
            return (
              <Host
                style={{ width: 44, height: 42, alignItems: 'center', justifyContent: 'center' }}
                colorScheme={isDarkMode ? 'dark' : 'light'}
                seedColor={theme.primary}
              >
                <SwiftMenu
                  label={
                    <SwiftImage
                      systemName="ellipsis"
                      size={22}
                      modifiers={[
                        font({ size: 22, weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: primaryInk }),
                        frame({ width: 44, height: 42 }),
                      ]}
                    />
                  }
                >
                  <SwiftButton label={t.playlistAddHymns} systemImage="plus" onPress={openAddHymnsSheet} />
                  {playlistHymns.length > 0 ? (
                    <SwiftButton label={t.friendsSharePlaylist} systemImage="paperplane" onPress={handleOpenShareWithFriend} />
                  ) : null}
                  <SwiftButton label={t.playlistRenameAction} systemImage="pencil" onPress={handleOpenRename} />
                  <SwiftSection>
                    <SwiftButton role="destructive" label={t.deletePlaylist} systemImage="trash" onPress={handleDeletePlaylist} />
                  </SwiftSection>
                </SwiftMenu>
              </Host>
            );
          })() : (
            <MenuView
              themeVariant={isDarkMode ? 'dark' : 'light'}
              shouldOpenOnLongPress={false}
              actions={[
                ...(playlistHymns.length > 0
                  ? [{ id: 'share', title: t.friendsSharePlaylist, image: IS_IOS ? 'paperplane' : undefined, imageColor: primaryInk }]
                  : []),
                { id: 'add', title: t.playlistAddHymns, image: IS_IOS ? 'plus' : undefined, imageColor: primaryInk },
                { id: 'rename', title: t.playlistRenameAction, image: IS_IOS ? 'pencil' : undefined, imageColor: primaryInk },
                { id: 'delete', title: t.deletePlaylist, attributes: { destructive: true }, image: IS_IOS ? 'trash' : undefined, imageColor: '#FF453A' },
              ]}
              onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === 'share') handleOpenShareWithFriend();
                else if (nativeEvent.event === 'add') openAddHymnsSheet();
                else if (nativeEvent.event === 'rename') handleOpenRename();
                else if (nativeEvent.event === 'delete') handleDeletePlaylist();
              }}
            >
              <View
                style={{ width: 44, height: 42, alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel={t.playlistOptionsTitle}
              >
                <AppMenuIcon ios="ellipsis" android="more-horiz" size={22} containerSize={26} color={primaryInk} weight="semibold" />
              </View>
            </MenuView>
          )}
        </GlassSurface>
      </View>

      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          { paddingTop: insets.top + ipadTopOffset + 70, flexGrow: 1 },
          isWideTablet && styles.tabletContent,
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Centered Apple Music Hero Artwork + Title + 3-Button Cluster ── */}
        <View style={[styles.heroSection, { paddingHorizontal: 20 }]}>
          <Animated.View style={[styles.heroArtworkOuter, { transform: [{ scale: heroCoverScale }] }]}>
            {IS_IOS ? (
              <Link.AppleZoomTarget>
                <View style={styles.heroArtworkTarget}>
                  <Image
                    source={EBP_HYMN_COVER}
                    style={styles.heroArtworkImg}
                    resizeMode="cover"
                  />
                </View>
              </Link.AppleZoomTarget>
            ) : (
              <View style={styles.heroArtworkTarget}>
                <Image
                  source={EBP_HYMN_COVER}
                  style={styles.heroArtworkImg}
                  resizeMode="cover"
                />
              </View>
            )}
          </Animated.View>

          <Text style={[styles.heroTitle, { color: primaryInk }]}>{playlist.name}</Text>
          <Text style={{ ...fonts.sansMedium, fontSize: 15, color: accentColor, marginTop: 2 }}>
            {t.appName}
          </Text>
          <Text
            style={[
              styles.heroSub,
              { color: mutedSub, fontVariant: ['tabular-nums'], marginTop: 5 },
            ]}
          >
            {`${playlistHymns.length} ${playlistHymns.length === 1 ? t.songCount_one : t.songCount_other} · ${withAudioText}`}
          </Text>

          {/* Signature Apple Music 3-Button Cluster: [Shuffle]  [▶ Play]  [+ Add Hymns] */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              marginTop: 18,
              width: '100%',
            }}
          >
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={62}
              style={[
                { width: 48, height: 48, borderRadius: 24 },
                !IS_IOS && {
                  backgroundColor: subtlePillBg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: cardBorder,
                  overflow: 'hidden',
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.favoritesShuffle}
                onPress={() => handlePlayPlaylist(true)}
                style={({ pressed }) => [
                  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <AppMenuIcon ios="shuffle" android="shuffle" size={19} weight="semibold" color={primaryInk} />
              </Pressable>
            </GlassSurface>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                playlistHymns.length > 0 ? handlePlayPlaylist(false) : openAddHymnsSheet()
              }
              style={{
                flex: 1,
                maxWidth: 196,
                height: 48,
                borderRadius: 24,
                backgroundColor: playPillBg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingHorizontal: 20,
              }}
            >
              <AppMenuIcon
                ios={playlistHymns.length > 0 ? 'play.fill' : 'plus'}
                android={playlistHymns.length > 0 ? 'play-arrow' : 'add'}
                size={18}
                weight="semibold"
                color={playPillInk}
              />
              <Text style={{ ...fonts.sansSemiBold, fontSize: 16.5, color: playPillInk }}>
                {playlistHymns.length > 0 ? t.favoritesPlay : t.playlistAddHymns}
              </Text>
            </TouchableOpacity>

            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={62}
              style={[
                { width: 48, height: 48, borderRadius: 24 },
                !IS_IOS && {
                  backgroundColor: subtlePillBg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: cardBorder,
                  overflow: 'hidden',
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.playlistAddHymns}
                onPress={openAddHymnsSheet}
                style={({ pressed }) => [
                  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <AppMenuIcon ios="plus" android="add" size={20} weight="semibold" color={primaryInk} />
              </Pressable>
            </GlassSurface>
          </View>
        </View>

        {/* ── Sort Header when playlist has multiple hymns ── */}
        {playlistHymns.length > 1 ? (
          <View style={[styles.sortRow, { paddingHorizontal: 20, marginBottom: 6 }]}>
            <Text style={[styles.sortCountLabel, { color: mutedSub }]}>
              {playlistHymns.length} {t.songCount_other}
            </Text>
            <ListSortMenu
              pill
              value={playlistSort}
              onChange={setPlaylistSort}
              options={playlistSortOptions}
              menuTitle={t.sortMenuTitle}
            />
          </View>
        ) : null}

        {/* ── Open Borderless Apple Music Tracklist ── */}
        {playlistHymns.length === 0 ? (
          <View style={[styles.emptyState, { paddingHorizontal: 28 }]}>
            <Text style={[styles.emptyText, { color: mutedSub }]}>
              {t.playlistEmpty}
            </Text>
          </View>
        ) : (
          <View>
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 20, backgroundColor: hairline }} />
            {playlistHymns.map((hymn: any, index: number) => {
              const idStr = String(hymn.id);
              const isCurrent = currentHymnId === idStr;
              const canPlay = hasHymnAudio(idStr);
              const cleanCat = hymn.categories
                ? toCleanCat(translateCategories(hymn.categories, language))
                : '';

              return (
                <View key={idStr}>
                  {index > 0 ? (
                    <View
                      style={{
                        height: StyleSheet.hairlineWidth,
                        marginLeft: 58,
                        backgroundColor: hairline,
                      }}
                    />
                  ) : null}
                  <View
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: 14,
                        paddingRight: 10,
                        minHeight: 58,
                      },
                      isCurrent && {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(110,22,25,0.06)',
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={canPlay ? t.favoritesPlayNow : String(hymn.number)}
                      onPress={() => {
                        if (canPlay) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          openPlayer(idStr, sortedPlaylistIds, { label: playlist.name, shuffle: false });
                        } else {
                          Haptics.selectionAsync();
                          router.push({ pathname: '/hymn/[id]', params: { id: idStr, playlistId: playlist.id } });
                        }
                      }}
                      style={({ pressed }) => [
                        { width: 44, height: 54, alignItems: 'center', justifyContent: 'center' },
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      {isCurrent ? (
                        <AnimatedEqualizer playing={isPlaying} color={accentColor} size={16} />
                      ) : (
                        <Text
                          style={{
                            ...fonts.sansMedium,
                            fontSize: 15,
                            color: mutedSub,
                            fontVariant: ['tabular-nums'],
                          }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {hymn.number}
                        </Text>
                      )}
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <HymnRowLink
                        hymn={hymn}
                        href={{ pathname: '/hymn/[id]', params: { id: idStr, playlistId: playlist.id } }}
                        queueIds={sortedPlaylistIds}
                        queueLabel={playlist.name}
                        playlistIdToRemoveFrom={String(playlist.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 6 }}
                        activeOpacity={0.72}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              ...(isCurrent ? fonts.sansSemiBold : fonts.sansMedium),
                              fontSize: 16,
                              letterSpacing: -0.2,
                              color: isCurrent ? accentColor : primaryInk,
                            }}
                          >
                            {hymn.title}
                          </Text>
                          {cleanCat || canPlay ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {cleanCat ? (
                                <Text
                                  numberOfLines={1}
                                  style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedSub, flexShrink: 1 }}
                                >
                                  {cleanCat}
                                </Text>
                              ) : null}
                              {canPlay ? (
                                <View
                                  style={{
                                    width: 18,
                                    height: 15,
                                    borderRadius: 4,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDarkMode
                                      ? 'rgba(255,255,255,0.10)'
                                      : 'rgba(110,22,25,0.08)',
                                  }}
                                >
                                  <AppMenuIcon ios="waveform" android="graphic-eq" size={10} color={accentColor} weight="semibold" />
                                </View>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      </HymnRowLink>
                    </View>

                    <TrackEllipsisMenu
                      hymnId={idStr}
                      hymnNumber={hymn.number}
                      hymnTitle={hymn.title}
                      canPlay={canPlay}
                      removeLabel={t.favoritesRemoveFromPlaylist}
                      removeIcon="minus.circle"
                      iconColor={mutedSub}
                      onPlay={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        openPlayer(idStr, sortedPlaylistIds, { label: playlist.name, shuffle: false });
                      }}
                      onOpenLyrics={() =>
                        router.push({ pathname: '/hymn/[id]', params: { id: idStr, playlistId: playlist.id } })
                      }
                      onRemove={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleRemoveHymn(idStr);
                      }}
                    />
                  </View>
                </View>
              );
            })}

            {/* Editorial Footer */}
            <View
              style={{
                marginTop: 14,
                paddingTop: 14,
                paddingHorizontal: 20,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: hairline,
                gap: 3,
              }}
            >
              <Text
                style={{
                  ...fonts.sansRegular,
                  fontSize: 13,
                  color: mutedSub,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${playlistHymns.length} ${playlistHymns.length === 1 ? t.songCount_one : t.songCount_other} · ${withAudioText}`}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: bottomClearance }} />
      </Animated.ScrollView>

      {/* ── Add Hymns Searchable Picker Sheet (Glorify swipe-down) ── */}
      <Modal
        visible={addHymnsOpen}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeAddHymnsSheet}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalBackdropWrap}>
            <GestureDetector gesture={pickerBackdropPan}>
              <Reanimated.View style={[styles.modalScrim, pickerBackdropStyle]}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={closeAddHymnsSheet}
                />
              </Reanimated.View>
            </GestureDetector>

            <Reanimated.View style={[styles.pickerSheetOuter, pickerSheetStyle]}>
              <GestureDetector gesture={pickerHeaderPan}>
                <View style={styles.grabberHitZone}>
                  <SheetGrabber inline interactive />
                </View>
              </GestureDetector>

              <View
                style={[
                  styles.pickerSheet,
                  {
                    backgroundColor: theme.surfaceVariants.containerLow,
                    height: Math.min(screenHeight * 0.78, 660),
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
                ]}
              >
                <GestureDetector gesture={pickerHeaderPan}>
                  <View style={styles.shareSheetHeader}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.shareSheetTitle, { color: theme.onSurface }]}>
                        {t.playlistAddHymns}
                      </Text>
                      <Text style={[styles.shareSheetSub, { color: theme.onSurfaceVariant }]}>
                        {t.playlistAddHymnsSub}
                      </Text>
                    </View>
                    <GlassSurface isInteractive glassEffectStyle="regular" intensity={58} style={styles.closeGlass}>
                      <Pressable
                        onPress={closeAddHymnsSheet}
                        accessibilityRole="button"
                        accessibilityLabel={t.close}
                        style={styles.closeGlass}
                      >
                        <AppMenuIcon
                          ios="xmark"
                          android="close"
                          color={theme.primary}
                          size={19}
                          containerSize={22}
                          scale="large"
                          weight="semibold"
                        />
                      </Pressable>
                    </GlassSurface>
                  </View>
                </GestureDetector>

                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <MaterialIcons name="search" size={19} color={theme.onSurfaceVariant} />
                  <TextInput
                    value={hymnSearch}
                    onChangeText={setHymnSearch}
                    placeholder={t.playlistSearchHymnsPlaceholder}
                    placeholderTextColor={theme.onSurfaceVariant + '88'}
                    style={[styles.searchInput, { color: theme.onSurface }]}
                    clearButtonMode="while-editing"
                  />
                </View>

                <FlatList
                  data={filteredPickerHymns}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={16}
                  maxToRenderPerBatch={24}
                  renderItem={({ item }) => {
                    const hId = String(item.id);
                    const included = playlistIdSet.has(hId);
                    return (
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (included) removeHymnFromPlaylist(playlist.id, hId);
                          else addHymnToPlaylist(playlist.id, hId);
                        }}
                        style={({ pressed }) => [
                          styles.pickerRow,
                          { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.07)' : theme.outlineVariant + '30' },
                          pressed && { opacity: 0.72 },
                        ]}
                      >
                        <Text style={[styles.pickerNum, { color: theme.primary }]}>{item.number}</Text>
                        <Text numberOfLines={1} style={[styles.pickerTitle, { color: theme.onSurface }]}>
                          {item.title}
                        </Text>
                        <MaterialIcons
                          name={included ? 'check-circle' : 'add-circle-outline'}
                          size={23}
                          color={included ? theme.primary : theme.outline}
                        />
                      </Pressable>
                    );
                  }}
                />
              </View>
            </Reanimated.View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* ── Rename Playlist Modal ── */}
      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRenameOpen(false)}
      >
        <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined} style={styles.renameOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRenameOpen(false)} />
          <View
            style={[
              styles.renameCard,
              { backgroundColor: theme.surfaceVariants.containerLow, borderColor: cardBorder },
            ]}
          >
            <Text style={[styles.shareSheetTitle, { color: theme.onSurface, marginBottom: 12 }]}>
              {t.playlistRenameTitle}
            </Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={t.playlistsNamePlaceholder}
              placeholderTextColor={theme.onSurfaceVariant + '88'}
              maxLength={80}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveRename}
              style={[
                styles.renameInput,
                {
                  color: theme.onSurface,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
                  borderColor: cardBorder,
                },
              ]}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity
                onPress={() => setRenameOpen(false)}
                style={[styles.renameBtnSecondary, { backgroundColor: subtlePillBg }]}
              >
                <Text style={[styles.renameBtnSecondaryText, { color: theme.onSurface }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!renameValue.trim()}
                onPress={handleSaveRename}
                style={[
                  styles.renameBtnPrimary,
                  { backgroundColor: theme.primary, opacity: renameValue.trim() ? 1 : 0.45 },
                ]}
              >
                <Text style={[styles.renameBtnPrimaryText, { color: theme.onPrimary }]}>
                  {t.playlistSaveAction}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Share with Friend Sheet ── */}
      <Modal
        visible={sharePickerOpen}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setSharePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={t.close}
            onPress={() => setSharePickerOpen(false)}
          />
          <SheetGrabber inline />
          <View
            style={[
              styles.shareSheet,
              {
                backgroundColor: theme.surfaceVariants.containerLow,
                paddingBottom: Math.max(insets.bottom, 22),
              },
            ]}
          >
            <View style={styles.shareSheetHeader}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.shareSheetTitle, { color: theme.onSurface }]}>
                  {t.friendsSharePlaylist}
                </Text>
                <Text style={[styles.shareSheetSub, { color: theme.onSurfaceVariant }]}>
                  {t.friendsSharePlaylistSub}
                </Text>
              </View>
              <GlassSurface isInteractive glassEffectStyle="regular" intensity={58} style={styles.closeGlass}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={() => setSharePickerOpen(false)}
                  style={styles.closeGlass}
                >
                  <AppMenuIcon
                    ios="xmark"
                    android="close"
                    color={theme.primary}
                    size={19}
                    containerSize={22}
                    scale="large"
                    weight="semibold"
                  />
                </Pressable>
              </GlassSurface>
            </View>

            {shareMessage ? (
              <Text style={[styles.feedbackText, { color: '#34C759' }]}>{shareMessage}</Text>
            ) : null}
            {shareError ? (
              <Text accessibilityRole="alert" style={[styles.feedbackText, { color: theme.error || '#c0392b' }]}>
                {shareError}
              </Text>
            ) : null}

            {friendsLoading && friendLists.friends.length === 0 ? (
              <ActivityIndicator color={theme.primary} style={{ paddingVertical: 28 }} />
            ) : friendLists.friends.length === 0 ? (
              <View style={styles.emptyFriendsBox}>
                <AppMenuIcon ios="person.2" android="group" color={theme.onSurfaceVariant} size={28} />
                <Text style={[styles.emptyFriendsText, { color: theme.onSurfaceVariant }]}>
                  {t.friendsSharePlaylistEmpty}
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.friendsCard,
                    {
                      backgroundColor: isDarkMode ? '#222225' : '#FFFFFF',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '50',
                    },
                  ]}
                >
                  {friendLists.friends.map((friend, idx) => {
                    const isSending = sendingToId === friend.id;
                    const isSent = sentToIds[friend.id] === true;
                    const church = friend.churchName ? churchDisplayName(friend.churchName) : '';
                    return (
                      <View key={friend.id}>
                        {idx > 0 && (
                          <View
                            style={{
                              height: StyleSheet.hairlineWidth,
                              marginLeft: 66,
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant,
                            }}
                          />
                        )}
                        <Pressable
                          accessibilityRole="button"
                          disabled={Boolean(sendingToId) || isSent}
                          onPress={() => void handleSendToFriend(friend.id, friend.name)}
                          style={({ pressed }) => [
                            styles.friendRow,
                            pressed && {
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.friendAvatar,
                              { backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary },
                            ]}
                          >
                            <Text
                              style={{
                                ...fonts.sansBold,
                                fontSize: 14,
                                color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                              }}
                            >
                              {friend.initials}
                            </Text>
                          </View>
                          <View style={{ flex: 1, gap: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={{ ...fonts.sansSemiBold, fontSize: 15.5, color: theme.onSurface }}
                            >
                              {friend.name}
                            </Text>
                            {church ? (
                              <Text
                                numberOfLines={1}
                                style={{ ...fonts.sansRegular, fontSize: 13, color: theme.onSurfaceVariant }}
                              >
                                {church}
                              </Text>
                            ) : null}
                          </View>
                          {isSending ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : isSent ? (
                            <AppMenuIcon ios="checkmark.circle.fill" android="check-circle" color="#34C759" size={22} />
                          ) : (
                            <AppMenuIcon ios="paperplane" android="send" color={theme.primary} size={18} />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  circleGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  circleGlassInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHeaderTitle: {
    flex: 1,
    ...fonts.sansBold,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  tabletContent: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 22,
  },
  heroArtworkOuter: {
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  heroArtworkTarget: {
    width: 176,
    height: 176,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroArtworkFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArtwork: {
    width: 176,
    height: 176,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  heroTitle: {
    ...fonts.bold,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSub: {
    ...fonts.sansRegular,
    fontSize: 14.5,
  },
  playShuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroActionGlass: {
    flex: 1,
    height: 48,
    borderRadius: 999,
  },
  heroActionGlassInner: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroActionText: {
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
  addHymnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  heroArtworkImg: {
    width: '100%',
    height: '100%',
  },
  addHymnsIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHymnsText: {
    flex: 1,
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  hymnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  numBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    ...fonts.bold,
    fontSize: 16,
  },
  rowTitle: {
    ...fonts.regularItalic,
    fontSize: 17.5,
    lineHeight: 22,
  },
  rowSub: {
    ...fonts.sansRegular,
    fontSize: 11.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  quickPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 30,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 15,
    textAlign: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sortCountLabel: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalBackdropWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  pickerSheetOuter: {
    width: '100%',
  },
  grabberHitZone: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  pickerSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15,
    paddingVertical: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerNum: {
    ...fonts.bold,
    fontSize: 15.5,
    width: 44,
    textAlign: 'center',
  },
  pickerTitle: {
    flex: 1,
    ...fonts.regularItalic,
    fontSize: 16.5,
  },
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  renameCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  renameInput: {
    ...fonts.sansRegular,
    fontSize: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  renameBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameBtnSecondaryText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  renameBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameBtnPrimaryText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  shareSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  shareSheetTitle: {
    ...fonts.bold,
    fontSize: 21,
  },
  shareSheetSub: {
    ...fonts.sansRegular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  closeGlass: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    ...fonts.sansSemiBold,
    fontSize: 13.5,
    marginBottom: 10,
  },
  emptyFriendsBox: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyFriendsText: {
    ...fonts.sansRegular,
    fontSize: 14.5,
    textAlign: 'center',
    maxWidth: 260,
  },
  friendsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
