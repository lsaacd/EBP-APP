import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

/** SF Symbols on iOS; Material icons on Android. Never an emoji glyph. */
export default function AppMenuIcon({
  ios,
  android,
  color,
  size = 22,
  containerSize,
  weight = 'medium',
  scale = 'default',
  resizeMode = 'scaleAspectFit',
  style,
}: {
  ios: SymbolViewProps['name'];
  android: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  size?: number;
  containerSize?: number;
  weight?: SymbolViewProps['weight'];
  scale?: SymbolViewProps['scale'];
  resizeMode?: SymbolViewProps['resizeMode'];
  style?: StyleProp<ViewStyle>;
}) {
  const iosBox = containerSize ?? size;
  return Platform.OS === 'ios'
    ? (
      <SymbolView
        name={ios}
        tintColor={color}
        size={iosBox}
        weight={weight}
        scale={scale}
        resizeMode={resizeMode}
        style={[{ width: iosBox, height: iosBox }, style]}
      />
    )
    : <MaterialIcons name={android} color={color} size={size} />;
}
