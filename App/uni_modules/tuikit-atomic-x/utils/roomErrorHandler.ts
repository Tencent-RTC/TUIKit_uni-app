import { showToast } from '@/uni_modules/tuikit-atomic-x/utils/toast';
import { registerComponentLocale, t } from '@/uni_modules/tuikit-atomic-x/components/locales';
import { roomErrorZhCN, roomErrorEn } from '@/uni_modules/tuikit-atomic-x/constants/roomErrorLocales';

registerComponentLocale({
  'zh-CN': roomErrorZhCN,
  'zh-Hans': roomErrorZhCN,
  'zh': roomErrorZhCN,
  'en': roomErrorEn,
});

export const ERR_SCREEN_SHARE_EXTENSION_NOT_CONFIGURED = 12061;

const ROOM_ERROR_KEY_MAP: Record<number, string> = {
  // 通用
  [-1]: 'RoomError.Failure.Default',
  [-1001]: 'RoomError.Failure.InvalidParameter',
  [-1002]: 'RoomError.Failure.NotLoggedIn',
  [100001]: 'RoomError.Failure.Server',
  [-2]: 'RoomError.Failure.TooFrequent',
  [100012]: 'RoomError.Failure.TooFrequent',
  [-1004]: 'RoomError.Failure.Package',
  [100007]: 'RoomError.Failure.Package',
  [100013]: 'RoomError.Failure.Package',
  // 进入 / 创建会议
  [100003]: 'RoomEntry.Failure.RoomExists',
  [100011]: 'RoomEntry.Failure.RoomExists',
  [-2105]: 'RoomEntry.Failure.IllegalRoomId',
  [-2107]: 'RoomEntry.Failure.IllegalRoomName',
  [100004]: 'RoomEntry.Failure.RoomNotFound',
  [100008]: 'RoomEntry.Failure.RoomFull',
  [100019]: 'RoomEntry.Failure.WrongPassword',
  [100026]: 'RoomEntry.Failure.SensitiveWord',
  // 成员 / 录制 / 屏幕共享
  [100020]: 'Participants.Failure.AdminLimit',
  [101072]: 'CloudRecording.Failure.NotEnabled',
  [-1109]: 'ScreenShare.Failure.Failed',
  [12061]: 'ScreenShare.Failure.Unsupported',
  // 房间规则（前端已拦截；SDK 兜底返回时用同一句）
  [-2361]: 'Device.AllMicDisabled',
  [-2371]: 'Device.AllCamDisabled',
  [-2373]: 'ScreenShare.Failure.OwnerAdminOnly',
  // 聊天（IM 错误码）
  [-2380]: 'RoomChat.MutedAllPlaceholder',
  [100017]: 'RoomChat.MutedPlaceholder',
  [10017]: 'RoomChat.Failure.MutedSend',
  [10010]: 'RoomChat.Failure.MutedSend',
  [80001]: 'RoomChat.SensitiveWord',
  [10007]: 'RoomChat.NotInGroup',
  [2351]: 'RoomChat.VideoSizeExceeded',
  [20016]: 'RoomChat.RecallTimeLimit',
};

export type DeviceFaultKind = 'system' | 'busy' | 'noDevice' | 'startFailed';
export type FaultDevice = 'microphone' | 'camera';
export interface DeviceFault {
  kind: DeviceFaultKind;
  device: FaultDevice;
}

const DEVICE_FAULT_MAP: Record<number, [DeviceFaultKind, FaultDevice | null]> = {
  [-1003]: ['system', null],
  [-1101]: ['system', 'camera'],
  [-1105]: ['system', 'microphone'],
  [-1102]: ['busy', 'camera'],
  [-1106]: ['busy', 'microphone'],
  [-1103]: ['noDevice', 'camera'],
  [-1107]: ['noDevice', 'microphone'],
  [-1100]: ['startFailed', 'camera'],
  [-1104]: ['startFailed', 'microphone'],
};

const SILENT_CODES = new Set([-2310, -2311, -2312, 100102]);

const ENTRY_TOAST_CODES = new Set([100003, 100011, -2105, -2107, 100026]);

export function parseErrorCode(e: any): number | null {
  if (e == null) return null;
  if (typeof e.code === 'number' && e.code !== 0) return e.code;
  if (typeof e.errCode === 'number' && e.errCode !== 0) return e.errCode;
  const m = (e?.message || e?.errMsg || '').match(/code[=:]\s*(-?\d+)/);
  return m ? parseInt(m[1], 10) : null;
}


export function formatRoomError(code: number | null): string | null {
  if (code === null) return null;
  const key = ROOM_ERROR_KEY_MAP[code];
  return key ? t(key) : null;
}


export function resolveDeviceFault(e: any, fallbackDevice: FaultDevice): DeviceFault | null {
  const code = parseErrorCode(e);
  if (code === null) return null;
  const entry = DEVICE_FAULT_MAP[code];
  if (!entry) return null;
  logRoomError(e, code);
  return { kind: entry[0], device: entry[1] ?? fallbackDevice };
}

function logRoomError(e: any, code: number | null): void {
  console.error('[room error] code:', code, '| message:', e?.message ?? e, '| error:', JSON.stringify(e));
}


export function showErrorToast(e: any, action?: string): void {
  const code = parseErrorCode(e);
  logRoomError(e, code);
  if (code !== null && SILENT_CODES.has(code)) return;
  const message =
    formatRoomError(code) ??
    (action ? t('RoomError.WithRetry', { action }) : t('RoomError.Failure.Default'));
  showToast({ message, type: 'error' });
}

export interface EnterFailure {
  title: string;
  message: string;
  asToast: boolean;
}

export function resolveEnterFailure(e: any, isCreate: boolean): EnterFailure {
  const code = parseErrorCode(e);
  logRoomError(e, code);
  return {
    title: t(isCreate ? 'RoomEntry.Failure.Create' : 'RoomEntry.Failure.Join'),
    message: formatRoomError(code) ?? t('RoomEntry.Failure.Default'),
    asToast: code !== null && ENTRY_TOAST_CODES.has(code),
  };
}
