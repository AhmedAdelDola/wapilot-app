import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export default {
  open: async (filePath: string): Promise<void> => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Cannot open file', 'Sharing is not available on this device');
        return;
      }

      // If it's already a local file, open directly
      if (filePath.startsWith('file://')) {
        await Sharing.shareAsync(filePath);
        return;
      }

      // Download remote file to cache, then open
      if (!cacheDirectory) {
        Alert.alert('Error', 'Cache directory not available');
        return;
      }
      const fileName = decodeURIComponent(filePath.split('/').pop() || 'file');
      const localUri = `${cacheDirectory}${fileName}`;
      const { uri } = await downloadAsync(filePath, localUri);
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      Alert.alert('Error opening file', e?.message || String(e));
    }
  },
};
