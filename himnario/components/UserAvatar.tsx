/**
 * UserAvatar — Circular cloud-synced profile photo backed by `expo-image`
 * (`memory-disk` cache) with automatic fallback to Sacred Ink monogram initials.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { fonts } from '../theme/theme';
import AppMenuIcon from './AppMenuIcon';

export interface UserAvatarProps {
  uri?: string | null;
  initials: string;
  size: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  showEditBadge?: boolean;
  editBadgeBg?: string;
  editBadgeIconColor?: string;
  editBadgeBorderColor?: string;
}

export default function UserAvatar({
  uri,
  initials,
  size,
  backgroundColor = '#6e1619',
  textColor = '#FFFFFF',
  borderColor,
  borderWidth = 0,
  fontSize,
  showEditBadge = false,
  editBadgeBg = '#6e1619',
  editBadgeIconColor = '#FFFFFF',
  editBadgeBorderColor = '#FFFFFF',
}: UserAvatarProps) {
  const cleanUri = typeof uri === 'string' && uri.trim() ? uri.trim() : null;
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const showImage = Boolean(cleanUri && cleanUri !== failedUri);
  const radius = size / 2;
  const computedFontSize = fontSize ?? Math.max(11, Math.round(size * 0.37));
  const badgeSize = Math.max(20, Math.round(size * 0.32));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor,
            borderColor: borderColor ?? 'transparent',
            borderWidth,
          },
        ]}
      >
        {showImage && cleanUri ? (
          <Image
            source={{ uri: cleanUri }}
            style={{ width: size, height: size, borderRadius: radius }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={160}
            onError={() => setFailedUri(cleanUri)}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={[
              styles.initials,
              {
                fontSize: computedFontSize,
                color: textColor,
              },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>

      {showEditBadge ? (
        <View
          pointerEvents="none"
          style={[
            styles.editBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: editBadgeBg,
              borderColor: editBadgeBorderColor,
            },
          ]}
        >
          <AppMenuIcon
            ios="camera.fill"
            android="photo-camera"
            color={editBadgeIconColor}
            size={Math.max(10, Math.round(badgeSize * 0.52))}
            containerSize={badgeSize - 4}
            weight="semibold"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    ...fonts.sansBold,
    letterSpacing: 0.4,
    includeFontPadding: false,
    textAlign: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
