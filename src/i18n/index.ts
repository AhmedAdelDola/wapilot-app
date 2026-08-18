const translations: Record<string, string> = {
  'ERRORS.AUTH': 'Login failed. Please check your credentials.',
  'ERRORS.COMMON_ERROR': 'Something went wrong. Please try again.',
  'SETTINGS.LOGOUT': 'Logout',
  'SETTINGS.TITLE': 'Settings',
};

const i18n = {
  locale: 'en',
  t: (key: string): string => translations[key] || key,
};

export default i18n;
