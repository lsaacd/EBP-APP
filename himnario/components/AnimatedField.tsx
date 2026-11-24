import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../theme/fonts';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from '../utils/haptics';

export interface AnimatedFieldProps extends Omit<TextInputProps, 'style'> {
  /** Floating label shown inside the field at rest, floating smoothly above on focus/value. */
  label: string;
  /** Current text value (controlled). */
  value: string;
  /** Highlights the field in error red. */
  error?: boolean;
  /** Optional trailing accessory (e.g., show/hide password eye button). */
  rightElement?: React.ReactNode;
  /** Renders as a borderless row inside an iOS inset-grouped card with a focus accent bar. */
  grouped?: boolean;
  /** Suppresses the bottom hairline divider in grouped mode. */
  isLast?: boolean;
  /** Optional container style override. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional override for standalone field background color. */
  surfaceColor?: string;
}

const FLOAT_SPRING = { damping: 22, stiffness: 300, mass: 0.75 };
const ERROR_COLOR = '#D64545';

type TextInputHandle = React.ComponentRef<typeof TextInput>;

export const AnimatedField = forwardRef<TextInputHandle, AnimatedFieldProps>(function AnimatedField(
  {
    label,
    value,
    error = false,
    rightElement,
    grouped = false,
    isLast = false,
    containerStyle,
    surfaceColor,
    placeholder,
    editable = true,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...inputProps
  },
  forwardedRef,
) {
  const { theme, isDarkMode } = useTheme();
  const innerRef = useRef<TextInputHandle>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(forwardedRef, () => innerRef.current as TextInputHandle);

  const hasValue = value.length > 0;
  const shouldFloat = focused || hasValue;

  const floatProgress = useSharedValue(shouldFloat ? 1 : 0);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    floatProgress.value = withSpring(shouldFloat ? 1 : 0, FLOAT_SPRING);
  }, [shouldFloat, floatProgress]);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, focusProgress]);

  const idleBorder = isDarkMode ? 'rgba(255,255,255,0.14)' : theme.outlineVariant + '70';
  const activeBorder = error ? ERROR_COLOR : theme.primary;
  const idleSurface = surfaceColor ?? theme.surfaceVariants.containerLowest;
  const groupedFocusWash = isDarkMode ? theme.primary + '1C' : theme.primary + '0B';
  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.10)' : theme.outlineVariant + '48';

  const standaloneBoxStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? ERROR_COLOR
      : interpolateColor(focusProgress.value, [0, 1], [idleBorder, activeBorder]);
    const borderWidth = error ? 1.5 : interpolate(focusProgress.value, [0, 1], [1, 1.75]);
    const scale = interpolate(focusProgress.value, [0, 1], [1, 1.006]);
    return {
      borderColor,
      borderWidth,
      transform: [{ scale }],
    };
  });

  const groupedRowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(0,0,0,0)', groupedFocusWash],
    ),
  }));

  const accentBarStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value,
    transform: [{ scaleY: interpolate(focusProgress.value, [0, 1], [0.35, 1]) }],
  }));

  const labelIdleColor = isDarkMode ? 'rgba(253,249,242,0.62)' : theme.onSurfaceVariant;
  const labelActiveColor = error ? ERROR_COLOR : theme.primary;

  const labelStyle = useAnimatedStyle(() => {
    const top = interpolate(floatProgress.value, [0, 1], [18, 7.5]);
    const fontSize = interpolate(floatProgress.value, [0, 1], [15.5, 11.5]);
    const color = error
      ? ERROR_COLOR
      : interpolateColor(focusProgress.value, [0, 1], [labelIdleColor, labelActiveColor]);
    return {
      top,
      fontSize,
      color,
    };
  });

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setFocused(true);
    if (editable) {
      Haptics.selectionAsync();
    }
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const handleContainerPress = () => {
    if (editable !== false) {
      innerRef.current?.focus();
    }
  };

  const fieldBody = (
    <Pressable
      onPress={handleContainerPress}
      accessible={false}
      style={[
        styles.rowInner,
        rightElement ? styles.rowInnerWithRight : null,
      ]}
    >
      <Animated.Text
        pointerEvents="none"
        numberOfLines={1}
        style={[
          styles.floatingLabel,
          focused || hasValue ? fonts.sansSemiBold : fonts.sansRegular,
          rightElement ? styles.floatingLabelWithRight : null,
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>

      <TextInput
        ref={innerRef}
        value={value}
        editable={editable}
        placeholder={focused && !hasValue ? placeholder : undefined}
        placeholderTextColor={theme.onSurfaceVariant + '68'}
        accessibilityLabel={accessibilityLabel ?? label}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          { color: theme.onSurface },
          editable === false ? styles.inputDisabled : null,
        ]}
        {...inputProps}
      />

      {rightElement ? <View style={styles.rightSlot}>{rightElement}</View> : null}
    </Pressable>
  );

  if (grouped) {
    return (
      <Animated.View style={[styles.groupedWrapper, groupedRowStyle, containerStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.groupedAccentBar,
            { backgroundColor: error ? ERROR_COLOR : theme.primary },
            accentBarStyle,
          ]}
        />
        {fieldBody}
        {!isLast && (
          <View
            pointerEvents="none"
            style={[styles.groupedDivider, { backgroundColor: dividerColor }]}
          />
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.standaloneWrapper,
        {
          backgroundColor: idleSurface,
          shadowColor: error ? ERROR_COLOR : theme.primary,
          shadowOpacity: focused ? (isDarkMode ? 0.22 : 0.12) : 0,
        },
        standaloneBoxStyle,
        containerStyle,
      ]}
    >
      {fieldBody}
    </Animated.View>
  );
});

export default AnimatedField;

const styles = StyleSheet.create({
  standaloneWrapper: {
    minHeight: 56,
    borderRadius: 14,
    justifyContent: 'center',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  groupedWrapper: {
    minHeight: 56,
    justifyContent: 'center',
    position: 'relative',
  },
  groupedAccentBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  groupedDivider: {
    position: 'absolute',
    left: 14,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 14,
    minHeight: 56,
  },
  rowInnerWithRight: {
    paddingRight: 6,
  },
  floatingLabel: {
    position: 'absolute',
    left: 14,
    right: 14,
    includeFontPadding: false,
  },
  floatingLabelWithRight: {
    right: 48,
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingTop: 23,
    paddingBottom: 9,
    paddingHorizontal: 0,
    margin: 0,
    ...fonts.sansRegular,
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  rightSlot: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
