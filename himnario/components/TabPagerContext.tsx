import { createContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface TabPagerState {
  position: SharedValue<number>;
  width: number;
  index: number;
  count: number;
  select: (index: number) => void;
}

export const TabPagerContext = createContext<TabPagerState | null>(null);
