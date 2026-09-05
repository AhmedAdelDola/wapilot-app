import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const CompanyIcon = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M6.50153 4.88815L9.50153 3.67269C11.9917 2.66381 13.2368 2.15936 14.1184 2.75565C15 3.35194 15 4.6985 15 7.39161V21.5H4V8.60707C4 7.29651 4 6.64122 4.34192 6.13291C4.68384 5.62459 5.28973 5.37911 6.50153 4.88815Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M15 8.5H16C17.8856 8.5 18.8284 8.5 19.4142 9.08579C20 9.67157 20 10.6144 20 12.5V21.5H15" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M2 21.5H22" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M8 8.5H11" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M8 12.5H11" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M8 16.5H11" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
};