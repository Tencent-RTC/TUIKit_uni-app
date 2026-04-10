/**
 * @module LiveAudienceState
 * @module_description
 * 直播间观众状态管理模块
 * 核心功能：管理直播间观众列表，提供观众权限控制、管理员设置等直播间秩序维护功能。
 * 技术特点：支持实时观众列表更新、权限分级管理、批量操作等高级功能，确保直播间秩序和用户体验。
 * 业务价值：为直播平台提供完整的观众管理解决方案，支持大规模观众场景下的秩序维护。
 * 应用场景：观众管理、权限控制、直播间秩序维护、观众互动管理等核心业务场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener
} from "@/uni_modules/tuikit-atomic-x";
import { LiveUserInfoParam, currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 获取观众列表参数
 * @interface FetchAudienceListOptions
 */
export type FetchAudienceListOptions = {
  liveID: string
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 设置管理员参数
 * @interface SetAdministratorOptions
 */
export type SetAdministratorOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 撤销管理员参数
 * @interface RevokeAdministratorOptions
 */
export type RevokeAdministratorOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 踢出房间参数
 * @interface KickUserOutOfRoomOptions
 */
export type KickUserOutOfRoomOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 禁用发送消息参数
 * @interface DisableSendMessageOptions
 */
export type DisableSendMessageOptions = {
  liveID: string;
  userID: string;
  isDisable: boolean;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 直播间观众列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { audienceList } = useLiveAudienceState('your_live_id');
 *
 * // 监听观众列表变化
 * watch(audienceList, (newAudienceList) => {
 *   if (newAudienceList && newAudienceList.length > 0) {
 *     console.log('观众列表更新:', newAudienceList);
 *     newAudienceList.forEach(audience => {
 *       console.log('观众ID:', audience.userID);
 *     });
 *   }
 * });
 *
 * // 获取当前观众列表
 * const audiences = audienceList.value;
 * console.log('当前观众数:', audiences.length);
 */
const audienceList = ref<LiveUserInfoParam[]>([]);

/**
 * 直播间观众数量
 * @type {Ref<number>}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { audienceCount } = useLiveAudienceState('your_live_id');
 *
 * // 监听观众数量变化
 * watch(audienceCount, (newCount) => {
 *   console.log('观众数量更新:', newCount);
 *   // 当观众数量达到某个阈值时可以进行特殊处理
 *   if (newCount >= 100) {
 *     console.log('直播热度很高，观众数超过100');
 *   }
 * });
 *
 * // 获取当前观众数量
 * const count = audienceCount.value;
 * console.log('当前观众数量:', count);
 */
const audienceCount = ref<number>(0);

/**
 * 被禁止发送消息的用户列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { messageBannedUserList } = useLiveAudienceState('your_live_id');
 *
 * // 监听禁言用户列表变化
 * watch(messageBannedUserList, (newList) => {
 *   console.log('禁言用户列表更新:', newList);
 * });
 */
const messageBannedUserList = ref<LiveUserInfoParam[]>([]);

/**
 * 获取直播间观众列表
 * @param {FetchAudienceListOptions} [params] - 获取观众列表参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { fetchAudienceList } = useLiveAudienceState("your_live_id");
 * fetchAudienceList({
 *   liveID: 'your_live_id',
 * });
 */
function fetchAudienceList(params?: FetchAudienceListOptions): void {
  callAPI(JSON.stringify({
    api: "fetchAudienceList",
    params: params || {},
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
 * 设置管理员
 * @param {SetAdministratorOptions} params - 设置管理员参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { setAdministrator } = useLiveAudienceState("your_live_id");
 * setAdministrator({ liveID: 'your_live_id', userID: 'user123' });
 */
function setAdministrator(params: SetAdministratorOptions): void {
  callAPI(JSON.stringify({
    api: "setAdministrator",
    params: params,
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
 * 撤销管理员权限
 * @param {RevokeAdministratorOptions} params - 撤销管理员参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { revokeAdministrator } = useLiveAudienceState("your_live_id");
 * revokeAdministrator({ liveID: 'your_live_id', userID: 'user123' });
 */
function revokeAdministrator(params: RevokeAdministratorOptions): void {
  console.error('revokeAdministrator: ', params)
  callAPI(JSON.stringify({
    api: "revokeAdministrator",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('revokeAdministrator =====>: ', data)
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
 * 将用户踢出直播间
 * @param {KickUserOutOfRoomOptions} params - 踢出用户参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { kickUserOutOfRoom } = useLiveAudienceState("your_live_id");
 * kickUserOutOfRoom({ liveID: 'your_live_id', userID: 'user123' });
 */
function kickUserOutOfRoom(params: KickUserOutOfRoomOptions): void {
  callAPI(JSON.stringify({
    api: "kickUserOutOfRoom",
    params: params,
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
 * 禁用用户发送消息
 * @param {DisableSendMessageOptions} params - 禁用发送消息参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { disableSendMessage } = useLiveAudienceState("your_live_id");
 * disableSendMessage({ liveID: 'your_live_id', userID: 'user123', isDisable: true });
 */
function disableSendMessage(params: DisableSendMessageOptions): void {
  console.error('disableSendMessage: ', params)
  callAPI(JSON.stringify({
    api: "disableSendMessage",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('disableSendMessage =====>: ', data)
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
    id = `audience_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}

/**
 * 添加观众事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onAudienceJoined'(观众加入)<br>'onAudienceLeft'(观众离开)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { addAudienceListener } = useLiveAudienceState("your_live_id");
 * addAudienceListener('your_live_id', 'onAudienceJoined', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addAudienceListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "LiveAudienceStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除观众事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onAudienceJoined'(观众加入)<br>'onAudienceLeft'(观众离开)
 * @param {string} listenerID - 监听器ID, 用于标识监听器,需保证唯一，删除时需要传入相同的listenerID
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { removeAudienceListener } = useLiveAudienceState("your_live_id");
 * removeAudienceListener('your_live_id', 'onAudienceJoined', 'listener_001');
 */
function removeAudienceListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "LiveAudienceStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

const BINDABLE_DATA_NAMES = [
  "audienceList",
  "audienceCount",
  "messageBannedUserList"
] as const;

/**
 * 绑定事件监听（内部方法）
 * 同一个 liveID 只绑定一次，通过 boundLiveID 防止重复绑定
 */
let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  // 已经绑定过该 liveID，无需重复绑定
  if (boundLiveID === liveID) {
    return;
  }

  // 如果之前绑定了其他 liveID，先解绑
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }

  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "LiveAudienceStore",
      name: dataName,
      roomID: liveID,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[${liveID}][${dataName}] Data:`, result);
        onLiveAudienceStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[${liveID}][${dataName}] Error:`, error);
      }
    });
  });
}

/**
 * 解除事件监听（内部方法）
 */
function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "LiveAudienceStore",
      name: dataName,
      roomID: liveID,
      params: {}
    });
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
}

// 监听 currentLive 变化，当 currentLive 为空时自动解绑
let stopWatchingCurrentLive: (() => void) | null = null;

function ensureWatchCurrentLive() {
  if (stopWatchingCurrentLive) return;
  stopWatchingCurrentLive = watch(
    () => currentLive.value,
    (newVal, oldVal) => {
      if (oldVal && oldVal.liveID !== '') {
        if (newVal.liveID === '' && boundLiveID) {
          unbindEvent(boundLiveID);
        }
      }
    }
  );
}

const onLiveAudienceStoreChanged: Record<string, (result: any) => void> = {
  audienceList: (res) => {
    audienceList.value = safeJsonParse<LiveUserInfoParam[]>(res.audienceList, []);
  },
  audienceCount: (res) => {
    audienceCount.value = safeJsonParse<number>(res.audienceCount, 0);
  },
  messageBannedUserList: (res) => {
    messageBannedUserList.value = safeJsonParse<LiveUserInfoParam[]>(res.messageBannedUserList, []);
  }
};

export function useLiveAudienceState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    audienceList,           // 直播间观众列表
    audienceCount,          // 直播间观众数量
    messageBannedUserList,  // 被禁止发送消息的用户列表

    fetchAudienceList,      // 获取观众列表
    setAdministrator,       // 设置管理员
    revokeAdministrator,    // 撤销管理员权限
    kickUserOutOfRoom,      // 将用户踢出直播间
    disableSendMessage,     // 禁用用户发送消息

    addAudienceListener,    // 添加观众事件监听
    removeAudienceListener, // 移除观众事件监听
  };
}

export default useLiveAudienceState;