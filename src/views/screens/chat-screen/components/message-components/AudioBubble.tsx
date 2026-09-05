import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { PlayBackType } from 'react-native-audio-recorder-player';
import Animated, { FadeIn, FadeOut, useSharedValue } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Sentry from '@sentry/react-native';

import {
  selectCurrentPlayingAudioSrc,
  setCurrentPlayingAudioSrc,
} from '@/viewmodels/store/conversation/audioPlayerSlice';

import { tailwind } from '@/theme';
import { IconProps } from '@/models/types';
import { Icon, Slider } from '@/views/components/common';
import { Spinner } from '@/views/components/spinner';
import { AudioStatus, pausePlayer, resumePlayer, seekTo, startPlayer, stopPlayer } from '../audio-recorder';
import { MESSAGE_VARIANTS } from '@/constants';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/hooks';
// eslint-disable-next-line import/no-unresolved
import { convertOggToWav } from '@/utils/audioConverter';

// eslint-disable-next-line react/display-name
export const PlayIcon = React.memo(({ fill, fillOpacity }: IconProps) => {
  return (
    <Svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <Path d="M0 13V0L10 6.80952L0 13Z" fill={fill} fillOpacity={fillOpacity} />
    </Svg>
  );
});
// eslint-disable-next-line react/display-name
export const PauseIcon = React.memo(({ fill, fillOpacity }: IconProps) => {
  return (
    <Svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <Rect width="3" height="12" fill={fill} fillOpacity={fillOpacity} />
      <Rect x="7" width="3" height="12" fill={fill} fillOpacity={fillOpacity} />
    </Svg>
  );
});

// Static fake waveform bars (WhatsApp-style). Heights are fixed so the
// visualization looks consistent without real frequency data.
const WAVEFORM_BARS = [
  6, 10, 14, 9, 16, 12, 7, 18, 13, 8, 15, 11, 6, 17, 10, 14, 9, 16, 12, 7,
  18, 13, 8, 15, 11, 6, 17, 10, 14, 9, 16, 12, 7, 18, 13, 8, 15, 11, 6,
];

const formatTime = (ms?: number): string => {
  const seconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

type AudioBubbleProps = {
  audioSrc: string;
  variant: string;
  senderThumbnail?: string;
};

type AudioPlayerProps = Pick<AudioBubbleProps, 'audioSrc' | 'variant' | 'senderThumbnail'>;

// eslint-disable-next-line react/display-name
export const AudioBubblePlayer = React.memo((props: AudioPlayerProps) => {
  const { audioSrc, variant, senderThumbnail } = props;

  const [isSoundLoading, setIsSoundLoading] = useState(false);
  const [isAudioPlaying, setAudioPlaying] = useState(false);
  const [convertedAudioSrc, setConvertedAudioSrc] = useState(audioSrc);
  const [currentPositionText, setCurrentPositionText] = useState(0);
  const [totalDurationText, setTotalDurationText] = useState(0);

  const dispatch = useDispatch();
  const currentPlayingAudioSrc = useAppSelector(selectCurrentPlayingAudioSrc);

  const currentPosition = useSharedValue(0);
  const totalDuration = useSharedValue(0);

  const isUser = variant === MESSAGE_VARIANTS.USER || variant === MESSAGE_VARIANTS.AGENT;

  const audioPlayBackStatus = useCallback(
    (data: { status?: AudioStatus; data?: PlayBackType }) => {
      if (data.status === AudioStatus.STOPPED) {
        currentPosition.value = 0;
        totalDuration.value = 0;
        setCurrentPositionText(0);
        setTotalDurationText(0);
        setAudioPlaying(false);
        dispatch(setCurrentPlayingAudioSrc(''));
        return;
      }
      const playBackData = data.data;
      if (playBackData) {
        currentPosition.value = playBackData.currentPosition;
        totalDuration.value = playBackData.duration;
        setCurrentPositionText(playBackData.currentPosition);
        setTotalDurationText(playBackData.duration);
        if (playBackData.currentPosition === playBackData.duration) {
          currentPosition.value = 0;
          totalDuration.value = 0;
          setCurrentPositionText(0);
          setTotalDurationText(0);
          setAudioPlaying(false);
          dispatch(setCurrentPlayingAudioSrc(''));
        }
      }
    },
    [currentPosition, totalDuration, dispatch],
  );

  useEffect(() => {
    const prepareAudio = async () => {
      if (Platform.OS === 'ios' && audioSrc.toLowerCase().endsWith('.ogg')) {
        setIsSoundLoading(true);
        try {
          const convertedSrc = await convertOggToWav(audioSrc);
          setConvertedAudioSrc(convertedSrc instanceof Error ? audioSrc : convertedSrc);
        } catch (error) {
          Sentry.captureException(error);
        } finally {
          setIsSoundLoading(false);
        }
      }
    };
    prepareAudio();
  }, [audioSrc]);

  const togglePlayback = useCallback(() => {
    if (convertedAudioSrc === currentPlayingAudioSrc) {
      if (isAudioPlaying) {
        pausePlayer();
      } else {
        resumePlayer();
      }
      setAudioPlaying(!isAudioPlaying);
    } else {
      setIsSoundLoading(true);
      startPlayer(convertedAudioSrc, audioPlayBackStatus).then(() => {
        setIsSoundLoading(false);
        setAudioPlaying(true);
        dispatch(setCurrentPlayingAudioSrc(convertedAudioSrc));
      });
    }
  }, [convertedAudioSrc, currentPlayingAudioSrc, isAudioPlaying, dispatch, audioPlayBackStatus]);

  const manualSeekTo = useCallback(async (manualSeekPosition: number) => {
    seekTo(manualSeekPosition).then(() => {
      resumePlayer();
    });
  }, []);

  const pauseAudio = useCallback(async () => {
    await pausePlayer();
  }, []);

  const isCurrentAudioSrcPlaying = useMemo(
    () => currentPlayingAudioSrc === convertedAudioSrc && isAudioPlaying,
    [convertedAudioSrc, currentPlayingAudioSrc, isAudioPlaying],
  );

  useEffect(() => {
    if (currentPlayingAudioSrc !== audioSrc) {
      currentPosition.value = 0;
      totalDuration.value = 0;
      setCurrentPositionText(0);
      setTotalDurationText(0);
    }
  }, [currentPlayingAudioSrc, audioSrc, currentPosition, totalDuration]);

  useEffect(() => {
    return () => {
      stopPlayer()
        .then()
        .finally(() => {
          setAudioPlaying(false);
          dispatch(setCurrentPlayingAudioSrc(''));
        });
    };
  }, [dispatch]);

  // WhatsApp-style: play icon, fake waveform, 0:02 under it, time on the right, avatar far right.
  return (
    <View
      style={tailwind.style(
        'w-full flex flex-row items-center gap-2 py-1',
        isUser ? 'pr-1' : 'pl-1',
      )}>
      {/* Play / Pause button */}
      <Pressable disabled={isSoundLoading} hitSlop={10} onPress={togglePlayback}>
        {isSoundLoading ? (
          <Animated.View>
            <Spinner size={16} stroke={isUser ? 'white' : '#282E34'} />
          </Animated.View>
        ) : isCurrentAudioSrcPlaying ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Icon
              icon={
                <PauseIcon
                  fillOpacity={isUser ? '1' : '0.7'}
                  fill={isUser ? 'white' : '#282E34'}
                />
              }
              size={16}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Icon
              icon={
                <PlayIcon
                  fillOpacity={isUser ? '1' : '0.7'}
                  fill={isUser ? 'white' : '#282E34'}
                />
              }
              size={16}
            />
          </Animated.View>
        )}
      </Pressable>

      {/* Waveform + time row */}
      <View style={tailwind.style('flex-1 flex-col')}>
        <View style={tailwind.style('flex-row items-center')}>
          {/* Blue dot at the start of the track */}
          <View
            style={tailwind.style(
              'w-2 h-2 rounded-full mr-1.5',
              isUser ? 'bg-white' : 'bg-[#25D366]',
            )}
          />
          {/* Waveform bars with transparent slider overlay for seek */}
          <View style={tailwind.style('relative flex-1 flex-row items-center h-5')}>
            {WAVEFORM_BARS.map((h, i) => (
              <View
                key={i}
                style={{
                  width: 2,
                  height: h,
                  marginHorizontal: 1,
                  borderRadius: 1,
                  backgroundColor: isUser ? 'rgba(255,255,255,0.55)' : '#b8c0c8',
                }}
              />
            ))}
            {/* Transparent slider overlays the waveform for seek/position */}
            <View style={tailwind.style('absolute inset-0')}>
              <Slider
                trackColor="bg-transparent"
                filledTrackColor="bg-transparent"
                knobStyle="border-transparent"
                currentPosition={currentPosition}
                totalDuration={totalDuration}
                manualSeekTo={manualSeekTo}
                pauseAudio={pauseAudio}
              />
            </View>
          </View>
        </View>
        {/* 0:02 under the waveform */}
        <View style={tailwind.style('flex-row justify-between mt-0.5')}>
          <Animated.Text
            style={tailwind.style(
              'text-[11px] font-inter-420-20',
              isUser ? 'text-white/80' : 'text-gray-600',
            )}>
            {formatTime(currentPositionText)}
          </Animated.Text>
        </View>
      </View>

      {/* Time on the right */}
      <Animated.Text
        style={tailwind.style(
          'text-[11px] font-inter-420-20 self-end mb-1',
          isUser ? 'text-white/80' : 'text-gray-500',
        )}>
        {formatTime(totalDurationText)}
      </Animated.Text>

      {/* Avatar of the speaker on the far right */}
      {senderThumbnail ? (
        <Image
          source={{ uri: senderThumbnail }}
          style={tailwind.style('w-8 h-8 rounded-full self-center')}
        />
      ) : (
        <View
          style={tailwind.style(
            'w-8 h-8 rounded-full self-center items-center justify-center bg-gray-200',
          )}>
          <Icon icon={<PlayIcon fill="#80838D" fillOpacity={1} />} size={12} />
        </View>
      )}
    </View>
  );
});

// eslint-disable-next-line react/display-name
export const AudioBubble = React.memo<AudioBubbleProps>(props => {
  const { audioSrc, variant, senderThumbnail } = props;

  return (
    <Animated.View style={tailwind.style('w-full flex flex-row items-center')}>
      <AudioBubblePlayer
        audioSrc={audioSrc}
        variant={variant}
        senderThumbnail={senderThumbnail}
      />
    </Animated.View>
  );
});
