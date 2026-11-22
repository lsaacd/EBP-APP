import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

interface AppleLookAroundNativeModule {
  isAvailable(lat: number, lng: number): Promise<boolean>;
  presentLookAround(
    lat: number,
    lng: number,
    primaryTitle?: string | null,
    secondaryTitle?: string | null,
    doneLabel?: string | null,
  ): Promise<boolean>;
}

const nativeModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<AppleLookAroundNativeModule>('AppleLookAround')
    : null;

export async function isAppleLookAroundAvailable(lat: number, lng: number): Promise<boolean> {
  if (!nativeModule?.isAvailable) return false;
  try {
    return await nativeModule.isAvailable(lat, lng);
  } catch {
    return false;
  }
}

export async function presentAppleLookAround(
  lat: number,
  lng: number,
  options?: {
    primaryTitle?: string | null;
    secondaryTitle?: string | null;
    doneLabel?: string | null;
  },
): Promise<boolean> {
  if (!nativeModule?.presentLookAround) return false;
  try {
    return await nativeModule.presentLookAround(
      lat,
      lng,
      options?.primaryTitle ?? null,
      options?.secondaryTitle ?? null,
      options?.doneLabel ?? null,
    );
  } catch {
    return false;
  }
}
