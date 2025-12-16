/**
 * @module DeviceState
 * @module_description
 * 设备状态管理模块
 * 核心功能：管理摄像头、麦克风等音视频设备的控制，提供设备状态监控、权限检查等基础设备服务。
 * 技术特点：支持多设备管理、设备状态实时监控、权限动态检查、设备故障自动恢复等高级功能。
 * 业务价值：为直播系统提供稳定的设备基础，确保音视频采集的可靠性和用户体验。
 * 应用场景：设备管理、权限控制、音视频采集、设备故障处理等基础技术场景。
 */
import { ref } from "vue";
import {
  OpenLocalMicrophoneOptions, SetAudioRouteOptions, OpenLocalCameraOptions, SwitchCameraOptions,
  UpdateVideoQualityOptions, SwitchMirrorOptions, VolumeOptions,
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import permission from "../utils/permission";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

export const DeviceStatusCode = {
  OFF: 0,
  ON: 1,
} as const;

export type DeviceStatusCodeType =
  (typeof DeviceStatusCode)[keyof typeof DeviceStatusCode];

export const DeviceStatus = {
  OFF: "OFF",
  ON: "ON",
} as const;


export type DeviceStatusType = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const DeviceErrorCode = {
  NO_ERROR: 0,
  NO_DEVICE_DETECTED: 1,
  NO_SYSTEM_PERMISSION: 2,
  NOT_SUPPORT_CAPTURE: 3,
  OCCUPIED_ERROR: 4,
  UNKNOWN_ERROR: 5,
} as const;

export type DeviceErrorCodeType =
  (typeof DeviceErrorCode)[keyof typeof DeviceErrorCode];

export const DeviceErrorEnum = {
  NO_ERROR: "NO_ERROR",
  NO_DEVICE_DETECTED: "NO_DEVICE_DETECTED",
  NO_SYSTEM_PERMISSION: "NO_SYSTEM_PERMISSION",
  NOT_SUPPORT_CAPTURE: "NOT_SUPPORT_CAPTURE",
  OCCUPIED_ERROR: "OCCUPIED_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type DeviceErrorType = (typeof DeviceErrorEnum)[keyof typeof DeviceErrorEnum];

export const AudioOutput = {
  SPEAKERPHONE: "SPEAKERPHONE",
  EARPIECE: "EARPIECE",
} as const;

export type AudioOutputType = (typeof AudioOutput)[keyof typeof AudioOutput];

const DEVICE_STATUS_MAP: Record<DeviceStatusCodeType, DeviceStatusType> = {
  [DeviceStatusCode.OFF]: DeviceStatus.OFF,
  [DeviceStatusCode.ON]: DeviceStatus.ON,
} as const;

const DEVICE_ERROR_MAP: Record<DeviceErrorCodeType, DeviceErrorType> = {
  [DeviceErrorCode.NO_ERROR]: DeviceErrorEnum.NO_ERROR,
  [DeviceErrorCode.NO_DEVICE_DETECTED]: DeviceErrorEnum.NO_DEVICE_DETECTED,
  [DeviceErrorCode.NO_SYSTEM_PERMISSION]: DeviceErrorEnum.NO_SYSTEM_PERMISSION,
  [DeviceErrorCode.NOT_SUPPORT_CAPTURE]: DeviceErrorEnum.NOT_SUPPORT_CAPTURE,
  [DeviceErrorCode.OCCUPIED_ERROR]: DeviceErrorEnum.OCCUPIED_ERROR,
  [DeviceErrorCode.UNKNOWN_ERROR]: DeviceErrorEnum.UNKNOWN_ERROR,
} as const;

/**
 * 麦克风开启状态
 * @type {Ref<DeviceStatusType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { microphoneStatus } = useDeviceState();
 * 
 * // 监听麦克风状态变化
 * watch(microphoneStatus, (newStatus) => {
 *   console.log('麦克风状态:', newStatus);
 *   if (newStatus === 'ON') {
 *     console.log('麦克风已打开');
 *   } else if (newStatus === 'OFF') {
 *     console.log('麦克风已关闭');
 *   }
 * });
 */
const microphoneStatus = ref<DeviceStatusType>();

/**
 * 麦克风最后一次错误状态
 * @type {Ref<DeviceErrorType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { microphoneLastError } = useDeviceState();
 * 
 * // 监听麦克风错误状态
 * watch(microphoneLastError, (newError) => {
 *   if (newError && newError !== 'NO_ERROR') {
 *     console.log('麦克风错误:', newError);
 *   }
 * });
 */
const microphoneLastError = ref<DeviceErrorType>();

/**
 * 是否有音频发布权限
 * @type {Ref<boolean>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { hasPublishAudioPermission } = useDeviceState();
 * 
 * // 检查是否有音频发布权限
 * const hasPermission = hasPublishAudioPermission.value;
 * if (!hasPermission) {
 *   console.log('没有音频发布权限');
 * }
 */
const hasPublishAudioPermission = ref<boolean>(true);

/**
 * 采集音量大小（0-100）
 * @type {Ref<number>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { captureVolume } = useDeviceState();
 * 
 * // 监听采集音量变化
 * watch(captureVolume, (newVolume) => {
 *   console.log('采集音量:', newVolume);
 * });
 */
const captureVolume = ref<number>(0);

/**
 * 当前麦克风音量（0-100）
 * @type {Ref<number>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { currentMicVolume } = useDeviceState();
 * 
 * // 监听麦克风音量变化
 * watch(currentMicVolume, (newVolume) => {
 *   console.log('当前麦克风音量:', newVolume);
 * });
 */
const currentMicVolume = ref<number>(0);

/**
 * 输出音量大小（0-100）
 * @type {Ref<number>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { outputVolume } = useDeviceState();
 * 
 * // 监听输出音量变化
 * watch(outputVolume, (newVolume) => {
 *   console.log('输出音量:', newVolume);
 * });
 */
const outputVolume = ref<number>(0);

/**
 * 摄像头开启状态
 * @type {Ref<DeviceStatusType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { cameraStatus } = useDeviceState();
 * 
 * // 监听摄像头状态变化
 * watch(cameraStatus, (newStatus) => {
 *   console.log('摄像头状态:', newStatus);
 *   if (newStatus === 'ON') {
 *     console.log('摄像头已打开');
 *   }
 * });
 */
const cameraStatus = ref<DeviceStatusType>();

/**
 * 摄像头最后一次错误状态
 * @type {Ref<DeviceErrorType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { cameraLastError } = useDeviceState();
 * 
 * // 监听摄像头错误状态
 * watch(cameraLastError, (newError) => {
 *   if (newError && newError !== 'NO_ERROR') {
 *     console.log('摄像头错误:', newError);
 *   }
 * });
 */
const cameraLastError = ref<DeviceErrorType>();

/**
 * 是否为前置摄像头
 * @type {Ref<boolean>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { isFrontCamera } = useDeviceState();
 * 
 * // 检查当前是否为前置摄像头
 * const isFront = isFrontCamera.value;
 * if (isFront) {
 *   console.log('当前使用前置摄像头');
 * }
 */
const isFrontCamera = ref<boolean>();

/**
 * 本地镜像类型
 * @type {Ref<string>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { localMirrorType } = useDeviceState();
 * 
 * // 获取本地镜像类型
 * const mirrorType = localMirrorType.value;
 * console.log('本地镜像类型:', mirrorType);
 */
const localMirrorType = ref<string>('');

/**
 * 本地视频质量设置
 * @type {Ref<any>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { localVideoQuality } = useDeviceState();
 * 
 * // 获取本地视频质量设置
 * const quality = localVideoQuality.value;
 * console.log('本地视频质量:', quality);
 */
const localVideoQuality = ref<any>();

/**
 * 当前音频输出路由（扬声器/耳机）
 * @type {Ref<AudioOutputType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { currentAudioRoute } = useDeviceState();
 * 
 * // 监听音频输出路由变化
 * watch(currentAudioRoute, (newRoute) => {
 *   console.log('音频输出路由:', newRoute);
 *   if (newRoute === 'SPEAKERPHONE') {
 *     console.log('使用扬声器');
 *   } else if (newRoute === 'EARPIECE') {
 *     console.log('使用耳机');
 *   }
 * });
 */
const currentAudioRoute = ref<AudioOutputType>();

/**
 * 屏幕共享状态
 * @type {Ref<DeviceStatusType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { screenStatus } = useDeviceState();
 * 
 * // 监听屏幕共享状态
 * watch(screenStatus, (newStatus) => {
 *   console.log('屏幕共享状态:', newStatus);
 *   if (newStatus === 'ON') {
 *     console.log('屏幕共享已开启');
 *   }
 * });
 */
const screenStatus = ref<DeviceStatusType>();

/**
 * 网络信息状态
 * @type {Ref<any>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { networkInfo } = useDeviceState();
 * 
 * // 获取网络信息
 * const info = networkInfo.value;
 * console.log('网络信息:', info);
 */
const networkInfo = ref<any>();

/**
 * @internal
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
 * @internal
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
 * 打开本地麦克风
 * @param {OpenLocalMicrophoneOptions} [params] - 麦克风参数
 * @returns {Promise<void>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { openLocalMicrophone } = useDeviceState();
 * openLocalMicrophone({})
 */
async function openLocalMicrophone(params?: OpenLocalMicrophoneOptions): Promise<void> {
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
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { closeLocalMicrophone } = useDeviceState();
 * closeLocalMicrophone()
 */
function closeLocalMicrophone(): void {
  callUTSFunction("closeLocalMicrophone");
}

/**
 * 设置采集音量
 * @param {VolumeOptions} params - 音量参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { setCaptureVolume } = useDeviceState();
 * setCaptureVolume({ volume: 80 })
 */
function setCaptureVolume(params: VolumeOptions): void {
  callUTSFunction("setCaptureVolume", params);
}

/**
 * 设置输出音量
 * @param {VolumeOptions} params - 音量参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { setOutputVolume } = useDeviceState();
 * setOutputVolume({ volume: 90 })
 */
function setOutputVolume(params: VolumeOptions): void {
  callUTSFunction("setOutputVolume", params);
}

/**
 * 设置音频路由
 * @param {SetAudioRouteOptions} params - 音频路由参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * // 设置为扬声器
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { setAudioRoute } = useDeviceState();
 * setAudioRoute({ route: 'SPEAKERPHONE' })
 */
function setAudioRoute(params: SetAudioRouteOptions): void {
  callUTSFunction("setAudioRoute", params);
}

/**
 * 打开本地摄像头
 * @param {OpenLocalCameraOptions} [params] - 摄像头参数
 * @returns {Promise<void>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { openLocalCamera } = useDeviceState();
 * openLocalCamera({ isFront: true })
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
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { closeLocalCamera } = useDeviceState();
 * closeLocalCamera()
 */
function closeLocalCamera(): void {
  callUTSFunction("closeLocalCamera");
}

/**
 * 切换摄像头前后置
 * @param {SwitchCameraOptions} params - 切换参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * // 切换到前置摄像头
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { switchCamera } = useDeviceState();
 * switchCamera({ isFront: true })
 */
function switchCamera(params: SwitchCameraOptions): void {
  callUTSFunction("switchCamera", params);
}

/**
 * 切换镜像
 * @param {SwitchMirrorOptions} params - 镜像参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * // 设置自动镜像
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { switchMirror } = useDeviceState();
 * switchMirror({ mirrorType: 'AUTO' })
 */
function switchMirror(params: SwitchMirrorOptions): void {
  callUTSFunction("switchMirror", params);
}

/**
 * 更新视频质量
 * @param {UpdateVideoQualityOptions} params - 视频质量参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { updateVideoQuality } = useDeviceState();
 * updateVideoQuality({ quality: 'VIDEOQUALITY_1080P' })
 */
function updateVideoQuality(params: UpdateVideoQualityOptions): void {
  callUTSFunction("updateVideoQuality", params);
}

/**
 * 开始屏幕共享
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { startScreenShare } = useDeviceState();
 * startScreenShare()
 */
function startScreenShare(): void {
  callUTSFunction("startScreenShare");
}

/**
 * 停止屏幕共享
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { stopScreenShare } = useDeviceState();
 * stopScreenShare()
 */
function stopScreenShare(): void {
  callUTSFunction("stopScreenShare");
}

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
    } else if (eventName === "microphoneLastError") {
      const errorCode = safeJsonParse<number>(res, -1);
      const error = mapErrorCodeToDeviceError(errorCode);
      if (error) {
        microphoneLastError.value = error;
      } else {
        console.error(`Invalid microphone error code received: ${errorCode}`);
      }
    } else if (eventName === "captureVolume") {
      const data = safeJsonParse<number>(res, 0);
      captureVolume.value = data;
    } else if (eventName === "currentMicVolume") {
      const data = safeJsonParse<number>(res, 0);
      currentMicVolume.value = data;
    }
    else if (eventName === "outputVolume") {
      const data = safeJsonParse<number>(res, 0);
      outputVolume.value = data;
    }

    else if (eventName === "cameraStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToDeviceStatus(statusCode);
      if (status) {
        cameraStatus.value = status;
      } else {
        console.error(`Invalid camera status code received: ${statusCode}`);
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
    } else if (eventName === "localMirrorType") {
      localMirrorType.value = JSON.parse(res);
    } else if (eventName === "localVideoQuality") {
      const data = safeJsonParse<boolean>(res, false);
      localVideoQuality.value = data;
    }
    else if (eventName === "currentAudioRoute") {
      const data = safeJsonParse<AudioOutputType>(res, AudioOutput.SPEAKERPHONE);
      currentAudioRoute.value = data;
    } else if (eventName === "screenStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToDeviceStatus(statusCode);
      if (status) {
        screenStatus.value = status;
      } else {
        console.error(`Invalid screen status code received: ${statusCode}`);
      }
    } else if (eventName === "networkInfo") {
      networkInfo.value = safeJsonParse<any>(res, {});
    }
  } catch (error) {
    console.error("onDeviceStoreChanged error:", error);
  }
};

function bindEvent(): void {
  getRTCRoomEngineManager().on("deviceStoreChanged", onDeviceStoreChanged, "");
}

export function useDeviceState() {
  bindEvent();

  return {
    microphoneStatus,         // 麦克风开启状态
    microphoneLastError,      // 麦克风最后一次错误状态
    hasPublishAudioPermission,// 是否有音频发布权限
    captureVolume,            // 采集音量大小
    currentMicVolume,         // 当前麦克风音量
    outputVolume,             // 输出音量大小

    cameraStatus,             // 摄像头开启状态
    cameraLastError,          // 摄像头最后一次错误状态
    isFrontCamera,            // 是否为前置摄像头
    localMirrorType,          // 本地镜像类型
    localVideoQuality,        // 本地视频质量设置
    currentAudioRoute,        // 当前音频输出路由
    screenStatus,             // 屏幕共享状态
    networkInfo,              // 网络信息状态

    openLocalMicrophone,      // 打开本地麦克风
    closeLocalMicrophone,     // 关闭本地麦克风
    setCaptureVolume,         // 设置采集音量
    setOutputVolume,          // 设置输出音量
    setAudioRoute,            // 设置音频路由

    openLocalCamera,          // 打开本地摄像头
    closeLocalCamera,         // 关闭本地摄像头
    switchCamera,             // 切换摄像头
    switchMirror,             // 切换镜像
    updateVideoQuality,       // 更新视频质量

    startScreenShare,         // 开始屏幕共享
    stopScreenShare,          // 停止屏幕共享
  };
}

export default useDeviceState;