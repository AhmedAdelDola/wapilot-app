import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tailwind } from '@/theme';

type GetSupportSheetProps = {
  onClose: () => void;
};

export const GetSupportSheet = ({ onClose }: GetSupportSheetProps) => {
  return (
    <View style={tailwind.style('bg-white rounded-t-3xl')}>
      <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
        <Pressable onPress={onClose} hitSlop={16}>
          <Text style={tailwind.style('text-xl text-gray-400')}>✕</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Get support
        </Text>
        <View style={tailwind.style('w-6')} />
      </View>

      <View style={tailwind.style('px-4 py-2')}>
        <Pressable
          style={tailwind.style('flex-row items-center py-4 border-b border-gray-100')}>
          <View style={tailwind.style('w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3')}>
            <Text style={tailwind.style('text-xl')}>💬</Text>
          </View>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
            Contact us via WhatsApp
          </Text>
        </Pressable>

        <Pressable
          style={tailwind.style('flex-row items-center py-4')}>
          <View style={tailwind.style('w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3')}>
            <Text style={tailwind.style('text-xl')}>📋</Text>
          </View>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
            Submit an issue
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
