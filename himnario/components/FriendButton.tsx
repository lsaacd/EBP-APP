/**
 * FriendButton — the one control for a friendship, wherever a person is shown.
 * Its label follows the relationship:
 *   none → "Agregar hermano" · outgoing → "Solicitud enviada" (tap to cancel)
 *   incoming → "Aceptar" + "Rechazar" · friends → "Hermanos ✓" (tap to remove)
 * It shows nothing for a guest or for your own profile.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import { communityError } from '../utils/communityApi';
import { useFriends } from '../utils/friendsStore';
import type { FriendStatus } from '../utils/friends';
import AppMenuIcon from './AppMenuIcon';

export default function FriendButton({
  userId,
  name,
  status,
  onStatusChange,
  compact = false,
}: {
  userId: string;
  name: string;
  status: FriendStatus | null;
  onStatusChange?: (next: FriendStatus) => void;
  /** Smaller buttons for list rows. */
  compact?: boolean;
}) {
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const { request, accept, remove } = useFriends();
  const [busy, setBusy] = useState(false);

  if (!status || status === 'self') return null;

  const run = (action: () => Promise<FriendStatus | null>, fallback: FriendStatus) => {
    if (busy) return;
    Haptics.selectionAsync();
    setBusy(true);
    action()
      .then((next) => onStatusChange?.(next ?? fallback))
      .catch((e) => Alert.alert(t.churchError, communityError(e, language === 'es')))
      .finally(() => setBusy(false));
  };

  const confirmRemove = (title: string, confirmLabel: string) =>
    Alert.alert(title, name, [
      { text: t.cancel, style: 'cancel' },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => run(() => remove(userId), 'none'),
      },
    ]);

  const quietBg = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.surfaceVariants.containerHighest;
  const height = compact ? 36 : 46;
  const fontSize = compact ? 13 : 14.5;

  const button = (
    label: string,
    onPress: () => void,
    tone: 'primary' | 'quiet' | 'good',
    icon?: { ios: string; android: string },
  ) => {
    const color = tone === 'primary' ? theme.onPrimary : tone === 'good' ? '#34C759' : theme.onSurface;
    return (
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${name}`}
        style={({ pressed }) => [
          styles.button,
          {
            height,
            backgroundColor:
              tone === 'primary'
                ? theme.primary
                : tone === 'good'
                  ? isDarkMode
                    ? 'rgba(52,199,89,0.18)'
                    : 'rgba(52,199,89,0.14)'
                  : quietBg,
            borderWidth: tone === 'good' ? 1 : 0,
            borderColor: tone === 'good' ? '#34C759' : 'transparent',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <>
            {icon ? (
              <AppMenuIcon ios={icon.ios as never} android={icon.android as never} color={color} size={compact ? 14 : 16} />
            ) : null}
            <Text numberOfLines={1} style={{ ...fonts.sansSemiBold, fontSize, color }}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    );
  };

  if (status === 'incoming') {
    return (
      <View style={styles.row}>
        {button(t.friendsAccept, () => run(() => accept(userId), 'friends'), 'primary', {
          ios: 'checkmark',
          android: 'check',
        })}
        {button(t.friendsDecline, () => run(() => remove(userId), 'none'), 'quiet')}
      </View>
    );
  }
  if (status === 'outgoing') {
    return (
      <View style={styles.row}>
        {button(t.friendsRequestSent, () => confirmRemove(t.friendsCancelRequestTitle, t.friendsCancelRequest), 'quiet', {
          ios: 'clock',
          android: 'schedule',
        })}
      </View>
    );
  }
  if (status === 'friends') {
    return (
      <View style={styles.row}>
        {button(t.friendsAreFriends, () => confirmRemove(t.friendsRemoveTitle, t.friendsRemove), 'good', {
          ios: 'checkmark.seal.fill',
          android: 'verified',
        })}
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {button(t.friendsAdd, () => run(() => request(userId), 'outgoing'), 'primary', {
        ios: 'person.badge.plus',
        android: 'person-add',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
});
