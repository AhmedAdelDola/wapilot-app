import React from 'react';
import Svg, { Path, Polyline } from 'react-native-svg';

type InboxEmptyIconProps = {
  size?: number;
  color?: string;
};

export const InboxEmptyIcon = ({ size = 64, color = '#626F7F' }: InboxEmptyIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="22 12 16 12 14 15 10 15 8 12 2 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
