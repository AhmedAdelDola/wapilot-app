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

export default class AudioRecorderPlayer {
  startRecorder = async (_path?: string, _options?: any): Promise<string> => '';
  stopRecorder = async (): Promise<string> => '';
  resumeRecorder = async (): Promise<string> => '';
  pauseRecorder = async (): Promise<string> => '';
  startPlayer = async (_path?: string): Promise<string> => '';
  stopPlayer = async (): Promise<string> => '';
  pausePlayer = async (): Promise<string> => '';
  resumePlayer = async (): Promise<string> => '';
  seekToPlayer = async (_position: number): Promise<void> => {};
  setVolume = async (_volume: number): Promise<void> => {};
  addRecordBackListener = (_cb: (e: RecordBackType) => void): (() => void) => () => {};
  removeRecordBackListener = (): void => {};
  addPlayBackListener = (_cb: (e: PlayBackType) => void): (() => void) => () => {};
  removePlayBackListener = (): void => {};
}
