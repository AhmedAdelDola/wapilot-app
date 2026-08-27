import React, { memo } from 'react';
import { ImageURISource } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { isEqual } from 'lodash';

import { Avatar, AvatarStatusType } from '@/views/components/common';
import { AnimatedNativeView } from '@/views/components/native-components';
import { tailwind } from '@/theme';
import { AvailabilityStatus } from '@/models/types';

type ConversationAvatarProps = {
  src: ImageURISource;
  name: string;
  status: AvailabilityStatus;
};

const checkIfPropsAreSame = (prev: ConversationAvatarProps, next: ConversationAvatarProps) => {
  const arePropsEqual = isEqual(prev, next);
  return arePropsEqual;
};

export const ConversationAvatar = memo((props: ConversationAvatarProps) => {
  const { src, name, status } = props;
  return (
    <AnimatedNativeView
      style={tailwind.style('')}
      layout={LinearTransition.springify().damping(28).stiffness(200)}>
      <Avatar size="4xl" {...{ src, name, status: status as AvatarStatusType }} />
    </AnimatedNativeView>
  );
}, checkIfPropsAreSame);

ConversationAvatar.displayName = 'ConversationAvatar';
