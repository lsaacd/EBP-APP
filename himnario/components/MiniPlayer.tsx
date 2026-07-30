/**
 * MiniPlayer — Floating compact player bar above the BottomNavBar.
 *
 * Visible whenever a hymn is loaded (playing or paused).
 * Tap the bar to open the full-screen MusicPlayer.
 * Prev / Play-Pause / Next controls on the right.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { hasHymnAudio } from '../data/audioRegistry';

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

export default function MiniPlayer() {
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
  const isIOS = Platform.OS === 'ios';
  const glassTint = isDarkMode
    ? isIOS ? 'rgba(1,1,1,0.55)' : 'rgba(1,1,1,0.92)'
    : isIOS ? 'rgba(255,255,255,0.15)' : 'rgba(252,249,242,0.95)';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const blurTint = isDarkMode ? 'dark' : 'light';
  const textColor = isDarkMode ? '#ffffff' : '#1c1c18';
  const subtitleColor = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(28,28,24,0.5)';
  const playBtnBg = isDarkMode ? '#ffffff' : '#6e1619';
  const playBtnIcon = isDarkMode ? '#010101' : '#ffffff';
  const controlColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(28,28,24,0.55)';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.container, { borderColor }]}
        activeOpacity={0.92}
        onPress={() => openPlayer(String(hymn.id))}
      >
        {/* Blur background */}
        <BlurView
          intensity={isIOS ? 40 : 10}
          tint={blurTint}
          style={[StyleSheet.absoluteFill, styles.blur]}
        />
        {/* Colour wash */}
        <View style={[StyleSheet.absoluteFill, styles.blur, { backgroundColor: glassTint }]} />

        {/* Content row */}
        <View style={styles.content}>
          {/* Album art thumbnail */}
          <Image source={DEFAULT_COVER} style={styles.cover} />

          {/* Text block */}
          <View style={styles.textBlock}>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {t.nowPlaying}
            </Text>
            <Text
              style={[styles.title, { color: textColor }]}
              numberOfLines={1}
            >
              {hymn.title}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={skipPrev} hitSlop={8}>
              <MaterialIcons name="skip-previous" size={22} color={controlColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePlayPause}
              style={[styles.playBtn, { backgroundColor: playBtnBg }]}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={22}
                color={playBtnIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNext} hitSlop={8}>
              <MaterialIcons name="skip-next" size={22} color={controlColor} />
            </TouchableOpacity>
          </View>
        </View>
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
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  blur: {
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
