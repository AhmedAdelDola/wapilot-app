import React from 'react';
import { Image } from 'react-native';

import {
  ChatwootIcon,
  WebsiteFilledIcon,
  MailFilledIcon,
  TelegramFilledIcon,
  XFilledIcon,
  InstagramFilledIcon,
  SMSFilledIcon,
} from '@/svg-icons';

import { Channel, InboxTypes } from '@/types';
import { LineFilledIcon } from '@/svg-icons/channels/Line';

const WhatsAppChannelIcon = () => (
  <Image
    source={require('../../assets/channels/whatsapp.png')}
    style={{ width: '100%', height: '100%' }}
    resizeMode="contain"
  />
);

const MessengerChannelIcon = () => (
  <Image
    source={require('../../assets/channels/messenger.png')}
    style={{ width: '100%', height: '100%' }}
    resizeMode="contain"
  />
);

const normalizedChannelType = (channelType: Channel | string) =>
  String(channelType || '').trim().toLowerCase();

const isTwilioChannel = (channelType: Channel | string) => {
  const type = normalizedChannelType(channelType);
  return type === InboxTypes.TWILIO.toLowerCase() || type === 'twilio' || type === 'twilio_sms';
};

const isFacebookChannel = (channelType: Channel | string) => {
  const type = normalizedChannelType(channelType);
  return type === InboxTypes.FB.toLowerCase() || type === 'facebook' || type === 'messenger';
};

const isATwilioSMSChannel = (channelType: Channel | string, medium: string) => {
  return isTwilioChannel(channelType) && String(medium).toLowerCase() === 'sms';
};

const isAWhatsAppChannel = (channelType: Channel | string) => {
  const type = normalizedChannelType(channelType);
  return type === InboxTypes.WHATSAPP.toLowerCase() || type === 'whatsapp' || type === 'whats_app';
};

const isWhatsAppMediumOrProvider = (value: string) => {
  const normalizedValue = String(value || '').trim().toLowerCase();
  return normalizedValue === 'whatsapp' || normalizedValue === 'whats_app' || normalizedValue.includes('whatsapp');
};

export const getChannelIcon = (
  channelType: Channel | string,
  medium: string,
  additionalType: string,
) => {
  if (isAWhatsAppChannel(channelType) || isWhatsAppMediumOrProvider(medium)) {
    return <WhatsAppChannelIcon />;
  }

  if (isFacebookChannel(channelType)) {
    if (additionalType === 'instagram_direct_message') {
      return <InstagramFilledIcon />;
    }
    return <MessengerChannelIcon />;
  }

  if (isTwilioChannel(channelType)) {
    if (isATwilioSMSChannel(channelType, medium)) {
      return <SMSFilledIcon />;
    }
    return <WhatsAppChannelIcon />;
  }

  if (channelType === InboxTypes.WEB) {
    return <WebsiteFilledIcon />;
  }

  if (channelType === InboxTypes.EMAIL) {
    return <MailFilledIcon />;
  }

  if (channelType === InboxTypes.TELEGRAM) {
    return <TelegramFilledIcon />;
  }

  if (channelType === InboxTypes.LINE) {
    return <LineFilledIcon />;
  }

  if (channelType === InboxTypes.SMS) {
    return <SMSFilledIcon />;
  }

  if (channelType === InboxTypes.TWITTER) {
    return <XFilledIcon />;
  }

  return <ChatwootIcon />;
};
