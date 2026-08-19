import { Alert } from 'react-native';

export const showToast = ({ message }: { message: string }) => {
  Alert.alert('Message Pro', message);
};
