/**
 * @module DeviceState (Vue2 适配版)
 * @module_description
 * 设备状态管理模块
 * 核心功能：管理摄像头、麦克风等音视频设备的控制，提供设备状态监控、权限检查等基础设备服务。
 *
 * 转换说明（基于 uniapp-uts-vue2-compat skill）：
 * - ref() → makeReactive 直接属性 (Pattern A: state.xxx)
 * - onUnmounted 移除（在组件层用 beforeDestroy 替代）
 * - UTS 直接 import → tuikitBridge 安全桥接 (Trap 3/4)
 * - ?. 可选链 → && 显式判空 (Trap 13/15)
 * - as const → 普通数组
 * - onDeviceStoreChanged[dataName]?.(result) → 显式判空调用 (Trap 15)
 */
import { safeJsonParse } from "../utils/utsUtils";
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore — uni-app 编译器会正确解析 UTS 插件路径，TS 类型检查可忽略
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import permission from "../utils/permission";

declare const uni: any;

// ===================== 枚举 & 接口 =====================

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
  AUTO = 0,
  ENABLE = 1,
  DISABLE = 2,
}

export enum VideoQuality {
  QUALITY_360P = 1,
  QUALITY_540P = 2,
  QUALITY_720P = 3,
  QUALITY_1080P = 4,
}

export type OpenLocalMicrophoneOptions = {
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

export type VolumeOptions = {
  volume: number;
}

export type OpenLocalCameraOptions = {
  isFront: boolean;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

export type SwitchCameraOptions = {
  isFront: boolean;
}

export type UpdateVideoQualityOptions = {
  quality: VideoQuality;
}

export type StartScreenShareOptions = {
  appGroup: string;
}

export type SetAudioRouteOptions = {
  audioRoute: AudioOutput;
}

export type SwitchMirrorOptions = {
  mirrorType: MirrorType;
}

// ===================== Vue2 响应式状态 =====================

interface DeviceReactiveState {
  microphoneStatus: DeviceStatus;
  microphoneLastError: DeviceError;
  hasPublishAudioPermission: boolean;
  captureVolume: number;
  currentMicVolume: number;
  outputVolume: number;
  cameraStatus: DeviceStatus;
  cameraLastError: DeviceError;
  isFrontCamera: boolean;
  localMirrorType: MirrorType;
  localVideoQuality: any;
  currentAudioRoute: AudioOutput;
  screenStatus: DeviceStatus | undefined;
  networkInfo: any;
}

// 全局状态存储 key
const DEVICE_STATE_KEY = '__TUIKIT_DEVICE_STATE__';

// 初始化全局状态存储 (Vue2 使用 Vue.observable)
function getGlobalState(): { state: DeviceReactiveState; bindEventDone: boolean } {
  if (!uni[DEVICE_STATE_KEY]) {
    uni[DEVICE_STATE_KEY] = {
      state: makeReactive<DeviceReactiveState>({
        microphoneStatus: DeviceStatus.OFF,
        microphoneLastError: DeviceError.NO_ERROR,
        hasPublishAudioPermission: true,
        captureVolume: 0,
        currentMicVolume: 0,
        outputVolume: 0,
        cameraStatus: DeviceStatus.OFF,
        cameraLastError: DeviceError.NO_ERROR,
        isFrontCamera: true,
        localMirrorType: MirrorType.AUTO,
        localVideoQuality: undefined,
        currentAudioRoute: AudioOutput.SPEAKERPHONE,
        screenStatus: undefined,
        networkInfo: undefined,
      }),
      bindEventDone: false,
    };
  }
  return uni[DEVICE_STATE_KEY];
}

// ===================== 设备控制方法 =====================

/**
 * 打开本地麦克风
 * Trap 15: data?.code → data && data.code; params?.success?.() → if (params && params.success) ...
 */
async function openLocalMicrophone(params?: OpenLocalMicrophoneOptions): Promise<void> {
  // @ts-ignore
  if (uni.getSystemInfoSync().platform === "android") {
    await permission.requestAndroidPermission(
      "android.permission.RECORD_AUDIO"
    );
  }
  return new Promise((resolve, rejectPromise) => {
    callAPI(JSON.stringify({
      api: "openLocalMicrophone",
      params: {},
    }), (res: string) => {
      try {
        const data = safeJsonParse(res, {}) as any;
        console.log('openLocalMicrophone =====>: ', data);
        if (data && data.code === 0) {
          if (params && params.success) { params.success(); }
          resolve();
        } else {
          if (params && params.fail) { params.fail(data.code, data.message); }
          rejectPromise(new Error((data && data.message) || 'openLocalMicrophone failed'));
        }
      } catch (error: any) {
        if (params && params.fail) { params.fail(-1, error.message); }
        rejectPromise(error);
      }
    });
  });
}

function closeLocalMicrophone(): void {
  callAPI(JSON.stringify({
    api: "closeLocalMicrophone",
    params: {},
  }), () => { });
}

function setCaptureVolume(params: VolumeOptions): void {
  callAPI(JSON.stringify({
    api: "setCaptureVolume",
    params: params,
  }), () => { });
}

function setOutputVolume(params: VolumeOptions): void {
  callAPI(JSON.stringify({
    api: "setOutputVolume",
    params: params,
  }), () => { });
}

function setAudioRoute(params: SetAudioRouteOptions): void {
  callAPI(JSON.stringify({
    api: "setAudioRoute",
    params: params,
  }), () => { });
}

/**
 * 打开本地摄像头
 */
async function openLocalCamera(params?: OpenLocalCameraOptions): Promise<void> {
  // @ts-ignore
  if (uni.getSystemInfoSync().platform === "android") {
    await permission.requestAndroidPermission("android.permission.CAMERA");
  }
  return new Promise((resolve, rejectPromise) => {
    callAPI(JSON.stringify({
      api: "openLocalCamera",
      params: params,
    }), (res: string) => {
      try {
        const data = safeJsonParse(res, {}) as any;
        console.log('openLocalCamera =====>: ', data);
        if (data && data.code === 0) {
          if (params && params.success) { params.success(); }
          resolve();
        } else {
          if (params && params.fail) { params.fail(data.code, data.message); }
          rejectPromise(new Error((data && data.message) || 'openLocalCamera failed'));
        }
      } catch (error: any) {
        if (params && params.fail) { params.fail(-1, error.message); }
        rejectPromise(error);
      }
    });
  });
}

function closeLocalCamera(): void {
  callAPI(JSON.stringify({
    api: "closeLocalCamera",
    params: {},
  }), () => { });
}

function switchCamera(params: SwitchCameraOptions): void {
  callAPI(JSON.stringify({
    api: "switchCamera",
    params: params,
  }), () => { });
}

function switchMirror(params: SwitchMirrorOptions): void {
  callAPI(JSON.stringify({
    api: "switchMirror",
    params: params,
  }), () => { });
}

function updateVideoQuality(params: UpdateVideoQualityOptions): void {
  callAPI(JSON.stringify({
    api: "updateVideoQuality",
    params: params,
  }), () => { });
}

function startScreenShare(): void {
  callAPI(JSON.stringify({
    api: "startScreenShare",
    params: {},
  }), () => { });
}

function stopScreenShare(): void {
  callAPI(JSON.stringify({
    api: "stopScreenShare",
    params: {},
  }), () => { });
}

// ===================== 事件绑定 =====================

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
];

/**
 * 状态变更处理器映射
 * 写入 globalState.state.xxx 而非 ref.value (Pattern A)
 */
const onDeviceStoreChanged: Record<string, (result: any) => void> = {
  microphoneStatus: (res) => {
    getGlobalState().state.microphoneStatus = safeJsonParse<DeviceStatus>(res.microphoneStatus, DeviceStatus.OFF);
  },
  microphoneLastError: (res) => {
    getGlobalState().state.microphoneLastError = safeJsonParse<DeviceError>(res.microphoneLastError, DeviceError.NO_ERROR);
  },
  captureVolume: (res) => {
    getGlobalState().state.captureVolume = safeJsonParse<number>(res.captureVolume, 0);
  },
  currentMicVolume: (res) => {
    getGlobalState().state.currentMicVolume = safeJsonParse<number>(res.currentMicVolume, 0);
  },
  outputVolume: (res) => {
    getGlobalState().state.outputVolume = safeJsonParse<number>(res.outputVolume, 0);
  },
  cameraStatus: (res) => {
    getGlobalState().state.cameraStatus = safeJsonParse<DeviceStatus>(res.cameraStatus, DeviceStatus.OFF);
  },
  cameraLastError: (res) => {
    getGlobalState().state.cameraLastError = safeJsonParse<DeviceError>(res.cameraLastError, DeviceError.NO_ERROR);
  },
  isFrontCamera: (res) => {
    getGlobalState().state.isFrontCamera = safeJsonParse<boolean>(res.isFrontCamera, true);
  },
  localMirrorType: (res) => {
    getGlobalState().state.localMirrorType = safeJsonParse<MirrorType>(res.localMirrorType, MirrorType.AUTO);
  },
  localVideoQuality: (res) => {
    getGlobalState().state.localVideoQuality = safeJsonParse<VideoQuality>(res.localVideoQuality, VideoQuality.QUALITY_360P);
  },
  currentAudioRoute: (res) => {
    getGlobalState().state.currentAudioRoute = safeJsonParse<AudioOutput>(res.currentAudioRoute, AudioOutput.SPEAKERPHONE);
  },
  screenStatus: (res) => {
    getGlobalState().state.screenStatus = safeJsonParse<DeviceStatus>(res.screenStatus, DeviceStatus.OFF);
  },
  networkInfo: (res) => {
    getGlobalState().state.networkInfo = safeJsonParse<any>(res.networkInfo, {});
  },
};

/**
 * 绑定事件监听
 * Trap 15: onDeviceStoreChanged[dataName]?.(result) → 显式判空
 */
function bindEvent(): void {
  const globalState = getGlobalState();

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
        const result = safeJsonParse<any>(data, {});
        const handler = onDeviceStoreChanged[dataName];
        if (handler) {
          handler(result);
        }
      } catch (error: any) {
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

/**
 * 清除设备状态数据
 */
function clearDeviceState(): void {
  unbindEvent();
  const globalState = getGlobalState();
  globalState.state.microphoneStatus = DeviceStatus.OFF;
  globalState.state.microphoneLastError = DeviceError.NO_ERROR;
  globalState.state.hasPublishAudioPermission = true;
  globalState.state.captureVolume = 0;
  globalState.state.currentMicVolume = 0;
  globalState.state.outputVolume = 0;
  globalState.state.cameraStatus = DeviceStatus.OFF;
  globalState.state.cameraLastError = DeviceError.NO_ERROR;
  globalState.state.isFrontCamera = true;
  globalState.state.localMirrorType = MirrorType.AUTO;
  globalState.state.localVideoQuality = undefined;
  globalState.state.currentAudioRoute = AudioOutput.SPEAKERPHONE;
  globalState.state.screenStatus = undefined;
  globalState.state.networkInfo = undefined;
  globalState.bindEventDone = false;
}

// ===================== Hook 导出 =====================

/**
 * 设备状态管理 Hook（Vue2 适配版）
 *
 * 状态访问方式（Pattern A — 直接属性访问）：
 *   const { state } = useDeviceState();
 *   state.microphoneStatus   // 麦克风状态
 *   state.cameraStatus       // 摄像头状态
 *   state.isFrontCamera      // 是否前置摄像头
 *
 * 在 Options API 组件中使用：
 *   data() {
 *     var deviceStore = useDeviceState();
 *     return { deviceState: deviceStore.state, deviceStore: deviceStore }
 *   },
 *   computed: {
 *     isMicOn() { return this.deviceState.microphoneStatus === 1; },
 *     isCamOn() { return this.deviceState.cameraStatus === 1; }
 *   }
 */
export function useDeviceState() {
  bindEvent();
  const globalState = getGlobalState();
  return {
    /** 响应式状态对象 (Vue2 直接访问属性即可) */
    state: globalState.state,

    // 麦克风控制方法
    openLocalMicrophone,
    closeLocalMicrophone,
    setCaptureVolume,
    setOutputVolume,
    setAudioRoute,

    // 摄像头控制方法
    openLocalCamera,
    closeLocalCamera,
    switchCamera,
    switchMirror,
    updateVideoQuality,

    // 屏幕共享
    startScreenShare,
    stopScreenShare,

    // 内部方法
    clearDeviceState,
  };
}

export default useDeviceState;
