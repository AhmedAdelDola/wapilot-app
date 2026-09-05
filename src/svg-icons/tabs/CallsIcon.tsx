import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const CallsIconOutline = ({ stroke = '#858585', color, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; width?: number | string; height?: number | string; [key: string]: any }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z"
        fill="none"
        stroke={color || stroke}
        strokeWidth="1.8"
      />
    </Svg>
  );
};

export const CallsIconFilled = () => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </Svg>
  );
};
