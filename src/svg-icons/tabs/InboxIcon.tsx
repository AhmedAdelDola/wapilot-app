import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const InboxIconOutline = () => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M3 12h4l2 3h6l2-3h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const InboxIconFilled = () => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
      />
      <Path
        d="M3 12h4l2 3h6l2-3h4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};
