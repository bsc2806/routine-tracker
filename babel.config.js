module.exports = function (api) {
  // 환경별로 분기하므로 NODE_ENV 기준으로 캐시
  api.cache.using(() => process.env.NODE_ENV);
  // 테스트(jest) 환경에서는 순수 로직만 변환 — NativeWind/reanimated 플러그인 제외
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      isTest
        ? 'babel-preset-expo'
        : ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
    // react-native-reanimated/plugin 은 반드시 마지막에 위치해야 합니다.
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};
