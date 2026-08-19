import * as ImagePicker from 'expo-image-picker';

export type Asset = {
  base64?: string | null;
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
  fileName?: string | null;
  duration?: number;
  bitrate?: number;
  timestamp?: string;
  id?: string;
};

type ImagePickerResponse = {
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Asset[];
};

const mapMediaType = (mediaType?: string): ImagePicker.MediaTypeOptions => {
  if (mediaType === 'video') return ImagePicker.MediaTypeOptions.Videos;
  if (mediaType === 'photo') return ImagePicker.MediaTypeOptions.Images;
  return ImagePicker.MediaTypeOptions.All;
};

const mapResult = (result: ImagePicker.ImagePickerResult): ImagePickerResponse => {
  if (result.canceled) {
    return { didCancel: true, assets: [] };
  }
  return {
    didCancel: false,
    assets: result.assets.map(asset => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
      type: asset.type ?? undefined,
      fileName: asset.fileName ?? undefined,
      duration: asset.duration ?? undefined,
      base64: asset.base64 ?? undefined,
    })),
  };
};

export const launchCamera = async (options?: any): Promise<ImagePickerResponse> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return {
      didCancel: true,
      errorCode: 'camera_unavailable',
      errorMessage: 'Camera permission denied',
      assets: [],
    };
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: mapMediaType(options?.mediaType),
    quality: options?.quality ?? 1,
    allowsMultipleSelection: false,
    base64: options?.includeBase64,
  });
  return mapResult(result);
};

export const launchImageLibrary = async (options?: any): Promise<ImagePickerResponse> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mapMediaType(options?.mediaType),
    quality: options?.quality ?? 1,
    allowsMultipleSelection: (options?.selectionLimit ?? 1) > 1,
    selectionLimit: options?.selectionLimit ?? 1,
    base64: options?.includeBase64,
  });
  return mapResult(result);
};

export default { launchCamera, launchImageLibrary };
