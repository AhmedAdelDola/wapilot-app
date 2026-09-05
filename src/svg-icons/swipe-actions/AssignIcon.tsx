import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const AssignIcon = ({ stroke = '#858585', color, strokeWidth = 1.5, fill = 'none', strokeOpacity, width = 24, height = 24, ...rest }: { stroke?: string; color?: string; strokeWidth?: number; fill?: string; strokeOpacity?: number; [key: string]: any }): JSX.Element => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3H3C2.44772 3 2 3.44772 2 4V18L3.5 21L5 18V4C5 3.44772 4.55228 3 4 3Z" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M21 12.0013V8.00072C21 5.64336 21 4.46468 20.2678 3.73234C19.5355 3 18.357 3 16 3H13C10.643 3 9.46447 3 8.73223 3.73234C8 4.46468 8 5.64336 8 8.00072V16.0019C8 18.3592 8 19.5379 8.73223 20.2703C9.35264 20.8908 10.2934 20.9855 12 21" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M12 7H17" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M12 11H17" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M14 19C14 19 15.5 19.5 16.5 21C16.5 21 18 17 22 15" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M2 7H5" stroke={color || stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
};