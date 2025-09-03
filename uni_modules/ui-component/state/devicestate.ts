import { ref } from "vue";
import {
  OpenLocalMicrophoneOptions,
  UnmuteLocalAudioOptions,
  SetAudioRouteOptions,
  OpenLocalCameraOptions,
  SwitchCameraOptions,
  UpdateVideoQualityOptions,
  SwitchMirrorOptions,
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";
import permission from "../utils/permission";

// ============== 导出的枚举类型定义 ==============

/**
 * 设备状态码枚举
 * 对应底层SDK返回的数字状态码
 */
export const DeviceStatusCode = {
  OFF: 0,
  ON: 1,
  ADMIN_INVITING: 2,
  USER_APPLYING: 3,
} as const;

/**
 * 设备状态码类型
 */
export type DeviceStatusCodeType =
  (typeof DeviceStatusCode)[keyof typeof DeviceStatusCode];

/**
 * 设备状态枚举常量
 */
export const DeviceStatus = {
  OFF: "OFF",
  ON: "ON",
  ADMIN_INVITING: "ADMIN_INVITING",
  USER_APPLYING: "USER_APPLYING",
} as const;

/**
 * 设备状态类型
 */
export type DeviceStatusType = (typeof DeviceStatus)[keyof typeof DeviceStatus];

/**
 * 设备错误码枚举
 * 对应底层SDK返回的错误码
 */
export const DeviceErrorCode = {
  NO_ERROR: 0,
  NO_DEVICE_DETECTED: 1,
  NO_SYSTEM_PERMISSION: 2,
  NOT_SUPPORT_CAPTURE: 3,
} as const;

/**
 * 设备错误码类型
 */
export type DeviceErrorCodeType =
  (typeof DeviceErrorCode)[keyof typeof DeviceErrorCode];

/**
 * 设备错误枚举常量
 */
export const DeviceError = {
  NO_ERROR: "NO_ERROR",
  NO_DEVICE_DETECTED: "NO_DEVICE_DETECTED",
  NO_SYSTEM_PERMISSION: "NO_SYSTEM_PERMISSION",
  NOT_SUPPORT_CAPTURE: "NOT_SUPPORT_CAPTURE",
} as const;

/**
 * 设备错误类型
 */
export type DeviceErrorType = (typeof DeviceError)[keyof typeof DeviceError];

/**
 * 设备状态原因码枚举
 */
export const DeviceStatusReasonCode = {
  CHANGED_BY_SELF: 0,
  CHANGED_BY_ADMIN: 1,
} as const;

/**
 * 设备状态原因码类型
 */
export type DeviceStatusReasonCodeType =
  (typeof DeviceStatusReasonCode)[keyof typeof DeviceStatusReasonCode];

/**
 * 设备状态原因枚举常量
 */
export const DeviceStatusReason = {
  CHANGED_BY_SELF: "CHANGED_BY_SELF",
  CHANGED_BY_ADMIN: "CHANGED_BY_ADMIN",
} as const;

/**
 * 设备状态原因类型
 */
export type DeviceStatusReasonType =
  (typeof DeviceStatusReason)[keyof typeof DeviceStatusReason];

/**
 * 音频输出枚举常量
 */
export const AudioOutput = {
  EARPIECE: "EARPIECE",
  SPEAKER: "SPEAKER",
  HEADPHONE: "HEADPHONE",
  BLUETOOTH: "BLUETOOTH",
} as const;

/**
 * 音频输出类型
 */
export type AudioOutputType = (typeof AudioOutput)[keyof typeof AudioOutput];

/**
 * 状态码到状态字符串的映射
 */
const DEVICE_STATUS_MAP: Record<DeviceStatusCodeType, DeviceStatusType> = {
  [DeviceStatusCode.OFF]: DeviceStatus.OFF,
  [DeviceStatusCode.ON]: DeviceStatus.ON,
  [DeviceStatusCode.ADMIN_INVITING]: DeviceStatus.ADMIN_INVITING,
  [DeviceStatusCode.USER_APPLYING]: DeviceStatus.USER_APPLYING,
} as const;

/**
 * 错误码到错误字符串的映射
 */
const DEVICE_ERROR_MAP: Record<DeviceErrorCodeType, DeviceErrorType> = {
  [DeviceErrorCode.NO_ERROR]: DeviceError.NO_ERROR,
  [DeviceErrorCode.NO_DEVICE_DETECTED]: DeviceError.NO_DEVICE_DETECTED,
  [DeviceErrorCode.NO_SYSTEM_PERMISSION]: DeviceError.NO_SYSTEM_PERMISSION,
  [DeviceErrorCode.NOT_SUPPORT_CAPTURE]: DeviceError.NOT_SUPPORT_CAPTURE,
} as const;

/**
 * 状态原因码到状态原因字符串的映射
 */
const DEVICE_STATUS_REASON_MAP: Record<
  DeviceStatusReasonCodeType,
  DeviceStatusReasonType
> = {
  [DeviceStatusReasonCode.CHANGED_BY_SELF]: DeviceStatusReason.CHANGED_BY_SELF,
  [DeviceStatusReasonCode.CHANGED_BY_ADMIN]:
    DeviceStatusReason.CHANGED_BY_ADMIN,
} as const;

// ============== 响应式状态定义 ==============

// 麦克风相关状态
const microphoneStatus = ref<DeviceStatusType>();
const microphoneStatusReason = ref<DeviceStatusReasonType>();
const microphoneLastError = ref<DeviceErrorType>();
const hasPublishAudioPermission = ref<boolean>(true);
const captureVolume = ref<number>(0);

// 摄像头相关状态
const cameraStatus = ref<DeviceStatusType>();
const cameraStatusReason = ref<DeviceStatusReasonType>();
const cameraLastError = ref<DeviceErrorType>();

// 其他设备相关状态
const currentAudioRoute = ref<AudioOutputType>();
const isScreenSharing = ref<boolean>(false);
const isFrontCamera = ref<boolean>();
const isLocalMirror = ref<boolean>();
const screenStatus = ref<DeviceStatusType>();
const screenStatusReason = ref<DeviceStatusReasonType>();
const netWorkInfo = ref();

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
 * 将设备状态码转换为状态字符串
 * @param statusCode 状态码
 */
function mapStatusCodeToDeviceStatus(
  statusCode: number
): DeviceStatusType | null {
  const mappedStatus = DEVICE_STATUS_MAP[statusCode as DeviceStatusCodeType];
  if (!mappedStatus) {
    console.warn(`Unknown device status code: ${statusCode}`);
    return null;
  }
  return mappedStatus;
}

/**
 * 将设备错误码转换为错误字符串
 * @param errorCode 错误码
 */
function mapErrorCodeToDeviceError(errorCode: number): DeviceErrorType | null {
  const mappedError = DEVICE_ERROR_MAP[errorCode as DeviceErrorCodeType];
  if (!mappedError) {
    console.warn(`Unknown device error code: ${errorCode}`);
    return null;
  }
  return mappedError;
}

/**
 * 将设备状态原因码转换为原因字符串
 * @param reasonCode 原因码
 */
function mapReasonCodeToDeviceStatusReason(
  reasonCode: number
): DeviceStatusReasonType | null {
  const mappedReason =
    DEVICE_STATUS_REASON_MAP[reasonCode as DeviceStatusReasonCodeType];
  if (!mappedReason) {
    console.warn(`Unknown device status reason code: ${reasonCode}`);
    return null;
  }
  return mappedReason;
}

// ============== 业务方法封装 ==============

/**
 * 打开本地麦克风
 * @param params 麦克风参数
 */
async function openLocalMicrophone(
  params?: OpenLocalMicrophoneOptions
): Promise<void> {
  // @ts-ignore
  if (uni.getSystemInfoSync().platform === "android") {
    await permission.requestAndroidPermission(
      "android.permission.RECORD_AUDIO"
    );
  }
  callUTSFunction("openLocalMicrophone", params || {});
}

/**
 * 关闭本地麦克风
 */
function closeLocalMicrophone(): void {
  callUTSFunction("closeLocalMicrophone");
}

/**
 * 静音本地音频
 */
function muteLocalAudio(): void {
  callUTSFunction("muteLocalAudio");
}

/**
 * 取消静音本地音频
 * @param params 取消静音参数
 */
function unmuteLocalAudio(params?: UnmuteLocalAudioOptions): void {
  callUTSFunction("unmuteLocalAudio", params || {});
}

/**
 * 设置音频路由
 * @param params 音频路由参数
 */
function setAudioRoute(params: SetAudioRouteOptions): void {
  callUTSFunction("setAudioRoute", params);
}

/**
 * 打开本地摄像头
 * @param params 摄像头参数
 */
async function openLocalCamera(params?: OpenLocalCameraOptions): Promise<void> {
  // @ts-ignore
  if (uni.getSystemInfoSync().platform === "android") {
    await permission.requestAndroidPermission("android.permission.CAMERA");
  }
  callUTSFunction("openLocalCamera", params || {});
}

/**
 * 关闭本地摄像头
 */
function closeLocalCamera(): void {
  callUTSFunction("closeLocalCamera");
}

/**
 * 切换摄像头
 * @param params 切换参数
 */
function switchCamera(params: SwitchCameraOptions): void {
  callUTSFunction("switchCamera", params);
}

/**
 * 切换镜像
 * @param params 镜像参数
 */
function switchMirror(params: SwitchMirrorOptions): void {
  callUTSFunction("switchMirror", params);
}

/**
 * 更新视频质量
 * @param params 视频质量参数
 */
function updateVideoQuality(params: UpdateVideoQualityOptions): void {
  callUTSFunction("updateVideoQuality", params);
}

/**
 * 开始屏幕共享
 */
function startScreenShare(): void {
  callUTSFunction("startScreenShare");
}

/**
 * 停止屏幕共享
 */
function stopScreenShare(): void {
  callUTSFunction("stopScreenShare");
}

// ============== 事件处理 ==============

/**
 * 设备状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onDeviceStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "microphoneStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToDeviceStatus(statusCode);
      if (status) {
        microphoneStatus.value = status;
      } else {
        console.error(`Invalid microphone status code received: ${statusCode}`);
      }
    } else if (eventName === "microphoneStatusReason") {
      const reasonCode = safeJsonParse<number>(res, -1);
      const reason = mapReasonCodeToDeviceStatusReason(reasonCode);
      if (reason) {
        microphoneStatusReason.value = reason;
      } else {
        console.error(
          `Invalid microphone status reason code received: ${reasonCode}`
        );
      }
    } else if (eventName === "microphoneLastError") {
      const errorCode = safeJsonParse<number>(res, -1);
      const error = mapErrorCodeToDeviceError(errorCode);
      if (error) {
        microphoneLastError.value = error;
      } else {
        console.error(`Invalid microphone error code received: ${errorCode}`);
      }
    } else if (eventName === "currentAudioRoute") {
      const data = safeJsonParse<AudioOutputType>(res, AudioOutput.SPEAKER);
      currentAudioRoute.value = data;
    } else if (eventName === "captureVolume") {
      const data = safeJsonParse<number>(res, 0);
      captureVolume.value = data;
    } else if (eventName === "cameraStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToDeviceStatus(statusCode);
      if (status) {
        cameraStatus.value = status;
      } else {
        console.error(`Invalid camera status code received: ${statusCode}`);
      }
    } else if (eventName === "cameraStatusReason") {
      const reasonCode = safeJsonParse<number>(res, -1);
      const reason = mapReasonCodeToDeviceStatusReason(reasonCode);
      if (reason) {
        cameraStatusReason.value = reason;
      } else {
        console.error(
          `Invalid camera status reason code received: ${reasonCode}`
        );
      }
    } else if (eventName === "cameraLastError") {
      const errorCode = safeJsonParse<number>(res, -1);
      const error = mapErrorCodeToDeviceError(errorCode);
      if (error) {
        cameraLastError.value = error;
      } else {
        console.error(`Invalid camera error code received: ${errorCode}`);
      }
    } else if (eventName === "isFrontCamera") {
      const data = safeJsonParse<boolean>(res, true);
      isFrontCamera.value = data;
    } else if (eventName === "isLocalMirror") {
      const data = safeJsonParse<boolean>(res, false);
      isLocalMirror.value = data;
    } else if (eventName === "isScreenSharing") {
      const data = safeJsonParse<boolean>(res, false);
      isScreenSharing.value = data;
    } else if (eventName === "screenStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToDeviceStatus(statusCode);
      if (status) {
        screenStatus.value = status;
      } else {
        console.error(`Invalid screen status code received: ${statusCode}`);
      }
    } else if (eventName === "screenStatusReason") {
      const reasonCode = safeJsonParse<number>(res, -1);
      const reason = mapReasonCodeToDeviceStatusReason(reasonCode);
      if (reason) {
        screenStatusReason.value = reason;
      } else {
        console.error(
          `Invalid screen status reason code received: ${reasonCode}`
        );
      }
    } else if (eventName === "networkInfo") {
      netWorkInfo.value = JSON.parse(res);
    }
  } catch (error) {
    console.error("onDeviceStoreChanged error:", error);
  }
};

/**
 * 绑定事件监听
 */
function bindEvent(): void {
  getV2RTCRoomEngineManager().on(
    "deviceStoreChanged",
    onDeviceStoreChanged,
    ""
  );
}

// ============== Composition API 导出 ==============

/**
 * 设备状态管理的Composition API
 */
export function useDeviceState() {
  bindEvent();

  return {
    // 响应式状态 - 麦克风相关
    microphoneStatus,
    microphoneStatusReason,
    microphoneLastError,
    hasPublishAudioPermission,
    captureVolume,
    netWorkInfo,

    // 响应式状态 - 摄像头相关
    cameraStatus,
    cameraStatusReason,
    cameraLastError,

    // 响应式状态 - 其他设备相关
    currentAudioRoute,
    isScreenSharing,
    isFrontCamera,
    isLocalMirror,
    screenStatus,
    screenStatusReason,

    // 操作方法 - 麦克风相关
    openLocalMicrophone,
    closeLocalMicrophone,
    muteLocalAudio,
    unmuteLocalAudio,
    setAudioRoute,

    // 操作方法 - 摄像头相关
    openLocalCamera,
    closeLocalCamera,
    switchCamera,
    switchMirror,
    updateVideoQuality,

    // 操作方法 - 屏幕共享相关
    startScreenShare,
    stopScreenShare,

    // 工具方法
    callUTSFunction,
  };
}

export default useDeviceState;
