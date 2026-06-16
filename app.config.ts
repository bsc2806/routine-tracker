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
    adaptiveIcon: {
      backgroundColor: '#10b981',
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.routinetracker.app',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // .env 의 값이 빌드 시 주입됩니다. (v1: 클라이언트 직접 호출)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
  },
};

export default config;
