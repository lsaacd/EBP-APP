/**
 * TactilePressable — Spring-physics tactile wrapper powered by `pressto` (`PressableScale`)
 * on iOS/Android with a clean standard `Pressable` fallback on Web.
 */
import React from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from 'pressto';

export interface TactilePressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'none';
  children: React.ReactNode;
}

export default function TactilePressable({
  onPress,
  onLongPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  children,
}: TactilePressableProps) {
  if (Platform.OS === 'web') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      enabled={!disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={style}
    >
      {children}
    </PressableScale>
  );
}
