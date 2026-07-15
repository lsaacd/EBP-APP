import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNowPlaying } from '../../context/NowPlayingContext';

const IS_IOS = Platform.OS === 'ios';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom, 20) + 16;
  const { currentHymnId } = useNowPlaying();
  
  const { playlists, deletePlaylist, removeHymnFromPlaylist } = usePlaylists();
  const { toggleFavorite } = useFavorites();
  
  const playlist = playlists.find(p => p.id === id);
  const allHymns = [...hymnsData, ...estribillosData];
  const playlistHymns = playlist ? playlist.hymnIds.map(hId => allHymns.find(h => String(h.id) === hId)).filter(Boolean) : [];

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Eliminar lista",
      "¿Estás seguro de que quieres eliminar esta lista de reproducción?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: () => {
            if (id) {
              deletePlaylist(String(id));
              router.back();
            }
          }
        }
      ]
    );
  };

  const handleRemoveHymn = (hymnId: string) => {
    if (id) {
      removeHymnFromPlaylist(String(id), hymnId);
    }
  };

  // ── Scroll & header states ────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const iosScrollRef = useRef<any>(null);
  
  const [headerH, setHeaderH] = useState(0);
  const headerTranslate = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerHidden = useRef(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < 5 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      lastScrollY.current = y;
      return;
    }

    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 3) return;

    if (dy > 0 && !headerHidden.current && y > 10) {
      headerHidden.current = true;
      Animated.timing(headerTranslate, {
        toValue: -headerH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else if (dy < 0 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, -1],
    extrapolate: 'clamp',
  });

  if (!playlist) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.onSurface, fontFamily: fonts.regular, fontSize: 18 }}>Lista no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary, fontFamily: fonts.bold }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scrollContent = (
    <>
      <View style={styles.pageHeader}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '0D' }]}>
          <MaterialIcons name="queue-music" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.pageTitle, { color: theme.primary }]}>{playlist.name}</Text>
        <Text style={[styles.pageSubhead, { color: theme.onSurfaceVariant }]}>
          {playlistHymns.length} {playlistHymns.length === 1 ? 'canción' : 'canciones'}
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePlaylist}>
          <MaterialIcons name="delete-outline" size={20} color={theme.error || '#c0392b'} />
          <Text style={[styles.deleteBtnText, { color: theme.error || '#c0392b' }]}>Eliminar Lista</Text>
        </TouchableOpacity>
      </View>

      {playlistHymns.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="music-off"
            size={64}
            color={theme.surfaceVariants.containerHighest}
            style={{ marginBottom: 24 }}
          />
          <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
            Esta lista está vacía.
          </Text>
          <TouchableOpacity
            style={[styles.goBtn, { backgroundColor: theme.surfaceVariants.containerLow }]}
            onPress={() => router.push('/hymns')}
          >
            <Text style={[styles.goBtnText, { color: theme.primary }]}>
              {t.exploreHymns}
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {playlistHymns.map((hymn: any) => (
            <View key={hymn.id}>
              <TouchableOpacity
                style={styles.listItem}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/hymn/${hymn.id}`);
                }}
              >
                <Text
                  style={[styles.listNum, { color: theme.primary, opacity: 0.45 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {hymn.number}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: theme.onSurface }]}>
                    {hymn.title}
                  </Text>
                  {hymn.categories ? (
                    <Text style={[styles.listTags, { color: theme.outline }]}>
                      {hymn.categories}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleRemoveHymn(String(hymn.id));
                  }}
                >
                  <MaterialIcons name="remove-circle-outline" size={24} color={theme.outline} />
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '30' }]} />
            </View>
          ))}
        </View>
      )}

      <View style={{ height: bottomClearance }} />
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />

      {/* Top Header */}
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Animated.Text
            style={[styles.headerTitle, { color: theme.primary, opacity: IS_IOS ? titleOpacity : 1 }]}
            numberOfLines={1}
          >
            {playlist.name}
          </Animated.Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)'  : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {IS_IOS ? (
          <Animated.ScrollView
            ref={(ref: any) => { iosScrollRef.current = ref?.getNode?.() ?? ref; }}
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {scrollContent}
          </Animated.ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scroll, { paddingTop: headerH + 8 }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {scrollContent}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  pageHeader: {
    marginBottom: 48,
    alignItems: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubhead: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 50, 50, 0.1)',
  },
  deleteBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  emptyText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  goBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 20,
  },
  listNum: {
    fontFamily: fonts.bold,
    fontSize: 22,
    width: 56,
    textAlign: 'center',
  },
  listTitle: {
    fontFamily: fonts.regularItalic,
    fontSize: 19,
    marginBottom: 2,
  },
  listTags: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
