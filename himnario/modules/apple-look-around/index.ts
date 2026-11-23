import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AppleDrivingEstimate {
  distanceMeters: number;
  expectedTravelTimeSeconds: number;
}

interface AppleLookAroundNativeModule {
  isAvailable(lat: number, lng: number): Promise<boolean>;
  presentLookAround(
    lat: number,
    lng: number,
    primaryTitle?: string | null,
    secondaryTitle?: string | null,
    doneLabel?: string | null,
  ): Promise<boolean>;
  getDrivingEstimate?(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<AppleDrivingEstimate | null>;
}

const nativeModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<AppleLookAroundNativeModule>('AppleLookAround')
    : null;

export async function getAppleDrivingEstimate(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<AppleDrivingEstimate | null> {
  if (!nativeModule?.getDrivingEstimate) return null;
  try {
    const res = await nativeModule.getDrivingEstimate(fromLat, fromLng, toLat, toLng);
    if (
      res &&
      typeof res.distanceMeters === 'number' &&
      Number.isFinite(res.distanceMeters) &&
      res.distanceMeters > 0 &&
      typeof res.expectedTravelTimeSeconds === 'number' &&
      Number.isFinite(res.expectedTravelTimeSeconds) &&
      res.expectedTravelTimeSeconds > 0
    ) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}

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
