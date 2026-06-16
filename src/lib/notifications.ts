import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Routine } from '../types';

const ANDROID_CHANNEL_ID = 'routine-reminders';

// 앱이 포그라운드일 때도 알림 배너를 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** 알림 권한 요청 + (안드로이드) 채널 등록. 허용 여부 반환 */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: '루틴 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/**
 * 루틴의 reminderTime("HH:mm")에 매일 반복되는 로컬 알림을 예약하고
 * 알림 식별자를 반환한다. reminderTime 이 없으면 null.
 */
export async function scheduleRoutineReminder(routine: Routine): Promise<string | null> {
  if (!routine.reminderTime) return null;
  const { hour, minute } = parseTime(routine.reminderTime);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${routine.icon} ${routine.title}`,
      body: '오늘 루틴을 체크할 시간이에요! 💪',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** 예약된 알림 취소 (식별자 없으면 무시) */
export async function cancelReminder(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // 이미 사라진 알림 — 무시
  }
}
