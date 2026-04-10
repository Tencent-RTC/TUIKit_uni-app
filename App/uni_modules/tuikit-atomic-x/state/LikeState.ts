/**
 * @module LikeState
 * @module_description
 * 点赞互动管理模块
 * 核心功能：处理直播间的点赞功能，支持点赞发送、点赞统计、点赞事件监听等互动功能。
 * 技术特点：支持高并发点赞处理、实时点赞统计、点赞动画效果、点赞排行榜等高级功能。
 * 业务价值：为直播平台提供基础的互动能力，增强用户参与度和直播氛围。
 * 应用场景：点赞互动、人气统计、互动效果、用户参与等基础互动场景。
 */
import { ref, watch } from "vue";
import { callAPI, addListener, removeListener, reportUIPlatform } from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 发送点赞参数
 * @interface SendLikeOptions
 */
export type SendLikeOptions = {
  liveID: string;
  count: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 总点赞数量
 * @type {Ref<number>}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { totalLikeCount } = useLikeState('your_live_id');
 *
 * // 监听总点赞数量变化
 * watch(totalLikeCount, (newCount) => {
 *   console.log('总点赞数量:', newCount);
 * });
 *
 * // 获取当前总点赞数量
 * const likeCount = totalLikeCount.value;
 * console.log('当前获赞数:', likeCount);
 */
const totalLikeCount = ref<number>(0);

/**
 * 发送点赞
 * @param {SendLikeOptions} params - 点赞参数
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { sendLike } = useLikeState("your_live_id");
 * sendLike({ liveID: 'your_live_id', count: 1 });
 */
function sendLike(params: SendLikeOptions): void {
  callAPI(JSON.stringify({
    api: "sendLike",
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
    id = `like_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加点赞事件监听
 * @param {string} liveID - 直播ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveLikesMessage'(收到点赞消息)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { addLikeListener } = useLikeState("your_live_id");
 * addLikeListener('your_live_id', 'onReceiveLikesMessage', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addLikeListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "LikeStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除点赞事件监听
 * @param {string} liveID - 直播ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveLikesMessage'(收到点赞消息)
 * @param {(eventData: string) => void} listener - 事件监听器函数，需要传入添加时相同的函数引用
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { addLikeListener, removeLikeListener } = useLikeState("your_live_id");
 * const onReceiveLikes = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addLikeListener('your_live_id', 'onReceiveLikesMessage', onReceiveLikes);
 * // 移除监听时传入相同的函数引用
 * removeLikeListener('your_live_id', 'onReceiveLikesMessage', onReceiveLikes);
 */
function removeLikeListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "LikeStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  addListener({
    type: "state",
    store: "LikeStore",
    name: "totalLikeCount",
    roomID: liveID,
    params: {}
  }, (data: string) => {
    try {
      const result = safeJsonParse<any>(data, {});
      console.log(`[like][totalLikeCount] Data:`, result);
      totalLikeCount.value = safeJsonParse<number>(result.totalLikeCount, 0);
    } catch (error) {
      console.error(`[like][totalLikeCount] Error:`, error);
    }
  });
}

function unbindEvent(liveID: string): void {
  removeListener({
    type: "state",
    store: "LikeStore",
    name: "totalLikeCount",
    roomID: liveID,
    params: {}
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
}

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

export function useLikeState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    totalLikeCount,       // 总点赞数量
    sendLike,             // 发送点赞
    addLikeListener,      // 添加点赞事件监听
    removeLikeListener,   // 移除点赞事件监听
  };
}
export default useLikeState;