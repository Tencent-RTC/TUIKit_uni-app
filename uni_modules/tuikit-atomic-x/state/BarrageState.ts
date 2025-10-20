/**
 * 弹幕管理模块
 * @module BarrageState
 */
import { ref } from "vue";
import {
    SendTextMessageOptions, SendCustomMessageOptions, BarrageParam
} from "@/uni_modules/tuikit-atomic-x";

import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 弹幕消息列表
 * @type {Ref<BarrageParam[]>}
 */
const messageList = ref<BarrageParam[]>([]);

/**
 * 是否允许发送消息
 * @type {Ref<boolean>}
 */
const allowSendMessage = ref<boolean>(false);

/**
 * 发送文本消息
 * @param {SendTextMessageOptions} params - 发送消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendTextMessage } = useBarrageState('your_live_id');
 * sendTextMessage({ text: 'Hello World' });
 */
function sendTextMessage(params : SendTextMessageOptions) : void {
    callUTSFunction("sendTextMessage", params);
}

/**
 * 发送自定义消息
 * @param {SendCustomMessageOptions} params - 发送自定义消息参数
 * @returns {void}
 * @memberof module:BarrageState
 * @example
 * import { useBarrageState } from '@/uni_modules/tuikit-atomic-x/state/BarrageState';
 * const { sendCustomMessage } = useBarrageState('your_live_id');
 * sendCustomMessage({ businessID: "livekit", data: JSON.stringify("my custom message"});
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
        messageList,         // 弹幕消息列表

        // allowSendMessage,    // 是否允许发送消息 TODO：待支持
        sendTextMessage,     // 发送文本消息方法
        sendCustomMessage    // 发送自定义消息方法
    };
}

export default useBarrageState;