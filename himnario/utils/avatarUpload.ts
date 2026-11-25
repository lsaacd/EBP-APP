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
  removePhoto: string;
  cancel: string;
}

export function promptAvatarAction(options: {
  hasAvatar: boolean;
  labels: AvatarActionSheetLabels;
  onChooseLibrary: () => void;
  onTakePhoto: () => void;
  onRemove: () => void;
}): void {
  const { hasAvatar, labels, onChooseLibrary, onTakePhoto, onRemove } = options;

  if (Platform.OS === 'ios') {
    const buttons = hasAvatar
      ? [labels.chooseLibrary, labels.takePhoto, labels.removePhoto, labels.cancel]
      : [labels.chooseLibrary, labels.takePhoto, labels.cancel];
    const cancelButtonIndex = buttons.length - 1;
    const destructiveButtonIndex = hasAvatar ? 2 : undefined;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: labels.title,
        options: buttons,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onChooseLibrary();
        else if (buttonIndex === 1) onTakePhoto();
        else if (hasAvatar && buttonIndex === 2) onRemove();
      },
    );
    return;
  }

  const actions: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
    { text: labels.chooseLibrary, onPress: onChooseLibrary },
    { text: labels.takePhoto, onPress: onTakePhoto },
  ];
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
