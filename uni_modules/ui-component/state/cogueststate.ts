import { ref } from "vue";
import {
  SendCoGuestRequestOptions,
  CancelCoGuestRequestOptions,
  AcceptCoGuestRequestOptions,
  RejectCoGuestRequestOptions,
  DisconnectOptions,
  SendOpenDeviceRequestOptions,
  CancelOpenDeviceRequestOptions,
  AcceptOpenDeviceRequestOptions,
  RejectOpenDeviceRequestOptions,
  CloseRemoteDeviceOptions,
  SeatUserInfoParam,
  CoGuestRequestInfo,
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// ============== 导出的枚举类型定义 ==============

/**
 * 连麦嘉宾状态码枚举
 * 对应底层SDK返回的数字状态码
 */
export const CoGuestStatusCode = {
  CONNECTED: 0,
  DISCONNECTED: 1,
  ADMIN_INVITING: 2,
  USER_APPLYING: 3,
} as const;

/**
 * 连麦嘉宾状态码类型
 */
export type CoGuestStatusCodeType = typeof CoGuestStatusCode[keyof typeof CoGuestStatusCode];

/**
 * 连麦嘉宾状态枚举常量
 * 对应连麦嘉宾状态的字符串值
 */
export const CoGuestStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ADMIN_INVITING: 'ADMIN_INVITING',
  USER_APPLYING: 'USER_APPLYING',
} as const;

/**
 * 连麦嘉宾状态类型
 */
export type CoGuestStatusType = typeof CoGuestStatus[keyof typeof CoGuestStatus];

/**
 * 连麦嘉宾用户信息类型
 */
export type CoGuestUserInfo = SeatUserInfoParam;

/**
 * 状态码到状态字符串的映射
 */
const COGUEST_STATUS_MAP: Record<CoGuestStatusCodeType, CoGuestStatusType> = {
  [CoGuestStatusCode.CONNECTED]: CoGuestStatus.CONNECTED,
  [CoGuestStatusCode.DISCONNECTED]: CoGuestStatus.DISCONNECTED,
  [CoGuestStatusCode.ADMIN_INVITING]: CoGuestStatus.ADMIN_INVITING,
  [CoGuestStatusCode.USER_APPLYING]: CoGuestStatus.USER_APPLYING,
} as const;

// ============== 响应式状态定义 ==============

const localStatus = ref<CoGuestStatusType>(CoGuestStatus.DISCONNECTED);
const invitees = ref<CoGuestUserInfo[]>([]);
const applicants = ref<CoGuestUserInfo[]>([]);
const connectedGuests = ref<CoGuestUserInfo[]>([]);
const invitableGuests = ref<CoGuestUserInfo[]>([]);
const latestReceivedRequest = ref<CoGuestRequestInfo | null>(null);
const latestCancelledRequest = ref<CoGuestRequestInfo | null>(null);
const latestAcceptedRequest = ref<CoGuestRequestInfo | null>(null);
const latestRejectedRequest = ref<CoGuestRequestInfo | null>(null);
const latestTimeoutRequest = ref<CoGuestRequestInfo | null>(null);

// ============== 工具函数 ==============

/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
function callUTSFunction(funcName: string, args?: any): void {
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

/**
 * 安全的JSON解析函数
 * @param jsonString JSON字符串
 * @param defaultValue 解析失败时的默认值
 */
function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}

/**
 * 将状态码转换为状态字符串
 * @param statusCode 状态码
 */
function mapStatusCodeToCoGuestStatus(statusCode: number): CoGuestStatusType | null {
  const mappedStatus = COGUEST_STATUS_MAP[statusCode as CoGuestStatusCodeType];
  if (!mappedStatus) {
    console.warn(`Unknown coguest status code: ${statusCode}`);
    return null;
  }
  return mappedStatus;
}

// ============== 业务方法封装 ==============

/**
 * 发送连麦嘉宾请求
 * @param params 连麦嘉宾请求参数
 */
function sendCoGuestRequest(params: SendCoGuestRequestOptions): void {
  const defaultRequestOptionsCallbacks = {
    onAccepted: (requestId: string, userId: string) => {
      console.log("sendCoGuestRequest Success:", {
        sendCoGuestRequest,
        args: JSON.stringify(params),
        result: JSON.stringify({ requestId, userId }),
      });
    },
    onRejected: (requestId: string, userId: string) => {
      console.log("sendCoGuestRequest Success:", {
        sendCoGuestRequest,
        args: JSON.stringify(params),
        result: JSON.stringify({ requestId, userId }),
      });
    },
    onCancelled: (requestId: string, userId: string) => {
      console.log("sendCoGuestRequest Success:", {
        sendCoGuestRequest,
        args: JSON.stringify(params),
        result: JSON.stringify({ requestId, userId }),
      });
    },
    onTimeout: (requestId: string, userId: string) => {
      console.log("sendCoGuestRequest Success:", {
        sendCoGuestRequest,
        args: JSON.stringify(params),
        result: JSON.stringify({ requestId, userId }),
      });
    },
    onError: (
      requestId: string,
      userId: string,
      errCode: number,
      errMsg: string
    ) => {
      console.log("sendCoGuestRequest Success:", {
        sendCoGuestRequest,
        args: JSON.stringify(params),
        result: JSON.stringify({ requestId, userId, errCode, errMsg }),
      });
    },
  };

  // 智能合并回调函数：如果参数中有回调就使用参数中的，没有就使用默认的
  const finalParams = {
    ...params,
    onAccepted: params.onAccepted || defaultRequestOptionsCallbacks.onAccepted,
    onRejected: params.onRejected || defaultRequestOptionsCallbacks.onRejected,
    onCancelled: params.onCancelled || defaultRequestOptionsCallbacks.onCancelled,
    onTimeout: params.onTimeout || defaultRequestOptionsCallbacks.onTimeout,
    onError: params.onError || defaultRequestOptionsCallbacks.onError,
  };

  getV2RTCRoomEngineManager().sendCoGuestRequest(finalParams);
}

/**
 * 取消连麦嘉宾请求
 * @param params 取消连麦嘉宾请求参数
 */
function cancelCoGuestRequest(params?: CancelCoGuestRequestOptions): void {
  callUTSFunction("cancelCoGuestRequest", params || {});
}

/**
 * 接受连麦嘉宾请求
 * @param params 接受连麦嘉宾请求参数
 */
function acceptCoGuestRequest(params?: AcceptCoGuestRequestOptions): void {
  callUTSFunction("acceptCoGuestRequest", params || {});
}

/**
 * 拒绝连麦嘉宾请求
 * @param params 拒绝连麦嘉宾请求参数
 */
function rejectCoGuestRequest(params?: RejectCoGuestRequestOptions): void {
  callUTSFunction("rejectCoGuestRequest", params || {});
}

/**
 * 断开连麦嘉宾连接
 * @param params 断开连接参数
 */
function disconnect(params?: DisconnectOptions): void {
  callUTSFunction("disconnect", params || {});
}

/**
 * 发送开启设备请求
 * @param params 开启设备请求参数
 */
function sendOpenDeviceRequest(params: SendOpenDeviceRequestOptions): void {
  callUTSFunction("sendOpenDeviceRequest", params);
}

/**
 * 取消开启设备请求
 * @param params 取消开启设备请求参数
 */
function cancelOpenDeviceRequest(params: CancelOpenDeviceRequestOptions): void {
  callUTSFunction("cancelOpenDeviceRequest", params);
}

/**
 * 接受开启设备请求
 * @param params 接受开启设备请求参数
 */
function acceptOpenDeviceRequest(params: AcceptOpenDeviceRequestOptions): void {
  callUTSFunction("acceptOpenDeviceRequest", params);
}

/**
 * 拒绝开启设备请求
 * @param params 拒绝开启设备请求参数
 */
function rejectOpenDeviceRequest(params: RejectOpenDeviceRequestOptions): void {
  callUTSFunction("rejectOpenDeviceRequest", params);
}

/**
 * 关闭远程设备
 * @param params 关闭远程设备参数
 */
function closeRemoteDevice(params: CloseRemoteDeviceOptions): void {
  callUTSFunction("closeRemoteDevice", params);
}

// ============== 事件处理 ==============

/**
 * 连麦嘉宾状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onCoGuestStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "localStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToCoGuestStatus(statusCode);

      if (status) {
        localStatus.value = status;
      } else {
        console.error(`Invalid coguest status code received: ${statusCode}`);
      }
    } else if (eventName === "invitees") {
      const data = safeJsonParse<CoGuestUserInfo[]>(res, []);
      invitees.value = data;
    } else if (eventName === "applicants") {
      const data = safeJsonParse<CoGuestUserInfo[]>(res, []);
      applicants.value = data;
    } else if (eventName === "connectedGuests") {
      const data = safeJsonParse<CoGuestUserInfo[]>(res, []);
      connectedGuests.value = data;
    } else if (eventName === "invitableGuests") {
      const data = safeJsonParse<CoGuestUserInfo[]>(res, []);
      invitableGuests.value = data;
    } else if (eventName === "latestReceivedRequest") {
      const data = safeJsonParse<CoGuestRequestInfo | null>(res, null);
      latestReceivedRequest.value = data;
    } else if (eventName === "latestCancelledRequest") {
      const data = safeJsonParse<CoGuestRequestInfo | null>(res, null);
      latestCancelledRequest.value = data;
    } else if (eventName === "latestAcceptedRequest") {
      const data = safeJsonParse<CoGuestRequestInfo | null>(res, null);
      latestAcceptedRequest.value = data;
    } else if (eventName === "latestRejectedRequest") {
      const data = safeJsonParse<CoGuestRequestInfo | null>(res, null);
      latestRejectedRequest.value = data;
    } else if (eventName === "latestTimeoutRequest") {
      const data = safeJsonParse<CoGuestRequestInfo | null>(res, null);
      latestTimeoutRequest.value = data;
    }
  } catch (error) {
    console.error("onCoGuestStoreChanged error:", error);
  }
};

/**
 * 绑定事件监听
 * @param liveId 直播间ID
 */
function bindEvent(liveId: string): void {
  getV2RTCRoomEngineManager().on(
    "coGuestStoreChanged",
    onCoGuestStoreChanged,
    liveId
  );
}

// ============== Composition API 导出 ==============

/**
 * 连麦嘉宾状态管理的Composition API
 * @param liveId 直播间ID
 */
export function useCoGuestState(liveId: string) {
  bindEvent(liveId);

  return {
    // 响应式状态
    localStatus,
    invitees,
    applicants,
    connectedGuests,
    invitableGuests,
    latestReceivedRequest,
    latestCancelledRequest,
    latestAcceptedRequest,
    latestRejectedRequest,
    latestTimeoutRequest,

    // 连麦请求操作方法
    sendCoGuestRequest,
    cancelCoGuestRequest,
    acceptCoGuestRequest,
    rejectCoGuestRequest,
    disconnect,

    // 设备操作方法
    sendOpenDeviceRequest,
    cancelOpenDeviceRequest,
    acceptOpenDeviceRequest,
    rejectOpenDeviceRequest,
    closeRemoteDevice,

    // 工具方法
    callUTSFunction,
  };
}

export default useCoGuestState;
