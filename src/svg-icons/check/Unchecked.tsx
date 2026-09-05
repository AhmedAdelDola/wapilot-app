import React from 'react';
import { Circle, Svg } from 'react-native-svg';

import { IconProps } from '../../types';

export const UncheckedIcon = (props: IconProps & { width?: number; height?: number }) => {
  const { stroke = '#C7C7C7', width = 20, height = 20 } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke={stroke} strokeWidth="2" />
    </Svg>
  );
};
