module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@models': './src/models',
            '@viewmodels': './src/viewmodels',
            '@views': './src/views',
            '@components': './src/views/components',
            '@screens': './src/views/screens',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
