export type DocumentPickerResponse = {
  uri: string;
  name?: string;
  size?: number;
  type?: string;
  fileCopyUri?: string | null;
  copyError?: string | null;
};

export const pick = async (): Promise<DocumentPickerResponse[]> => [];
export const pickMultiple = async (): Promise<DocumentPickerResponse[]> => [];
export const pickDirectory = async (): Promise<DocumentPickerResponse | null> => null;

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

export const isErrorWithCode = (error: any): error is { code: string } => !!error?.code;

export default { pick, pickMultiple, pickDirectory, types, errorCodes, isErrorWithCode };
