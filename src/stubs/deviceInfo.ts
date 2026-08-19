const DEVICE_DEFAULTS = {
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getBundleId: () => 'com.messagepro.app',
  getSystemName: () => 'Android',
  getSystemVersion: () => '14',
  getDeviceId: () => 'unknown',
  getModel: () => 'unknown',
  getBrand: () => 'unknown',
  getManufacturer: () => 'unknown',
  getApplicationName: () => 'Message Pro',
  getDeviceType: () => 'Handset',
  getUniqueId: () => 'unknown',
  isTablet: () => false,
  isEmulator: () => false,
  isLandscape: () => false,
  hasNotch: () => false,
  getApiLevel: () => 34,
};

export const getVersion = DEVICE_DEFAULTS.getVersion;
export const getBuildNumber = DEVICE_DEFAULTS.getBuildNumber;
export const getBundleId = DEVICE_DEFAULTS.getBundleId;
export const getSystemName = DEVICE_DEFAULTS.getSystemName;
export const getSystemVersion = DEVICE_DEFAULTS.getSystemVersion;
export const getDeviceId = DEVICE_DEFAULTS.getDeviceId;
export const getModel = DEVICE_DEFAULTS.getModel;
export const getBrand = DEVICE_DEFAULTS.getBrand;
export const getManufacturer = DEVICE_DEFAULTS.getManufacturer;
export const getApplicationName = DEVICE_DEFAULTS.getApplicationName;
export const getDeviceType = DEVICE_DEFAULTS.getDeviceType;
export const getUniqueId = DEVICE_DEFAULTS.getUniqueId;
export const isTablet = DEVICE_DEFAULTS.isTablet;
export const isEmulator = DEVICE_DEFAULTS.isEmulator;
export const isLandscape = DEVICE_DEFAULTS.isLandscape;
export const hasNotch = DEVICE_DEFAULTS.hasNotch;
export const getApiLevel = DEVICE_DEFAULTS.getApiLevel;

export default DEVICE_DEFAULTS;
