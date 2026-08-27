import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const ReplyIcon = ({ color = '#858585', size = 24 }: { color?: string; size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L4 11L9 16M4 11H15C17.2091 11 19 12.7909 19 15V18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
