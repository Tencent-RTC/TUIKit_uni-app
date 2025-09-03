import { ref } from "vue";
import {
  MessageInfo,
  SendTextMessageOptions,
  SendCustomMessageOptions,
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// 1. 响应式状态定义
const messageList = ref<MessageInfo[]>([]);

// 3. 统一调用方法
function callUTSFunction(funcName: string, args?: any) {
  const defaultCallback = {
    success: (result: string) => {
      console.log(`BarrageState.${funcName} success:`, result);
    },
    fail: (errCode: number, errMsg: string) => {
      console.error(`BarrageState.${funcName} failed:`, errCode, errMsg);
    },
  };

  const finalArgs = args ? { ...args, ...defaultCallback } : defaultCallback;

  try {
    getV2RTCRoomEngineManager()[funcName](finalArgs);
  } catch (error) {
    console.error(`BarrageState.${funcName} error:`, error);
  }
}

// 4. 方法封装
/**
 * 发送文本消息
 */
function sendTextMessage(params: SendTextMessageOptions) {
  callUTSFunction("sendTextMessage", params);
}

/**
 * 发送自定义消息
 */
function sendCustomMessage(params: SendCustomMessageOptions) {
  callUTSFunction("sendCustomMessage", params);
}

const onBarrageStoreChanged = (eventName: string, res: string) => {
  try {
    if (eventName === "messageList") {
      const data = JSON.parse(res);
      messageList.value = data;
    }
  } catch (error) {
    console.error("onBarrageStoreChanged JSON parse error:", error);
  }
};
// 6. 事件绑定管理
function bindEvent(liveId: string) {
  getV2RTCRoomEngineManager().on(
    "barrageStoreChanged",
    onBarrageStoreChanged,
    liveId
  );
}

// 8. Composition API 导出
export function useBarrageState(liveId: string) {
  bindEvent(liveId);
  return {
    // 响应式状态
    messageList,

    // 操作方法 - 最简化调用，状态通过事件更新
    sendTextMessage,
    sendCustomMessage,

    // 统一调用方法
    callUTSFunction,
  };
}

export default useBarrageState;
