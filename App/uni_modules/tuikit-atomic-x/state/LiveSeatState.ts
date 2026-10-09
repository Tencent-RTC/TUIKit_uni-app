/**
 * @module LiveSeatState
 * @module_description
 * 直播间麦位管理模块
 * 核心功能：实现多人连麦场景下的座位控制，支持复杂的座位状态管理和音视频设备控制。
 * 技术特点：基于音视频技术，支持多路音视频流管理，提供座位锁定、设备控制、权限管理等高级功能。
 * 业务价值：为多人互动直播提供核心技术支撑，支持PK、连麦、多人游戏等丰富的互动场景。
 * 应用场景：多人连麦、主播PK、互动游戏、在线教育、会议直播等需要多人音视频互动的场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener
} from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { DeviceStatus } from "./DeviceState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 设备控制策略类型
 * @remarks
 * 可用值：
 * - `UNLOCK_ONLY`: 仅解锁设备权限
 */
export enum DeviceControlPolicy {
  UNLOCK_ONLY = 1,
}

/**
 * 移动座位策略类型
 * @remarks
 * 可用值：
 * - `ABORT_WHEN_OCCUPIED`: 当目标座位被占用时中止操作
 * - `FORCE_REPLACE`: 强制替换目标座位上的用户
 * - `SWAP_POSITION`: 交换位置
 */
export enum MoveSeatPolicy {
  ABORT_WHEN_OCCUPIED = 0,
  FORCE_REPLACE = 1,
  SWAP_POSITION = 2,
}

/**
 * 区域信息参数类型定义
 * @typedef {Object} RegionInfoParams
 * @property {number} x X坐标位置
 * @property {number} y Y坐标位置
 * @property {number} w 宽度
 * @property {number} h 高度
 * @property {number} zorder 层级顺序
 * @memberof module:LiveSeatState
 */
/**
 * 座位用户信息参数
 * @typedef {Object} SeatUserInfoParam
 * @property {string} [userID] - 用户ID
 * @property {string} [userName] - 用户名
 * @property {string} [avatarURL] - 头像URL
 * @property {string} [role] - 用户角色
 * @property {string} [liveID] - 直播间ID
 * @property {DeviceStatus} [microphoneStatus] - 麦克风状态
 * @property {boolean} [allowOpenMicrophone] - 是否允许开启麦克风
 * @property {DeviceStatus} [cameraStatus] - 摄像头状态
 * @property {boolean} [allowOpenCamera] - 是否允许开启摄像头
 * @memberof module:LiveSeatState
 */
export type SeatUserInfoParam = {
  userID?: string;
  userName?: string;
  avatarURL?: string;
  role?: string;
  liveID?: string;
  microphoneStatus?: DeviceStatus;
  allowOpenMicrophone?: boolean;
  cameraStatus?: DeviceStatus;
  allowOpenCamera?: boolean;
};

export type RegionInfoParams = {
  x: number;
  y: number;
  w: number;
  h: number;
  zorder: number;
}

/**
 * 直播画布参数类型定义
 * @typedef {Object} LiveCanvasParams
 * @property {number} w 画布宽度
 * @property {number} h 画布高度
 * @property {string} [background] 背景色（可选）
 * @memberof module:LiveSeatState
 */
export type LiveCanvasParams = {
  w: number;
  h: number;
  background?: string;
}

/**
 * 座位信息类型定义
 * @typedef {Object} SeatInfo
 * @property {number} index 座位索引
 * @property {boolean} isLocked 是否锁定
 * @property {SeatUserInfoParam} userInfo 座位上用户信息
 * @property {RegionInfoParams} region 座位区域信息
 * @memberof module:LiveSeatState
 */
export type SeatInfo = {
  index: number;
  isLocked: boolean;
  userInfo: SeatUserInfoParam;
  region: RegionInfoParams;
}

/**
 * 上麦参数
 * @interface TakeSeatOptions
 */
export type TakeSeatOptions = {
  liveID: string;
  seatIndex: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 下麦参数
 * @interface LeaveSeatOptions
 */
export type LeaveSeatOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 静音麦克风参数
 * @interface MuteMicrophoneOptions
 */
export type MuteMicrophoneOptions = {
  liveID: string;
}

/**
 * 取消静音麦克风参数
 * @interface UnmuteMicrophoneOptions
 */
export type UnmuteMicrophoneOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 踢用户下麦参数
 * @interface KickUserOutOfSeatOptions
 */
export type KickUserOutOfSeatOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 移动用户到座位参数
 * @interface MoveUserToSeatOptions
 */
export type MoveUserToSeatOptions = {
  liveID: string;
  userID: string;
  targetIndex: number;
  policy?: MoveSeatPolicy;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 锁定座位参数
 * @interface LockSeatOptions
 */
export type LockSeatOptions = {
  liveID: string
  seatIndex: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 解锁座位参数
 * @interface UnlockSeatOptions
 */
export type UnlockSeatOptions = {
  liveID: string;
  seatIndex: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 开启远程摄像头参数
 * @interface OpenRemoteCameraOptions
 */
export type OpenRemoteCameraOptions = {
  liveID: string;
  userID: string;
  policy: DeviceControlPolicy;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 关闭远程摄像头参数
 * @interface CloseRemoteCameraOptions
 */
export type CloseRemoteCameraOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 开启远程麦克风参数
 * @interface OpenRemoteMicrophoneOptions
 */
export type OpenRemoteMicrophoneOptions = {
  liveID: string;
  userID: string;
  policy: DeviceControlPolicy;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 关闭远程麦克风参数
 * @interface CloseRemoteMicrophoneOptions
 */
export type CloseRemoteMicrophoneOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 座位列表
 * @type {Ref<SeatInfo[]>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { seatList } = useLiveSeatState('your_live_id');
 *
 * // 监听座位列表变化
 * watch(seatList, (newSeatList) => {
 *   if (newSeatList && newSeatList.length > 0) {
 *     console.log('座位列表更新:', newSeatList);
 *     newSeatList.forEach(seat => {
 *       console.log('座位索引:', seat.index);
 *       console.log('座位是否锁定:', seat.isLocked);
 *       if (seat.userInfo) {
 *         console.log('座位上用户ID:', seat.userInfo.userID);
 *       }
 *     });
 *   }
 * });
 *
 * // 获取当前座位列表
 * const seats = seatList.value;
 * console.log('当前座位数:', seats.length);
 */
const seatList = ref<SeatInfo[]>([]);

/**
 * 画布信息
 * @type {Ref<LiveCanvasParams | null>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { canvas } = useLiveSeatState('your_live_id');
 *
 * // 监听画布信息变化
 * watch(canvas, (newCanvas) => {
 *   if (newCanvas) {
 *     console.log('画布信息更新:', newCanvas);
 *   }
 * });
 *
 * // 获取当前画布信息
 * const currentCanvas = canvas.value;
 * if (currentCanvas) {
 *   console.log('当前画布分辨率:', currentCanvas.w, 'x', currentCanvas.h);
 * }
 */
const canvas = ref<LiveCanvasParams | null>(null);

/**
 * 正在说话的用户列表
 * @type {Ref<Map<string, number> | null>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { speakingUsers } = useLiveSeatState('your_live_id');
 *
 * // 监听正在说话的用户列表变化
 * watch(speakingUsers, (newSpeakingUsers) => {
 *   if (newSpeakingUsers && newSpeakingUsers.size > 0) {
 *     console.log('正在说话的用户更新');
 *     newSpeakingUsers.forEach((volume, userID) => {
 *       console.log('用户ID:', userID);
 *       console.log('音量:', volume);
 *     });
 *   }
 * });
 *
 * // 获取当前正在说话的用户数量
 * const users = speakingUsers.value;
 * if (users) {
 *   console.log('当前说话的用户数:', users.size);
 * }
 */
const speakingUsers = ref<Map<string, number> | null>(null);

/**
 * 用户上麦
 * @param {TakeSeatOptions} params - 上麦参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { takeSeat } = useLiveSeatState('your_live_id');
 * takeSeat({
 *   liveID: 'your_live_id',
 *   seatIndex: 1,
 *   success: () => console.log('上麦成功'),
 *   fail: (code, message) => console.error('上麦失败:', code, message)
 * });
 */
function takeSeat(params: TakeSeatOptions): void {
  callAPI(JSON.stringify({
    api: "takeSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

/**
 * 用户下麦
 * @param {LeaveSeatOptions} params - 下麦参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { leaveSeat } = useLiveSeatState('your_live_id');
 * leaveSeat({
 *   liveID: 'your_live_id',
 *   success: () => console.log('下麦成功'),
 *   fail: (code, message) => console.error('下麦失败:', code, message)
 * });
 */
function leaveSeat(params: LeaveSeatOptions): void {
  callAPI(JSON.stringify({
    api: "leaveSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 静音麦克风
 * @param {MuteMicrophoneOptions} params - 静音参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { muteMicrophone } = useLiveSeatState('your_live_id');
 * muteMicrophone({
 *   liveID: 'your_live_id',
 * });
 */
function muteMicrophone(params: MuteMicrophoneOptions): void {
  callAPI(JSON.stringify({
    api: "muteMicrophone",
    params: params
  }), () => { });
}
/**
 * 取消静音麦克风
 * @param {UnmuteMicrophoneOptions} params - 取消静音参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { unmuteMicrophone } = useLiveSeatState('your_live_id');
 * unmuteMicrophone({
 *   liveID: 'your_live_id',
 *   success: () => console.log('麦克风取消静音成功'),
 *   fail: (code, message) => console.error('麦克风取消静音失败:', code, message)
 * });
 */
function unmuteMicrophone(params: UnmuteMicrophoneOptions): void {
  callAPI(JSON.stringify({
    api: "unmuteMicrophone",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 将用户踢出座位
 * @param {KickUserOutOfSeatOptions} params - 踢出参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { kickUserOutOfSeat } = useLiveSeatState('your_live_id');
 * kickUserOutOfSeat({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   success: () => console.log('踢出用户成功'),
 *   fail: (code, message) => console.error('踢出用户失败:', code, message)
 * });
 */
function kickUserOutOfSeat(params: KickUserOutOfSeatOptions): void {
  callAPI(JSON.stringify({
    api: "kickUserOutOfSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 移动用户到指定座位
 * @param {MoveUserToSeatOptions} params - 移动参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { moveUserToSeat } = useLiveSeatState('your_live_id');
 * moveUserToSeat({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   targetIndex: 1,
 *   success: () => console.log('用户移动成功'),
 *   fail: (code, message) => console.error('用户移动失败:', code, message)
 * });
 */
function moveUserToSeat(params: MoveUserToSeatOptions): void {
  callAPI(JSON.stringify({
    api: "moveUserToSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 锁定座位
 * @param {LockSeatOptions} params - 锁定参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { lockSeat } = useLiveSeatState('your_live_id');
 * lockSeat({
 *   liveID: 'your_live_id',
 *   seatIndex: 2,
 *   success: () => console.log('座位锁定成功'),
 *   fail: (code, message) => console.error('座位锁定失败:', code, message)
 * });
 */
function lockSeat(params: LockSeatOptions): void {
  callAPI(JSON.stringify({
    api: "lockSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 解锁座位
 * @param {UnlockSeatOptions} params - 解锁参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { unlockSeat } = useLiveSeatState('your_live_id');
 * unlockSeat({
 *   liveID: 'your_live_id',
 *   seatIndex: 2,
 *   success: () => console.log('座位解锁成功'),
 *   fail: (code, message) => console.error('座位解锁失败:', code, message)
 * });
 */
function unlockSeat(params: UnlockSeatOptions): void {
  callAPI(JSON.stringify({
    api: "unlockSeat",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 开启远程摄像头
 * @param {OpenRemoteCameraOptions} params - 开启摄像头参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { openRemoteCamera } = useLiveSeatState('your_live_id');
 * openRemoteCamera({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   policy: 'UNLOCK_ONLY',
 *   success: () => console.log('远程摄像头开启成功'),
 *   fail: (code, message) => console.error('远程摄像头开启失败:', code, message)
 * });
 */
function openRemoteCamera(params: OpenRemoteCameraOptions): void {
  callAPI(JSON.stringify({
    api: "openRemoteCamera",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 关闭远程摄像头
 * @param {CloseRemoteCameraOptions} params - 关闭摄像头参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { closeRemoteCamera } = useLiveSeatState('your_live_id');
 * closeRemoteCamera({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   success: () => console.log('远程摄像头关闭成功'),
 *   fail: (code, message) => console.error('远程摄像头关闭失败:', code, message)
 * });
 */
function closeRemoteCamera(params: CloseRemoteCameraOptions): void {
  callAPI(JSON.stringify({
    api: "closeRemoteCamera",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 开启远程麦克风
 * @param {OpenRemoteMicrophoneOptions} params - 开启麦克风参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { openRemoteMicrophone } = useLiveSeatState('your_live_id');
 * openRemoteMicrophone({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   policy: 'UNLOCK_ONLY',
 *   success: () => console.log('远程麦克风开启成功'),
 *   fail: (code, message) => console.error('远程麦克风开启失败:', code, message)
 * });
 */
function openRemoteMicrophone(params: OpenRemoteMicrophoneOptions): void {
  callAPI(JSON.stringify({
    api: "openRemoteMicrophone",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}
/**
 * 关闭远程麦克风
 * @param {CloseRemoteMicrophoneOptions} params - 关闭麦克风参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { closeRemoteMicrophone } = useLiveSeatState('your_live_id');
 * closeRemoteMicrophone({
 *   liveID: 'your_live_id',
 *   userID: '用户 ID',
 *   success: () => console.log('远程麦克风关闭成功'),
 *   fail: (code, message) => console.error('远程麦克风关闭失败:', code, message)
 * });
 */
function closeRemoteMicrophone(params: CloseRemoteMicrophoneOptions): void {
  callAPI(JSON.stringify({
    api: "closeRemoteMicrophone",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

type ListenerCallback = (eventData: string) => void;
const listenerIDMap = new WeakMap<ListenerCallback, string>();
const listenerLiveIDMap = new WeakMap<ListenerCallback, string>();
let listenerIDCounter = 0;
function getOrCreateListenerID(listener: ListenerCallback): string {
  let id = listenerIDMap.get(listener);
  if (id === undefined) {
    id = `liveseat_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加座位事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onLocalCameraOpenedByAdmin'(本地摄像头被管理员开启)<br>'onLocalCameraClosedByAdmin'(本地摄像头被管理员关闭)<br>'onLocalMicrophoneOpenedByAdmin'(本地麦克风被管理员开启)<br>'onLocalMicrophoneClosedByAdmin'(本地麦克风被管理员关闭)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { addLiveSeatEventListener } = useLiveSeatState('your_live_id');
 * addLiveSeatEventListener('your_live_id', 'onLocalCameraOpenedByAdmin', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addLiveSeatEventListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "LiveSeatStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除座位事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onLocalCameraOpenedByAdmin'(本地摄像头被管理员开启)<br>'onLocalCameraClosedByAdmin'(本地摄像头被管理员关闭)<br>'onLocalMicrophoneOpenedByAdmin'(本地麦克风被管理员开启)<br>'onLocalMicrophoneClosedByAdmin'(本地麦克风被管理员关闭)
 * @param {(eventData: string) => void} listener - 事件监听器函数，需要传入添加时相同的函数引用
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { addLiveSeatEventListener, removeLiveSeatEventListener } = useLiveSeatState('your_live_id');
 * const onCameraOpened = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addLiveSeatEventListener('your_live_id', 'onLocalCameraOpenedByAdmin', onCameraOpened);
 * // 移除监听时传入相同的函数引用
 * removeLiveSeatEventListener('your_live_id', 'onLocalCameraOpenedByAdmin', onCameraOpened);
 */
function removeLiveSeatEventListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = getOrCreateListenerID(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "LiveSeatStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

const BINDABLE_DATA_NAMES = [
  "seatList",
  "canvas",
  "speakingUsers"
] as const;

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (!liveID || currentLive.value?.liveID !== liveID) {
    return;
  }
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "LiveSeatStore",
      name: dataName,
      roomID: liveID,
      listenerID: "LiveSeatStore",
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        // console.log(`[LiveSeatState][${liveID}][${dataName}] result:`, result);
        onLiveSeatStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[LiveSeatState][${liveID}][${dataName}] Error:`, error);
      }
    });
  });
  // 注册完成后启动数据看门狗:窗口内 canvas/seatList 未到达则自动重绑自愈
  // (补救推送被异步注册窗口错过的竞态,见 armSeatDataWatchdog 注释)。
  armSeatDataWatchdog();
}

function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "LiveSeatStore",
      name: dataName,
      roomID: liveID,
      listenerID: "LiveSeatStore",
      params: {}
    });
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
  // 解绑时撤销看门狗并复位重试计数,避免退房后误触发重绑。
  clearSeatDataWatchdog();
  seatDataWatchdogRetries = 0;
}

// 重绑 LiveSeatStore 监听:进房数据(canvas/seatList)错过监听注册窗口时的补救。
// 竞态:bindEvent 的 addListener 经桥接层异步派发注册,进房期主线程繁忙时,
// native 的 canvas/seatList 推送可能落在注册完成之前被永久错过(数据未变化
// 不再重推)——表现为进房画面用 SDK 默认布局(左上角小图)、挂件不渲染,直到
// 后续某次座位/模板事件重推才就位。unbind→add 走桥接层 isNewListener 路径
// 重新通知 native 注册,给数据链一次重建机会(注册若带快照回推则立即拿到当前值;
// 即使不回推,后续变化推送也能被接住,严格优于不重绑)。
function rebindSeatStore(): void {
  const id = boundLiveID;
  if (!id) return;
  if (currentLive.value?.liveID !== id) return;
  unbindEvent(id);
  bindEvent(id);
}

// 【数据链看门狗·内部自愈】bindEvent 后启动:窗口内 canvas/seatList 仍未到达则
// 自动重绑(内部调 rebindSeatStore,不暴露对外接口)。到点自查数据是否已到:
// 已到则复位重试计数;未到则重绑再等一轮,最多重试 2 次后放弃(避免异常场景
// 无限循环)。退房解绑时撤销。视图层无需感知,数据链自我修复。
const SEAT_DATA_WATCHDOG_MS = 3000;
let seatDataWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let seatDataWatchdogRetries = 0;
function clearSeatDataWatchdog(): void {
  if (seatDataWatchdogTimer) {
    clearTimeout(seatDataWatchdogTimer);
    seatDataWatchdogTimer = null;
  }
}
function armSeatDataWatchdog(): void {
  clearSeatDataWatchdog();
  seatDataWatchdogTimer = setTimeout(() => {
    seatDataWatchdogTimer = null;
    const canvasArrived = !!canvas.value;
    const seatArrived = (seatList.value || []).length > 0;
    if (canvasArrived && seatArrived) {
      seatDataWatchdogRetries = 0; // 数据已到,复位计数(下个房间重新计)
      return;
    }
    if (seatDataWatchdogRetries >= 2) return; // 两轮重绑仍无数据,放弃
    seatDataWatchdogRetries++;
    rebindSeatStore();
    // rebindSeatStore → bindEvent 会重新 arm 看门狗
  }, SEAT_DATA_WATCHDOG_MS);
}

let stopWatchingCurrentLive: (() => void) | null = null;

// 重置座位相关状态为初值:退房/切换房间时清空,避免上个房间的 seatList/canvas 残留到新房间。
function resetSeatState(): void {
  seatList.value = [];
  canvas.value = null;
  speakingUsers.value = null;
}

function ensureWatchCurrentLive() {
  if (stopWatchingCurrentLive) return;
  stopWatchingCurrentLive = watch(
    () => currentLive.value,
    (newVal: any) => {
      // currentLive 可能被 native 或本地 leaveLive 推为 null:
      // - liveID 为空/null → 视为退房,解绑 + 重置状态;
      // - liveID 变化 → 切房间,重绑;
      // - liveID 不变(同房内 viewCount 等字段更新)→ 空分支保护,不动订阅避免推送丢失。
      // flush:'sync' 保证 room→null→room 快速切换时 null 过渡不被合并丢弃。
      const newLiveID = newVal?.liveID ?? '';
      if (newLiveID === '') {
        if (boundLiveID) {
          unbindEvent(boundLiveID);
        }
        resetSeatState();
      } else if (newLiveID !== boundLiveID) {
        resetSeatState();
        bindEvent(newLiveID);
      }
    },
    // immediate:建立 watch 时 currentLive 可能已就绪(如冷启动 native 先推、
    // 页面/组件后建 watch)——不回放当前值则永不 bind,数据链断。
    // 首次建立时 currentLive 为 null 走 '' 分支,reset 对空状态无副作用。
    { flush: 'sync', immediate: true }
  );
}

const onLiveSeatStoreChanged: Record<string, (result: any) => void> = {
  seatList: (res) => {
    console.log(`[LiveSeatState] seatList:`, res);
    seatList.value = safeJsonParse<SeatInfo[]>(res.seatList, []);
  },
  canvas: (res) => {
    canvas.value = safeJsonParse<LiveCanvasParams | null>(res.canvas, null);
  },
  speakingUsers: (res) => {
    speakingUsers.value = safeJsonParse<Map<string, number> | null>(res.speakingUsers, null);
  }
};

export function useLiveSeatState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    seatList,                // 座位列表
    canvas,                  // 画布信息
    speakingUsers,           // 正在说话的用户列表

    takeSeat,                // 用户上麦
    leaveSeat,               // 用户下麦
    muteMicrophone,          // 静音麦克风
    unmuteMicrophone,        // 取消静音麦克风
    kickUserOutOfSeat,       // 将用户踢出座位
    moveUserToSeat,          // 移动用户到指定座位
    lockSeat,                // 锁定座位
    unlockSeat,              // 解锁座位
    openRemoteCamera,        // 开启远程摄像头
    closeRemoteCamera,       // 关闭远程摄像头
    openRemoteMicrophone,    // 开启远程麦克风
    closeRemoteMicrophone,   // 关闭远程麦克风

    addLiveSeatEventListener,    // 添加座位事件监听
    removeLiveSeatEventListener, // 移除座位事件监听
  };
}

export default useLiveSeatState;