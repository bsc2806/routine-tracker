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

function content(routine: Routine) {
  return {
    title: `${routine.icon} ${routine.title}`,
    body: '오늘 루틴을 체크할 시간이에요! 💪',
    ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
  };
}

/**
 * 루틴의 reminderTime + schedule 에 맞춰 로컬 알림을 예약하고 식별자 배열을 반환.
 * - 매일: DAILY 트리거 1개
 * - 특정 요일: 요일마다 WEEKLY 트리거 (해당 요일에만 알림)
 * reminderTime 이 없으면 빈 배열.
 */
export async function scheduleRoutineReminder(routine: Routine): Promise<string[]> {
  if (!routine.reminderTime) return [];
  const { hour, minute } = parseTime(routine.reminderTime);
  const sched = routine.schedule;

  if (!sched || sched.type === 'daily' || !sched.days?.length) {
    const id = await Notifications.scheduleNotificationAsync({
      content: content(routine),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return [id];
  }

  // expo weekday: 1=일요일 ~ 7=토요일  (앱 내부 0=일 ~ 6=토 → +1)
  const ids: string[] = [];
  for (const day of sched.days) {
    const id = await Notifications.scheduleNotificationAsync({
      content: content(routine),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

/** 예약된 모든 로컬 알림 취소 (복원/초기화 시 사용) */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // 무시
  }
}

/** 예약된 알림들 취소 (없으면 무시) */
export async function cancelReminders(notificationIds?: string[]): Promise<void> {
  if (!notificationIds?.length) return;
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}
