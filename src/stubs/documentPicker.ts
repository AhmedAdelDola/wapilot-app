export const pick = async () => [];
export const pickDirectory = async () => null;
export const types = {
  allFiles: '*/*',
  images: 'image/*',
  pdf: 'application/pdf',
  plainText: 'text/plain',
};
export const isErrorWithCode = (error: any) => !!error?.code;
export default { pick, pickDirectory, types, isErrorWithCode };
