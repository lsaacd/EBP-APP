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
  containerSize,
  weight = 'bold',
}: {
  ios: SymbolViewProps['name'];
  android: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  size?: number;
  containerSize?: number;
  weight?: SymbolViewProps['weight'];
}) {
  const iosBox = containerSize ?? size;
  return Platform.OS === 'ios'
    ? <SymbolView name={ios} tintColor={color} size={iosBox} weight={weight} resizeMode="scaleAspectFit" style={{ width: iosBox, height: iosBox }} />
    : <MaterialIcons name={android} color={color} size={size} />;
}
