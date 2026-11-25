/**
 * HymnRowLink — Native iOS 26 Liquid Glass `<Link.Preview />` + `<Link.Menu>`
 * wrapper for hymn rows across Home, Hymns, Favorites, and Playlist Detail.
 *
 * - On iOS: Tapping navigates via Expo Router `<Link>` (with light haptic feedback);
 *   long-pressing opens a live rendered preview of the hymn lyrics (`<Link.Preview />`)
 *   paired with a native Liquid Glass `UIMenu` (`<Link.Menu>`) for Play Audio,
 *   Save/Remove Favorite, 1-tap Add/Remove to any Playlist, and Share Hymn.
 * - On Android / Web: Renders a standard `TouchableOpacity` with zero extra overhead.
 */
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Link, useRouter, type Href } from 'expo-router';
import * as Haptics from '../utils/haptics';
import { useFavorites } from '../context/FavoritesContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { useLanguage } from '../context/LanguageContext';
import { hasHymnAudio } from '../data/audioRegistry';

export interface HymnRowLinkProps {
  hymn: {
    id: string | number;
    number: string | number;
    title: string;
  };
  href: Href;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  /** Optional playback queue IDs when playing audio from Favorites or a Playlist. */
  queueIds?: string[] | null;
  /** Optional display label for the playback queue. */
  queueLabel?: string;
  /** When inside a Playlist screen, adds a destructive "Remove from playlist" action. */
  playlistIdToRemoveFrom?: string;
  /** Optional extra callback fired on tap alongside navigation. */
  onNavigate?: () => void;
  children: React.ReactNode;
}

const IS_IOS = Platform.OS === 'ios';
const NAV_DEBOUNCE_MS = 450;
let lastHymnNavAt = 0;

function claimHymnNavigationSlot(): boolean {
  const now = Date.now();
  if (now - lastHymnNavAt < NAV_DEBOUNCE_MS) {
    return false;
  }
  lastHymnNavAt = now;
  return true;
}

const styles = StyleSheet.create({
  /** Plain object style required by Expo Router `<Link.Trigger>` / Radix `<Slot>`. */
  triggerFullWidth: {
    width: '100%',
  },
});

export default function HymnRowLink({
  hymn,
  href,
  style,
  activeOpacity = 0.78,
  queueIds = null,
  queueLabel,
  playlistIdToRemoveFrom,
  onNavigate,
  children,
}: HymnRowLinkProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { playlists, addHymnToPlaylist, removeHymnFromPlaylist } = usePlaylists();
  const { openPlayer } = useNowPlaying();
  const [pressed, setPressed] = useState(false);

  const idStr = String(hymn.id);
  const canPlay = hasHymnAudio(idStr);
  const saved = isFavorite(idStr);

  const handleShareHymn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isChorus = idStr.startsWith('E');
    const prefix = (isChorus ? t.chorusNumberLabel : t.hymnNumberLabel).replace(
      '{n}',
      String(hymn.number),
    );
    const publicUrl = `https://himnarioebp.com/hymn/${encodeURIComponent(idStr)}/`;
    const titleLine = `${prefix} · ${hymn.title}`;
    try {
      await Share.share(
        IS_IOS
          ? {
              title: titleLine,
              message: `${titleLine}\n${t.appName}`,
              url: publicUrl,
            }
          : {
              title: titleLine,
              message: `${titleLine}\n${t.appName}\n\n${publicUrl}`,
            },
        { dialogTitle: t.shareHymnTitle },
      );
    } catch {
      // User dismissed share sheet
    }
  };

  if (!IS_IOS) {
    return (
      <TouchableOpacity
        style={style}
        activeOpacity={activeOpacity}
        onPress={() => {
          if (!claimHymnNavigationSlot()) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onNavigate?.();
          router.push(href);
        }}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <Link href={href} asChild>
      <Link.Trigger>
        <Pressable
          style={styles.triggerFullWidth}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          onPress={(event: GestureResponderEvent) => {
            if (!claimHymnNavigationSlot()) {
              event?.preventDefault?.();
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNavigate?.();
          }}
        >
          <View style={[style, pressed && { opacity: activeOpacity }]}>
            {children}
          </View>
        </Pressable>
      </Link.Trigger>

      <Link.Preview />

      <Link.Menu title={`${hymn.number}. ${hymn.title}`}>
        {canPlay ? (
          <Link.MenuAction
            icon="play.fill"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openPlayer(
                idStr,
                queueIds,
                queueLabel ? { label: queueLabel, shuffle: false } : undefined,
              );
            }}
          >
            {t.favoritesPlay}
          </Link.MenuAction>
        ) : null}

        <Link.MenuAction
          icon={saved ? 'bookmark.slash' : 'bookmark'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleFavorite(idStr);
          }}
        >
          {saved ? t.contextRemoveFavorite : t.contextSaveFavorite}
        </Link.MenuAction>

        {playlists.length > 0 ? (
          <Link.Menu title={t.addToPlaylist} icon="text.badge.plus">
            {playlists.map((pl) => {
              const inList = pl.hymnIds.includes(idStr);
              return (
                <Link.MenuAction
                  key={pl.id}
                  isOn={inList}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (inList) {
                      removeHymnFromPlaylist(pl.id, idStr);
                    } else {
                      addHymnToPlaylist(pl.id, idStr);
                    }
                  }}
                >
                  {pl.name}
                </Link.MenuAction>
              );
            })}
          </Link.Menu>
        ) : null}

        <Link.MenuAction
          icon="square.and.arrow.up"
          onPress={() => {
            void handleShareHymn();
          }}
        >
          {t.shareHymnTitle}
        </Link.MenuAction>

        {playlistIdToRemoveFrom ? (
          <Link.MenuAction
            icon="minus.circle"
            destructive
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeHymnFromPlaylist(playlistIdToRemoveFrom, idStr);
            }}
          >
            {t.contextRemoveFromPlaylist}
          </Link.MenuAction>
        ) : null}
      </Link.Menu>
    </Link>
  );
}
