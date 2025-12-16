/**
 * @module BarrageState
 * 弹幕管理管理模块
 * @module_description
 * 核心功能：处理直播间内的文本消息、自定义消息等弹幕功能，支持弹幕发送、消息状态同步等。
 * 技术特点：支持高并发消息处理、实时消息同步、消息过滤、表情包支持等高级功能。
 * 业务价值：为直播平台提供核心的互动能力，增强用户参与度和直播氛围。
 * 应用场景：弹幕互动、消息管理、表情包、聊天室等社交互动场景。
 */
import { ref } from "vue";
import {
  SendTextMessageOptions, SendCustomMessageOptions, BarrageParam, AppendLocalTipOptions
} from "@/uni_modules/tuikit-atomic-x";

import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";


/**
 * 当前房间的弹幕消息列表
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
 *     newMessages.forEach(msg => {
 *       console.log('消息内容:', msg.content);
 *       console.log('发送者:', msg.sender);
 *     });
 *   }
 * });
 * 
 * // 获取当前弹幕列表
 * const messages = messageList.value;
 * console.log('当前弹幕数量:', messages.length);
 */
const messageList = ref<BarrageParam[]>([]);

/**
 * 是否允许发送消息
 * @type {Ref<boolean>}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { allowSendMessage } = useBarrageState('your_live_id');
 * 
 * // 监听消息发送权限变化
 * watch(allowSendMessage, (newAllow) => {
 *   console.log('是否允许发送消息:', newAllow);
 * });
 * 
 * // 检查当前是否允许发送消息
 * const allowSend = allowSendMessage.value;
 * if (allowSend) {
 *   console.log('已启用消息发送功能');
 * }
 */
const allowSendMessage = ref<boolean>(false);

/**
 * 发送文本类型弹幕。
 * @param {SendTextMessageOptions} params - 发送文本弹幕参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendTextMessage } = useBarrageState('your_live_id');
 * sendTextMessage({ liveID: "your_live_id", text: 'Hello World' });
 */
function sendTextMessage(params : SendTextMessageOptions) : void {
  callUTSFunction("sendTextMessage", params);
}

/**
 * 添加本地提示消息。
 * @param {AppendLocalTipOptions} params - 添加本地提示消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { appendLocalTip } = useBarrageState('your_live_id');
 * appendLocalTip({ liveID: "your_live_id", message: { text: 'Hello World' } });
 */
function appendLocalTip(params : AppendLocalTipOptions) : void {
  getRTCRoomEngineManager()["appendLocalTip"](params);
}

/**
 * 发送自定义类型弹幕。
 * @param {SendCustomMessageOptions} params - 发送自定义类型弹幕参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendCustomMessage } = useBarrageState('your_live_id');
 * sendCustomMessage({ liveID: "your_live_id", businessID: "livekit", data: JSON.stringify("my custom message"});
 */
function sendCustomMessage(params : SendCustomMessageOptions) : void {
  callUTSFunction("sendCustomMessage", params);
}

const onBarrageStoreChanged = (eventName : string, res : string) : void => {
  try {
    if (eventName === "messageList") {
      const data = safeJsonParse<BarrageParam[]>(res, []);
      messageList.value = data;
    } else if (eventName === "allowSendMessage") {
      const data = safeJsonParse<boolean>(res, false);
      allowSendMessage.value = data;
    }
  } catch (error) {
    console.error("onBarrageStoreChanged JSON parse error:", error);
  }
};

function bindEvent(liveID : string) {
  getRTCRoomEngineManager().on("barrageStoreChanged", onBarrageStoreChanged, liveID);
}
export function useBarrageState(liveID : string) {
  bindEvent(liveID);
  return {
    messageList,         // 当前房间的弹幕消息列表

    // allowSendMessage, // 是否允许发送消息 TODO：待支持
    sendTextMessage,     // 发送文本消息方法
    sendCustomMessage,   // 发送自定义消息方法
    appendLocalTip       // 添加本地提示消息方法
  };
}

export default useBarrageState;