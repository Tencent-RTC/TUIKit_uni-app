import { ref } from "vue";
import {
  SendCoHostRequestOptions,
  CancelCoHostRequestOptions,
  AcceptCoHostRequestOptions,
  RejectCoHostRequestOptions,
  ExitCoHostOptions,
  SeatUserInfoParam,
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// ============== 导出的枚举类型定义 ==============

/**
 * 连麦状态码枚举
 * 对应底层SDK返回的数字状态码
 */
export const CoHostStatusCode = {
  CONNECTED: 0,
  DISCONNECTED: 1,
  INVITED: 2,
  REQUESTING: 3,
} as const;

/**
 * 连麦状态码类型
 */
export type CoHostStatusCodeType = typeof CoHostStatusCode[keyof typeof CoHostStatusCode];

/**
 * 连麦状态枚举常量
 * 对应连麦状态的字符串值
 */
export const CoHostStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  INVITED: 'INVITED',
  REQUESTING: 'REQUESTING',
} as const;

/**
 * 连麦状态类型
 */
export type CoHostStatusType = typeof CoHostStatus[keyof typeof CoHostStatus];

/**
 * 连麦请求信息类型
 */
export type CoHostRequestInfo = {
  requestId?: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  timestamp?: number;
};

/**
 * 连麦主机信息类型
 */
export type CoHostUserInfo = SeatUserInfoParam;

/**
 * 状态码到状态字符串的映射
 */
const COHOST_STATUS_MAP: Record<CoHostStatusCodeType, CoHostStatusType> = {
  [CoHostStatusCode.CONNECTED]: CoHostStatus.CONNECTED,
  [CoHostStatusCode.DISCONNECTED]: CoHostStatus.DISCONNECTED,
  [CoHostStatusCode.INVITED]: CoHostStatus.INVITED,
  [CoHostStatusCode.REQUESTING]: CoHostStatus.REQUESTING,
} as const;

// ============== 响应式状态定义 ==============

const localStatus = ref<CoHostStatusType>(CoHostStatus.DISCONNECTED);
const invitees = ref<CoHostUserInfo[]>([]); // 被邀请的人
const applicants = ref<CoHostUserInfo[]>([]); // 申请连线的人
const connectedHosts = ref<CoHostUserInfo[]>([]); // 连线中的人
const invitableHosts = ref<CoHostUserInfo[]>([]); // 可邀请列表
const latestReceivedRequest = ref<CoHostRequestInfo | null>(null);
const latestCancelledRequest = ref<CoHostRequestInfo | null>(null);
const latestAcceptedRequest = ref<CoHostRequestInfo | null>(null);
const latestRejectedRequest = ref<CoHostRequestInfo | null>(null);
const latestTimeoutRequest = ref<CoHostRequestInfo | null>(null);

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
function mapStatusCodeToCoHostStatus(statusCode: number): CoHostStatusType | null {
  const mappedStatus = COHOST_STATUS_MAP[statusCode as CoHostStatusCodeType];
  if (!mappedStatus) {
    console.warn(`Unknown cohost status code: ${statusCode}`);
    return null;
  }
  return mappedStatus;
}

// ============== 业务方法封装 ==============

/**
 * 发送连麦请求
 * @param params 连麦请求参数
 */
function sendCoHostRequest(params: SendCoHostRequestOptions): void {
  callUTSFunction("sendCoHostRequest", params);
}

/**
 * 取消连麦请求
 * @param params 取消连麦请求参数
 */
function cancelCoHostRequest(params: CancelCoHostRequestOptions): void {
  callUTSFunction("cancelCoHostRequest", params);
}

/**
 * 接受连麦请求
 * @param params 接受连麦请求参数
 */
function acceptCoHostRequest(params: AcceptCoHostRequestOptions): void {
  callUTSFunction("acceptCoHostRequest", params);
}

/**
 * 拒绝连麦请求
 * @param params 拒绝连麦请求参数
 */
function rejectCoHostRequest(params: RejectCoHostRequestOptions): void {
  callUTSFunction("rejectCoHostRequest", params);
}

/**
 * 退出连麦
 * @param params 退出连麦参数
 */
function exitCoHost(params?: ExitCoHostOptions): void {
  callUTSFunction("exitCoHost", params);
}

// ============== 事件处理 ==============

/**
 * 连麦状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onCoHostStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "localStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToCoHostStatus(statusCode);

      if (status) {
        localStatus.value = status;
      } else {
        console.error(`Invalid cohost status code received: ${statusCode}`);
      }
    } else if (eventName === "invitees") {
      const data = safeJsonParse<CoHostUserInfo[]>(res, []);
      invitees.value = data;
    } else if (eventName === "applicants") {
      const data = safeJsonParse<CoHostUserInfo[]>(res, []);
      applicants.value = data;
    } else if (eventName === "connectedHosts") {
      const data = safeJsonParse<CoHostUserInfo[]>(res, []);
      connectedHosts.value = data;
    } else if (eventName === "invitableHosts") {
      const data = safeJsonParse<CoHostUserInfo[]>(res, []);
      invitableHosts.value = data;
    } else if (eventName === "latestReceivedRequest") {
      const data = safeJsonParse<CoHostRequestInfo | null>(res, null);
      latestReceivedRequest.value = data;
    } else if (eventName === "latestCancelledRequest") {
      const data = safeJsonParse<CoHostRequestInfo | null>(res, null);
      latestCancelledRequest.value = data;
    } else if (eventName === "latestRejectedRequest") {
      const data = safeJsonParse<CoHostRequestInfo | null>(res, null);
      latestRejectedRequest.value = data;
    } else if (eventName === "latestAcceptedRequest") {
      const data = safeJsonParse<CoHostRequestInfo | null>(res, null);
      latestAcceptedRequest.value = data;
    } else if (eventName === "latestTimeoutRequest") {
      const data = safeJsonParse<CoHostRequestInfo | null>(res, null);
      latestTimeoutRequest.value = data;
    }
  } catch (error) {
    console.error("onCoHostStoreChanged error:", error);
  }
};

/**
 * 绑定事件监听
 * @param liveId 直播间ID
 */
function bindEvent(liveId: string): void {
  getV2RTCRoomEngineManager().on(
    "coHostStoreChanged",
    onCoHostStoreChanged,
    liveId
  );
}

// ============== Composition API 导出 ==============

/**
 * 连麦状态管理的Composition API
 * @param liveId 直播间ID
 */
export function useCoHostState(liveId: string) {
  bindEvent(liveId);

  return {
    // 响应式状态
    localStatus,
    invitees,
    applicants,
    connectedHosts,
    invitableHosts,
    latestReceivedRequest,
    latestAcceptedRequest,
    latestCancelledRequest,
    latestRejectedRequest,
    latestTimeoutRequest,

    // 操作方法
    sendCoHostRequest,
    cancelCoHostRequest,
    acceptCoHostRequest,
    rejectCoHostRequest,
    exitCoHost,

    // 工具方法
    callUTSFunction,
  };
}

export default useCoHostState;
