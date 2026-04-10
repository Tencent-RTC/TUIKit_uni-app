/**
 * @module GiftState
 * @module_description
 * 礼物互动管理模块
 * 核心功能：管理直播间礼物的发送、接收、展示等礼物互动功能，支持普通礼物和自定义礼物类型。
 * 技术特点：支持礼物列表管理、礼物发送与接收事件监听、礼物动画展示等高级功能。
 * 业务价值：为直播平台提供核心的礼物打赏能力，是直播变现的重要途径。
 * 应用场景：礼物打赏、礼物动画、礼物排行榜、自定义礼物等直播打赏互动场景。
 */
import { ref, watch } from "vue";
import { callAPI, addListener, removeListener, HybridResponseData, reportUIPlatform } from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 礼物参数类型定义
 * @typedef {Object} GiftParam
 * @property {String} giftID - 礼物唯一标识
 * @property {String} name - 礼物名称
 * @property {String} desc - 礼物描述
 * @property {String} iconURL - 礼物图标URL
 * @property {String} resourceURL - 礼物动画资源URL
 * @property {number} level - 礼物等级
 * @property {number} coins - 礼物价格（金币）
 * @property {Map<String, String>} extensionInfo - 扩展信息
 * @memberof module:GiftState
 */
export type GiftParam = {
  giftID: String;
  name: String;
  desc: String;
  iconURL: String;
  resourceURL: String;
  level: number;
  coins: number;
  extensionInfo: Map<String, String>;
};

/**
 * 礼物分类参数类型定义
 * @typedef {Object} GiftCategoryParam
 * @property {string} [categoryID] - 分类ID
 * @property {string} [name] - 分类名称
 * @property {string} [desc] - 分类描述
 * @property {Map<string, string>} [extensionInfo] - 扩展信息
 * @property {GiftParam[]} [giftList] - 分类下的礼物列表
 * @memberof module:GiftState
 */
export type GiftCategoryParam = {
  categoryID?: string;
  name?: string;
  desc?: string;
  extensionInfo?: Map<string, string>;
  giftList?: GiftParam[];
};

/**
 * 刷新可用礼物列表参数
 * @interface RefreshUsableGiftsOptions
 */
export type RefreshUsableGiftsOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 发送礼物参数
 * @interface SendGiftOptions
 */
export type SendGiftOptions = {
  liveID: string;
  giftID: string;
  count: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 设置礼物语言参数
 * @interface SetLanguageOptions
 */
export type SetLanguageOptions = {
  liveID: string;
  language: string; //("zh-CN" for Chinese, "en" for English)
}

/**
 * 可用礼物列表
 * @type {Ref<GiftCategoryParam[]>}
 * @memberof module:GiftState
 */
const usableGifts = ref<GiftCategoryParam[]>([]);

/**
 * 刷新可用礼物列表
 * @param {RefreshUsableGiftsOptions} params - 刷新礼物列表参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { refreshUsableGifts } = useGiftState("your_live_id");
 * refreshUsableGifts({});
 */
function refreshUsableGifts(params: RefreshUsableGiftsOptions): void {
  callAPI(JSON.stringify({
    api: "refreshUsableGifts",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
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
 * 发送礼物
 * @param {SendGiftOptions} params - 发送礼物参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { sendGift } = useGiftState("your_live_id")
 * sendGift({ liveID: 'your_live_id', giftID: "gift001", count: 1 });
 */
function sendGift(params: SendGiftOptions): void {
  callAPI(JSON.stringify({
    api: "sendGift",
    params: params
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
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
 * 设置礼物语言
 * @param {SetLanguageOptions} params - 设置语言参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { setLanguage } = useGiftState("your_live_id");
 * setLanguage({ liveID: 'your_live_id', language: 'zh' });
 */
function setLanguage(params: SetLanguageOptions): void {
  callAPI(JSON.stringify({
    api: "setLanguage",
    params: params
  }), (res: string) => { });
}

type ListenerCallback = (eventData: string) => void;
const listenerIDMap = new WeakMap<ListenerCallback, string>();
// 记录每个 listener 注册时的 liveID，remove 时用记录值兜底，避免上层 uni.$liveID 被清空导致 roomID 不匹配
const listenerLiveIDMap = new WeakMap<ListenerCallback, string>();
let listenerIDCounter = 0;
function getOrCreateListenerID(listener: ListenerCallback): string {
  let id = listenerIDMap.get(listener);
  if (id === undefined) {
    id = `gift_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加礼物事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveGift'(收到礼物)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { addGiftListener } = useGiftState("your_live_id");
 * addGiftListener('your_live_id', 'onReceiveGift', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addGiftListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "GiftStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除礼物事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveGift'(收到礼物)
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { removeGiftListener } = useGiftState("your_live_id")
 * removeGiftListener('your_live_id', 'onReceiveGift', 'listener_001');
 */
function removeGiftListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "GiftStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

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

  addListener({
    type: "state",
    store: "GiftStore",
    name: "usableGifts",
    roomID: liveID,
    params: {}
  }, (data: string) => {
    try {
      const result = safeJsonParse<any>(data, {});
      console.log(`[${liveID}][usableGifts] Data:`, result);
      usableGifts.value = safeJsonParse<GiftCategoryParam[]>(result.usableGifts, []);
    } catch (error) {
      console.error(`[${liveID}][usableGifts] Error:`, error);
    }
  });
}

/**
 * 解除事件监听（内部方法）
 */
function unbindEvent(liveID: string): void {
  removeListener({
    type: "state",
    store: "GiftStore",
    name: "usableGifts",
    roomID: liveID,
    params: {}
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

/**
 * 礼物状态管理 Hook
 * @param {string} liveID - 直播间ID
 * @returns {Object} 礼物状态和方法集合
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { usableGifts, refreshUsableGifts, sendGift } = useGiftState("your_live_id");
 */
export function useGiftState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    usableGifts,         // 可用礼物列表

    refreshUsableGifts,  // 刷新可用礼物列表
    sendGift,            // 发送礼物
    setLanguage,         // 设置礼物显示语言
    addGiftListener,     // 添加礼物事件监听
    removeGiftListener   // 移除礼物事件监听
  };
}
export default useGiftState;