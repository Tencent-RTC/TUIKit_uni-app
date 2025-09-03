import { ref } from "vue";
import {
  LiveInfoParam,
  FetchLiveListOptions,
  ScheduleLiveOptions,
  CancelScheduleOptions,
  CreateLiveOptions,
  JoinLiveOptions,
  LeaveLiveOptions,
  EndLiveOptions,
  UpdateLiveInfoOptions,
  CallExperimentalAPIOptions,
} from "@/uni_modules/ui-component";

import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// ============== 导出的枚举类型定义 ==============

/**
 * 本地直播状态码枚举
 * 对应底层SDK返回的数字状态码
 */
export const LocalLiveStatusCode = {
  IDLE: 0,
  NOT_STARTED: 1,
  LIVE: 2,
  PAUSED: 3,
  ENDED: 4,
} as const;

/**
 * 本地直播状态码类型
 * 对应底层SDK返回的数字状态码
 */
export type LocalLiveStatusCodeType =
  (typeof LocalLiveStatusCode)[keyof typeof LocalLiveStatusCode];

/**
 * 本地直播状态枚举常量
 * 对应直播状态的字符串值
 */
export const LocalLiveStatus = {
  IDLE: "IDLE",
  NOT_STARTED: "NOT_STARTED",
  LIVE: "LIVE",
  PAUSED: "PAUSED",
  ENDED: "ENDED",
} as const;

/**
 * 本地直播状态类型
 * 对应直播状态的字符串联合类型
 */
export type LocalLiveStatusType =
  (typeof LocalLiveStatus)[keyof typeof LocalLiveStatus];

/**
 * 状态码到状态字符串的映射
 */
const LOCAL_LIVE_STATUS_MAP: Record<
  LocalLiveStatusCodeType,
  LocalLiveStatusType
> = {
  [LocalLiveStatusCode.IDLE]: LocalLiveStatus.IDLE,
  [LocalLiveStatusCode.NOT_STARTED]: LocalLiveStatus.NOT_STARTED,
  [LocalLiveStatusCode.LIVE]: LocalLiveStatus.LIVE,
  [LocalLiveStatusCode.PAUSED]: LocalLiveStatus.PAUSED,
  [LocalLiveStatusCode.ENDED]: LocalLiveStatus.ENDED,
} as const;

// ============== 响应式状态定义 ==============

const liveList = ref<LiveInfoParam[]>([]);
const currentLive = ref<LiveInfoParam | null>(null);
const localLiveStatus = ref<LocalLiveStatusType>(LocalLiveStatus.IDLE);
const liveListCursor = ref<string>("");

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
function mapStatusCodeToLiveStatus(
  statusCode: number
): LocalLiveStatusType | null {
  const mappedStatus =
    LOCAL_LIVE_STATUS_MAP[statusCode as LocalLiveStatusCodeType];
  if (!mappedStatus) {
    console.warn(`Unknown live status code: ${statusCode}`);
    return null;
  }
  return mappedStatus;
}

// ============== 业务方法封装 ==============

/**
 * 获取直播列表
 * @param params 获取参数
 */
function fetchLiveList(params: FetchLiveListOptions): void {
  callUTSFunction("fetchLiveList", params);
}

/**
 * 预约直播
 * @param params 预约参数
 */
function schedule(params: ScheduleLiveOptions): void {
  callUTSFunction("schedule", params);
}

/**
 * 取消预约直播
 * @param params 取消预约参数
 */
function cancelSchedule(params: CancelScheduleOptions): void {
  callUTSFunction("cancelSchedule", params);
}

/**
 * 创建直播
 * @param params 创建参数
 */
function createLive(params: CreateLiveOptions): void {
  callUTSFunction("createLive", params);
}

/**
 * 加入直播
 * @param params 加入参数
 */
function joinLive(params: JoinLiveOptions): void {
  callUTSFunction("joinLive", params);
}

/**
 * 离开直播
 * @param params 离开参数
 */
function leaveLive(params?: LeaveLiveOptions): void {
  callUTSFunction("leaveLive", params || {});
}

/**
 * 结束直播
 * @param params 结束参数
 */
function endLive(params?: EndLiveOptions): void {
  callUTSFunction("endLive", params || {});
}

/**
 * 更新直播信息
 * @param params 更新参数
 */
function updateLiveInfo(params: UpdateLiveInfoOptions): void {
  callUTSFunction("updateLiveInfo", params);
}

function callExperimentalAPI(params: CallExperimentalAPIOptions): void {
  const defaultCallback = {
    onResponse: (res?: string) => {
      console.log("onExperimentalAPIResponse: ", res);
    },
  };
  const finalParams = {
    ...params,
    onResponse: params.onResponse || defaultCallback.onResponse,
  };

  console.log("callExperimentalAPI", finalParams);
  getV2RTCRoomEngineManager().callExperimentalAPI(finalParams);
}

// ============== 事件处理 ==============

/**
 * 直播状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onLiveStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "liveList") {
      const data = safeJsonParse<LiveInfoParam[]>(res, []);
      liveList.value = data;
    } else if (eventName === "liveListCursor") {
      const data = safeJsonParse<string>(res, "");
      liveListCursor.value = data;
    } else if (eventName === "currentLive") {
      const data = safeJsonParse<LiveInfoParam | null>(res, null);
      currentLive.value = data;
    } else if (eventName === "localLiveStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToLiveStatus(statusCode);

      if (status) {
        localLiveStatus.value = status;
      } else {
        console.error(`Invalid live status code received: ${statusCode}`);
      }
    }
  } catch (error) {
    console.error("onLiveStoreChanged error:", error);
  }
};

/**
 * 绑定事件监听
 */
function bindEvent(): void {
  getV2RTCRoomEngineManager().on("liveStoreChanged", onLiveStoreChanged, "");
}

// ============== Composition API 导出 ==============

/**
 * 直播状态管理的Composition API
 */
export function useLiveState() {
  bindEvent();

  return {
    // 响应式状态
    liveList,
    currentLive,
    localLiveStatus,
    liveListCursor,

    // 操作方法
    fetchLiveList,
    schedule,
    cancelSchedule,
    createLive,
    joinLive,
    leaveLive,
    endLive,
    updateLiveInfo,
    callExperimentalAPI,

    // 工具方法
    callUTSFunction,
  };
}

export default useLiveState;
