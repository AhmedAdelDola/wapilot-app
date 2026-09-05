import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const FileErrorIcon = ({ stroke = '#FF382E', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
      <Path d="M14.5 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7.5L14.5 2Z" stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      <Path d="M14 2V7H20" stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      <Path d="M12 11V16" stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
      <Path d="M9.5 13.5L12 11L14.5 13.5" stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
    </Svg>
  );
};
