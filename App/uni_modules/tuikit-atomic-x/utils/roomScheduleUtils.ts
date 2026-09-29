import { RoomType, RoomStatus } from '@/uni_modules/tuikit-atomic-x/state';
import type { RoomInfo } from '@/uni_modules/tuikit-atomic-x/types/room';

export const DURATION_OPTIONS: number[] = [30, 60, 90, 120, 180, 240, 300, 360];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatRoomType(roomType?: RoomType): string {
  const hit = ROOM_TYPE_OPTIONS.find((o) => o.value === roomType);
  return hit ? hit.label : ROOM_TYPE_OPTIONS[0].label;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '30分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function formatFullDateTime(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const d = new Date(timestamp);
  return `${d.getFullYear()}年${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatFullDateTimeSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatFullDateTime(seconds * 1000);
}

export function formatTime(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const d = new Date(timestamp);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatTimeSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatTime(seconds * 1000);
}

export function formatDateGroupTitle(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const d = new Date(timestamp);
  const today = new Date();
  const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dateText = `${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日`;

  if (isSameDay(d, today)) return `今天 ${dateText}`;
  if (isSameDay(d, tomorrow)) return `明天 ${dateText}`;
  return `${dateText} ${weekNames[d.getDay()]}`;
}

export function formatDateGroupTitleSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatDateGroupTitle(seconds * 1000);
}

export function formatRoomIDDisplay(roomID: string): string {
  const raw = (roomID || '').replace(/\D/g, '');
  if (raw.length === 0) return roomID || '';
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += 3) {
    groups.push(raw.slice(i, i + 3));
  }
  return groups.join(' ');
}

/**
 * 房间名称显示截断：超过阈值时按「前 keepHead + ... + 后 6」中段省略。
 *
 * 阈值 = keepHead + 3（省略号） + 6（尾段）。`keepHead` 由调用方按各自场景的
 * 可展示宽度估算后传入：宽容器可以传大一些（如 9，总长 18），窄容器传小一些
 * （如 6，总长 15）；超出的字符数由 `keepHead + 3 + 6` 决定，函数本身不感知 px。
 *
 * 例（keepHead=9）：「水电费水电费水电费师傅就哭了水电费开始了减肥水电费了师傅的临时房间」
 *   → 「水电费水电费水电费...傅的临时房间」
 *
 * 仅用于展示，不要用它回写到 input.value（输入框仍应保留完整值）。
 */
const ROOM_NAME_KEEP_TAIL = 6
const ROOM_NAME_ELLIPSIS = '...'

export function truncateRoomNameDisplay(
  name: string | undefined | null,
  keepHead: number = 9,
): string {
  const s = (name == null ? '' : String(name))
  const head = Math.max(0, Math.floor(keepHead))
  const maxLen = head + ROOM_NAME_ELLIPSIS.length + ROOM_NAME_KEEP_TAIL
  if (s.length <= maxLen) return s
  return s.slice(0, head) + ROOM_NAME_ELLIPSIS + s.slice(-ROOM_NAME_KEEP_TAIL)
}

export function formatRoomStatus(room: RoomInfo): { text: string; isRunning: boolean } {
  if (room.roomStatus === RoomStatus.Running) {
    return { text: '进行中', isRunning: true };
  }
  return { text: '未开始', isRunning: false };
}

const ROOM_ID_DIGITS = 6;
const ROOM_PASSWORD_DIGITS = 6;

/**
 * 生成固定位数的纯数字串。
 *
 * 不直接用 String(Math.floor(...)) 的原因：
 * 在部分 nvue/weex 运行时上，Math.random() 可能返回精度异常的值，
 * 经 Math.floor + String 后会带上浮点尾数（如 "4020954983"），
 * 导致生成出 10 位房间号。这里统一做定长约束：
 *   1. 非有限值或越界时回退到安全值
 *   2. 只保留数字字符，多截少补，保证结果恒为 digits 位
 */
function generateNumericID(digits: number): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const raw = Math.floor(Math.random() * (max - min + 1)) + min;
  const safe = Number.isFinite(raw) ? Math.abs(Math.trunc(raw)) : min;
  const onlyDigits = String(safe).replace(/\D/g, '');

  if (onlyDigits.length === digits) return onlyDigits;
  // 超长：截断到 digits 位，并保证首位非 0
  if (onlyDigits.length > digits) {
    const cut = onlyDigits.slice(0, digits);
    return cut.charAt(0) === '0' ? `1${cut.slice(1)}` : cut;
  }
  // 过短：右侧补 0 到 digits 位
  return onlyDigits.padEnd(digits, '0');
}

export function generateRoomID(): string {
  return generateNumericID(ROOM_ID_DIGITS);
}

export function generateRoomPassword(): string {
  return generateNumericID(ROOM_PASSWORD_DIGITS);
}

export function getDefaultStartTime(): number {
  const now = new Date();
  now.setSeconds(0, 0);
  const minutes = now.getMinutes();
  const delta = minutes < 30 ? 30 - minutes : 60 - minutes;
  return now.getTime() + delta * 60 * 1000;
}

export function groupRoomsByDate(rooms: RoomInfo[]): { title: string; rooms: RoomInfo[] }[] {
  const sorted = [...rooms].sort(
    (a, b) => (a.scheduledStartTime ?? 0) - (b.scheduledStartTime ?? 0),
  );
  const groups: { title: string; rooms: RoomInfo[] }[] = [];
  const indexMap = new Map<string, number>();

  for (const room of sorted) {
    const title = formatDateGroupTitleSec(room.scheduledStartTime);
    const existing = indexMap.get(title);
    if (existing === undefined) {
      indexMap.set(title, groups.length);
      groups.push({ title, rooms: [room] });
    } else {
      groups[existing].rooms.push(room);
    }
  }
  return groups;
}
