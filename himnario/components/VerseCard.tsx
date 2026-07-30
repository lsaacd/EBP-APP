import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const DAILY_VERSES = [
  { es: { ref: 'Mateo 18:20', text: 'Porque donde están dos ó tres congregados en mi nombre, allí estoy yo en medio de ellos.' }, en: { ref: 'Matthew 18:20', text: 'For where two or three are gathered in my name, there am I among them.' } },
  { es: { ref: 'Salmo 23:1', text: 'Jehová es mi pastor; nada me faltará.' }, en: { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' } },
  { es: { ref: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.' }, en: { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' } },
  { es: { ref: 'Isaías 41:10', text: 'No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.' }, en: { ref: 'Isaiah 41:10', text: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.' } },
  { es: { ref: 'Romanos 8:28', text: 'Y sabemos que á los que á Dios aman, todas las cosas les ayudan á bien, es á saber, á los que conforme al propósito son llamados.' }, en: { ref: 'Romans 8:28', text: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.' } },
  { es: { ref: 'Proverbios 3:5', text: 'Fíate de Jehová de todo tu corazón, Y no estribes en tu prudencia.' }, en: { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart, and do not lean on your own understanding.' } },
  { es: { ref: 'Salmo 46:1', text: 'Dios es nuestro amparo y fortaleza, Nuestro pronto auxilio en las tribulaciones.' }, en: { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' } },
  { es: { ref: 'Juan 14:6', text: 'Jesús le dice: Yo soy el camino, y la verdad, y la vida: nadie viene al Padre, sino por mí.' }, en: { ref: 'John 14:6', text: 'Jesus said to him, "I am the way, and the truth, and the life. No one comes to the Father except through me."' } },
  { es: { ref: 'Hebreos 11:1', text: 'Es pues la fe la sustancia de las cosas que se esperan, la demostración de las cosas que no se ven.' }, en: { ref: 'Hebrews 11:1', text: 'Now faith is the assurance of things hoped for, the conviction of things not seen.' } },
  { es: { ref: '1 Corintios 16:14', text: 'Todas vuestras cosas sean hechas con caridad.' }, en: { ref: '1 Corinthians 16:14', text: 'Let all that you do be done in love.' } },
  { es: { ref: 'Josué 1:9', text: 'Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en donde quiera que fueres.' }, en: { ref: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.' } },
  { es: { ref: 'Salmo 119:105', text: 'Lámpara es á mis pies tu palabra, Y lumbrera á mi camino.' }, en: { ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet and a light to my path.' } },
  { es: { ref: 'San Juan 3:16', text: 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' }, en: { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' } },
  { es: { ref: '1 Timoteo 3:15', text: 'Y si no fuere tan presto, para que sepas cómo te conviene conversar en la casa de Dios, que es la iglesia del Dios vivo, columna y apoyo de la verdad.' }, en: { ref: '1 Timothy 3:15', text: 'If I delay, you may know how one ought to behave in the household of God, which is the church of the living God, a pillar and buttress of the truth.' } },
  { es: { ref: 'Salmos 100:1', text: 'Cantad alegres á Dios, habitantes de toda la tierra.' }, en: { ref: 'Psalm 100:1', text: 'Make a joyful noise to the LORD, all the earth!' } },
  { es: { ref: 'Salmos 139:23', text: 'Examíname, oh Dios, y conoce mi corazón: Pruébame y reconoce mis pensamientos:' }, en: { ref: 'Psalm 139:23', text: 'Search me, O God, and know my heart! Try me and know my thoughts!' } },
  { es: { ref: 'Hebreos 13:15', text: 'Así que, ofrezcamos por medio de él á Dios siempre sacrificio de alabanza, es á saber, fruto de labios que confiesen á su nombre.' }, en: { ref: 'Hebrews 13:15', text: 'Through him then let us continually offer up a sacrifice of praise to God, that is, the fruit of lips that acknowledge his name.' } },
  { es: { ref: 'Salmo 95:1', text: 'Venid, celebremos alegremente á Jehová: Cantemos con júbilo á la roca de nuestra salud.' }, en: { ref: 'Psalm 95:1', text: 'Oh come, let us sing to the Lord; let us make a joyful noise to the rock of our salvation!' } },
  { es: { ref: 'Salmo 96:1', text: 'Cantad á Jehová canción nueva; Cantad á Jehová, toda la tierra.' }, en: { ref: 'Psalm 96:1', text: 'Oh sing to the Lord a new song; sing to the Lord, all the earth!' } },
  { es: { ref: 'Salmo 150:6', text: 'Todo lo que respira alabe á JAH. Aleluya.' }, en: { ref: 'Psalm 150:6', text: 'Let everything that has breath praise the Lord! Praise the Lord!' } },
  { es: { ref: 'Efesios 5:19', text: 'Hablando entre vosotros con salmos, y con himnos, y canciones espirituales, cantando y alabando al Señor en vuestros corazones;' }, en: { ref: 'Ephesians 5:19', text: 'Addressing one another in psalms and hymns and spiritual songs, singing and making melody to the Lord with your heart,' } },
  { es: { ref: 'Colosenses 3:16', text: 'La palabra de Cristo habite en vosotros en abundancia en toda sabiduría, enseñándoos y exhortándoos los unos á los otros con salmos é himnos y canciones espirituales, con gracia cantando en vuestros corazones al Señor.' }, en: { ref: 'Colossians 3:16', text: 'Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom, singing psalms and hymns and spiritual songs, with thankfulness in your hearts to God.' } },
  { es: { ref: 'Salmo 9:1', text: 'Te alabaré, oh Jehová, con todo mi corazón; Contaré todas tus maravillas.' }, en: { ref: 'Psalm 9:1', text: 'I will give thanks to the Lord with my whole heart; I will recount all of your wonderful deeds.' } },
  { es: { ref: 'Salmo 33:3', text: 'Cantadle canción nueva: Hacedlo bien tañendo con júbilo.' }, en: { ref: 'Psalm 33:3', text: 'Sing to him a new song; play skillfully on the strings, with loud shouts.' } },
  { es: { ref: 'Salmo 34:1', text: 'Bendeciré á Jehová en todo tiempo; Su alabanza será siempre en mi boca.' }, en: { ref: 'Psalm 34:1', text: 'I will bless the Lord at all times; his praise shall continually be in my mouth.' } },
  { es: { ref: 'Salmo 47:6', text: 'Cantad á Dios, cantad: Cantad á nuestro Rey, cantad.' }, en: { ref: 'Psalm 47:6', text: 'Sing praises to God, sing praises! Sing praises to our King, sing praises!' } },
  { es: { ref: 'Salmo 150:1', text: 'Alabad á Dios en su santuario: Alabadle en la extensión de su fortaleza.' }, en: { ref: 'Psalm 150:1', text: 'Praise the Lord! Praise God in his sanctuary; praise him in his mighty heavens!' } },
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
      {/* Decorative accent line at top */}
      <View style={[styles.accentLine, { backgroundColor: theme.primary + '40' }]} />

      {/* Label without icons */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.primary }]}>
          {labelVerse}
        </Text>
      </View>

      {/* Opening quote mark */}
      <Text style={[styles.quoteMark, { color: theme.primary + '20' }]}>"</Text>

      {/* Scripture Text */}
      <Text style={[styles.verseText, { color: theme.onSurface }]}>
        {verseData.text}
      </Text>

      {/* Reference with thin rule */}
      <View style={styles.refContainer}>
        <View style={[styles.refRule, { backgroundColor: theme.primary + '30' }]} />
        <Text style={[styles.reference, { color: theme.onSurfaceVariant }]}>
          {verseData.ref}
        </Text>
        <View style={[styles.refRule, { backgroundColor: theme.primary + '30' }]} />
      </View>

      {/* Share Button — pill style */}
      <TouchableOpacity
        style={[styles.shareBtn, {
          backgroundColor: isDarkMode ? theme.surfaceVariants.container : theme.primary,
        }]}
        activeOpacity={0.8}
        onPress={handleShare}
      >
        <MaterialIcons name="share" size={16} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.shareText}>{labelShare}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 28,
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  quoteMark: {
    fontFamily: fonts.bold,
    fontSize: 64,
    lineHeight: 50,
    marginBottom: -4,
    marginTop: -4,
  },
  verseText: {
    fontFamily: fonts.regularItalic,
    fontSize: 19,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  refRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  reference: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  shareText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});
