/**
 * MusicPlayer — Spotify-style full-screen player modal.
 *
 * Features:
 * - Slides up from bottom as a native modal sheet
 * - Album art (per-hymn or default cover)
 * - Title, number, author display
 * - Scrubable progress bar with elapsed/total timestamps
 * - Play / Pause, Skip Back, Skip Forward controls
 * - Favorite toggle
 * - Loads audio from the local audioRegistry (bundled assets)
 * - Auto-advances to next hymn when track ends
 *
 * Usage:
 *   <MusicPlayer
 *     visible={showPlayer}
 *     hymn={currentHymn}
 *     onClose={() => setShowPlayer(false)}
 *   />
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
  Linking,
  Share,
  ScrollView,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getHymnAudio, hasHymnAudio } from '../data/audioRegistry';
import AddToPlaylistModal from './AddToPlaylistModal';
import { useNowPlaying } from '../context/NowPlayingContext';
import { fonts } from '../theme/theme';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatTime = (ms: number): string => {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────
// ProgressSection — isolated to prevent full-player re-renders
// ─────────────────────────────────────────────────────────────
const ProgressSection = React.memo(function ProgressSection({
  player,
  audioAvailable,
}: {
  player: ReturnType<typeof useAudioPlayer>;
  audioAvailable: boolean;
}) {
  const status = useAudioPlayerStatus(player);
  
  // Use a Ref for instant locking to prevent "rubber-banding" on iOS
  const isSeekingRef = useRef(false);
  const [seekVal, setSeekVal] = useState(0);
  const [, forceUpdate] = useState({});

  // Stabilize values to prevent scale-jitter (snap-back)
  const currentMs = Math.floor((status.currentTime ?? 0) * 1000);
  const durationMs = Math.floor((status.duration ?? 0) * 1000);
  
  const displayValue = isSeekingRef.current ? seekVal : currentMs;

  return (
    <View style={progressStyles.section}>
      <Slider
        style={progressStyles.slider}
        minimumValue={0}
        maximumValue={durationMs > 0 ? durationMs : 1}
        value={displayValue}
        onSlidingStart={() => {
          isSeekingRef.current = true;
          setSeekVal(currentMs);
          forceUpdate({});
        }}
        onValueChange={(v) => {
          setSeekVal(Math.floor(v));
        }}
        onSlidingComplete={(v: number) => {
          player.seekTo(v / 1000);
          // Tiny delay before unlocking prevents the "snap back" 
          // while the audio engine catches up to the new position
          setTimeout(() => {
            isSeekingRef.current = false;
            forceUpdate({});
          }, 150);
        }}
        minimumTrackTintColor={audioAvailable ? '#c0392b' : 'rgba(255,255,255,0.2)'}
        maximumTrackTintColor="rgba(255,255,255,0.15)"
        thumbTintColor={audioAvailable ? '#ffffff' : 'transparent'}
        disabled={!audioAvailable}
      />
      <View style={progressStyles.timeRow}>
        <Text style={progressStyles.timeText}>{formatTime(displayValue)}</Text>
        <Text style={progressStyles.timeText}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  );
});

const progressStyles = StyleSheet.create({
  section: { marginBottom: 4 },
  slider: { width: '100%', height: 36 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface MusicPlayerProps {
  visible: boolean;
  hymnId: string;
  onClose: () => void;
  onViewLyrics?: (hymnId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
function MusicPlayerInner({ visible, hymnId, onClose, onViewLyrics }: MusicPlayerProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ── Global audio state from context ──────────────────────
  const {
    currentHymnId,
    isPlaying,
    player,
    isShuffled,
    repeatMode,
    togglePlayPause,
    skipNext,
    skipPrev,
    setCurrentHymnId,
    toggleShuffle,
    cycleRepeat,
    closeFullPlayer,
    clearNowPlaying,
  } = useNowPlaying();

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const currentId = currentHymnId ?? hymnId;
  const activeData = String(currentId).startsWith('E') ? estribillosData : hymnsData;
  const hymn = activeData.find((h: any) => String(h.id) === String(currentId));
  const currentIndex = activeData.findIndex((h: any) => String(h.id) === String(currentId));

  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handlePlayPause = togglePlayPause;
  const handleNext = skipNext;
  const handlePrev = skipPrev;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Don't pause — audio keeps playing and mini-player shows
    closeFullPlayer();
    onClose();
  };

  const audioAvailable = hymn ? hasHymnAudio(String(hymn.id)) : false;
  const nextHymn = currentIndex < activeData.length - 1 ? activeData[currentIndex + 1] : null;
  const prevHymn = currentIndex > 0 ? activeData[currentIndex - 1] : null;

  // ── Custom Smooth Swipe-Down gesture ──────────────────────
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Only trigger vertical drag down. Math.abs(dy) > Math.abs(dx) * 1.5 prevents interference with the slider.
        return dy > 6 && Math.abs(dy) > Math.abs(dx) * 1.5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          // Resistance when dragging upwards
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          // Slide down completely off-screen and close
          Animated.timing(translateY, {
            toValue: SCREEN_H,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            handleClose();
          });
        } else {
          // Spring back to top smoothly
          Animated.spring(translateY, {
            toValue: 0,
            tension: 45,
            friction: 7.5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!hymn) return null;

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      {Platform.OS === 'android' && <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />}
      
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            transform: [{ translateY }],
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Dark background gradient */}
        <LinearGradient
          colors={['#2a0a0b', '#0e0404', '#000000']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

        {/* ─── Top Bar (X left · header centered · chevron right) ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              clearNowPlaying();
              onClose();
            }}
            style={styles.iconHit}
            id="music-player-stop"
          >
            <MaterialIcons name="close" size={26} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.topLabel}>{t.nowPlaying}</Text>
            <Text style={styles.topSubLabel}>Himnario El Buen Pastor</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.iconHit} id="music-player-close">
            <MaterialIcons name="keyboard-arrow-down" size={32} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* ─── Album Art (flex to fill available space) ────────── */}
        <View style={styles.artContainer}>
          <Image
            source={DEFAULT_COVER}
            style={styles.albumArt}
            resizeMode="cover"
          />
          {/* No audio overlay */}
          {!audioAvailable && (
            <View style={styles.noAudioOverlay}>
              <MaterialIcons name="music-off" size={40} color="rgba(255,255,255,0.5)" />
              <Text style={styles.noAudioText}>Audio no disponible</Text>
            </View>
          )}
          {/* Loading spinner overlay */}
          {isLoading && (
            <View style={styles.noAudioOverlay}>
              <ActivityIndicator size="large" color="#c0392b" />
              <Text style={styles.noAudioText}>Cargando…</Text>
            </View>
          )}
        </View>

        {/* ─── Hymn Info (compact: title line 1, credit line 2) ── */}
        <View style={styles.infoSection}>
          <Text style={styles.hymnTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {hymn.title}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (hymn.audioCredit?.url) {
                Linking.openURL(hymn.audioCredit.url).catch(() => { });
              }
            }}
            activeOpacity={0.7}
            disabled={!hymn.audioCredit?.url}
          >
            <Text style={styles.creditLine} numberOfLines={1}>
              {hymn.audioCredit?.name
                ? `${hymn.author ? hymn.author + ' · ' : ''}@${hymn.audioCredit.name}`
                : hymn.author || ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Progress Bar (isolated component — own position state) ── */}
        <ProgressSection
          player={player}
          audioAvailable={audioAvailable}
        />

        {/* ─── Playback Controls (5-button row like reference) ─── */}
        <View style={styles.controls}>

          {/* Shuffle */}
          <TouchableOpacity
            style={styles.controlBtnSmall}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleShuffle();
            }}
            id="music-player-shuffle"
          >
            <MaterialIcons
              name="shuffle"
              size={24}
              color={isShuffled ? '#ffffff' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

          {/* Skip Previous */}
          <TouchableOpacity
            onPress={handlePrev}
            style={styles.controlBtn}
            disabled={!prevHymn}
            id="music-player-prev"
          >
            <MaterialIcons
              name="skip-previous"
              size={38}
              color={prevHymn ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'}
            />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={!audioAvailable || isLoading}
            style={[
              styles.playBtn,
              { opacity: audioAvailable && !isLoading ? 1 : 0.35 }
            ]}
            id="music-player-playpause"
          >
            {isLoading ? (
              <ActivityIndicator size={32} color="#000" />
            ) : (
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={42}
                color="#000000"
              />
            )}
          </TouchableOpacity>

          {/* Skip Next */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!nextHymn}
            style={styles.controlBtn}
            id="music-player-next"
          >
            <MaterialIcons
              name="skip-next"
              size={38}
              color={nextHymn ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'}
            />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.controlBtnSmall}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              cycleRepeat();
            }}
            id="music-player-repeat"
          >
            <MaterialIcons
              name={repeatMode === 'one' ? 'repeat-one' : 'repeat'}
              size={24}
              color={repeatMode !== 'off' ? '#ffffff' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

        </View>

        {/* ─── Bottom Action Row (favorite left, share, lyrics right) ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPlaylistModalVisible(true);
            }}
          >
            <MaterialIcons name="playlist-add" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleFavorite(String(hymn.id));
            }}
            id="music-player-favorite"
          >
            <MaterialIcons
              name={isFavorite(String(hymn.id)) ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite(String(hymn.id)) ? '#c0392b' : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowShareModal(true);
            }}
            id="music-player-share"
          >
            <MaterialIcons name="ios-share" size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          {/* View Lyrics */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Capture the current track ID before closing
              const lyricsId = currentId;
              closeFullPlayer();
              onClose();
              // Navigate to lyrics after the modal dismiss animation
              setTimeout(() => {
                if (onViewLyrics) {
                  onViewLyrics(lyricsId);
                } else {
                  router.replace(`/hymn/${lyricsId}`);
                }
              }, 350);
            }}
            id="music-player-lyrics"
          >
            <MaterialIcons name="queue-music" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

      </LinearGradient>

      {/* ═══════ Share Modal ═══════════════════════════════════ */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={shareStyles.overlay}>
          <View style={[shareStyles.sheet, { paddingBottom: insets.bottom + 20 }]}>

            {/* Header */}
            <View style={shareStyles.header}>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={shareStyles.closeBtn}
                id="share-modal-close"
              >
                <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={shareStyles.headerTitle}>Compartir</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Preview Card */}
            <View style={shareStyles.cardContainer}>
              <LinearGradient
                colors={['#3a0e0f', '#1a0505']}
                style={shareStyles.card}
              >
                <Image
                  source={DEFAULT_COVER}
                  style={shareStyles.cardArt}
                  resizeMode="cover"
                />
                <Text style={shareStyles.cardTitle} numberOfLines={1}>
                  {hymn.title}
                </Text>
                <Text style={shareStyles.cardCredit} numberOfLines={1}>
                  {hymn.audioCredit?.name
                    ? `${hymn.author || ''} · @${hymn.audioCredit.name}`
                    : hymn.author || ''}
                </Text>
                <Text style={shareStyles.cardBrand}>Himnario El Buen Pastor</Text>
              </LinearGradient>
            </View>

            {/* Share Actions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={shareStyles.actionsRow}
            >
              {/* Messages */}
              <TouchableOpacity
                style={shareStyles.actionItem}
                onPress={() => {
                  setShowShareModal(false);
                  const body = encodeURIComponent(`${hymn.title}\n\n— Himnario El Buen Pastor`);
                  Linking.openURL(`sms:&body=${body}`).catch(() => { });
                }}
              >
                <View style={[shareStyles.actionIcon, { backgroundColor: '#34C759' }]}>
                  <MaterialIcons name="chat-bubble" size={24} color="#fff" />
                </View>
                <Text style={shareStyles.actionLabel}>Messages</Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={shareStyles.actionItem}
                onPress={() => {
                  setShowShareModal(false);
                  const text = encodeURIComponent(`${hymn.title}\n\n— Himnario El Buen Pastor`);
                  Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
                    Linking.openURL(`https://wa.me/?text=${text}`).catch(() => { });
                  });
                }}
              >
                <View style={[shareStyles.actionIcon, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={24} color="#fff" />
                </View>
                <Text style={shareStyles.actionLabel}>WhatsApp</Text>
              </TouchableOpacity>

              {/* Copy Text */}
              <TouchableOpacity
                style={shareStyles.actionItem}
                onPress={async () => {
                  await Clipboard.setStringAsync(
                    `${hymn.title}\n\n${hymn.lyrics}\n\n— Himnario El Buen Pastor`
                  );
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowShareModal(false);
                }}
              >
                <View style={[shareStyles.actionIcon, { backgroundColor: '#636366' }]}>
                  <MaterialIcons name="content-copy" size={22} color="#fff" />
                </View>
                <Text style={shareStyles.actionLabel}>Copiar</Text>
              </TouchableOpacity>

              {/* More (native share sheet) */}
              <TouchableOpacity
                style={shareStyles.actionItem}
                onPress={() => {
                  setShowShareModal(false);
                  setTimeout(() => {
                    Share.share({
                      title: hymn.title,
                      message: `${hymn.title}\n\n${hymn.lyrics}\n\n— Himnario El Buen Pastor`,
                    });
                  }, 300);
                }}
              >
                <View style={[shareStyles.actionIcon, { backgroundColor: '#636366' }]}>
                  <MaterialIcons name="more-horiz" size={24} color="#fff" />
                </View>
                <Text style={shareStyles.actionLabel}>Más</Text>
              </TouchableOpacity>
            </ScrollView>

          </View>
        </View>
      </Modal>

      </Animated.View>
      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        hymnId={hymnId}
      />
    </Modal>
  );
}

// Memoize to prevent re-renders when the parent page scrolls
export default React.memo(MusicPlayerInner);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const ART_SIZE = Math.min(SCREEN_W - 56, SCREEN_H * 0.45, 500);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Top bar — header text + close button
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconHit: { padding: 8 },
  topLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  topSubLabel: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // Album art — takes up main space
  artContainer: {
    alignSelf: 'center',
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
    }),
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  noAudioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  noAudioText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },

  // Info — compact
  infoSection: {
    marginBottom: 8,
  },
  hymnTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 4,
  },
  creditLine: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },

  // Controls — 5-button row
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  controlBtn: {
    padding: 6,
  },
  controlBtnSmall: {
    padding: 8,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#c0392b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },

  // Bottom action row
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  bottomAction: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
    zIndex: 100,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});

// ─── Share Modal Styles ──────────────────────────────────────
const CARD_W = SCREEN_W * 0.72;

const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  card: {
    width: CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 24,
  },
  cardArt: {
    width: CARD_W - 40,
    height: CARD_W - 40,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Newsreader_700Bold',
    fontSize: 20,
    color: '#ffffff',
    paddingHorizontal: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardCredit: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardBrand: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 14,
    color: '#c0392b',
    letterSpacing: 0.3,
  },
  actionsRow: {
    paddingHorizontal: 24,
    gap: 20,
    paddingBottom: 8,
  },
  actionItem: {
    alignItems: 'center',
    width: 68,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
