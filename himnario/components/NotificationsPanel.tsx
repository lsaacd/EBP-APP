/**
 * NotificationsPanel — the "Notificaciones" sub-page inside the account sheet.
 * Shows push activation banner (Phase 2), chronological community alerts
 * (likes, replies, friend requests/accepts, shared playlists), and 3 toggles.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import { communityError } from '../utils/communityApi';
import {
  parseNotificationDestination,
  type AppNotification,
  type NotificationDestination,
} from '../utils/notifications';
import { useNotifications } from '../utils/notificationsStore';
import {
  getPushPermissionStatus,
  type PushPermissionState,
} from '../utils/pushNotifications';
import AppMenuIcon from './AppMenuIcon';

function relativeTime(timestamp: number, es: boolean): string {
  if (!timestamp) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return es ? 'Ahora' : 'Just now';
  if (minutes < 60) return es ? `Hace ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return es ? `Hace ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return es ? `Hace ${days} d` : `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(es ? 'es' : 'en');
}

export default function NotificationsPanel({
  onNavigate,
}: {
  onNavigate?: (destination: NotificationDestination) => void;
}) {
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const es = language !== 'en';
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
    remove,
    syncPushToken,
  } = useNotifications();
  const [pushStatus, setPushStatus] = useState<PushPermissionState>('unavailable');
  const [enablingPush, setEnablingPush] = useState(false);
  const [savingSwitch, setSavingSwitch] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    void refresh();
    void getPushPermissionStatus().then(setPushStatus);
  }, [refresh]);

  const cardBg = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(60,60,67,0.08)';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.60)' : theme.onSurfaceVariant;
  const divider = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(60,60,67,0.12)';

  const handleEnablePush = async () => {
    if (enablingPush) return;
    Haptics.selectionAsync();
    setEnablingPush(true);
    try {
      const nextStatus = await syncPushToken(es ? 'es' : 'en', true);
      setPushStatus(nextStatus);
      if (nextStatus === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setEnablingPush(false);
    }
  };

  const handlePressNotification = (item: AppNotification) => {
    Haptics.selectionAsync();
    if (!item.read) {
      void markRead(item.id);
    }
    const destination = parseNotificationDestination(item);
    if (destination) {
      onNavigate?.(destination);
    }
  };

  const handleDismiss = (item: AppNotification) => {
    Haptics.selectionAsync();
    void remove(item.id).catch((e) => Alert.alert(t.churchError, communityError(e, es)));
  };

  const saveSwitch = (
    key: 'notifyCommentLikes' | 'notifyCommentReplies' | 'notifyFriends',
    value: boolean,
  ) => {
    if (savingSwitch) return;
    Haptics.selectionAsync();
    setSavingSwitch(key);
    updateProfile({ [key]: value })
      .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
      .finally(() => setSavingSwitch(null));
  };

  const headlineFor = (item: AppNotification): string => {
    const map = {
      comment_like: t.notificationsCopyCommentLike,
      comment_reply: t.notificationsCopyCommentReply,
      friend_request: t.notificationsCopyFriendRequest,
      friend_accepted: t.notificationsCopyFriendAccepted,
      shared_playlist: t.notificationsCopySharedPlaylist,
    };
    return map[item.type].replace('{name}', item.actorName);
  };

  const iconFor = (
    type: AppNotification['type'],
  ): { ios: React.ComponentProps<typeof AppMenuIcon>['ios']; android: React.ComponentProps<typeof AppMenuIcon>['android']; tint: string } => {
    if (type === 'comment_like') {
      return { ios: 'heart.fill', android: 'favorite', tint: '#FF2D55' };
    }
    if (type === 'comment_reply') {
      return { ios: 'bubble.right.fill', android: 'chat-bubble', tint: theme.primary };
    }
    if (type === 'shared_playlist') {
      return { ios: 'music.note.list', android: 'queue-music', tint: theme.primary };
    }
    return { ios: 'person.2.fill', android: 'group', tint: theme.primary };
  };

  const switchRow = (
    key: 'notifyCommentLikes' | 'notifyCommentReplies' | 'notifyFriends',
    title: string,
    subtitle: string,
    value: boolean,
  ) => (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...fonts.sansMedium, fontSize: 15.5, color: theme.onSurface }}>{title}</Text>
        <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 17, color: mutedText }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={savingSwitch !== null}
        onValueChange={(next) => saveSwitch(key, next)}
        trackColor={{
          false: isDarkMode ? 'rgba(255,255,255,0.16)' : theme.outlineVariant,
          true: isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary,
        }}
        thumbColor="#ffffff"
      />
    </View>
  );

  return (
    <View style={{ gap: 18 }}>
      {/* Push permission card (shown on real devices when push is not yet granted) */}
      {pushStatus === 'undetermined' ? (
        <View style={[styles.card, styles.pushBanner, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View
            style={[
              styles.pushIconWrap,
              { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : theme.primary + '14' },
            ]}
          >
            <AppMenuIcon
              ios="bell.badge.fill"
              android="notifications-active"
              color={isDarkMode ? '#fdf9f2' : theme.primary}
              size={20}
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ ...fonts.sansSemiBold, fontSize: 15, color: theme.onSurface }}>
              {t.notificationsEnablePushTitle}
            </Text>
            <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 17, color: mutedText }}>
              {t.notificationsEnablePushBody}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={enablingPush}
            onPress={() => void handleEnablePush()}
            style={({ pressed }) => ({
              backgroundColor: theme.primary,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              opacity: enablingPush ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            {enablingPush ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <Text style={{ ...fonts.sansSemiBold, fontSize: 13.5, color: theme.onPrimary }}>
                {t.notificationsEnablePushBtn}
              </Text>
            )}
          </Pressable>
        </View>
      ) : pushStatus === 'denied' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            void Linking.openSettings().catch(() => {});
          }}
          style={({ pressed }) => [
            styles.card,
            styles.pushBanner,
            { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <AppMenuIcon ios="bell.slash" android="notifications-off" color={mutedText} size={20} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...fonts.sansSemiBold, fontSize: 14.5, color: theme.onSurface }}>
              {t.notificationsPushDeniedTitle}
            </Text>
            <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 17, color: mutedText }}>
              {t.notificationsPushDeniedBody}
            </Text>
          </View>
          <Text style={{ ...fonts.sansSemiBold, fontSize: 13, color: theme.primary }}>
            {t.notificationsOpenSettings}
          </Text>
        </Pressable>
      ) : null}

      {/* Notification list */}
      {notifications.length > 0 ? (
        <View style={{ gap: 8 }}>
          {unreadCount > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 4 }}>
              <Pressable
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => {
                  Haptics.selectionAsync();
                  void markAllRead();
                }}
              >
                <Text style={{ ...fonts.sansSemiBold, fontSize: 13.5, color: theme.primary }}>
                  {t.notificationsMarkAllRead}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {notifications.map((item, idx) => {
              const badgeIcon = iconFor(item.type);
              const timeLabel = relativeTime(item.createdAt, es);
              return (
                <View key={item.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handlePressNotification(item)}
                    style={({ pressed }) => [
                      styles.row,
                      !item.read && {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.05)'
                          : theme.primary + '0A',
                      },
                      pressed && {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.06)'
                          : theme.primary + '12',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.09)' : theme.primary + '12' },
                      ]}
                    >
                      <AppMenuIcon
                        ios={badgeIcon.ios}
                        android={badgeIcon.android}
                        color={badgeIcon.tint}
                        size={17}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {!item.read ? <View style={styles.unreadDot} /> : null}
                        <Text
                          style={{
                            ...(item.read ? fonts.sansRegular : fonts.sansSemiBold),
                            fontSize: 14.5,
                            lineHeight: 20,
                            color: theme.onSurface,
                            flex: 1,
                          }}
                        >
                          {headlineFor(item)}
                        </Text>
                      </View>
                      {item.preview ? (
                        <Text
                          numberOfLines={2}
                          style={{
                            ...fonts.sansRegular,
                            fontSize: 13,
                            lineHeight: 18,
                            color: mutedText,
                          }}
                        >
                          “{item.preview}”
                        </Text>
                      ) : null}
                      {timeLabel ? (
                        <Text style={{ ...fonts.sansRegular, fontSize: 11.5, color: mutedText }}>
                          {timeLabel}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.notificationsDismiss}
                      hitSlop={10}
                      onPress={() => handleDismiss(item)}
                      style={{ padding: 6 }}
                    >
                      <AppMenuIcon ios="xmark" android="close" color={mutedText} size={13} />
                    </Pressable>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <AppMenuIcon ios="bell" android="notifications-none" color={mutedText} size={28} />
              <Text style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface, textAlign: 'center' }}>
                {t.notificationsEmptyTitle}
              </Text>
              <Text
                style={{
                  ...fonts.sansRegular,
                  fontSize: 14,
                  lineHeight: 20,
                  color: mutedText,
                  textAlign: 'center',
                }}
              >
                {t.notificationsEmptyBody}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Collapsible notification preferences (tucked cleanly out of the inbox) */}
      {user ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: prefsOpen }}
            onPress={() => {
              Haptics.selectionAsync();
              setPrefsOpen((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.row,
              pressed && {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
              },
            ]}
          >
            <AppMenuIcon ios="slider.horizontal.3" android="tune" color={theme.primary} size={19} />
            <Text style={{ flex: 1, ...fonts.sansSemiBold, fontSize: 15.5, color: theme.onSurface }}>
              {t.notificationsPrefsTitle}
            </Text>
            <AppMenuIcon
              ios={prefsOpen ? 'chevron.up' : 'chevron.down'}
              android={prefsOpen ? 'expand-less' : 'expand-more'}
              color={mutedText}
              size={13}
              weight="semibold"
            />
          </Pressable>

          {prefsOpen ? (
            <>
              <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
              {switchRow(
                'notifyCommentReplies',
                t.notificationsPrefReplies,
                t.notificationsPrefRepliesSub,
                user.notifyCommentReplies,
              )}
              <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
              {switchRow(
                'notifyCommentLikes',
                t.notificationsPrefLikes,
                t.notificationsPrefLikesSub,
                user.notifyCommentLikes,
              )}
              <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
              {switchRow(
                'notifyFriends',
                t.notificationsPrefFriends,
                t.notificationsPrefFriendsSub,
                user.notifyFriends,
              )}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { ...fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.9, paddingHorizontal: 14 },
  card: { borderRadius: 20, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  emptyCard: { padding: 24, alignItems: 'center', gap: 8 },
  pushBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  pushIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  row: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D64545',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
});
