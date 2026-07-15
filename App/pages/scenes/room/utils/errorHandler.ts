import { showToast } from '@/uni_modules/tuikit-atomic-x/utils/toast';
import type { ToastType } from '@/uni_modules/tuikit-atomic-x/utils/toast';

/**
 * Room 错误处理器
 * 提供错误码 → 本地化文案 → Toast 展示能力。
 *
 * ```ts
 * try {
 *   await roomParticipantState.kickUser({ userID });
 * } catch (e) {
 *   showErrorToast(e, '移出成员失败');
 * }
 * ```
 *
 * 如需对特定错误码做业务处理（如弹密码框）：
 *
 * ```ts
 * try {
 *   await roomState.joinRoom({ roomID, roomType, password });
 * } catch (e) {
 *   const code = parseErrorCode(e);
 *   if (code === 100018) {
 *     isPasswordSheetVisible.value = true;
 *     return;
 *   }
 *   showErrorToast(e, '进入房间失败');
 * }
 * ```
 */

// ─── TIM (IM SDK) 错误码 ───

const TIM_ERROR_MAP: Record<number, string> = {
  0: '操作成功',
  7002: '非法的userId',
  7008: '请求被限频，请稍后重试',
  7015: '检测到敏感词，请修改后重试',
  9522: '内容太长，请缩减内容后再试',
  10017: '当前房间内，您已被禁言',
};

// TIM 网络相关错误码（统一文案："网络异常，请稍后再试"）
const TIM_NETWORK_ERROR_CODES = [9508, 9509, 9510, 9511, 9512, 9518, 9519, 9520, 9521, 9523, 9524, 9525];
for (const code of TIM_NETWORK_ERROR_CODES) {
  TIM_ERROR_MAP[code] = '网络异常，请稍后再试';
}

// ─── Room Engine 错误码 ───

const ROOM_ERROR_MAP: Record<number, string> = {
  // 基础错误
  [-2]: '请求被限频，请稍后重试',
  [-3]: '重复操作',
  [-4]: '房间 ID 不匹配，请检查是否退房或者切换了房间',

  // SDK 错误
  [-1000]: '未找到 SDKAppID，请在 腾讯云视立方 SDK 控制台 确认应用信息',
  [-1001]: '调用 API 时，传入的参数不合法，检查入参是否合法',
  [-1002]: '未登录,请调用 Login 接口',
  [-1003]: '获取权限失败，当前未授权音/视频权限，请查看是否开启设备权限',
  [-1004]: '该功能需要开通额外的套餐，请在 腾讯云视立方 SDK 控制台 按需开通对应套餐',
  [-1005]: 'License无效或已过期，请在 腾讯云视立方 SDK控制台确认License有效期',

  // 设备错误
  [-1100]: '系统问题，打开摄像头失败。检查摄像头设备是否正常',
  [-1101]: '摄像头没有系统授权, 检查系统授权',
  [-1102]: '摄像头被占用，检查是否有其他进程使用摄像头',
  [-1103]: '当前无摄像头设备，请插入摄像头设备解决该问题',
  [-1104]: '系统问题，打开麦克风失败。检查麦克风设备是否正常',
  [-1105]: '麦克风没有系统授权，检查系统授权',
  [-1106]: '麦克风被占用',
  [-1107]: '当前无麦克风设备',
  [-1108]: '获取屏幕分享源（屏幕和窗口）失败，检查屏幕录制权限',
  [-1109]: '开启屏幕分享失败，检查房间内是否有人正在屏幕分享',

  // 房间操作错误
  [-2101]: '需要进房后才可使用此功能',
  [-2102]: '房主不支持退房操作，房主只能解散房间',
  [-2103]: '当前房间类型下不支持该操作',
  [-2105]: '创建房间 ID 非法，自定义 ID 必须为可打印 ASCII 字符（0x20–0x7e），最长48个字节',
  [-2107]: '房间名称非法，名称最长30字节，字符编码必须是 UTF-8',
  [-2108]: '当前用户已在别的房间内，单个 roomEngine 实例只支持用户进入一个房间，如果要进入不同的房间请先退房或者使用新的 roomEngine 实例',

  // 用户权限
  [-2200]: '用户不存在',
  [-2300]: '需要房主权限才能操作',
  [-2301]: '需要房主或者管理员权限才能操作',
  [-2310]: '信令请求无权限，例如取消非自己发起的邀请',
  [-2311]: '信令请求 ID 无效或已经被处理过',
  [-2312]: '信令请求重复',

  // 麦位
  [-2340]: '最大麦位超出套餐包数量限制',
  [-2344]: '麦位编号不存在',
  [-2360]: '当前麦位音频被锁',
  [-2361]: '全员静音中，无法解除静音',
  [-2370]: '当前麦位视频被锁, 需要由房主解锁麦位后，才能打开摄像头',
  [-2371]: '全员禁画中，无法开启摄像头',
  [-2372]: '当前麦位视频被锁, 需要由房主解锁麦位后，才能打开屏幕分享',
  [-2373]: '需要向房主或管理员申请后打开屏幕分享',

  // 消息
  [-2380]: '当前房间已开启全员禁言',

  // 其它
  [-4001]: '当前房间不支持预加载',
  [-6001]: '正在通话中，设备操作失败',

  // 服务端错误 (100xxx)
  [100001]: '服务器内部错误，请重试',
  [100002]: '请参数非法，请根据错误描述检查请求是否正确',
  [100003]: '房间ID 已被使用，请选择别的房间ID',
  [100004]: '房间不存在，或者曾经存在过，但是目前已经被解散',
  [100005]: '非房间成员',
  [100006]: '您当前无法执行此操作（可能是无权限，或受场景限制等原因）',
  [100007]: '无付费信息，需在控制台购买套餐包',
  [100008]: '房间成员已满',
  [100009]: '标签数量超上限',
  [100010]: '房间 ID 已被使用，并且操作者为房主，可以直接使用',
  [100011]: '房间 ID 已被 IM 占用，可以换一个房间 ID 使用，或者先通过 IM 接口解散该群',
  [100012]: '频率超过限制，例如创建房间超过频率超限，同一房间 ID， 1秒内只能创建一次',
  [100013]: '超过付费上限，例如麦位数，pk场次房间数量等超过付费限制',
  [100015]: '无效的房间类型',
  [100016]: '该成员已经被封禁',
  [100017]: '该成员已经被禁言',
  [100018]: '当前房间需要密码才能进入',
  [100019]: '进房密码错误',
  [100020]: '管理员数量已达上限',
  [100102]: '信令请求冲突',

  // 麦位服务端错误
  [100200]: '麦位已锁定，可以尝试换一个麦位',
  [100201]: '当前麦位已经有人了',
  [100202]: '已经处于排麦状态',
  [100203]: '已经处于麦上状态',
  [100204]: '没有在排麦列表中',
  [100205]: '嘉宾数量已达上限',
  [100206]: '请先成为嘉宾',
  [100210]: '已经有用户在麦位上',
  [100211]: '该房间不支持连麦',
  [100251]: '连麦列表为空',
  [100253]: '主讲嘉宾席位已被占用，无法开启设备',

  // Metadata 错误
  [100500]: '房间 meta 数据中的 key 数量超过上限',
  [100501]: '房间 meta 数据中单个 key 对应的 val 超过最大字节数限制',
  [100502]: '房间 meta数据中所有 key 对应的 val 总和超过最大字节数限制',
  [100503]: '删除房间 meta 数据时候，被删除的 key 没有一个存在',
  [100504]: '房间 meta 数据中的 key 大小超过了最大字节数限制',

  // 录制
  [101072]: '录制配置不存在或未启用',
};

// 需要用 WARNING 样式展示的错误码（非严格错误，是提示性警告）
const WARNING_CODES = new Set([
  -2361, // 需要向房主或管理员申请后打开麦克风
  -2371, // 需要向房主或管理员申请后打开摄像头
]);

// ─── 错误码解析与展示 ───

/**
 * 从 error 对象中解析 code。
 * 支持 error.code / error.errCode / message 中 "code=xxx" 格式。
 */
export function parseErrorCode(e: any): number | null {
  if (e == null) return null;
  if (typeof e.code === 'number' && e.code !== 0) return e.code;
  if (typeof e.errCode === 'number' && e.errCode !== 0) return e.errCode;
  const m = (e?.message || e?.errMsg || '').match(/code[=:]\s*(-?\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * 获取错误码对应的本地化文案。
 */
export function getLocalizedMessage(code: number): string {
  return ROOM_ERROR_MAP[code] || TIM_ERROR_MAP[code] || `操作失败 (${code})`;
}

/**
 * 根据错误码决定 Toast 样式。
 */
function getToastType(code: number): ToastType {
  if (WARNING_CODES.has(code)) return 'none';
  return 'error';
}

/**
 * 展示错误码对应的本地化 Toast。
 * @param code 错误码
 */
export function showError(code: number): void {
  const message = getLocalizedMessage(code);
  const type = getToastType(code);
  showToast({ message, type });
}

/**
 * 在 catch 块中统一处理异常并弹出本地化 Toast。
 *
 * 解析顺序：
 * 1. 从异常中解析错误码；命中则按错误码弹本地化 Toast；
 * 2. 解析不到错误码：使用 fallback 文案弹 Toast（若 fallback 也未提供，则 fallback 到 e.message / "操作失败"）。
 *
 * @example
 * ```ts
 * try {
 *   await roomParticipantState.kickUser({ userID });
 * } catch (e) {
 *   showErrorToast(e, '移出成员失败');
 * }
 * ```
 */
export function showErrorToast(e: any, fallback?: string): void {
  const code = parseErrorCode(e);
  console.warn('[room errorHandler] failed |', 'code:', code, '| message:', e?.message || e, '| error:', JSON.stringify(e));
  if (code !== null) {
    showError(code);
    return;
  }
  showToast({ message: fallback || e?.message || '操作失败', type: 'error' });
}
