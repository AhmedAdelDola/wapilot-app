import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const EyeSlash = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12 13.5V16.5" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M16 13L17 15.5" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M19.5 11L21.5 13" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M2.5 13L4.5 11" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M8 13L7 15.5" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M2 7.5C2 7.5 5 13.5 12 13.5C19 13.5 22 7.5 22 7.5" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
};