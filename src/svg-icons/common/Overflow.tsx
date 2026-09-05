import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const Overflow = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12.25 12H12M12.5 12C12.5 12.2761 12.2761 12.5 12 12.5C11.7239 12.5 11.5 12.2761 11.5 12C11.5 11.7239 11.7239 11.5 12 11.5C12.2761 11.5 12.5 11.7239 12.5 12Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17.25 12H17M17.5 12C17.5 12.2761 17.2761 12.5 17 12.5C16.7239 12.5 16.5 12.2761 16.5 12C16.5 11.7239 16.7239 11.5 17 11.5C17.2761 11.5 17.5 11.7239 17.5 12Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.25 12H7M7.5 12C7.5 12.2761 7.27614 12.5 7 12.5C6.72386 12.5 6.5 12.2761 6.5 12C6.5 11.7239 6.72386 11.5 7 11.5C7.27614 11.5 7.5 11.7239 7.5 12Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
