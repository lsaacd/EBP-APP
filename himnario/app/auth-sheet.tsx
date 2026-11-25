/**
 * AuthSheet Route (`/auth-sheet`) — Native iOS 26 Liquid Glass `formSheet`
 * presenting the unified Sign In / Create Account / Account & App Menu sheet
 * with native `Stack.Toolbar` Liquid Glass pills and soft scroll edge effects.
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AuthSheet } from '../components/AuthSheet';

export default function AuthSheetRoute() {
  const params = useLocalSearchParams<{ from?: string }>();
  const originPathname = typeof params.from === 'string' ? params.from : undefined;

  return (
    <AuthSheet
      visible
      presentationMode="native-sheet"
      originPathname={originPathname}
    />
  );
}
