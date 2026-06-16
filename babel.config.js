module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-reanimated/plugin 은 반드시 마지막에 위치해야 합니다.
    plugins: ['react-native-reanimated/plugin'],
  };
};
