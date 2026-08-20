import React from 'react';
import Svg, { Path } from 'react-native-svg';

type ArchiveBoxIconProps = {
  size?: number;
  color?: string;
};

export const ArchiveBoxIcon = ({ size = 64, color = '#6B7280' }: ArchiveBoxIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M12 16H52V52C52 54.2 50.2 56 48 56H16C13.8 56 12 54.2 12 52V16Z"
        fill={color}
        fillOpacity={0.2}
      />
      <Path
        d="M12 16H52V52C52 54.2 50.2 56 48 56H16C13.8 56 12 54.2 12 52V16Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 8H40V16H24V8Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M32 28V44"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 36L32 44L40 36"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
