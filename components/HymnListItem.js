import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HymnListItem({ hymn, onPress, theme }) {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16, // spacing-4 equivalent
      paddingHorizontal: 24, // Generous whitespace for margin
    },
    number: {
      fontFamily: 'Newsreader_700Bold',
      fontSize: 20,
      color: theme.primary,
      width: 56, // Increased to support 3-digit numbers without wrapping
      textAlign: 'left',
    },
    titleContainer: {
      flex: 1,
      paddingLeft: 8,
    },
    title: {
      fontFamily: 'Newsreader_400Regular',
      fontSize: 20,
      color: theme.onSurface,
      lineHeight: 28, // High leading for editorial feel
    },
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <Text
        style={styles.number}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {hymn.number}
      </Text>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{hymn.title}</Text>
      </View>
    </TouchableOpacity>
  );
}
