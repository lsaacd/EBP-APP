import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface HomeTabIconProps {
  selected?: boolean;
  color: string;
  size?: number;
}

/**
 * HomeTabIcon — Rounded house icon with an arched doorway matching the custom
 * home navigation icon. Renders as an outline when unselected and solid filled
 * with the arched doorway cutout when selected.
 */
export default function HomeTabIcon({
  selected = false,
  color,
  size = 24,
}: HomeTabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 150 150" fill="none">
      <Path
        d="M 75 11 L 12 69 L 12 139 L 54 139 L 54 103 A 21 21 0 0 1 96 103 L 96 139 L 138 139 L 138 69 Z"
        fill={selected ? color : 'none'}
        stroke={color}
        strokeWidth={12.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

