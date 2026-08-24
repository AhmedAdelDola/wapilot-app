import React from 'react';

import { tailwind } from '@/theme';
import { NativeView } from '@/components-next/native-components';
import { Icon } from '@/components-next/common/icon';
import { getChannelIcon } from '@/utils';
import { Inbox } from '@/types/Inbox';
import { ConversationAdditionalAttributes } from '@/types/Conversation';
import { Channel } from '@/types';

type ChannelIndicatorProps = {
  inbox?: Inbox | null;
  additionalAttributes?: ConversationAdditionalAttributes;
  channelType?: Channel | string;
  medium?: string;
  provider?: string;
};

export const ChannelIndicator = (props: ChannelIndicatorProps) => {
  const { channelType: inboxChannelType = '', medium: inboxMedium = '' } = props.inbox || {};
  const channelType = inboxChannelType || props.channelType || '';
  const medium = [inboxMedium, props.medium, props.provider, props.inbox?.provider]
    .filter(Boolean)
    .join(' ');
  const { type = '' } = props.additionalAttributes || {};

  return (
    <NativeView style={tailwind.style('pl-1 h-4 w-4  justify-center items-center')}>
      <Icon icon={getChannelIcon(channelType as Channel, medium, type)} size={16} />
    </NativeView>
  );
};
