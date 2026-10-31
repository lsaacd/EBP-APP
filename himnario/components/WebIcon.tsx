import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Match the website's SVG paths rather than substituting font glyphs.
const paths = {
  play: 'M8 4v16l12-8Z',
  pause: 'M7 4v16M17 4v16',
  previous: 'M5 4v16M19 5 7 12l12 7Z',
  next: 'M19 4v16M5 5l12 7-12 7Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  share: 'M8 12 17 5M8 12l9 7M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  list: 'M3 5h13M3 10h13M3 15h8m6-3v9m-4-4h8',
};
export default function WebIcon({ name, size = 22, color }: { name: keyof typeof paths; size?: number; color: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    <Path d={paths[name]} fill={name === 'play' ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
