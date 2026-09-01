/**
 * 预定房间相关工具函数
 *
 * 集中处理时间格式化、时长换算、房间类型映射、邀请信息拼装，
 * 避免各页面重复实现导致展示不一致。
 */

import { RoomType, RoomStatus } from '@/uni_modules/tuikit-atomic-x/state';
import type { RoomInfo } from '@/uni_modules/tuikit-atomic-x/types/room';

/** 房间时长选项（分钟） */
export const DURATION_OPTIONS: number[] = [30, 60, 90, 120, 180, 240, 300, 360];

/** 房间类型选项（与设计图文案对齐） */
export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: RoomType.Standard, label: '自由发言房间' },
  { value: RoomType.Webinar, label: '举手发言房间' },
];

/** 补零 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * 房间类型 → 文案。
 */
export function formatRoomType(roomType?: RoomType): string {
  const hit = ROOM_TYPE_OPTIONS.find((o) => o.value === roomType);
  return hit ? hit.label : ROOM_TYPE_OPTIONS[0].label;
}

/**
 * 时长（分钟）→ 文案，如 `30分钟` / `1小时` / `1小时30分钟`。
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '30分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/**
 * 时间戳 → `2026年12月06日 11:20`（预定表单/详情页的开始时间展示）。
 * 接收毫秒级时间戳（提交表单内部用的 RoomTimePicker / Date.now() 都是毫秒）。
 */
export function formatFullDateTime(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const d = new Date(timestamp);
  return `${d.getFullYear()}年${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * 同 formatFullDateTime，但接收**秒级时间戳**（RoomInfo.scheduledStartTime 等 SDK 字段都是秒）。
 * 内部 * 1000 转毫秒再格式化。
 */
export function formatFullDateTimeSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatFullDateTime(seconds * 1000);
}

/**
 * 时间戳 → `11:20`（列表页的起止时间）。
 * 接收毫秒级时间戳。
 */
export function formatTime(timestamp?: number): string {
  if (!timestamp || timestamp <= 0) return '';
  const d = new Date(timestamp);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * 同 formatTime，但接收**秒级时间戳**（RoomInfo.scheduledStartTime 等 SDK 字段）。
 */
export function formatTimeSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatTime(seconds * 1000);
}

/**
 * 时间戳 → `12月06日 周六`（列表分组标题）。
 * 今天/明天用相对文案，其余用日期 + 星期。
 * 接收毫秒级时间戳。
 */
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

/**
 * 同 formatDateGroupTitle，但接收**秒级时间戳**（RoomInfo.scheduledStartTime 等 SDK 字段）。
 */
export function formatDateGroupTitleSec(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatDateGroupTitle(seconds * 1000);
}

/**
 * 房间号 → `587-408-829`（每 3 位一段，便于口播/抄写）。
 */
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
 * 房间状态 → 文案 + 是否高亮。
 * 「进行中」用主色，「未开始」用灰色（与设计图一致）。
 */
export function formatRoomStatus(room: RoomInfo): { text: string; isRunning: boolean } {
  if (room.roomStatus === RoomStatus.Running) {
    return { text: '进行中', isRunning: true };
  }
  return { text: '未开始', isRunning: false };
}

/**
 * 生成 6 位随机房间号。
 */
export function generateRoomID(): string {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * 生成 6 位随机进房密码（数字，首位非 0，便于口播/抄写）。
 */
export function generateRoomPassword(): string {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * 邀请链接。
 * demo 侧无服务端短链，直接拼 web 端 roomkit 地址，保证「复制后可用」。
 */
export function buildInviteLink(roomID: string): string {
  return `https://web.sdk.qcloud.com/component/tuiroom/index.html#/home?roomId=${roomID}`;
}

/**
 * 邀请文案（复制房间号 / 复制链接之外的整段邀请语）。
 *
 * scheduledStartTime / scheduledEndTime 是 SDK 推的**秒级时间戳**（见 types/room.ts:99-101），
 * 这里用对应的 *_Sec 版本工具函数格式化，避免把秒误当毫秒导致显示 1970 年附近。
 */
export function buildInviteText(room: RoomInfo): string {
  const lines: string[] = [];
  if (room.roomName) lines.push(room.roomName);
  if (room.scheduledStartTime && room.scheduledEndTime) {
    lines.push(`${formatFullDateTimeSec(room.scheduledStartTime)} - ${formatTimeSec(room.scheduledEndTime)}`);
  }
  lines.push(`房间号：${formatRoomIDDisplay(room.roomID)}`);
  lines.push(`邀请链接：${buildInviteLink(room.roomID)}`);
  return lines.join('\n');
}

/**
 * 计算默认预定开始时间：
 * 当前时间向后取整到下一个 30 分钟刻度（如 11:07 → 11:30，11:38 → 12:00）。
 * 避免默认值落在过去导致 SDK 报参数非法。
 */
export function getDefaultStartTime(): number {
  const now = new Date();
  now.setSeconds(0, 0);
  const minutes = now.getMinutes();
  const delta = minutes < 30 ? 30 - minutes : 60 - minutes;
  return now.getTime() + delta * 60 * 1000;
}

/**
 * 按开始时间的「天」把预定列表分组，用于列表页的日期分割标题。
 * 同时保证组内按开始时间升序。
 *
 * scheduledStartTime 是 SDK 推的**秒级时间戳**（types/room.ts:99-101），
 * 排序时统一用秒避免与房间按毫秒 createTime 混淆；格式化走 *_Sec 版本。
 */
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
