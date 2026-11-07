import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

/** SF Symbols on iOS; Material icons on Android. Never an emoji glyph. */
export default function AppMenuIcon({
  ios,
  android,
  color,
  size = 22,
  weight = 'bold',
}: {
  ios: SymbolViewProps['name'];
  android: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  size?: number;
  weight?: SymbolViewProps['weight'];
}) {
  return Platform.OS === 'ios'
    ? <SymbolView name={ios} tintColor={color} size={size} weight={weight} style={{ width: size, height: size }} />
    : <MaterialIcons name={android} color={color} size={size} />;
}
