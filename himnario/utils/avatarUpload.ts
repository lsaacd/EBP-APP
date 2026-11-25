/**
 * avatarUpload — 1-tap cloud profile photo picker + square 512×512 JPEG processor.
 *
 * Works identically for Sign in with Apple, Google, and Email accounts on iOS & Android
 * using native `expo-image-picker` + `expo-image-manipulator`.
 */
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AvatarPickerMessages {
  unavailable: string;
  cameraDenied: string;
  libraryDenied: string;
  processError: string;
}

export interface AvatarActionSheetLabels {
  title: string;
  chooseLibrary: string;
  takePhoto: string;
  restoreGoogle?: string;
  removePhoto: string;
  cancel: string;
}

export function promptAvatarAction(options: {
  hasAvatar: boolean;
  hasGoogleAvatar?: boolean;
  labels: AvatarActionSheetLabels;
  onChooseLibrary: () => void;
  onTakePhoto: () => void;
  onRestoreGoogle?: () => void;
  onRemove: () => void;
}): void {
  const {
    hasAvatar,
    hasGoogleAvatar,
    labels,
    onChooseLibrary,
    onTakePhoto,
    onRestoreGoogle,
    onRemove,
  } = options;
  const canRestoreGoogle = Boolean(hasGoogleAvatar && labels.restoreGoogle && onRestoreGoogle);

  if (Platform.OS === 'ios') {
    const entries: { label: string; action?: () => void; destructive?: boolean }[] = [
      { label: labels.chooseLibrary, action: onChooseLibrary },
      { label: labels.takePhoto, action: onTakePhoto },
    ];
    if (canRestoreGoogle && labels.restoreGoogle && onRestoreGoogle) {
      entries.push({ label: labels.restoreGoogle, action: onRestoreGoogle });
    }
    if (hasAvatar) {
      entries.push({ label: labels.removePhoto, action: onRemove, destructive: true });
    }
    entries.push({ label: labels.cancel });

    const cancelButtonIndex = entries.length - 1;
    const destructiveIdx = entries.findIndex((e) => e.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: labels.title,
        options: entries.map((e) => e.label),
        cancelButtonIndex,
        destructiveButtonIndex: destructiveIdx >= 0 ? destructiveIdx : undefined,
      },
      (buttonIndex) => {
        entries[buttonIndex]?.action?.();
      },
    );
    return;
  }

  const actions: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
    { text: labels.chooseLibrary, onPress: onChooseLibrary },
    { text: labels.takePhoto, onPress: onTakePhoto },
  ];
  if (canRestoreGoogle && labels.restoreGoogle && onRestoreGoogle) {
    actions.push({ text: labels.restoreGoogle, onPress: onRestoreGoogle });
  }
  if (hasAvatar) {
    actions.push({ text: labels.removePhoto, style: 'destructive', onPress: onRemove });
  }
  actions.push({ text: labels.cancel, style: 'cancel' });
  Alert.alert(labels.title, undefined, actions);
}

export async function pickAvatarBase64(
  source: 'camera' | 'library',
  messages: AvatarPickerMessages,
): Promise<string | null> {
  if (
    !requireOptionalNativeModule('ExponentImagePicker') ||
    !requireOptionalNativeModule('ExpoImageManipulator')
  ) {
    throw new Error(messages.unavailable);
  }

  const ImagePicker = await import('expo-image-picker');
  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

  let result;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error(messages.cameraDenied);
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      exif: false,
    });
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error(messages.libraryDenied);
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      exif: false,
    });
  }

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!asset?.uri) throw new Error(messages.processError);

  const actions: (
    | { crop: { originX: number; originY: number; width: number; height: number } }
    | { resize: { width: number; height: number } }
  )[] = [];

  if (
    typeof asset.width === 'number' &&
    typeof asset.height === 'number' &&
    asset.width > 0 &&
    asset.height > 0 &&
    Math.abs(asset.width - asset.height) > 2
  ) {
    const side = Math.min(asset.width, asset.height);
    actions.push({
      crop: {
        originX: Math.max(0, Math.floor((asset.width - side) / 2)),
        originY: Math.max(0, Math.floor((asset.height - side) / 2)),
        width: side,
        height: side,
      },
    });
  }

  actions.push({ resize: { width: 512, height: 512 } });

  const manipulated = await manipulateAsync(asset.uri, actions, {
    compress: 0.82,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!manipulated.base64) {
    throw new Error(messages.processError);
  }
  return manipulated.base64;
}
