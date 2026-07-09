import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: '루틴 트래커',
  slug: 'routine-tracker',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'routinetracker',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  android: {
    package: 'com.routinetracker.app',
    versionCode: 1,
    // 민감한 일기 데이터가 ADB/클라우드 자동백업으로 평문 추출되는 것 방지
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#10b981',
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.routinetracker.app',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-notifications',
      {
        color: '#10b981',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // AI 호출은 프록시 서버(Cloudflare Worker) 경유. 앱에는 API 키가 없음.
    proxyUrl: process.env.EXPO_PUBLIC_PROXY_URL ?? '',
    proxyToken: process.env.EXPO_PUBLIC_PROXY_TOKEN ?? '',
  },
};

export default config;
