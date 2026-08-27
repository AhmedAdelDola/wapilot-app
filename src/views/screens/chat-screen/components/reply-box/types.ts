import { PressableProps } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

export type SendMessageButtonProps = PressableProps & {
  variant?: 'default' | 'copilot';
};

export type AddCommandButtonProps = PressableProps & {
  derivedAddMenuOptionStateValue: SharedValue<number> | SharedValue<0 | 1>;
};

export type PhotosCommandButtonProps = PressableProps & {};

export type VoiceRecordButtonProps = PressableProps & {};
