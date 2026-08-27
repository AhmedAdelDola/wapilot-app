/**
 * This code was taken from https://github.com/GetStream/react-native-samples/blob/main/projects/WhatsAppClone/src/utils/AudioManager.ts
 * All credits goes the Awesome Developer [@vanGalilea](https://github.com/vanGalilea/vanGalilea)
 */

import AudioRecorderPlayer, { PlayBackType } from 'react-native-audio-recorder-player';

export type Callback = (args: { status: AudioStatus; data?: PlayBackType }) => void;

type Path = string | undefined;

export enum AudioStatus {
  PLAYING = 'PLAYING',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  STOPPED = 'STOPPED',
}

let audioRecorderPlayer: AudioRecorderPlayer | undefined;
let currentPath: Path;
let currentCallback: Callback = () => {};
let currentPosition = 0;
let playbackRequestId = 0;

const stopCurrentPlayer = async () => {
  await audioRecorderPlayer?.stopPlayer();
  audioRecorderPlayer?.removePlayBackListener();
  currentPosition = 0;
  currentCallback({ status: AudioStatus.STOPPED });
  audioRecorderPlayer = undefined;
};

export const startPlayer = async (path: string, callback: Callback) => {
  // Every tap gets a monotonically increasing id. If a newer tap happens
  // while an earlier player is being stopped/started, the earlier request
  // becomes stale and is not allowed to start audio afterwards.
  const requestId = ++playbackRequestId;

  if (audioRecorderPlayer !== undefined) {
    // Stop any currently playing track before starting a new one so
    // multiple voice notes don't play at the same time.
    await stopCurrentPlayer();
  }

  if (requestId !== playbackRequestId) return;

  currentPath = path;
  currentCallback = callback;
  currentPosition = 0;

  if (audioRecorderPlayer === undefined) {
    audioRecorderPlayer = new AudioRecorderPlayer();
  }
  const player = audioRecorderPlayer;

  const shouldBeResumed = currentPath === path && currentPosition > 0;

  if (shouldBeResumed) {
    await player.resumePlayer();
    if (requestId !== playbackRequestId) return;
    currentCallback({
      status: AudioStatus.RESUMED,
    });
    return;
  }

  await player.startPlayer(currentPath);
  if (requestId !== playbackRequestId) {
    if (audioRecorderPlayer === player) await stopCurrentPlayer();
    return;
  }
  currentCallback({
    status: AudioStatus.STARTED,
  });
  player.addPlayBackListener(async e => {
    if (e.currentPosition === e.duration) {
      currentCallback({
        status: AudioStatus.STOPPED,
        data: e,
      });
      await stopPlayer();
    } else {
      currentPosition = e.currentPosition;
      currentCallback({
        status: AudioStatus.PLAYING,
        data: e,
      });
    }
    return;
  });
};

export const pausePlayer = async () => {
  await audioRecorderPlayer?.pausePlayer();
  currentCallback({ status: AudioStatus.PAUSED });
};

export const resumePlayer = async () => {
  await audioRecorderPlayer?.resumePlayer();
  currentCallback({ status: AudioStatus.RESUMED });
};

export const seekTo = async (position: number) => {
  await audioRecorderPlayer?.seekToPlayer(position);
  currentCallback({ status: AudioStatus.PLAYING });
};

export const stopPlayer = async () => {
  // Invalidate any pending start operation before stopping the native player.
  playbackRequestId += 1;
  await stopCurrentPlayer();
};
