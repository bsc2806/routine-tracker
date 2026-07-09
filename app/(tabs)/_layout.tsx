import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: dark ? '#9ca3af' : '#9ca3af',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: dark ? '#0b1220' : '#ffffff',
          borderTopColor: dark ? '#1f2937' : '#f1f5f9',
          height: 84,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: '루틴',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'list-circle' : 'list-circle-outline'}
              color={color}
              size={size + 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '일기',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'journal' : 'journal-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="advice"
        options={{
          title: 'AI 조언',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
