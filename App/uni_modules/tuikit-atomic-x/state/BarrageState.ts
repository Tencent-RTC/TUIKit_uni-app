/**
 * @module BarrageState
 * @module_description
 * 弹幕管理模块
 * 核心功能：管理直播间弹幕消息，支持文本弹幕发送、自定义弹幕发送、本地提示消息等弹幕互动功能。
 * 技术特点：支持实时弹幕推送、弹幕消息列表管理、自定义消息类型扩展等高级功能。
 * 业务价值：为直播平台提供核心的弹幕互动能力，增强观众参与感和直播氛围。
 * 应用场景：文本弹幕、自定义弹幕、系统提示消息、弹幕互动等直播聊天场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener, HybridResponseData
} from "@/uni_modules/tuikit-atomic-x";
import { LiveUserInfoParam, currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 弹幕消息类型
 * @remarks
 * 可用值：
 * - `TEXT`: 文本类型弹幕
 * - `CUSTOM`: 自定义类型弹幕
 */
export enum BarrageType {
  TEXT = 0,
  CUSTOM = 1,
}

/**
 * 弹幕参数
 * @interface BarrageParam
 */
export type BarrageParam = {
  liveID: string;
  sender: LiveUserInfoParam;
  sequence: number;
  timestampInSecond: number;
  messageType: BarrageType;
  textContent?: string;
  extensionInfo?: Map<string, string>;
  businessID?: string;
  data?: string;
};

/**
 * 发送文本弹幕参数
 * @interface SendTextMessageOptions
 */
export type SendTextMessageOptions = {
  liveID: string;
  text: string;
  extensionInfo?: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 发送自定义类型弹幕参数
 * @interface SendCustomMessageOptions
 */
export type SendCustomMessageOptions = {
  liveID: string;
  businessID: string;
  data: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 添加本地提示消息参数
 * @interface AppendLocalTipOptions
 */
export type AppendLocalTipOptions = {
  liveID: string;
  message: BarrageParam;
}

/**
 * 弹幕消息列表
 * @type {Ref<BarrageParam[]>}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { messageList } = useBarrageState('your_live_id');
 *
 * // 监听弹幕消息列表变化
 * watch(messageList, (newMessages) => {
 *   if (newMessages && newMessages.length > 0) {
 *     console.log('弹幕消息列表更新:', newMessages);
 *     const lastMsg = newMessages[newMessages.length - 1];
 *     console.log('最新弹幕:', lastMsg.textContent);
 *   }
 * });
 *
 * // 获取当前弹幕消息列表
 * const messages = messageList.value;
 * console.log('当前弹幕数量:', messages.length);
 */
const messageList = ref<BarrageParam[]>([]);

/**
 * 发送文本消息
 * @param {SendTextMessageOptions} params - 发送消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendTextMessage } = useBarrageState('your_live_id');
 * sendTextMessage({ liveID: 'your_live_id', text: 'Hello World' });
 */
function sendTextMessage(params: SendTextMessageOptions): void {
  console.error('sendTextMessage: ', params)
  callAPI(JSON.stringify({
    api: "sendTextMessage",
    params: params,
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
 * 发送自定义消息
 * @param {SendCustomMessageOptions} params - 发送自定义消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendCustomMessage } = useBarrageState('your_live_id');
 * sendCustomMessage({ liveID: 'your_live_id', businessID: 'livekit', data: JSON.stringify('my custom message') });
 */
function sendCustomMessage(params: SendCustomMessageOptions): void {
  console.error('sendCustomMessage: ', params)
  callAPI(JSON.stringify({
    api: "sendCustomMessage",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
      console.error('sendCustomMessage =====>: ', data)
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
 * 添加本地提示消息
 * @param {AppendLocalTipOptions} params - 本地提示消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { appendLocalTip } = useBarrageState('your_live_id');
 * appendLocalTip({ liveID: 'your_live_id', message: { liveID: 'your_live_id', sender: { userID: 'user_id' }, sequence: 0, timestampInSecond: 0, messageType: BarrageType.TEXT, textContent: 'tip message' } });
 */
function appendLocalTip(params: AppendLocalTipOptions): void {
  console.error('appendLocalTip: ', params)
  callAPI(JSON.stringify({
    api: "appendLocalTip",
    params: params,
  }), (_res: string) => {
  });
}

const BINDABLE_DATA_NAMES = [
  "messageList",
] as const;

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    // console.error('BarrageStore bindEvent, liveID:', liveID, dataName)
    addListener({
      type: "state",
      store: "BarrageStore",
      name: dataName,
      listenerID: "BarrageStore",
      roomID: liveID,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[barrage][${dataName}] Data:`, result);
        onBarrageStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[barrage][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "BarrageStore",
      name: dataName,
      listenerID: "BarrageStore",
      roomID: liveID,
      params: {}
    });
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

const onBarrageStoreChanged: Record<string, (result: any) => void> = {
  messageList: (res) => {
    messageList.value = safeJsonParse<BarrageParam[]>(res.messageList, []);
  },
};
export function useBarrageState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    messageList,         // 弹幕消息列表

    sendTextMessage,     // 发送文本消息方法
    sendCustomMessage,   // 发送自定义消息方法
    appendLocalTip,      // 添加本地提示消息方法
  };
}

export default useBarrageState;