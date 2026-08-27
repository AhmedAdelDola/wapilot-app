import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { Avatar } from '@/views/components/common/avatar';

type UserHeaderProps = {
  name: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'away' | 'offline';
};

export const UserHeader = ({ name, email, avatarUrl, status }: UserHeaderProps) => {
  return (
    <Animated.View
      style={tailwind.style('flex-row items-center px-5 py-4')}>
      <View style={tailwind.style('relative')}>
        <Avatar
          name={name}
          src={avatarUrl ? { uri: avatarUrl } : undefined}
          size="4xl"
          squared={false}
        />
        {status && (
          <View
            style={tailwind.style(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
              status === 'online' && 'bg-green-500',
              status === 'away' && 'bg-yellow-500',
              status === 'offline' && 'bg-gray-400',
            )}
          />
        )}
      </View>
      <View style={tailwind.style('ml-4 flex-1')}>
        <Text
          style={tailwind.style(
            'text-[18px] font-inter-580-24 text-gray-950',
          )}>
          {name}
        </Text>
        <Text
          style={tailwind.style(
            'text-[14px] font-inter-normal-20 text-gray-600 mt-0.5',
          )}>
          {email}
        </Text>
      </View>
    </Animated.View>
  );
};
