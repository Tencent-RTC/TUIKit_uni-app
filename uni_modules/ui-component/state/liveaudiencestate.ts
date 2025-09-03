import { ref } from "vue";
import {
  AudienceInfo,
  FetchAudienceListOptions,
  SetAdministratorOptions,
  RevokeAdministratorOptions,
  KickUserOutOfRoomOptions,
  DisableSendMessageOptions,
} from "@/uni_modules/ui-component";
// 响应式状态
const audienceList = ref<AudienceInfo[]>([]);
const audienceListCursor = ref<number>(0);
;
// 获取管理器实例（单例模式）
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
function callUTSFunction(funcName: string, args?: any) {
  // 创建默认的日志callback
  const defaultCallback = {
    success: (res?: string) => {
      console.log(`[${funcName}] Success:`, {
        funcName,
        args: JSON.stringify(args),
        result: res,
      });
    },
    fail: (errCode?: number, errMsg?: string) => {
      console.error(`[${funcName}] Failed:`, {
        funcName,
        args: JSON.stringify(args),
        errCode,
        errMsg,
      });
    },
  };

  // 准备最终的参数对象
  let finalArgs = args || {};

  // 如果args中没有callback，则添加默认callback
  if (!finalArgs.success && !finalArgs.fail) {
    finalArgs = {
      ...finalArgs,
      ...defaultCallback,
    };
  }

  // 直接调用UTS层
  try {
    console.log(`[${funcName}] Calling with args:`, finalArgs);

    // 直接传递对象给UTS层
    getV2RTCRoomEngineManager()[funcName](finalArgs);
  } catch (error) {
    console.error(`[${funcName}] Error calling UTS function:`, error);
    // 如果有失败回调，调用它
    if (finalArgs.fail) {
      finalArgs.fail(-1, `Failed to call ${funcName}: ${error}`);
    }
  }
}

// 方法封装 - callback直接在params中
function fetchAudienceList(params?: FetchAudienceListOptions) {
  callUTSFunction("fetchAudienceList", params || {});
}

function setAdministrator(params: SetAdministratorOptions) {
  callUTSFunction("setAdministrator", params);
}

function revokeAdministrator(params: RevokeAdministratorOptions) {
  callUTSFunction("revokeAdministrator", params);
}

function kickUserOutOfRoom(params: KickUserOutOfRoomOptions) {
  callUTSFunction("kickUserOutOfRoom", params);
}

function disableSendMessage(params: DisableSendMessageOptions) {
  callUTSFunction("disableSendMessage", params);
}

const onLiveAudienceStoreChanged = (eventName: string, res: string) => {
  try {
    if (eventName === "audienceList") {
      const data = JSON.parse(res);
      audienceList.value = data;
    }
    if (eventName === "audienceListCursor") {
      const data = JSON.parse(res);
      audienceListCursor.value = data;
    }
  } catch (error) {
    console.error("onLiveAudienceStoreChanged JSON parse error:", error);
  }
};

// 事件绑定
function bindEvent(liveId: string) {
  getV2RTCRoomEngineManager().on(
    "liveAudienceStoreChanged",
    onLiveAudienceStoreChanged,
    liveId
  );
}

// 导出 Composition API
export function useLiveAudienceState(liveId: string) {
  bindEvent(liveId);
  return {
    // 响应式状态 - 直接返回ref，不使用readonly包装
    audienceList,
    audienceListCursor,

    // 方法 - callback在params中
    fetchAudienceList,
    setAdministrator,
    revokeAdministrator,
    kickUserOutOfRoom,
    disableSendMessage,

    // 通用UTS调用方法
    callUTSFunction,
  };
}


export default useLiveAudienceState;
