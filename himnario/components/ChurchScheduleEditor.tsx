/**
 * ChurchScheduleEditor — pick service days and times instead of typing them.
 *
 * Tap a day to add a service, tap a time to change it. The result is written
 * back as the same text the church card parses into per-day rows, so a
 * schedule entered here always displays cleanly.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import AppMenuIcon from './AppMenuIcon';
import {
  formatClock,
  parseServiceTimes,
  serializeSchedule,
  sortScheduleEntries,
  type ScheduleEntry,
} from '../utils/churchSchedule';

const MAX_SERVICES = 8;
const MAX_TEXT_LENGTH = 240;
const NOTE_MAX = 40;
// Half-hour steps from 5:00 AM to 11:00 PM.
const TIME_OPTIONS = Array.from({ length: 37 }, (_, i) => 5 * 60 + i * 30);

const DAYS: { index: number; es: string; en: string; esFull: string; enFull: string }[] = [
  { index: 1, es: 'Lun', en: 'Mon', esFull: 'Lunes', enFull: 'Monday' },
  { index: 2, es: 'Mar', en: 'Tue', esFull: 'Martes', enFull: 'Tuesday' },
  { index: 3, es: 'Mié', en: 'Wed', esFull: 'Miércoles', enFull: 'Wednesday' },
  { index: 4, es: 'Jue', en: 'Thu', esFull: 'Jueves', enFull: 'Thursday' },
  { index: 5, es: 'Vie', en: 'Fri', esFull: 'Viernes', enFull: 'Friday' },
  { index: 6, es: 'Sáb', en: 'Sat', esFull: 'Sábado', enFull: 'Saturday' },
  { index: 0, es: 'Dom', en: 'Sun', esFull: 'Domingo', enFull: 'Sunday' },
];

type Entry = ScheduleEntry & { key: number };
type ActiveField = { key: number; field: 'start' | 'end' } | null;

/** True when `text` is empty or something this editor can load without losing anything. */
export function canEditSchedule(text: string): boolean {
  return !text.trim() || parseServiceTimes(text) !== null;
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
};

export default function ChurchScheduleEditor({ value, onChange, disabled }: Props) {
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const es = language !== 'en';

  // Loaded once from the incoming text; afterwards this component owns the rows.
  const [entries, setEntries] = useState<Entry[]>(() =>
    (parseServiceTimes(value) ?? []).map((row, i) => ({
      key: i + 1,
      dayIndex: row.dayIndex,
      start: row.start,
      end: row.end,
      note: row.note ?? '',
    })),
  );
  const [nextKey, setNextKey] = useState(() => entries.length + 1);
  const [active, setActive] = useState<ActiveField>(null);

  const commit = (next: Entry[]) => {
    setEntries(next);
    onChange(serializeSchedule(next));
  };

  const addDay = (dayIndex: number) => {
    if (disabled || entries.length >= MAX_SERVICES) return;
    // Sunday services are usually daytime; weekday services are in the evening.
    const start = dayIndex === 0 ? 10 * 60 : 19 * 60;
    const entry: Entry = { key: nextKey, dayIndex, start, end: start + 120, note: '' };
    const next = [...entries, entry];
    if (serializeSchedule(next).length > MAX_TEXT_LENGTH) return;
    Haptics.selectionAsync();
    setNextKey(nextKey + 1);
    setActive(null);
    commit(next);
  };

  const update = (key: number, patch: Partial<ScheduleEntry>) => {
    const next = entries.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry));
    if (serializeSchedule(next).length > MAX_TEXT_LENGTH) return;
    commit(next);
  };

  const remove = (key: number) => {
    Haptics.selectionAsync();
    if (active?.key === key) setActive(null);
    commit(entries.filter((entry) => entry.key !== key));
  };

  const pickTime = (minutes: number) => {
    if (!active) return;
    const entry = entries.find((e) => e.key === active.key);
    if (!entry) return;
    Haptics.selectionAsync();
    if (active.field === 'start') {
      // Keep the service length when the start moves, and never end before it starts.
      const length = entry.end === null ? null : Math.max(30, entry.end - entry.start);
      update(entry.key, {
        start: minutes,
        end: length === null ? null : Math.min(23 * 60 + 30, minutes + length),
      });
    } else {
      update(entry.key, { end: minutes <= entry.start ? entry.start + 30 : minutes });
    }
    setActive(null);
  };

  const mutedText = isDarkMode ? 'rgba(235,235,245,0.60)' : theme.onSurfaceVariant;
  const chipBg = isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
  const hairline = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const sorted = sortScheduleEntries(entries);
  const activeEntry = active ? entries.find((e) => e.key === active.key) : undefined;
  const activeValue = activeEntry && active ? activeEntry[active.field] : null;

  return (
    <View style={styles.root}>
      <View style={styles.dayRow}>
        {DAYS.map((day) => {
          const used = entries.some((entry) => entry.dayIndex === day.index);
          return (
            <Pressable
              key={day.index}
              disabled={disabled || entries.length >= MAX_SERVICES}
              onPress={() => addDay(day.index)}
              accessibilityRole="button"
              accessibilityLabel={`${t.churchScheduleAddService}: ${es ? day.esFull : day.enFull}`}
              style={({ pressed }) => [
                styles.dayChip,
                {
                  backgroundColor: used ? theme.primary + (isDarkMode ? '2E' : '18') : chipBg,
                  borderColor: used ? theme.primary : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={{
                  ...(used ? fonts.sansSemiBold : fonts.sansMedium),
                  fontSize: 13,
                  color: used ? theme.primary : theme.onSurface,
                }}
              >
                {es ? day.es : day.en}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {sorted.length === 0 ? (
        <Text style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedText, marginLeft: 2 }}>
          {t.churchScheduleTapADay}
        </Text>
      ) : (
        <View style={[styles.list, { borderColor: hairline }]}>
          {sorted.map((entry, i) => {
            const day = DAYS.find((d) => d.index === entry.dayIndex)!;
            const timeChip = (field: 'start' | 'end', minutes: number) => {
              const selected = active?.key === entry.key && active.field === field;
              return (
                <Pressable
                  disabled={disabled}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActive(selected ? null : { key: entry.key, field });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${field === 'start' ? t.churchScheduleStarts : t.churchScheduleEnds}: ${formatClock(minutes)}`}
                  style={[
                    styles.timeChip,
                    { backgroundColor: selected ? theme.primary : chipBg },
                  ]}
                >
                  <Text
                    style={{
                      ...fonts.sansMedium,
                      fontSize: 13.5,
                      fontVariant: ['tabular-nums'],
                      color: selected ? theme.onPrimary : theme.onSurface,
                    }}
                  >
                    {formatClock(minutes)}
                  </Text>
                </Pressable>
              );
            };
            return (
              <View
                key={entry.key}
                style={[
                  styles.entry,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: hairline },
                ]}
              >
                <View style={styles.entryTop}>
                  <Text
                    numberOfLines={1}
                    style={{ ...fonts.sansSemiBold, fontSize: 14.5, color: theme.onSurface, flex: 1 }}
                  >
                    {es ? day.esFull : day.enFull}
                  </Text>
                  {timeChip('start', entry.start)}
                  {entry.end !== null && (
                    <>
                      <Text style={{ color: mutedText, ...fonts.sansRegular, fontSize: 13 }}>–</Text>
                      {timeChip('end', entry.end)}
                    </>
                  )}
                  <Pressable
                    hitSlop={10}
                    disabled={disabled}
                    onPress={() => remove(entry.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.churchScheduleRemoveService}: ${es ? day.esFull : day.enFull}`}
                  >
                    <AppMenuIcon ios="minus.circle.fill" android="remove-circle" color={mutedText} size={19} />
                  </Pressable>
                </View>
                <TextInput
                  value={entry.note}
                  onChangeText={(text) => update(entry.key, { note: text.slice(0, NOTE_MAX) })}
                  placeholder={t.churchScheduleNotePlaceholder}
                  placeholderTextColor={mutedText}
                  maxLength={NOTE_MAX}
                  editable={!disabled}
                  style={[styles.note, { color: theme.onSurface }]}
                />
              </View>
            );
          })}
        </View>
      )}

      {active && activeEntry && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.timeStrip}
        >
          {TIME_OPTIONS.filter(
            (minutes) => active.field === 'start' || minutes > activeEntry.start,
          ).map((minutes) => {
            const selected = minutes === activeValue;
            return (
              <Pressable
                key={minutes}
                onPress={() => pickTime(minutes)}
                accessibilityRole="button"
                accessibilityLabel={formatClock(minutes)}
                style={[
                  styles.timeOption,
                  { backgroundColor: selected ? theme.primary : chipBg },
                ]}
              >
                <Text
                  style={{
                    ...fonts.sansMedium,
                    fontSize: 13.5,
                    fontVariant: ['tabular-nums'],
                    color: selected ? theme.onPrimary : theme.onSurface,
                  }}
                >
                  {formatClock(minutes)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  entry: { paddingVertical: 10, gap: 4 },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  timeChip: {
    paddingHorizontal: 9,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    ...fonts.sansRegular,
    fontSize: 13,
    paddingVertical: 2,
  },
  timeStrip: { gap: 7, paddingRight: 8 },
  timeOption: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
