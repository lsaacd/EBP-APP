/**
 * AuthSheet Route (`/auth-sheet`) — Native iOS 26 Liquid Glass `formSheet`
 * serving RN sub-pages (`share-app`, `help`) opened from the SwiftUI native
 * `<BottomSheet>` Auth sheet, and pre-SwiftUI iOS fallback.
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AuthSheet } from '../components/AuthSheet';

export default function AuthSheetRoute() {
  const params = useLocalSearchParams<{ from?: string; page?: string; noBack?: string }>();
  const originPathname = typeof params.from === 'string' ? params.from : undefined;
  const initialPage =
    params.page === 'share-app' || params.page === 'help' ? params.page : 'account';
  const hideNativeBack =
    params.noBack === '1' ||
    originPathname === '/(tabs)/settings' ||
    originPathname === '/settings';

  return (
    <AuthSheet
      visible
      presentationMode="native-sheet"
      initialPage={initialPage}
      originPathname={originPathname}
      hideNativeBack={hideNativeBack}
    />
  );
}
