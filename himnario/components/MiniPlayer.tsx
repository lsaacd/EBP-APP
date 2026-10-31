/**
 * MiniPlayer — Floating compact player bar above the BottomNavBar.
 *
 * Visible whenever a hymn is loaded (playing or paused).
 * Tap the bar to open the full-screen MusicPlayer.
 * Prev / Play-Pause / Next controls on the right.
 */
import React from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { hasHymnAudio } from '../data/audioRegistry';
import WebIcon from './WebIcon';
import GlassSurface from './GlassSurface';

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

export default function MiniPlayer() {
  const android = Platform.OS === 'android';
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const {
    currentHymnId,
    isPlaying,
    showFullPlayer,
    togglePlayPause,
    skipNext,
    skipPrev,
    openPlayer,
  } = useNowPlaying();

  // Don't render if nothing is loaded or full player is open
  if (!currentHymnId || showFullPlayer) return null;

  const activeData = String(currentHymnId).startsWith('E') ? estribillosData : hymnsData;
  const hymn = activeData.find((h: any) => String(h.id) === String(currentHymnId));
  if (!hymn) return null;

  const audioAvailable = hasHymnAudio(String(hymn.id));
  if (!audioAvailable) return null;

  // ── Theme-aware colors ──────────────────────────────────
  const textColor = isDarkMode ? '#ffffff' : '#1c1c18';
  const subtitleColor = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(28,28,24,0.5)';
  const playBtnBg = isDarkMode ? (android ? '#fdf9f2' : '#ffffff') : '#6e1619';
  const playBtnIcon = isDarkMode ? '#010101' : '#ffffff';
  const controlColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(28,28,24,0.55)';

  return (
    <View style={[styles.wrapper, android && { paddingHorizontal: 12 }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => openPlayer(String(hymn.id))}
      >
        <GlassSurface
          style={[styles.container, android && { borderRadius: 26, borderWidth: 1, borderColor: isDarkMode ? '#ffffff26' : '#e3dfd3', elevation: 8 }]}
          intensity={50}
          isInteractive
          tonalColor={android ? (isDarkMode ? '#202020' : '#fcf9f2') : (isDarkMode ? '#1C1C1C' : theme.surfaceVariants.containerHigh)}
        >
          {/* Content row */}
          <View style={[styles.content, android && { padding: 12, gap: 12 }]}>
            {/* Album art thumbnail */}
            <Image source={DEFAULT_COVER} style={[styles.cover, android && { width: 48, height: 48, borderRadius: 12 }]} />

            {/* Text block */}
            <View style={styles.textBlock}>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {t.nowPlaying}
              </Text>
              <Text
                style={[styles.title, android && { fontSize: 20 }, { color: textColor }]}
                numberOfLines={1}
              >
                {hymn.title}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous hymn" onPress={event => { event.stopPropagation(); skipPrev(); }} hitSlop={8} style={android && { padding: 4 }}>
                {android ? <WebIcon name="previous" color={controlColor} /> : <MaterialIcons name="skip-previous" size={22} color={controlColor} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={event => { event.stopPropagation(); togglePlayPause(); }}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                style={[styles.playBtn, android && { width: 46, height: 46, borderRadius: 16 }, { backgroundColor: playBtnBg }]}
              >
                {android ? <WebIcon name={isPlaying ? 'pause' : 'play'} color={playBtnIcon} /> : <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={22}
                  color={playBtnIcon}
                />}
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next hymn" onPress={event => { event.stopPropagation(); skipNext(); }} hitSlop={8} style={android && { padding: 4 }}>
                {android ? <WebIcon name="next" color={controlColor} /> : <MaterialIcons name="skip-next" size={22} color={controlColor} />}
              </TouchableOpacity>
            </View>
          </View>
        </GlassSurface>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
  },
  container: {
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 15,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
