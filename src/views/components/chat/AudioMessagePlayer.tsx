import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { PlayBackType } from 'react-native-audio-recorder-player';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectCurrentPlayingAudioSrc,
  setCurrentPlayingAudioSrc,
} from '@/viewmodels/store/conversation/audioPlayerSlice';
import {
  AudioStatus,
  pausePlayer,
  resumePlayer,
  seekTo,
  startPlayer,
  stopPlayer,
} from '@/views/screens/chat-screen/components/audio-recorder';
import { convertOggToWav } from '@/utils/audioConverter';

const PlayIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={12} height={14} viewBox="0 0 10 13" fill="none">
    <Path d="M0 13V0L10 6.80952L0 13Z" fill={color} />
  </Svg>
);

const PauseIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={12} height={14} viewBox="0 0 10 12" fill="none">
    <Rect width="3" height="12" fill={color} />
    <Rect x="7" width="3" height="12" fill={color} />
  </Svg>
);

const WAVEFORM_BARS = [
  6, 10, 14, 9, 16, 12, 7, 18, 13, 8, 15, 11, 6, 17, 10, 14, 9, 16, 12, 7,
  18, 13, 8, 15, 11, 6, 17, 10, 14, 9, 16, 12, 7, 18, 13, 8, 15, 11, 6,
];

const formatAudioTime = (ms: number): string => {
  const seconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export type AudioMessagePlayerProps = {
  audioSrc: string;
  isOutgoing?: boolean;
  isUser?: boolean;
  isDark?: boolean;
  senderThumbnail?: string;
  variant?: string;
};

export const AudioMessagePlayer = ({
  audioSrc,
  isOutgoing = false,
  isUser = false,
  isDark = false,
  senderThumbnail,
}: AudioMessagePlayerProps) => {
  const isSender = isOutgoing || isUser;
  const dispatch = useAppDispatch();
  const currentPlayingAudioSrc = useAppSelector(selectCurrentPlayingAudioSrc);

  const [convertedAudioSrc, setConvertedAudioSrc] = useState(audioSrc);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformWidth, setWaveformWidth] = useState(0);

  const isCurrentPlaying = currentPlayingAudioSrc === convertedAudioSrc && isPlaying;

  useEffect(() => {
    let isMounted = true;
    const prepare = async () => {
      if (Platform.OS === 'ios' && audioSrc.toLowerCase().endsWith('.ogg')) {
        try {
          const converted = await convertOggToWav(audioSrc);
          if (isMounted && !(converted instanceof Error)) {
            setConvertedAudioSrc(converted);
          }
        } catch {
          // fallback to original source
        }
      }
    };
    prepare();
    return () => {
      isMounted = false;
    };
  }, [audioSrc]);

  useEffect(() => {
    if (currentPlayingAudioSrc !== convertedAudioSrc) {
      setIsPlaying(false);
      setCurrentPosition(0);
    }
  }, [currentPlayingAudioSrc, convertedAudioSrc]);

  const handlePlaybackStatus = useCallback(
    (event: { status?: AudioStatus; data?: PlayBackType }) => {
      if (event.status === AudioStatus.STOPPED) {
        setIsPlaying(false);
        setCurrentPosition(0);
        dispatch(setCurrentPlayingAudioSrc(''));
        return;
      }
      const data = event.data;
      if (!data) return;

      setDuration(data.duration);
      setCurrentPosition(data.currentPosition);

      if (data.duration > 0 && data.currentPosition >= data.duration) {
        setIsPlaying(false);
        setCurrentPosition(0);
        dispatch(setCurrentPlayingAudioSrc(''));
      }
    },
    [dispatch],
  );

  const togglePlayback = useCallback(async () => {
    try {
      if (isCurrentPlaying) {
        await pausePlayer();
        setIsPlaying(false);
        return;
      }

      if (currentPlayingAudioSrc === convertedAudioSrc && duration > 0 && currentPosition > 0) {
        await resumePlayer();
        setIsPlaying(true);
        return;
      }

      dispatch(setCurrentPlayingAudioSrc(convertedAudioSrc));
      await startPlayer(convertedAudioSrc, handlePlaybackStatus);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [
    isCurrentPlaying,
    currentPlayingAudioSrc,
    convertedAudioSrc,
    duration,
    currentPosition,
    handlePlaybackStatus,
    dispatch,
  ]);

  const handleSeek = useCallback(
    async (ratio: number) => {
      if (duration <= 0) return;
      const targetPos = Math.floor(ratio * duration);
      setCurrentPosition(targetPos);
      try {
        await seekTo(targetPos);
        if (!isPlaying) {
          await resumePlayer();
          setIsPlaying(true);
        }
      } catch {
        // seek failed silently
      }
    },
    [duration, isPlaying],
  );

  const progressRatio = useMemo(() => {
    if (duration <= 0) return 0;
    return Math.min(1, Math.max(0, currentPosition / duration));
  }, [currentPosition, duration]);

  const buttonBg = isSender ? 'rgba(255,255,255,0.25)' : '#725AFF';
  const iconColor = '#ffffff';
  const activeWaveColor = isSender ? '#ffffff' : '#725AFF';
  const inactiveWaveColor = isSender
    ? 'rgba(255,255,255,0.35)'
    : isDark
      ? '#3A3F49'
      : '#D1D5DB';
  const timeColor = isSender
    ? 'rgba(255,255,255,0.85)'
    : isDark
      ? '#94a3b8'
      : '#626F7F';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
        paddingHorizontal: 6,
        minWidth: 220,
        maxWidth: 300,
      }}>
      {/* Play / Pause button */}
      <Pressable
        onPress={togglePlayback}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isCurrentPlaying ? 'Pause audio' : 'Play audio'}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: buttonBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {isCurrentPlaying ? (
          <PauseIcon color={iconColor} />
        ) : (
          <View style={{ marginLeft: 2 }}>
            <PlayIcon color={iconColor} />
          </View>
        )}
      </Pressable>

      {/* Waveform & Duration */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Pressable
          onLayout={e => setWaveformWidth(e.nativeEvent.layout.width)}
          onPress={e => {
            if (waveformWidth > 0) {
              const clickX = e.nativeEvent.locationX;
              handleSeek(clickX / waveformWidth);
            }
          }}
          style={{
            height: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            overflow: 'hidden',
          }}>
          {WAVEFORM_BARS.map((barHeight, idx) => {
            const barRatio = idx / WAVEFORM_BARS.length;
            const isPlayed = barRatio <= progressRatio;
            return (
              <View
                key={idx}
                style={{
                  width: 3,
                  height: barHeight,
                  borderRadius: 1.5,
                  backgroundColor: isPlayed ? activeWaveColor : inactiveWaveColor,
                }}
              />
            );
          })}
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 2,
          }}>
          <Text style={{ fontSize: 11, color: timeColor }}>
            {formatAudioTime(currentPosition)}
          </Text>
          <Text style={{ fontSize: 11, color: timeColor }}>
            {duration > 0 ? formatAudioTime(duration) : '0:00'}
          </Text>
        </View>
      </View>

      {/* Optional sender thumbnail avatar */}
      {senderThumbnail ? (
        <Image
          source={{ uri: senderThumbnail }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
      ) : null}
    </View>
  );
};
