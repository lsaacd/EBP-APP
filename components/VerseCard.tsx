import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const DAILY_VERSES = [
  { es: { ref: 'Mateo 18:20', text: 'Porque donde están dos ó tres congregados en mi nombre, allí estoy en medio de ellos.' }, en: { ref: 'Matthew 18:20', text: 'For where two or three are gathered in my name, there am I among them.' } },
  { es: { ref: 'Salmo 23:1', text: 'Jehová es mi pastor; nada me faltará.' }, en: { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' } },
  { es: { ref: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.' }, en: { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' } },
  { es: { ref: 'Isaías 41:10', text: 'No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.' }, en: { ref: 'Isaiah 41:10', text: 'Fear not, for I am with you; be not dismayed, for I am your God.' } },
  { es: { ref: 'Romanos 8:28', text: 'Y sabemos que á los que á Dios aman, todas las cosas les ayudan á bien, es á saber, á los que conforme al propósito son llamados.' }, en: { ref: 'Romans 8:28', text: 'And we know that for those who love God all things work together for good.' } },
  { es: { ref: 'Proverbios 3:5', text: 'Fíate de Jehová de todo tu corazón, Y no estribes en tu prudencia.' }, en: { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart, and do not lean on your own understanding.' } },
  { es: { ref: 'Salmo 46:1', text: 'Dios es nuestro amparo y fortaleza, Nuestro pronto auxilio en las tribulaciones.' }, en: { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' } },
  { es: { ref: 'Juan 14:6', text: 'Jesús le dice: Yo soy el camino, y la verdad, y la vida: nadie viene al Padre, sino por mí.' }, en: { ref: 'John 14:6', text: 'Jesus said to him, "I am the way, and the truth, and the life. No one comes to the Father except through me."' } },
  { es: { ref: 'Hebreos 11:1', text: 'Es pues la fe la sustancia de las cosas que se esperan, la demostración de las cosas que no se ven.' }, en: { ref: 'Hebrews 11:1', text: 'Now faith is the assurance of things hoped for, the conviction of things not seen.' } },
  { es: { ref: '1 Corintios 16:14', text: 'Todas vuestras cosas sean hechas con caridad.' }, en: { ref: '1 Corinthians 16:14', text: 'Let all that you do be done in love.' } },
  { es: { ref: 'Josué 1:9', text: 'Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en donde quiera que fueres.' }, en: { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you.' } },
  { es: { ref: 'Salmo 119:105', text: 'Lámpara es á mis pies tu palabra, Y lumbrera á mi camino.' }, en: { ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet and a light to my path.' } },
];

export default function VerseCard() {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();

  // Daily reset lock logic
  const today = new Date();
  const dayIndex = (today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate()) % DAILY_VERSES.length;
  const [dailyVerse] = useState(DAILY_VERSES[dayIndex]);

  const verseData = dailyVerse[language];

  // Provide fallback labels directly since they aren't in LanguageContext yet
  const labelVerse = language === 'es' ? 'VERSÍCULO DE HOY' : 'VERSE OF THE DAY';
  const labelShare = language === 'es' ? 'Compartir el Versículo' : 'Share Verse';

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `"${verseData.text}"\n— ${verseData.ref}`,
      });
    } catch (error) {
      console.log('Error sharing verse:', error);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
      {/* Label */}
      <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
        {labelVerse}
      </Text>

      {/* Scripture Text */}
      <Text style={[styles.verseText, { color: theme.onSurface }]}>
        &quot;{verseData.text}&quot;
      </Text>

      {/* Reference */}
      <Text style={[styles.reference, { color: theme.onSurface }]}>
        {verseData.ref}
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.outline, opacity: 0.15 }]} />

      {/* Share Button */}
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: isDarkMode ? theme.surfaceVariants.containerLowest : theme.primary }]}
        activeOpacity={0.8}
        onPress={handleShare}
      >
        <MaterialIcons name="share" size={18} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.shareText}>{labelShare}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Newsreader_700Bold',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.9,
    marginBottom: 16,
  },
  verseText: {
    fontFamily: fonts.regularItalic,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
    opacity: 0.9,
  },
  reference: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.8,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  shareText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
});
