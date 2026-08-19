import * as DocumentPicker from 'expo-document-picker';

export type DocumentPickerResponse = {
  uri: string;
  name?: string;
  size?: number;
  type?: string;
  fileCopyUri?: string | null;
  copyError?: string | null;
};

const mapResult = (result: DocumentPicker.DocumentPickerResult): DocumentPickerResponse[] => {
  if (result.canceled) {
    return [];
  }
  return result.assets.map(asset => ({
    uri: asset.uri,
    name: asset.name,
    size: asset.size ?? undefined,
    type: asset.mimeType ?? undefined,
    fileCopyUri: asset.uri,
    copyError: null,
  }));
};

const normalizeType = (type?: string | string[]): string | string[] => {
  if (!type) return '*/*';
  return type;
};

export const pick = async (options?: { type?: string | string[]; presentationStyle?: string }): Promise<DocumentPickerResponse[]> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: normalizeType(options?.type) as any,
    multiple: false,
  });
  return mapResult(result);
};

export const pickMultiple = async (options?: { type?: string | string[]; presentationStyle?: string }): Promise<DocumentPickerResponse[]> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: normalizeType(options?.type) as any,
    multiple: true,
  });
  return mapResult(result);
};

export const pickDirectory = async (): Promise<DocumentPickerResponse | null> => {
  return null;
};

export const types = {
  allFiles: '*/*',
  images: 'image/*',
  pdf: 'application/pdf',
  plainText: 'text/plain',
  audio: 'audio/*',
  zip: 'application/zip',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const errorCodes = {
  OPERATION_CANCELED: 'OPERATION_CANCELED',
  IN_PROGRESS: 'IN_PROGRESS',
  UNKNOWN: 'UNKNOWN',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
};

export const isErrorWithCode = (error: any): error is { code: string } => {
  return error?.code !== undefined;
};

export default { pick, pickMultiple, pickDirectory, types, errorCodes, isErrorWithCode };
