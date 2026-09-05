import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const PendingIcon = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
      <Path d="M12 21C16.6944 21 20.5 17.1944 20.5 12.5C20.5 7.80558 16.6944 4 12 4C7.30558 4 3.5 7.80558 3.5 12.5C3.5 17.1944 7.30558 21 12 21Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M5.88 18.7031L3.5 21.0031" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M18.1406 18.668L20.5006 20.998" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M5 3L2 6" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M22 6L19 3" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M15.5059 12.4941H8.50586" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
};

export const PendingFilledIcon = ({ color = '#FA8900' }: { color?: string }): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
      <Path d="M12 21C16.6944 21 20.5 17.1944 20.5 12.5C20.5 7.80558 16.6944 4 12 4C7.30558 4 3.5 7.80558 3.5 12.5C3.5 17.1944 7.30558 21 12 21Z" fill={color} />
      <Path d="M15.5059 12.4941H8.50586" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};