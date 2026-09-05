/* eslint-disable @typescript-eslint/no-require-imports */
const defaultTheme = require('tailwindcss/defaultTheme');

// Light theme colors
const radixUILightColors = require('./colors/light');
// Dark theme colors
const radixUIDarkColors = require('./colors/dark');

// Black with alpha variations
const blackA = require('./colors/blackA');
// White with alpha variations
const whiteA = require('./colors/whiteA');

const chatwootAppColors = {
  ...blackA,
  ...whiteA,
  ...radixUILightColors,
  ...radixUIDarkColors,
};

export const twConfig = {
  theme: {
    ...defaultTheme,
    extend: {
      colors: { ...chatwootAppColors },
      fontSize: {
        xs: '12px',
        cxs: '13px',
        md: '15px',
      },
      fontFamily: {
        'gontserrat-normal': ['Gontserrat-Regular'],
        'gontserrat-italic': ['Gontserrat-Italic'],
        'gontserrat-bold': ['Gontserrat-Bold'],
        'gontserrat-bold-italic': ['Gontserrat-BoldItalic'],
      },
    },
  },
  plugins: [],
};
