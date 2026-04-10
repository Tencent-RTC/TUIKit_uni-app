/**
 * @module DeviceState
 * @module_description
 * 设备状态管理模块
 * 核心功能：管理摄像头、麦克风等音视频设备的控制，提供设备状态监控、权限检查等基础设备服务。
 * 技术特点：支持多设备管理、设备状态实时监控、权限动态检查、设备故障自动恢复等高级功能。
 * 业务价值：为直播系统提供稳定的设备基础，确保音视频采集的可靠性和用户体验。
 * 应用场景：设备管理、权限控制、音视频采集、设备故障处理等基础技术场景。
 */
import { onUnmounted, ref, type Ref } from "vue";
import {
  callAPI, addListener, removeListener, HybridResponseData
} from "@/uni_modules/tuikit-atomic-x";
import permission from "../utils/permission";
import { safeJsonParse } from "../utils/utsUtils";

declare const uni: any;

// 全局状态存储 key
const DEVICE_STATE_KEY = '__TUIKIT_DEVICE_STATE__';

// 初始化全局状态存储
function getGlobalState() {
  if (!uni[DEVICE_STATE_KEY]) {
    uni[DEVICE_STATE_KEY] = {
      microphoneStatus: ref<DeviceStatus>(DeviceStatus.OFF),
      microphoneLastError: ref<DeviceError>(DeviceError.NO_ERROR),
      hasPublishAudioPermission: ref<boolean>(true),
      captureVolume: ref<number>(0),
      currentMicVolume: ref<number>(0),
      outputVolume: ref<number>(0),
      cameraStatus: ref<DeviceStatus>(DeviceStatus.OFF),
      cameraLastError: ref<DeviceError>(DeviceError.NO_ERROR),
      isFrontCamera: ref<boolean>(true),
      localMirrorType: ref<MirrorType>(MirrorType.AUTO),
      localVideoQuality: ref<any>(),
      currentAudioRoute: ref<AudioOutput>(AudioOutput.SPEAKERPHONE),
      screenStatus: ref<DeviceStatus>(),
      networkInfo: ref<any>(),
      bindEventDone: false
    };
  }
  return uni[DEVICE_STATE_KEY];
}

export enum DeviceStatus {
  OFF = 0,
  ON = 1
}

export enum DeviceError {
  NO_ERROR = 0,
  NO_DEVICE_DETECTED = 1,
  NO_SYSTEM_PERMISSION = 2,
  NOT_SUPPORT_CAPTURE = 3,
  OCCUPIED_ERROR = 4,
  UNKNOWN_ERROR = 5,
}

export enum AudioOutput {
  SPEAKERPHONE = 0,
  EARPIECE = 1,
}

export enum MirrorType {
  AUTO = 0,    // 自动模式
  ENABLE = 1,  // 前后摄像头都镜像
  DISABLE = 2, // 前后摄像头都不镜像
}

/**
 * 视频质量类型
 * @remarks
 * 可用值：
 * - `QUALITY_360P`: 360P分辨率
 * - `QUALITY_540P`: 540P分辨率
 * - `QUALITY_720P`: 720P分辨率
 * - `QUALITY_1080P`: 1080P分辨率
 */
export enum VideoQuality {
  QUALITY_360P = 1,
  QUALITY_540P = 2,
  QUALITY_720P = 3,
  QUALITY_1080P = 4,
}

/**
 * 开启本地麦克风参数
 * @interface OpenLocalMicrophoneOptions
 */
export type OpenLocalMicrophoneOptions = {
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 音量参数
 * @interface VolumeOptions
 */
export type VolumeOptions = {
  volume: number
}

/**
 * 开启本地摄像头参数
 * @interface OpenLocalCameraOptions
 */
export type OpenLocalCameraOptions = {
  isFront: boolean;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 切换摄像头参数
 * @interface SwitchCameraOptions
 */
export type SwitchCameraOptions = {
  isFront: boolean;
}

/**
 * 更新视频质量参数
 * @interface UpdateVideoQualityOptions
 */
export type UpdateVideoQualityOptions = {
  quality: VideoQuality;
}

/**
 * 开始屏幕分享参数（仅iOS）
 * @interface StartScreenShareOptions
 */
export type StartScreenShareOptions = {
  appGroup: string;
}

/**
 * 设置音频路由参数
 * @interface SetAudioRouteOptions
 * @description 设置音频路由配置结构
 * @param {AudioOutput} route - 音频路由类型（必填）
 */
export type SetAudioRouteOptions = {
  audioRoute: AudioOutput;
}

/**
 * 切换镜像参数
 * @interface SwitchMirrorOptions
 * @description 切换镜像配置结构
 * @param {MirrorType} mirrorType - 镜像类型（必填）
 */
export type SwitchMirrorOptions = {
  mirrorType: MirrorType;
}

/**
 * 麦克风开启状态
 * @type {Ref<DeviceStatus>}
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
const microphoneStatus: Ref<DeviceStatus> = getGlobalState().microphoneStatus;

/**
 * 麦克风最后一次错误状态
 * @type {Ref<DeviceError>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { microphoneLastError } = useDeviceState();
 *
 * // 监听麦克风错误状态
 * watch(microphoneLastError, (newError) => {
 *   if (newError !== undefined && newError !== DeviceError.NO_ERROR) {
 *     console.log('麦克风错误:', newError);
 *   }
 * });
 */
const microphoneLastError: Ref<DeviceError> = getGlobalState().microphoneLastError;

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
const hasPublishAudioPermission: Ref<boolean> = getGlobalState().hasPublishAudioPermission;

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
const captureVolume: Ref<number> = getGlobalState().captureVolume;

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
const currentMicVolume: Ref<number> = getGlobalState().currentMicVolume;

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
const outputVolume: Ref<number> = getGlobalState().outputVolume;

/**
 * 摄像头开启状态
 * @type {Ref<DeviceStatus>}
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
const cameraStatus: Ref<DeviceStatus> = getGlobalState().cameraStatus;

/**
 * 摄像头最后一次错误状态
 * @type {Ref<DeviceError>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { cameraLastError } = useDeviceState();
 *
 * // 监听摄像头错误状态
 * watch(cameraLastError, (newError) => {
 *   if (newError !== undefined && newError !== DeviceError.NO_ERROR) {
 *     console.log('摄像头错误:', newError);
 *   }
 * });
 */
const cameraLastError: Ref<DeviceError> = getGlobalState().cameraLastError;

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
const isFrontCamera: Ref<boolean> = getGlobalState().isFrontCamera;

/**
 * 本地镜像类型
 * @type {Ref<MirrorType>}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { localMirrorType } = useDeviceState();
 *
 * // 获取本地镜像类型
 * const mirrorType = localMirrorType.value;
 * console.log('本地镜像类型:', mirrorType);
 */
const localMirrorType: Ref<MirrorType> = getGlobalState().localMirrorType;

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
const localVideoQuality: Ref<any> = getGlobalState().localVideoQuality;

/**
 * 当前音频输出路由（扬声器/耳机）
 * @type {Ref<AudioOutput>}
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
const currentAudioRoute: Ref<AudioOutput> = getGlobalState().currentAudioRoute;

/**
 * 屏幕共享状态
 * @type {Ref<DeviceStatus>}
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
const screenStatus: Ref<DeviceStatus> = getGlobalState().screenStatus;

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
const networkInfo: Ref<any> = getGlobalState().networkInfo;
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
  return new Promise((resolve, reject) => {
    callAPI(JSON.stringify({
      api: "openLocalMicrophone",
      params: {},
    }), (res: string) => {
      try {
        const data = safeJsonParse(res, {}) as HybridResponseData;
        console.log('openLocalMicrophone =====>: ', data)
        if (data?.code === 0) {
          params?.success?.();
          resolve();
        } else {
          params?.fail?.(data.code, data.message);
          reject(new Error(data.message || 'openLocalMicrophone failed'));
        }
      } catch (error) {
        params?.fail?.(-1, error.message);
        reject(error);
      }
    });
  });
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
  callAPI(JSON.stringify({
    api: "closeLocalMicrophone",
    params: {},
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "setCaptureVolume",
    params: params,
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "setOutputVolume",
    params: params,
  }), () => { });
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
 * setAudioRoute({ audioRoute: AudioOutput.SPEAKERPHONE })
 */
function setAudioRoute(params: SetAudioRouteOptions): void {
  callAPI(JSON.stringify({
    api: "setAudioRoute",
    params: params,
  }), () => { });
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
  return new Promise((resolve, reject) => {
    callAPI(JSON.stringify({
      api: "openLocalCamera",
      params: params,
    }), (res: string) => {
      try {
        const data = safeJsonParse(res, {}) as any;
        console.log('openLocalCamera =====>: ', data)
        if (data?.code === 0) {
          params?.success?.();
          resolve();
        } else {
          params?.fail?.(data.code, data.message);
          reject(new Error(data.message || 'openLocalCamera failed'));
        }
      } catch (error) {
        params?.fail?.(-1, error.message);
        reject(error);
      }
    });
  });
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
  callAPI(JSON.stringify({
    api: "closeLocalCamera",
    params: {},
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "switchCamera",
    params: params,
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "switchMirror",
    params: params,
  }), () => { });
}

/**
 * 更新视频质量
 * @param {UpdateVideoQualityOptions} params - 视频质量参数
 * @returns {void}
 * @memberof module:DeviceState
 * @example
 * import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
 * const { updateVideoQuality } = useDeviceState();
 * updateVideoQuality({ quality: VideoQuality.QUALITY_1080P })
 */
function updateVideoQuality(params: UpdateVideoQualityOptions): void {
  callAPI(JSON.stringify({
    api: "updateVideoQuality",
    params: params,
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "startScreenShare",
    params: {},
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "stopScreenShare",
    params: {},
  }), () => { });
}

const BINDABLE_DATA_NAMES = [
  "microphoneStatus",
  "microphoneLastError",
  "captureVolume",
  "currentMicVolume",
  "outputVolume",
  "cameraStatus",
  "cameraLastError",
  "isFrontCamera",
  "localMirrorType",
  "localVideoQuality",
  "currentAudioRoute",
  "screenStatus",
  "networkInfo"
] as const;

function bindEvent(): void {
  const globalState = getGlobalState();

  // 防止重复绑定事件
  if (globalState.bindEventDone) {
    return;
  }
  globalState.bindEventDone = true;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "DeviceStore",
      name: dataName,
      listenerID: 'DeviceStore',
      params: {}
    }, (data: string) => {
      try {
        // console.log(`[DeviceState][${dataName}] Data:`, data);
        const result = safeJsonParse<any>(data, {});
        onDeviceStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[DeviceState][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "DeviceStore",
      name: dataName,
      listenerID: 'DeviceStore',
      params: {}
    });
  });
}
const onDeviceStoreChanged: Record<string, (result: any) => void> = {
  microphoneStatus: (res) => {
    microphoneStatus.value = safeJsonParse<DeviceStatus>(res.microphoneStatus, DeviceStatus.OFF);
  },
  microphoneLastError: (res) => {
    microphoneLastError.value = safeJsonParse<DeviceError>(res.microphoneLastError, DeviceError.NO_ERROR);
  },
  captureVolume: (res) => {
    captureVolume.value = safeJsonParse<number>(res.captureVolume, 0);
  },
  currentMicVolume: (res) => {
    currentMicVolume.value = safeJsonParse<number>(res.currentMicVolume, 0);
  },
  outputVolume: (res) => {
    outputVolume.value = safeJsonParse<number>(res.outputVolume, 0);
  },
  cameraStatus: (res) => {
    cameraStatus.value = safeJsonParse<DeviceStatus>(res.cameraStatus, DeviceStatus.OFF);
  },
  cameraLastError: (res) => {
    cameraLastError.value = safeJsonParse<DeviceError>(res.cameraLastError, DeviceError.NO_ERROR);
  },
  isFrontCamera: (res) => {
    isFrontCamera.value = safeJsonParse<boolean>(res.isFrontCamera, true);
  },
  localMirrorType: (res) => {
    localMirrorType.value = safeJsonParse<MirrorType>(res.localMirrorType, MirrorType.AUTO);
  },
  localVideoQuality: (res) => {
    localVideoQuality.value = safeJsonParse<VideoQuality>(res.localVideoQuality, VideoQuality.QUALITY_360P);
  },
  currentAudioRoute: (res) => {
    currentAudioRoute.value = safeJsonParse<AudioOutput>(res.currentAudioRoute, AudioOutput.SPEAKERPHONE);
  },
  screenStatus: (res) => {
    screenStatus.value = safeJsonParse<DeviceStatus>(res.screenStatus, DeviceStatus.OFF);
  },
  networkInfo: (res) => {
    networkInfo.value = safeJsonParse<any>(res.networkInfo, {});
  }
};

/**
 * 清除设备状态数据
 * @returns {void}
 * @memberof module:DeviceState
 */
function clearDeviceState(): void {
  // 解除事件绑定
  unbindEvent();

  const globalState = getGlobalState();
  // 清除所有状态
  globalState.microphoneStatus.value = DeviceStatus.OFF;
  globalState.microphoneLastError.value = DeviceError.NO_ERROR;
  globalState.hasPublishAudioPermission.value = true;
  globalState.captureVolume.value = 0;
  globalState.currentMicVolume.value = 0;
  globalState.outputVolume.value = 0;
  globalState.cameraStatus.value = DeviceStatus.OFF;
  globalState.cameraLastError.value = DeviceError.NO_ERROR;
  globalState.isFrontCamera.value = true;
  globalState.localMirrorType.value = MirrorType.AUTO;
  globalState.localVideoQuality.value = undefined;
  globalState.currentAudioRoute.value = AudioOutput.SPEAKERPHONE;
  globalState.screenStatus.value = undefined;
  globalState.networkInfo.value = undefined;
  // 重置绑定标志
  globalState.bindEventDone = false;
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

    // 内部方法（一般不需要外部调用）
    clearDeviceState,         // 清除状态（内部使用）
  };
}

export default useDeviceState;