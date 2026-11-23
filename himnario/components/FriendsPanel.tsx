/**
 * FriendsPanel — the "Hermanos" page inside the account sheet: requests you
 * received, your friends, and requests you sent. Tapping a friend opens their
 * details in place (the sheet is already a modal; a second one would freeze
 * UIKit on iOS).
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import { MINISTRIES, CHOIRS } from '../data/communityRules';
import * as Haptics from '../utils/haptics';
import { churchDisplayName } from '../utils/churchName';
import { memberSinceLabel, type FriendProfile, type FriendStatus } from '../utils/friends';
import { useFriends } from '../utils/friendsStore';
import AppMenuIcon from './AppMenuIcon';
import FriendButton from './FriendButton';

type Table = Record<string, [string, string]>;

export default function FriendsPanel() {
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const es = language !== 'en';
  const { lists, loading, refresh } = useFriends();
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const cardBg = isDarkMode ? '#222225' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '50';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.58)' : theme.onSurfaceVariant;
  const divider = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant;

  const roleLine = (person: FriendProfile) =>
    [
      person.ministry ? (MINISTRIES as Table)[person.ministry]?.[es ? 0 : 1] : null,
      person.choir ? (CHOIRS as Table)[person.choir]?.[es ? 0 : 1] : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const section = (title: string, people: FriendProfile[], status: FriendStatus) => {
    if (people.length === 0) return null;
    return (
      <View style={{ gap: 8 }}>
        <Text style={[styles.sectionHeader, { color: mutedText }]}>
          {`${title} (${people.length})`}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {people.map((person, index) => {
            const open = openId === person.id;
            const role = roleLine(person);
            const church = person.churchName ? churchDisplayName(person.churchName) : '';
            const since = memberSinceLabel(person.memberSince, es);
            return (
              <View key={person.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setOpenId(open ? null : person.id);
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
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
                      {person.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text numberOfLines={1} style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface }}>
                      {person.name}
                    </Text>
                    {role ? (
                      <Text numberOfLines={1} style={{ ...fonts.sansRegular, fontSize: 13, color: mutedText }}>
                        {role}
                      </Text>
                    ) : null}
                  </View>
                  <AppMenuIcon
                    ios={open ? 'chevron.up' : 'chevron.down'}
                    android={open ? 'expand-less' : 'expand-more'}
                    color={mutedText}
                    size={13}
                    weight="semibold"
                  />
                </Pressable>

                {open && (
                  <View style={styles.details}>
                    {church ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="building.columns" android="account-balance" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{church}</Text>
                      </View>
                    ) : null}
                    {person.location ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="mappin.and.ellipse" android="place" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{person.location}</Text>
                      </View>
                    ) : null}
                    {since ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="calendar" android="event" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{since}</Text>
                      </View>
                    ) : null}
                    <FriendButton
                      userId={person.id}
                      name={person.name}
                      status={status}
                      compact
                      onStatusChange={() => setOpenId(null)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const empty =
    lists.friends.length + lists.incoming.length + lists.outgoing.length === 0;

  return (
    <View style={{ gap: 18 }}>
      {section(t.friendsRequests, lists.incoming, 'incoming')}
      {section(t.friendsMine, lists.friends, 'friends')}
      {section(t.friendsSent, lists.outgoing, 'outgoing')}

      {empty && (
        <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <AppMenuIcon ios="person.2" android="group" color={mutedText} size={30} />
              <Text style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface, textAlign: 'center' }}>
                {t.friendsEmptyTitle}
              </Text>
              <Text style={{ ...fonts.sansRegular, fontSize: 14, lineHeight: 20, color: mutedText, textAlign: 'center' }}>
                {t.friendsEmptyBody}
              </Text>
            </>
          )}
        </View>
      )}

      <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 18, color: mutedText, paddingHorizontal: 14 }}>
        {t.friendsPrivacyNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { ...fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.9, paddingHorizontal: 14 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  emptyCard: { padding: 22, alignItems: 'center', gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  row: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8 },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  detailText: { ...fonts.sansRegular, fontSize: 14.5, flex: 1 },
});
