import type { TransformsStyle } from 'react-native';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

const isValidSize = (size: Size): boolean => {
  'worklet';
  return size && size.width > 0 && size.height > 0;
};

const defaultAnchorPoint = { x: 0.5, y: 0.5 };

export const withAnchorPoint = (transform: TransformsStyle, anchorPoint: Point, size: Size) => {
  'worklet';
  if (!isValidSize(size)) {
    return transform;
  }

  let injectedTransform = [
    ...((transform.transform as unknown as Array<Record<string, unknown>>) || []),
  ];

  if (anchorPoint.x !== defaultAnchorPoint.x && size.width) {
    injectedTransform = [
      { translateX: size.width * (anchorPoint.x - defaultAnchorPoint.x) },
      ...injectedTransform,
      { translateX: size.width * (defaultAnchorPoint.x - anchorPoint.x) },
    ];
  }

  if (anchorPoint.y !== defaultAnchorPoint.y && size.height) {
    injectedTransform = [
      { translateY: size.height * (anchorPoint.y - defaultAnchorPoint.y) },
      ...injectedTransform,
      { translateY: size.height * (defaultAnchorPoint.y - anchorPoint.y) },
    ];
  }

  return { transform: injectedTransform } as unknown as TransformsStyle;
};
