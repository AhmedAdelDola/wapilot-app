import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const VoiceNote = ({ stroke = 'black', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3V21" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7V17" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 11V13" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7V17" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 11V13" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
