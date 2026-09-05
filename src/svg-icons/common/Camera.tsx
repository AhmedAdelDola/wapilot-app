import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const CameraIcon = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    </Svg>
  );
};