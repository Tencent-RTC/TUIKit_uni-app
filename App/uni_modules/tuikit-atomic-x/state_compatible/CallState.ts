/**
 * @module CallState (Vue2 适配版)
 * @module_description
 * 通话状态管理模块
 * 核心功能：负责音视频通话的状态管理、通话控制、参与者管理等通话核心服务。
 *
 * 转换说明（基于 uniapp-uts-vue2-compat skill）：
 * - ref() → makeReactive 直接属性 (Pattern A: state.xxx)
 * - UTS 直接 import → tuikitBridge 安全桥接 (Trap 3/4)
 * - ?. 可选链 → && 显式判空 (Trap 13/15)
 * - ?? 空值合并 → 三元 / || (Trap 15)
 */
import { safeJsonParse } from "../utils/utsUtils";
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore — uni-app 编译器会正确解析 UTS 插件路径，TS 类型检查可忽略
import {
  addListener, callAPI, removeListener, setVirtualBackground,
  startFloatView, stopFloatView, addFloatViewListener, removeFloatViewListener,
  startVibrating, stopVibrating, enableMultiDeviceAbility,
  startForegroundService, stopForegroundService, setCallFramework
} from "../utils/tuikitBridge";

declare const uni: any;

// ===================== 枚举 & 接口 =====================

// 通话媒体类型枚举
export enum CallMediaType {
  Audio = 0,
  Video = 1
}

// 通话结束原因枚举
export enum CallEndReason {
  Unknown = 0,
  Hangup = 1,
  Reject = 2,
  Timeout = 3,
  Cancel = 4,
  Busy = 5,
  LineBusy = 6,
  Error = 7
}

// 网络质量枚举
export enum NetworkQuality {
  Unknown = 0,
  Excellent = 1,
  Good = 2,
  Poor = 3,
  Bad = 4,
  VeryBad = 5,
  Down = 6
}

// 通话错误码枚举
export enum CallErrorCode {
  PACKAGE_NOT_PURCHASED = 101011
}

export interface CallInfo {
  callId: string;
  mediaType: CallMediaType;
  startTime: number;
  duration: number;
  participantIds: string[];
  callParams?: any;
}

export interface CallParticipant {
  id: string;
  userName?: string;
  avatarUrl?: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isMicMuted: boolean;
  isCameraMuted: boolean;
  /** 参与者状态：0=空闲, 1=等待中, 2=通话中 */
  status?: number;
}

export interface RecentCall {
  callId: string;
  mediaType: CallMediaType;
  startTime: number;
  duration: number;
  participantIds: string[];
  endReason: CallEndReason;
}

export interface SpeakerVolume {
  userId: string;
  volume: number;
}

export interface NetworkQualityInfo {
  userId: string;
  quality: NetworkQuality;
}

export interface CallsOptions {
  participantIds: string[];
  mediaType: CallMediaType;
  params?: any;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface AcceptOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface RejectOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface HangupOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface JoinOptions {
  callId: string;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface InviteOptions {
  participantIds: string[];
  params?: any;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface QueryRecentCallsOptions {
  cursor?: string;
  count?: number;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface DeleteRecentCallsOptions {
  callIdList: string[];
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

export interface StartFloatWindowOptions {
  avatars?: Record<string, string>;
  waitingAnimation?: string;
  volumeLevelIcons?: Record<string, string>;
  networkQualityIcons?: Record<string, string>;
}

export type ICallListener = (params?: unknown) => void;

// ===================== Vue2 响应式状态 =====================

interface CallReactiveState {
  activeCall: CallInfo | null;
  recentCalls: RecentCall[];
  cursor: string;
  selfInfo: CallParticipant | null;
  allParticipants: CallParticipant[];
  speakerVolumes: SpeakerVolume[];
  networkQualities: Record<string, NetworkQuality>;
}

// 全局状态存储 key
const CALL_STATE_KEY = '__TUIKIT_CALL_STATE__';

// 初始化全局状态存储 (Vue2 使用 Vue.observable)
function getGlobalState(): { state: CallReactiveState; bindEventDone: boolean } {
  if (!uni[CALL_STATE_KEY]) {
    uni[CALL_STATE_KEY] = {
      state: makeReactive<CallReactiveState>({
        activeCall: null,
        recentCalls: [],
        cursor: '',
        selfInfo: null,
        allParticipants: [],
        speakerVolumes: [],
        networkQualities: {},
      }),
      bindEventDone: false,
    };
  }
  return uni[CALL_STATE_KEY];
}

const createStoreParams = JSON.stringify({
  storeName: "call",
  id: ''
});

// ===================== 通话控制方法 =====================

/**
 * 发起通话
 * Trap 15: data?.code → data && data.code; success?.() → if (success) success()
 */
function calls(params: CallsOptions): void {
  setCallFramework(17);
  const { success, fail, ...callParams } = params;
  callAPI(JSON.stringify({
    api: "calls",
    params: {
      createStoreParams: createStoreParams,
      ...callParams
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (success) { success(); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (fail) { fail(-1, error.message); }
    }
  });
}

/**
 * 接听通话
 */
function accept(params?: AcceptOptions): void {
  callAPI(JSON.stringify({
    api: "accept",
    params: {
      createStoreParams: createStoreParams,
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (params && params.success) { params.success(); }
      } else {
        if (params && params.fail) { params.fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (params && params.fail) { params.fail(-1, error.message); }
    }
  });
}

/**
 * 拒绝通话
 */
function reject(params?: RejectOptions): void {
  callAPI(JSON.stringify({
    api: "reject",
    params: {
      createStoreParams: createStoreParams,
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (params && params.success) { params.success(); }
      } else {
        if (params && params.fail) { params.fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (params && params.fail) { params.fail(-1, error.message); }
    }
  });
}

/**
 * 挂断通话
 */
function hangup(params?: HangupOptions): void {
  callAPI(JSON.stringify({
    api: "hangup",
    params: {
      createStoreParams: createStoreParams,
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (params && params.success) { params.success(); }
      } else {
        if (params && params.fail) { params.fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (params && params.fail) { params.fail(-1, error.message); }
    }
  });
}

/**
 * 加入通话
 */
function join(params: JoinOptions): void {
  const { success, fail, ...joinParams } = params;
  callAPI(JSON.stringify({
    api: "join",
    params: {
      createStoreParams: createStoreParams,
      ...joinParams
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (success) { success(); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (fail) { fail(-1, error.message); }
    }
  });
}

/**
 * 邀请用户加入通话
 */
function invite(params: InviteOptions): void {
  const { success, fail, ...inviteParams } = params;
  callAPI(JSON.stringify({
    api: "invite",
    params: {
      createStoreParams: createStoreParams,
      ...inviteParams
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (success) { success(); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (fail) { fail(-1, error.message); }
    }
  });
}

/**
 * 设置虚拟背景
 */
function enableVirtualBackground(enable: boolean) {
  setVirtualBackground(enable);
}

/**
 * 查询通话记录
 */
function queryRecentCalls(params?: QueryRecentCallsOptions): void {
  const { success, fail, ...queryParams } = params || {};
  callAPI(JSON.stringify({
    api: "queryRecentCalls",
    params: {
      createStoreParams: createStoreParams,
      cursor: queryParams.cursor || '',
      count: queryParams.count || 20
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (success) { success(); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (fail) { fail(-1, error.message); }
    }
  });
}

/**
 * 删除通话记录
 */
function deleteRecentCalls(params: DeleteRecentCallsOptions): void {
  const { success, fail, ...deleteParams } = params;
  callAPI(JSON.stringify({
    api: "deleteRecentCalls",
    params: {
      createStoreParams: createStoreParams,
      ...deleteParams
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data && data.code === 0) {
        if (success) { success(); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (fail) { fail(-1, error.message); }
    }
  });
}

// ===================== 事件监听管理 =====================

/**
 * 添加通话事件监听
 * Trap 15: listenerID ?? null → listenerID != null ? listenerID : null
 */
function addCallListener(eventName: string, listener: ICallListener, listenerID?: string): void {
  const createListenerKeyObject = {
    type: 'state',
    store: 'CallStore',
    name: eventName,
    listenerID: listenerID != null ? listenerID : null,
    params: {
      createStoreParams: createStoreParams
    }
  };
  addListener(createListenerKeyObject, listener as any);
}

/**
 * 移除通话事件监听
 */
function removeCallListener(eventName: string, listenerID?: string): void {
  const createListenerKeyObject = {
    type: 'state',
    store: 'CallStore',
    name: eventName,
    listenerID: listenerID != null ? listenerID : null,
    params: {
      createStoreParams: createStoreParams
    }
  };
  removeListener(createListenerKeyObject);
}


/**
 * 解除事件监听
 */
function unbindEvent(): void {
  const stateNames = [
    "activeCall",
    "recentCalls",
    "cursor",
    "selfInfo",
    "allParticipants",
    "speakerVolumes",
    "networkQualities"
  ];

  stateNames.forEach(name => {
    removeListener({
      type: "state",
      store: "CallStore",
      name,
      params: {
        createStoreParams: createStoreParams
      }
    });
  });
}

/**
 * 绑定事件监听
 */
function bindEvent(): void {
  const globalState = getGlobalState();

  if (globalState.bindEventDone) {
    return;
  }
  globalState.bindEventDone = true;

  // 监听活跃通话
  addListener({
    type: 'state',
    store: "CallStore",
    name: "activeCall",
    listenerID: "call",
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.activeCall = safeJsonParse<CallInfo | null>(result.activeCall, null);
      console.log(`[activeCall listener] Data:`, globalState.state.activeCall);
    } catch (error: any) {
      console.error(`[activeCall listener] Error:`, error);
    }
  });

  // 监听最近通话记录
  addListener({
    type: 'state',
    store: "CallStore",
    name: "recentCalls",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.recentCalls = safeJsonParse<RecentCall[]>(result.recentCalls, []);
      console.log(`[recentCalls listener] Data:`, globalState.state.recentCalls);
    } catch (error: any) {
      console.error(`[recentCalls listener] Error:`, error);
    }
  });

  // 监听查询游标
  addListener({
    type: 'state',
    store: "CallStore",
    name: "cursor",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.cursor = result.cursor || '';
      console.log(`[cursor listener] Data:`, globalState.state.cursor);
    } catch (error: any) {
      console.error(`[cursor listener] Error:`, error);
    }
  });

  // 监听自身信息
  addListener({
    type: 'state',
    store: "CallStore",
    name: "selfInfo",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.selfInfo = safeJsonParse<CallParticipant | null>(result.selfInfo, null);
      console.log(`[selfInfo listener] Data:`, globalState.state.selfInfo);
    } catch (error: any) {
      console.error(`[selfInfo listener] Error:`, error);
    }
  });

  // 监听所有参与者
  addListener({
    type: 'state',
    store: "CallStore",
    name: "allParticipants",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.allParticipants = safeJsonParse<CallParticipant[]>(result.allParticipants, []);
      console.log(`[allParticipants listener] Data:`, globalState.state.allParticipants);
    } catch (error: any) {
      console.error(`[allParticipants listener] Error:`, error);
    }
  });

  // 监听音量信息
  addListener({
    type: 'state',
    store: "CallStore",
    name: "speakerVolumes",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.speakerVolumes = safeJsonParse<SpeakerVolume[]>(result.speakerVolumes, []);
    } catch (error: any) {
      console.error(`[speakerVolumes listener] Error:`, error);
    }
  });

  // 监听网络质量
  addListener({
    type: 'state',
    store: "CallStore",
    name: "networkQualities",
    listenerID: "call",
    params: { createStoreParams: createStoreParams }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.networkQualities = safeJsonParse<Record<string, NetworkQuality>>(result.networkQualities, {});
      console.log(`[networkQualities listener] Data:`, globalState.state.networkQualities);
    } catch (error: any) {
      console.error(`[networkQualities listener] Error:`, error);
    }
  });
}

// ===================== 悬浮窗 & 振动 & 多设备 =====================

function startFloatWindow(options?: StartFloatWindowOptions, callback?: (code: number, message: string) => void) {
  startFloatView(JSON.stringify(options || {}), callback);
}

function stopFloatWindow() {
  stopFloatView();
}

function startVibrate() {
  console.log('callState startVibrating');
  startVibrating();
}

function stopVibrate() {
  console.log('callState stopVibrating');
  stopVibrating();
}

function addFloatWindowListener(click: () => void) {
  addFloatViewListener(click);
}

function removeFloatWindowListener() {
  removeFloatViewListener();
}

function enableCallMultiDeviceAbility(enable: boolean) {
  enableMultiDeviceAbility(enable);
}

// ===================== Hook 导出 =====================

/**
 * 通话状态管理 Hook（Vue2 适配版）
 *
 * 状态访问方式（Pattern A — 直接属性访问）：
 *   const { state } = useCallState();
 *   state.activeCall       // 当前活跃通话
 *   state.recentCalls      // 最近通话记录
 *   state.allParticipants  // 所有参与者
 *
 * 在 Options API 组件中使用：
 *   data() {
 *     var callStore = useCallState();
 *     return { callState: callStore.state, callStore: callStore }
 *   },
 *   computed: {
 *     currentCall() { return this.callState.activeCall; },
 *     participants() { return this.callState.allParticipants; }
 *   }
 */
export function useCallState() {
  bindEvent();
  const globalState = getGlobalState();
  return {
    /** 响应式状态对象 (Vue2 直接访问属性即可) */
    state: globalState.state,

    // 通话控制方法
    calls,
    accept,
    reject,
    hangup,
    join,
    invite,
    enableVirtualBackground,

    // 通话记录管理
    queryRecentCalls,
    deleteRecentCalls,

    // 事件监听管理
    addCallListener,
    removeCallListener,
    unbindEvent,

    // 悬浮窗 & 振动 & 多设备
    startFloatWindow,
    stopFloatWindow,
    startVibrate,
    stopVibrate,
    addFloatWindowListener,
    removeFloatWindowListener,
    enableCallMultiDeviceAbility,
    startForegroundService,
    stopForegroundService,
    setCallFramework,
  };
}

export default useCallState;