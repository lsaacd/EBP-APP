import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFriends } from '../../utils/friendsStore';
import { communityError } from '../../utils/communityApi';
import { churchDisplayName } from '../../utils/churchName';
import AppMenuIcon from '../../components/AppMenuIcon';
import GlassSurface from '../../components/GlassSurface';
import SheetGrabber from '../../components/SheetGrabber';

const IS_IOS = Platform.OS === 'ios';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom, 20) + 90;
  const { playlists, deletePlaylist, removeHymnFromPlaylist } = usePlaylists();
  const { user, openAuthSheet } = useAuth();
  const { lists: friendLists, loading: friendsLoading, refresh: refreshFriends, sendPlaylist } = useFriends();
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentToIds, setSentToIds] = useState<Record<string, boolean>>({});
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const playlist = playlists.find(p => p.id === id);
  const allHymns = [...hymnsData, ...estribillosData];
  const playlistHymns = playlist
    ? playlist.hymnIds
        .map(hId => allHymns.find(h => String(h.id) === hId))
        .filter(Boolean)
        .map(h => getLocalizedHymn(h as any, hymnLanguage))
    : [];

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
    Alert.alert(
      t.deletePlaylistTitle,
      t.deletePlaylistConfirm,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
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

  const scrollContent = (
    <>
      <View style={styles.pageHeader}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '0D' }]}>
          <MaterialIcons name="queue-music" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.pageTitle, { color: theme.primary }]}>{playlist.name}</Text>
        <Text style={[styles.pageSubhead, { color: theme.onSurfaceVariant }]}>
          {playlistHymns.length} {playlistHymns.length === 1 ? t.songCount_one : t.songCount_other}
        </Text>
        <View style={styles.headerActions}>
          {playlistHymns.length > 0 && (
            <TouchableOpacity
              style={[
                styles.shareFriendBtn,
                {
                  backgroundColor: isDarkMode ? 'rgba(181,69,69,0.22)' : theme.primary + '14',
                },
              ]}
              onPress={handleOpenShareWithFriend}
            >
              <AppMenuIcon
                ios="paperplane.fill"
                android="send"
                size={16}
                color={isDarkMode ? '#F0A8A8' : theme.primary}
              />
              <Text
                style={[
                  styles.shareFriendBtnText,
                  { color: isDarkMode ? '#F0A8A8' : theme.primary },
                ]}
              >
                {t.friendsSharePlaylist}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePlaylist}>
            <MaterialIcons name="delete-outline" size={20} color={theme.error || '#c0392b'} />
            <Text style={[styles.deleteBtnText, { color: theme.error || '#c0392b' }]}>{t.deletePlaylist}</Text>
          </TouchableOpacity>
        </View>
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
            {t.playlistEmpty}
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
                  router.push({ pathname: '/hymn/[id]', params: { id: hymn.id, playlistId: playlist.id } });
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
                      {translateCategories(hymn.categories, language)}
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
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
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
              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={56}
                style={styles.closeGlass}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={() => setSharePickerOpen(false)}
                  style={styles.closeGlass}
                >
                  <AppMenuIcon ios="xmark" android="close" color={theme.onSurface} size={17} weight="semibold" />
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
    ...fonts.bold,
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
    ...fonts.bold,
    fontSize: 34,
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubhead: {
    ...fonts.sansRegular,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  shareFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  shareFriendBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 50, 50, 0.1)',
  },
  deleteBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 14,
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.44)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  shareSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareSheetTitle: {
    ...fonts.bold,
    fontSize: 20,
  },
  shareSheetSub: {
    ...fonts.sansRegular,
    fontSize: 13.5,
    lineHeight: 18,
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
  },
  emptyFriendsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
    gap: 10,
  },
  emptyFriendsText: {
    ...fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  friendsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  friendRow: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  emptyText: {
    ...fonts.sansRegular,
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
    ...fonts.sansSemiBold,
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
    ...fonts.bold,
    fontSize: 22,
    width: 56,
    textAlign: 'center',
  },
  listTitle: {
    ...fonts.regularItalic,
    fontSize: 19,
    marginBottom: 2,
  },
  listTags: {
    ...fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
