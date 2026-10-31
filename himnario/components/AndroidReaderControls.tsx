import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ANDROID_BOTTOM_BAR_HEIGHT, androidBottomInset } from './androidBottomLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import WebIcon from './WebIcon';

export default function AndroidReaderControls({ onText, onTheme, onAudio, hasAudio }: {
  onText: () => void; onTheme: () => void; onAudio: () => void; hasAudio: boolean;
}) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const ink = isDarkMode ? '#fdf9f2' : '#24251f';
  const accent = isDarkMode ? '#fdf9f2' : '#6e1619';
  const background = isDarkMode ? '#202020' : '#fcf9f2';
  return (
    <View style={[styles.position, { bottom: androidBottomInset(insets.bottom) }]}>
      <View style={[styles.pill, { backgroundColor: background, borderColor: isDarkMode ? '#ffffff26' : '#e3dfd3' }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.textSize} onPress={onText} style={styles.button}>
          <MaterialIcons name="format-size" size={20} color={ink} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: ink }]}>{t.textSize}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={isDarkMode ? t.lightMode : t.darkMode} onPress={onTheme} style={styles.button}>
          <WebIcon name={isDarkMode ? 'sun' : 'moon'} color={ink} size={20} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: ink }]}>{isDarkMode ? t.lightMode : t.darkMode}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Audio" accessibilityState={{ disabled: !hasAudio }} disabled={!hasAudio} onPress={onAudio}
          style={[styles.button, { backgroundColor: accent, opacity: hasAudio ? 1 : 0.4 }]}>
          <WebIcon name="play" color={isDarkMode ? '#010101' : '#fcf9f2'} size={20} />
          <Text style={[styles.label, { color: isDarkMode ? '#010101' : '#fcf9f2' }]}>AUDIO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontFamily: 'PublicSans_600SemiBold', fontSize: 11, textTransform: 'uppercase', flexShrink: 1 },
  position: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  pill: { height: ANDROID_BOTTOM_BAR_HEIGHT, flexDirection: 'row', padding: 6, borderRadius: 38, borderWidth: 1, elevation: 8 },
  button: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 28, paddingHorizontal: 6 },
});
