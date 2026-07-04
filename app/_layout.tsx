import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BadgeWatcher } from '../src/components/BadgeWatcher';
import { ToastProvider } from '../src/components/ToastProvider';
import { AppProvider } from '../src/store/AppContext';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ToastProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <BadgeWatcher />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="routine/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          </Stack>
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
