import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

export type PlayBackType = {
  currentPosition: number;
  duration: number;
};

export type RecordBackType = {
  currentPosition: number;
  duration: number;
  currentMetering?: number;
};

export enum AVEncodingOption {
  aac = 'aac',
  alac = 'alac',
  flac = 'flac',
  opus = 'opus',
}

let recording: Audio.Recording | null = null;
let sound: Audio.Sound | null = null;
let playbackRequestId = 0;
let playbackQueue: Promise<void> = Promise.resolve();

let recordBackListener: ((e: RecordBackType) => void) | null = null;
let playBackListener: ((e: PlayBackType) => void) | null = null;

export default class AudioRecorderPlayer {
  startRecorder = async (_path?: string, _options?: any): Promise<string> => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recordingOptions: Audio.RecordingOptions = {
      isMeteringEnabled: true,
      android: {
        extension: '.aac',
        outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.aac',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MAX,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/aac',
        bitsPerSecond: 128000,
      },
    };

    const { recording: newRecording } = await Audio.Recording.createAsync(
      recordingOptions,
      (status) => {
        if (status.isRecording && recordBackListener) {
          const durationMs = (status as any).durationMillis ?? 0;
          const metering = (status as any).metering ?? 0;
          recordBackListener({
            currentPosition: durationMs,
            duration: durationMs,
            currentMetering: metering,
          });
        }
      },
      100
    );

    recording = newRecording;

    const uri = recording.getURI() ?? `recording.${Platform.OS === 'ios' ? 'm4a' : 'aac'}`;
    return uri;
  };

  stopRecorder = async (): Promise<string> => {
    if (!recording) return '';

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // Recording may already be stopped
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI() ?? '';
    recording = null;
    recordBackListener = null;

    return uri;
  };

  pauseRecorder = async (): Promise<string> => {
    if (!recording) return '';
    await recording.pauseAsync();
    return '';
  };

  resumeRecorder = async (): Promise<string> => {
    if (!recording) return '';
    await recording.startAsync();
    return '';
  };

  startPlayer = async (path?: string, _onPlayBackStatus?: (e: PlayBackType) => void): Promise<string> => {
    if (!path) return '';
    const play = async (): Promise<string> => {
      const requestId = ++playbackRequestId;
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch {}
        sound = null;
      }

      let newSound: Audio.Sound;
      const result = await Audio.Sound.createAsync(
        { uri: path },
        // `shouldPlay` is supported by the project's expo-av runtime. The
        // queue guarantees the prior sound has fully stopped first.
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (status: AVPlaybackStatus) => {
          if (requestId !== playbackRequestId || sound !== newSound) return;
          if (!status.isLoaded) return;
          playBackListener?.({
            currentPosition: status.positionMillis,
            duration: status.durationMillis ?? 0,
          });
          if (status.didJustFinish) this.stopPlayer();
        },
      );
      newSound = result.sound;
      sound = newSound;
      return path;
    };

    const result = playbackQueue.then(play, play);
    playbackQueue = result.then(() => undefined, () => undefined);
    return result;
  };

  stopPlayer = async (): Promise<string> => {
    const stop = async (): Promise<string> => {
      playbackRequestId += 1;
      if (!sound) return '';

      try {
        await sound.unloadAsync();
      } catch {}

      sound = null;
      playBackListener = null;
      return '';
    };
    const result = playbackQueue.then(stop, stop);
    playbackQueue = result.then(() => undefined, () => undefined);
    return result;
  };

  pausePlayer = async (): Promise<string> => {
    if (!sound) return '';
    await sound.setStatusAsync({ shouldPlay: false });
    return '';
  };

  resumePlayer = async (): Promise<string> => {
    if (!sound) return '';
    await sound.setStatusAsync({ shouldPlay: true });
    return '';
  };

  seekToPlayer = async (position: number): Promise<void> => {
    if (!sound) return;
    await sound.setStatusAsync({ positionMillis: position });
  };

  setVolume = async (volume: number): Promise<void> => {
    if (!sound) return;
    await sound.setStatusAsync({ volume });
  };

  addRecordBackListener = (cb: (e: RecordBackType) => void): (() => void) => {
    recordBackListener = cb;
    return () => { recordBackListener = null; };
  };

  removeRecordBackListener = (): void => {
    recordBackListener = null;
  };

  addPlayBackListener = (cb: (e: PlayBackType) => void): (() => void) => {
    playBackListener = cb;
    return () => { playBackListener = null; };
  };

  removePlayBackListener = (): void => {
    playBackListener = null;
  };
}
