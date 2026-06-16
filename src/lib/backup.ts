import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RecordEntry, Routine } from '../types';

export interface BackupData {
  app: 'routine-tracker';
  version: number;
  exportedAt: string;
  routines: Routine[];
  records: RecordEntry[];
}

/** 현재 데이터를 JSON 파일로 내보내고 공유 시트를 띄운다. */
export async function exportBackup(routines: Routine[], records: RecordEntry[]): Promise<void> {
  const payload: BackupData = {
    app: 'routine-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    routines,
    records,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `${FileSystem.cacheDirectory}routine-tracker-backup-${stamp}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('이 기기에서는 파일 공유를 사용할 수 없어요.');
  }
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: '루틴 데이터 백업',
    UTI: 'public.json',
  });
}

/** 백업 JSON 파일을 선택·검증해 반환. 취소 시 null. */
export async function pickBackup(): Promise<BackupData | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;

  const content = await FileSystem.readAsStringAsync(res.assets[0].uri);
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('파일을 읽을 수 없어요. 올바른 백업 파일인지 확인해 주세요.');
  }

  const d = data as Partial<BackupData>;
  if (!Array.isArray(d.routines) || !Array.isArray(d.records)) {
    throw new Error('루틴 트래커 백업 파일이 아니에요.');
  }
  return {
    app: 'routine-tracker',
    version: d.version ?? 1,
    exportedAt: d.exportedAt ?? new Date().toISOString(),
    routines: d.routines,
    records: d.records,
  };
}
