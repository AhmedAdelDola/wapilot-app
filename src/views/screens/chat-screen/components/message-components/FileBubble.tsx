import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import Animated from 'react-native-reanimated';

import { FileIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { Icon } from '@/views/components/common';
import { MESSAGE_VARIANTS } from '@/constants';

type FilePreviewProps = Pick<FileBubbleProps, 'fileSrc'> & {
  isComposed?: boolean;
  variant: string;
};

export const FileBubblePreview = (props: FilePreviewProps) => {
  const { fileSrc, isComposed = false, variant } = props;

  const fileName = decodeURIComponent(fileSrc.split('/').pop() || 'file');

  const previewFile = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing is not available on this device');
        return;
      }

      // If it's already a local file, open directly
      if (fileSrc.startsWith('file://')) {
        await Sharing.shareAsync(fileSrc);
        return;
      }

      // Download remote file to cache, then open
      if (!cacheDirectory) {
        Alert.alert('Error', 'Cache directory not available');
        return;
      }
      const localUri = `${cacheDirectory}${fileName}`;
      const { uri } = await downloadAsync(fileSrc, localUri);
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      Alert.alert('Error opening file', e?.message || String(e));
    }
  };

  return (
    <React.Fragment>
      <Animated.View style={tailwind.style('pr-1.5')}>
        <Icon
          size={24}
          icon={
            <FileIcon
              fill={
                variant === MESSAGE_VARIANTS.USER
                  ? tailwind.color('bg-white')
                  : tailwind.color('text-blue-800')
              }
            />
          }
        />
      </Animated.View>
      <Pressable hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={previewFile}>
        <Animated.View style={tailwind.style('relative')}>
          <Animated.Text
            numberOfLines={1}
            ellipsizeMode={'middle'}
            style={[
              tailwind.style(
                isComposed ? 'max-w-[248px]' : 'max-w-[170px]',
                variant === MESSAGE_VARIANTS.USER || variant === MESSAGE_VARIANTS.AGENT
                  ? 'text-base tracking-[0.32px] leading-[22px] font-inter-normal-20'
                  : '',
                variant === MESSAGE_VARIANTS.USER
                  ? 'text-white'
                  : variant === MESSAGE_VARIANTS.AGENT
                    ? 'text-gray-700'
                    : '',
              ),
              style.androidTextOnlyStyle,
            ]}>
            {fileName}
          </Animated.Text>
          <Animated.View
            style={[
              tailwind.style(
                'border-b-[1px] absolute left-0 right-0 ios:bottom-[1px] android:bottom-0',
                variant === MESSAGE_VARIANTS.USER ? 'border-white' : '',
                variant === MESSAGE_VARIANTS.AGENT ? 'border-blue-800' : '',
              ),
            ]}
          />
        </Animated.View>
      </Pressable>
    </React.Fragment>
  );
};

type FileBubbleProps = {
  fileSrc: string;
  variant: string;
};

export const FileBubble = (props: FileBubbleProps) => {
  const { fileSrc, variant } = props;

  return <FileBubblePreview fileSrc={fileSrc} variant={variant} />;
};

const style = StyleSheet.create({
  androidTextOnlyStyle: { includeFontPadding: false },
});
