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

    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {}
      sound = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: path },
      { shouldPlay: true, progressUpdateIntervalMillis: 100 },
      (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (playBackListener) {
          playBackListener({
            currentPosition: status.positionMillis,
            duration: status.durationMillis ?? 0,
          });
        }
        if (status.didJustFinish) {
          this.stopPlayer();
        }
      }
    );

    sound = newSound;
    return path;
  };

  stopPlayer = async (): Promise<string> => {
    if (!sound) return '';

    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}

    sound = null;
    playBackListener = null;

    return '';
  };

  pausePlayer = async (): Promise<string> => {
    if (!sound) return '';
    await sound.pauseAsync();
    return '';
  };

  resumePlayer = async (): Promise<string> => {
    if (!sound) return '';
    await sound.playAsync();
    return '';
  };

  seekToPlayer = async (position: number): Promise<void> => {
    if (!sound) return;
    await sound.setPositionAsync(position);
  };

  setVolume = async (volume: number): Promise<void> => {
    if (!sound) return;
    await sound.setVolumeAsync(volume);
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
