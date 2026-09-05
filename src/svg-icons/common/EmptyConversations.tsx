import React from 'react';
import Svg, { Path } from 'react-native-svg';

type EmptyConversationsIconProps = {
  size?: number;
  color?: string;
};

export const EmptyConversationsIcon = ({
  size = 64,
  color = '#80838D',
}: EmptyConversationsIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8C18.745 8 8 17.164 8 28.5C8 34.836 11.5 40.5 16.5 44.5V56L27.5 48.5C28.98 48.8 30.46 49 32 49C45.255 49 56 39.836 56 28.5C56 17.164 45.255 8 32 8Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 28H44"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M20 36H36"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};
