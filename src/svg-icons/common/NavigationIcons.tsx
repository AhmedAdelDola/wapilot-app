import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export const HamburgerIcon = () => {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

export const UserCircleIcon = ({ color = '#858585' }: { color?: string }) => {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M5.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="18" cy="5" r="4" fill="#22c55e" />
    </Svg>
  );
};

export const ChatBubbleIcon = () => {
  return (
    <Svg width="52" height="52" viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ChevronDownIcon = () => {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const ChevronRightIcon = () => {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
