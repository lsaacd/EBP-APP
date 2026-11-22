import { requireOptionalNativeModule } from 'expo-modules-core';

export async function pickAndUploadChurchPhotos(options: {
  source: 'camera' | 'library';
  remainingSlots: number;
  uploadBase64: (base64: string) => Promise<string>;
  es: boolean;
}): Promise<string[]> {
  const { source, remainingSlots, uploadBase64, es } = options;
  if (remainingSlots <= 0) return [];

  if (!requireOptionalNativeModule('ExponentImagePicker') || !requireOptionalNativeModule('ExpoImageManipulator')) {
    throw new Error(
      es
        ? 'Actualiza la aplicación a la última compilación nativa de TestFlight para usar la cámara y fototeca.'
        : 'Please update the app to the latest native TestFlight build to use the camera and photo library.',
    );
  }

  const ImagePicker = await import('expo-image-picker');
  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error(
        es
          ? 'Permiso de cámara denegado. Actívalo en Ajustes para tomar fotos de la iglesia.'
          : 'Camera permission denied. Enable it in Settings to take church photos.',
      );
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      exif: false,
    });
    if (res.canceled || !res.assets?.length) return [];
    const uploaded: string[] = [];
    for (const asset of res.assets.slice(0, 1)) {
      const targetWidth = asset.width && asset.width > 1400 ? 1400 : asset.width || 1280;
      const manipulated = await manipulateAsync(
        asset.uri,
        [{ resize: { width: targetWidth } }],
        { compress: 0.8, format: SaveFormat.JPEG, base64: true },
      );
      if (!manipulated.base64) {
        throw new Error(es ? 'No se pudo procesar la foto.' : 'Could not process photo.');
      }
      const url = await uploadBase64(manipulated.base64);
      uploaded.push(url);
    }
    return uploaded;
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      es
        ? 'Permiso de fototeca denegado. Actívalo en Ajustes para elegir fotos de la iglesia.'
        : 'Photo library permission denied. Enable it in Settings to pick church photos.',
    );
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remainingSlots > 1,
    selectionLimit: remainingSlots,
    quality: 0.85,
    exif: false,
  });
  if (res.canceled || !res.assets?.length) return [];
  const uploaded: string[] = [];
  for (const asset of res.assets.slice(0, remainingSlots)) {
    const targetWidth = asset.width && asset.width > 1400 ? 1400 : asset.width || 1280;
    const manipulated = await manipulateAsync(
      asset.uri,
      [{ resize: { width: targetWidth } }],
      { compress: 0.8, format: SaveFormat.JPEG, base64: true },
    );
    if (!manipulated.base64) {
      throw new Error(es ? 'No se pudo procesar la foto.' : 'Could not process photo.');
    }
    const url = await uploadBase64(manipulated.base64);
    uploaded.push(url);
  }
  return uploaded;
}
