/**
 * NotificationsScreen (iOS 26 Native SwiftUI Form) — Quiet, uncluttered activity inbox.
 *
 * Follows Oyelo's ReminderView & Kujun's SettingsScreen patterns:
 * - Hides redundant "Push notifications enabled" status banner when push is working
 * - Shows an actionable card only when push permission is undetermined or denied
 * - Keeps the main view focused on notifications (with native SwipeActions to dismiss
 *   and SwiftUI ContentUnavailableView when empty)
 * - Moves the 3 category toggles + device push status into a native Liquid Glass
 *   BottomSheet opened from the header preferences button
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { communityError } from '../../utils/communityApi';
import {
  parseNotificationDestination,
  type AppNotification,
} from '../../utils/notifications';
import { useNotifications } from '../../utils/notificationsStore';
import {
  getPushPermissionStatus,
  type PushPermissionState,
} from '../../utils/pushNotifications';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { showSuccessToast } from '../../utils/toast';
import type { NotificationsScreenProps } from './NotificationsScreen';

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

export default function NotificationsScreenIOS({
  prefsSheetOpen,
  onPrefsSheetOpenChange,
  onNavigate,
}: NotificationsScreenProps) {
  const swiftUI = getExpoSwiftUI();
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const es = language !== 'en';
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

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

  const refreshPushPermission = useCallback(() => {
    void getPushPermissionStatus().then(setPushStatus);
  }, []);

  useEffect(() => {
    void refresh();
    refreshPushPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPushPermission();
    });
    return () => sub.remove();
  }, [refresh, refreshPushPermission]);

  const handleRefresh = useCallback(async () => {
    refreshPushPermission();
    await refresh();
  }, [refresh, refreshPushPermission]);

  const handleEnablePush = useCallback(async () => {
    if (enablingPush) return;
    Haptics.selectionAsync().catch(() => {});
    setEnablingPush(true);
    try {
      const nextStatus = await syncPushToken(es ? 'es' : 'en', true);
      setPushStatus(nextStatus);
      if (nextStatus === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } finally {
      setEnablingPush(false);
    }
  }, [enablingPush, es, syncPushToken]);

  const handlePressNotification = useCallback(
    (item: AppNotification) => {
      Haptics.selectionAsync().catch(() => {});
      if (!item.read) {
        void markRead(item.id);
      }
      const destination = parseNotificationDestination(item);
      if (destination) {
        onNavigate?.(destination);
      }
    },
    [markRead, onNavigate],
  );

  const handleDismissNotification = useCallback(
    (item: AppNotification) => {
      Haptics.selectionAsync().catch(() => {});
      void remove(item.id).catch((e) =>
        Alert.alert(t.churchError, communityError(e, es)),
      );
    },
    [es, remove, t.churchError],
  );

  const handleSaveSwitch = useCallback(
    (
      key: 'notifyCommentLikes' | 'notifyCommentReplies' | 'notifyFriends',
      value: boolean,
    ) => {
      if (savingSwitch) return;
      Haptics.selectionAsync().catch(() => {});
      setSavingSwitch(key);
      updateProfile({ [key]: value })
        .then(() => {
          showSuccessToast(t.profileVisibilitySaved);
        })
        .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setSavingSwitch(null));
    },
    [es, savingSwitch, t.churchError, t.profileVisibilitySaved, updateProfile],
  );

  if (!swiftUI || !user) return null;

  const {
    BottomSheet,
    Button,
    Circle,
    ContentUnavailableView,
    Form,
    Group,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    NavigationStack,
    ProgressView,
    Section,
    Spacer,
    SwipeActions,
    Text,
    Toggle,
    Toolbar,
    ToolbarItem,
    VStack,
  } = swiftUI.ui;

  const {
    buttonBorderShape,
    buttonStyle,
    contentShape,
    controlSize,
    disabled,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    listRowBackground,
    listSectionMargins,
    listSectionSpacing,
    padding,
    preferredColorScheme,
    presentationDetents,
    presentationDragIndicator,
    refreshable,
    scrollEdgeEffectStyle,
    shapes,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const prominentFill = isDarkMode ? '#fdf9f2' : '#6e1619';
  const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
  const toggleTint = isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary;
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const bottomPad = hasMiniPlayer ? 92 : 28;

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

  const symbolFor = (type: AppNotification['type']): { name: SFSymbol; color: string } => {
    if (type === 'comment_like') return { name: 'heart.fill', color: '#FF2D55' };
    if (type === 'comment_reply') return { name: 'bubble.right.fill', color: symbolTint };
    if (type === 'shared_playlist') return { name: 'music.note.list', color: symbolTint };
    return { name: 'person.2.fill', color: symbolTint };
  };

  return (
    <>
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollEdgeEffectStyle('soft', 'all'),
            refreshable(handleRefresh),
          ]}
        >
          {/* Only surface push permission banner when push is NOT yet enabled */}
          {pushStatus === 'undetermined' ? (
            <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
              <HStack alignment="center" spacing={12}>
                <SwiftUIImage
                  systemName="bell.badge.fill"
                  size={20}
                  modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                />
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' })]}>
                    {t.notificationsEnablePushTitle}
                  </Text>
                  <Text
                    modifiers={[
                      font({ textStyle: 'footnote' }),
                      foregroundStyle(secondaryStyle),
                    ]}
                  >
                    {t.notificationsEnablePushBody}
                  </Text>
                </VStack>
                <Spacer />
                <Button
                  onPress={() => void handleEnablePush()}
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    controlSize('small'),
                    tint(prominentFill),
                    disabled(enablingPush),
                  ]}
                >
                  {enablingPush ? (
                    <ProgressView />
                  ) : (
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: prominentInk }),
                      ]}
                    >
                      {t.notificationsEnablePushBtn}
                    </Text>
                  )}
                </Button>
              </HStack>
            </Section>
          ) : pushStatus === 'denied' ? (
            <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  void Linking.openSettings().catch(() => {});
                }}
              >
                <HStack
                  alignment="center"
                  spacing={12}
                  modifiers={[contentShape(shapes.rectangle())]}
                >
                  <SwiftUIImage
                    systemName="bell.slash"
                    size={20}
                    modifiers={[foregroundStyle(secondaryStyle)]}
                  />
                  <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' })]}>
                      {t.notificationsPushDeniedTitle}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {t.notificationsPushDeniedBody}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Text
                    modifiers={[
                      font({ textStyle: 'footnote', weight: 'semibold' }),
                      foregroundStyle({ type: 'color', color: symbolTint }),
                    ]}
                  >
                    {t.notificationsOpenSettings}
                  </Text>
                </HStack>
              </Button>
            </Section>
          ) : null}

          {/* ── Notification Inbox ── */}
          {notifications.length > 0 ? (
            <>
              {unreadCount > 0 ? (
                <Section>
                  <Button
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      void markAllRead();
                    }}
                  >
                    <Label
                      title={t.notificationsMarkAllRead}
                      systemImage="checkmark.circle"
                    />
                  </Button>
                </Section>
              ) : null}

              <Section
                footer={
                  <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                    <Text> </Text>
                  </VStack>
                }
              >
                {notifications.map((item) => {
                  const icon = symbolFor(item.type);
                  const timeLabel = relativeTime(item.createdAt, es);
                  return (
                    <SwipeActions key={item.id}>
                      <Button
                        modifiers={[foregroundStyle(primaryStyle)]}
                        onPress={() => handlePressNotification(item)}
                      >
                        <HStack
                          alignment="center"
                          spacing={12}
                          modifiers={[contentShape(shapes.rectangle())]}
                        >
                          <SwiftUIImage
                            systemName={icon.name}
                            size={18}
                            modifiers={[
                              foregroundStyle({ type: 'color', color: icon.color }),
                              frame({ width: 26, alignment: 'center' }),
                            ]}
                          />
                          <VStack alignment="leading" spacing={3}>
                            <HStack alignment="center" spacing={6}>
                              {!item.read ? (
                                <Circle
                                  modifiers={[
                                    foregroundStyle({ type: 'color', color: '#D64545' }),
                                    frame({ width: 7, height: 7 }),
                                  ]}
                                />
                              ) : null}
                              <Text
                                modifiers={[
                                  font({
                                    textStyle: 'subheadline',
                                    weight: item.read ? 'regular' : 'semibold',
                                  }),
                                  lineLimit(2),
                                  truncationMode('tail'),
                                ]}
                              >
                                {headlineFor(item)}
                              </Text>
                            </HStack>
                            {item.preview ? (
                              <Text
                                modifiers={[
                                  font({ textStyle: 'footnote' }),
                                  foregroundStyle(secondaryStyle),
                                  lineLimit(2),
                                  truncationMode('tail'),
                                ]}
                              >
                                {`“${item.preview}”`}
                              </Text>
                            ) : null}
                            {timeLabel ? (
                              <Text
                                modifiers={[
                                  font({ textStyle: 'caption2' }),
                                  foregroundStyle(tertiaryStyle),
                                ]}
                              >
                                {timeLabel}
                              </Text>
                            ) : null}
                          </VStack>
                          <Spacer />
                          <SwiftUIImage
                            systemName="chevron.right"
                            size={12}
                            modifiers={[foregroundStyle(tertiaryStyle)]}
                          />
                        </HStack>
                      </Button>

                      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
                        <Button
                          role="destructive"
                          label={t.delete}
                          systemImage="trash"
                          onPress={() => handleDismissNotification(item)}
                        />
                      </SwipeActions.Actions>
                    </SwipeActions>
                  );
                })}
              </Section>
            </>
          ) : (
            <Section
              footer={
                <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                  <Text> </Text>
                </VStack>
              }
            >
              {loading ? (
                <HStack
                  alignment="center"
                  modifiers={[
                    frame({ maxWidth: Infinity, alignment: 'center' }),
                    padding({ top: 44, bottom: 32 }),
                    listRowBackground('clear'),
                  ]}
                >
                  <ProgressView />
                </HStack>
              ) : (
                <ContentUnavailableView
                  title={t.notificationsEmptyTitle}
                  systemImage="bell"
                  description={t.notificationsEmptyBody}
                  modifiers={[
                    listRowBackground('clear'),
                    padding({ top: 44, bottom: 24 }),
                  ]}
                />
              )}
            </Section>
          )}
        </Form>
      </Host>

      {/* ── Native Liquid Glass Notification Preferences Sheet (opened from header button) ── */}
      <Host
        style={{ position: 'absolute', width: 0, height: 0 }}
        colorScheme={scheme}
        seedColor={symbolTint}
      >
        <BottomSheet
          isPresented={prefsSheetOpen}
          onIsPresentedChange={onPrefsSheetOpenChange}
        >
          <Group
            modifiers={[
              presentationDetents(['medium', 'large']),
              presentationDragIndicator('visible'),
              preferredColorScheme(scheme),
            ]}
          >
            <NavigationStack>
              <Toolbar>
                <Form
                  modifiers={[
                    tint(symbolTint),
                    listSectionSpacing('compact'),
                    scrollEdgeEffectStyle('soft', 'all'),
                  ]}
                >
                  <Section>
                    <LabeledContent
                      label={
                        <Label
                          title={t.notificationsDeviceStatusTitle}
                          systemImage={
                            pushStatus === 'granted' ? 'bell.badge.fill' : 'bell.slash'
                          }
                        />
                      }
                    >
                      <Text
                        modifiers={[
                          font({ textStyle: 'subheadline', weight: 'semibold' }),
                          foregroundStyle(
                            pushStatus === 'granted'
                              ? { type: 'color', color: '#34C759' }
                              : secondaryStyle,
                          ),
                        ]}
                      >
                        {pushStatus === 'granted'
                          ? t.notificationsDeviceStatusOn
                          : t.notificationsDeviceStatusOff}
                      </Text>
                    </LabeledContent>

                    {pushStatus === 'undetermined' ? (
                      <Button
                        label={t.notificationsEnablePushBtn}
                        systemImage="bell.badge"
                        onPress={() => void handleEnablePush()}
                        modifiers={[disabled(enablingPush)]}
                      />
                    ) : pushStatus === 'denied' ? (
                      <Button
                        label={t.notificationsOpenSettings}
                        systemImage="gear"
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          void Linking.openSettings().catch(() => {});
                        }}
                      />
                    ) : null}
                  </Section>

                  <Section title={t.notificationsPreferences}>
                    <Toggle
                      isOn={user.notifyCommentReplies}
                      onIsOnChange={(next) =>
                        handleSaveSwitch('notifyCommentReplies', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.notificationsPrefReplies}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.notificationsPrefRepliesSub}
                        </Text>
                      </VStack>
                    </Toggle>

                    <Toggle
                      isOn={user.notifyCommentLikes}
                      onIsOnChange={(next) =>
                        handleSaveSwitch('notifyCommentLikes', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.notificationsPrefLikes}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.notificationsPrefLikesSub}
                        </Text>
                      </VStack>
                    </Toggle>

                    <Toggle
                      isOn={user.notifyFriends}
                      onIsOnChange={(next) => handleSaveSwitch('notifyFriends', next)}
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.notificationsPrefFriends}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.notificationsPrefFriendsSub}
                        </Text>
                      </VStack>
                    </Toggle>
                  </Section>
                </Form>

                <Toolbar.Content>
                  <ToolbarItem placement="principal">
                    <Text
                      modifiers={[
                        font({ textStyle: 'headline', weight: 'semibold' }),
                        foregroundStyle(primaryStyle),
                      ]}
                    >
                      {t.notificationsPrefsTitle}
                    </Text>
                  </ToolbarItem>
                  <ToolbarItem placement="confirmationAction">
                    <Button
                      label={t.done}
                      onPress={() => onPrefsSheetOpenChange(false)}
                      modifiers={[foregroundStyle(primaryStyle)]}
                    />
                  </ToolbarItem>
                </Toolbar.Content>
              </Toolbar>
            </NavigationStack>
          </Group>
        </BottomSheet>
      </Host>
    </>
  );
}
