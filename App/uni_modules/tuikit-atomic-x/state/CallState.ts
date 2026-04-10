/**
 * @module CallState
 * @module_description
 * 通话状态管理模块
 * 核心功能：负责音视频通话的状态管理、通话控制、参与者管理等通话核心服务。
 * 技术特点：支持音频通话、视频通话、多人通话、通话记录查询等高级功能。
 * 业务价值：为直播平台提供完整的音视频通话能力，支持一对一和多人通话场景。
 * 应用场景：语音通话、视频通话、群组通话、通话历史管理等通话场景。
 */
import { ref, type Ref } from "vue";
import { safeJsonParse } from "../utils/utsUtils";
import {
  addListener, callAPI, removeListener, setVirtualBackground,
  startFloatView, stopFloatView, addFloatViewListener, removeFloatViewListener, startVibrating, stopVibrating, enableMultiDeviceAbility, startForegroundService,
  stopForegroundService, setFramework
} from "@/uni_modules/tuikit-atomic-x";

declare const uni: any;

// 全局状态存储 key
const CALL_STATE_KEY = '__TUIKIT_CALL_STATE__';

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

/**
 * 通话信息接口
 */
export interface CallInfo {
  callId: string;
  mediaType: CallMediaType;
  startTime: number;
  duration: number;
  participantIds: string[];
  callParams?: any;
}

/**
 * 通话参与者信息接口
 */
export interface CallParticipant {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isMicMuted: boolean;
  isCameraMuted: boolean;
}

/**
 * 通话记录接口
 */
export interface RecentCall {
  callId: string;
  mediaType: CallMediaType;
  startTime: number;
  duration: number;
  participantIds: string[];
  endReason: CallEndReason;
}

/**
 * 音量信息接口
 */
export interface SpeakerVolume {
  userId: string;
  volume: number;
}

/**
 * 网络质量信息接口
 */
export interface NetworkQualityInfo {
  userId: string;
  quality: NetworkQuality;
}

/**
 * 发起通话参数
 */
export interface CallsOptions {
  participantIds: string[];
  mediaType: CallMediaType;
  params?: any;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 接听通话参数
 */
export interface AcceptOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 拒绝通话参数
 */
export interface RejectOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 挂断通话参数
 */
export interface HangupOptions {
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 加入通话参数
 */
export interface JoinOptions {
  callId: string;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 邀请加入通话参数
 */
export interface InviteOptions {
  participantIds: string[];
  params?: any;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 查询通话记录参数
 */
export interface QueryRecentCallsOptions {
  cursor?: string;
  count?: number;
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 删除通话记录参数
 */
export interface DeleteRecentCallsOptions {
  callIdList: string[];
  success?: () => void;
  fail?: (code: number, message: string) => void;
}

/**
 * 悬浮窗配置项
 */
export interface StartFloatWindowOptions {
  /** 参与者头像资源，key 为用户 ID，value 为头像路径 */
  avatars?: Record<string, string>
  /** 通话等待动画资源路径 */
  waitingAnimation?: string
  /** 音量等级图标资源，key 为等级名称（Mute/Low/Medium/High/Peak），value 为图标路径 */
  volumeLevelIcons?: Record<string, string>
  /** 网络质量图标资源，key 为质量名称（UNKNOWN/EXCELLENT/GOOD/POOR/BAD/VERY_BAD/DOWN），value 为图标路径 */
  networkQualityIcons?: Record<string, string>
}

/**
 * 通话事件监听器函数类型
 */
export type ICallListener = (params?: unknown) => void;


// 初始化全局状态存储
function getGlobalState() {
  if (!uni[CALL_STATE_KEY]) {
    uni[CALL_STATE_KEY] = {
      activeCall: ref<CallInfo | null>(null),
      recentCalls: ref<RecentCall[]>([]),
      cursor: ref<string>(''),
      selfInfo: ref<CallParticipant | null>(null),
      allParticipants: ref<CallParticipant[]>([]),
      speakerVolumes: ref<SpeakerVolume[]>([]),
      networkQualities: ref<Record<string, NetworkQuality>>({}),
      bindEventDone: false
    };
  }
  return uni[CALL_STATE_KEY];
}

/**
 * 当前活跃通话信息
 * @type {Ref<CallInfo | null>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { activeCall } = useCallState();
 *
 * // 监听通话信息变化
 * watch(activeCall, (newCall) => {
 *   if (newCall) {
 *     console.log('当前通话:', newCall.callId);
 *     console.log('通话类型:', newCall.mediaType);
 *   }
 * });
 */
const activeCall: Ref<CallInfo | null> = getGlobalState().activeCall;

/**
 * 最近通话记录列表
 * @type {Ref<RecentCall[]>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { recentCalls } = useCallState();
 *
 * // 监听最近通话记录变化
 * watch(recentCalls, (newCalls) => {
 *   console.log('最近通话记录:', newCalls);
 *   newCalls.forEach((call) => {
 *     console.log('通话ID:', call.callId, '类型:', call.mediaType);
 *   });
 * });
 */
const recentCalls: Ref<RecentCall[]> = getGlobalState().recentCalls;

/**
 * 通话记录查询游标
 * @type {Ref<string>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { cursor } = useCallState();
 *
 * // 监听查询游标变化
 * watch(cursor, (newCursor) => {
 *   console.log('当前游标:', newCursor);
 *   if (newCursor) {
 *     console.log('还有更多通话记录可加载');
 *   }
 * });
 */
const cursor: Ref<string> = getGlobalState().cursor;

/**
 * 当前用户在通话中的信息
 * @type {Ref<CallParticipant | null>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { selfInfo } = useCallState();
 *
 * // 监听自身通话信息变化
 * watch(selfInfo, (newInfo) => {
 *   if (newInfo) {
 *     console.log('用户ID:', newInfo.userId);
 *     console.log('麦克风状态:', newInfo.isMicMuted ? '静音' : '开启');
 *     console.log('摄像头状态:', newInfo.isCameraMuted ? '关闭' : '开启');
 *   }
 * });
 */
const selfInfo: Ref<CallParticipant | null> = getGlobalState().selfInfo;

/**
 * 所有通话参与者列表
 * @type {Ref<CallParticipant[]>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { allParticipants } = useCallState();
 *
 * // 监听通话参与者变化
 * watch(allParticipants, (newParticipants) => {
 *   console.log('参与者数量:', newParticipants.length);
 *   newParticipants.forEach((participant) => {
 *     console.log('用户:', participant.userId, '音频:', participant.hasAudio, '视频:', participant.hasVideo);
 *   });
 * });
 */
const allParticipants: Ref<CallParticipant[]> = getGlobalState().allParticipants;

/**
 * 参与者音量列表
 * @type {Ref<SpeakerVolume[]>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { speakerVolumes } = useCallState();
 *
 * // 监听参与者音量变化
 * watch(speakerVolumes, (newVolumes) => {
 *   newVolumes.forEach((item) => {
 *     console.log('用户:', item.userId, '音量:', item.volume);
 *   });
 * });
 */
const speakerVolumes: Ref<SpeakerVolume[]> = getGlobalState().speakerVolumes;

/**
 * 参与者网络质量信息
 * @type {Ref<Record<string, NetworkQuality>>}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { networkQualities } = useCallState();
 *
 * // 监听网络质量变化
 * watch(networkQualities, (newQualities) => {
 *   Object.entries(newQualities).forEach(([userId, quality]) => {
 *     console.log('用户:', userId, '网络质量:', quality);
 *   });
 * });
 */
const networkQualities: Ref<Record<string, NetworkQuality>> = getGlobalState().networkQualities;

const createStoreParams = JSON.stringify({
  storeName: "call",
  id: ''
})

/**
 * 发起通话
 * @param {CallsOptions} params - 通话参数
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState, CallMediaType } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { calls } = useCallState();
 * calls({
 *   participantIds: ['user123', 'user456'],
 *   mediaType: CallMediaType.Video,
 *   success: () => console.log('发起通话成功'),
 *   fail: (code, message) => console.error('发起通话失败:', code, message)
 * });
 */
function calls(params: CallsOptions): void {
  setFramework(17)
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
      if (data?.code === 0) {
        success?.();
      } else {
        fail?.(data.code, data.message);
      }
    } catch (error) {
      fail?.(-1, error.message);
    }
  });
}

/**
 * 接听通话
 * @param {AcceptOptions} [params] - 接听参数（可选）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { accept } = useCallState();
 * accept({
 *   success: () => console.log('接听成功'),
 *   fail: (code, message) => console.error('接听失败:', code, message)
 * });
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
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

/**
 * 拒绝通话
 * @param {RejectOptions} [params] - 拒绝参数（可选）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { reject } = useCallState();
 * reject({
 *   success: () => console.log('拒绝成功'),
 *   fail: (code, message) => console.error('拒绝失败:', code, message)
 * });
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
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

/**
 * 挂断通话
 * @param {HangupOptions} [params] - 挂断参数（可选）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { hangup } = useCallState();
 * hangup({
 *   success: () => console.log('挂断成功'),
 *   fail: (code, message) => console.error('挂断失败:', code, message)
 * });
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
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

/**
 * 加入通话
 * @param {JoinOptions} params - 加入通话参数
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { join } = useCallState();
 * join({
 *   callId: 'call_123456',
 *   success: () => console.log('加入通话成功'),
 *   fail: (code, message) => console.error('加入通话失败:', code, message)
 * });
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
      if (data?.code === 0) {
        success?.();
      } else {
        fail?.(data.code, data.message);
      }
    } catch (error) {
      fail?.(-1, error.message);
    }
  });
}

/**
 * 邀请用户加入通话
 * @param {InviteOptions} params - 邀请参数
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { invite } = useCallState();
 * invite({
 *   participantIds: ['user789'],
 *   success: () => console.log('邀请成功'),
 *   fail: (code, message) => console.error('邀请失败:', code, message)
 * });
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
      if (data?.code === 0) {
        success?.();
      } else {
        fail?.(data.code, data.message);
      }
    } catch (error) {
      fail?.(-1, error.message);
    }
  });
}

/**
 * 设置虚拟背景
 * @param {boolean} enable - 是否开启虚拟背景
 * @returns {void}
 * @memberof module:CallState
 * @internal
 */
function enableVirtualBackground(enable: boolean) {

  setVirtualBackground(enable)

}

/**
 * 查询通话记录
 * @param {QueryRecentCallsOptions} [params] - 查询参数（可选）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { queryRecentCalls } = useCallState();
 * queryRecentCalls({
 *   cursor: '',
 *   count: 20,
 *   success: () => console.log('查询成功'),
 *   fail: (code, message) => console.error('查询失败:', code, message)
 * });
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
      if (data?.code === 0) {
        success?.();
      } else {
        fail?.(data.code, data.message);
      }
    } catch (error) {
      fail?.(-1, error.message);
    }
  });
}

/**
 * 删除通话记录
 * @param {DeleteRecentCallsOptions} params - 删除参数
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { deleteRecentCalls } = useCallState();
 * deleteRecentCalls({
 *   callIdList: ['call_123', 'call_456'],
 *   success: () => console.log('删除成功'),
 *   fail: (code, message) => console.error('删除失败:', code, message)
 * });
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
      if (data?.code === 0) {
        success?.();
      } else {
        fail?.(data.code, data.message);
      }
    } catch (error) {
      fail?.(-1, error.message);
    }
  });
}

/**
 * 添加通话事件监听
 * @param {string} eventName - 事件名称，可选值: 'onCallStarted'(通话开始) | 'onCallReceived'(收到通话) | 'onCallEnded'(通话结束)
 * @param {ICallListener} listener - 事件回调函数
 * @param {string} [listenerID] - 监听器ID（可选，用于标识和移除特定监听器）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { addCallListener } = useCallState();
 *
 * // 监听收到通话事件
 * addCallListener('onCallReceived', (params) => {
 *   console.log('收到通话:', params);
 *   // params 包含: { callId, mediaType, userData }
 * }, 'myListener');
 *
 * // 监听通话开始事件
 * addCallListener('onCallStarted', (params) => {
 *   console.log('通话已开始:', params);
 *   // params 包含: { callId, mediaType }
 * });
 *
 * // 监听通话结束事件
 * addCallListener('onCallEnded', (params) => {
 *   console.log('通话已结束:', params);
 *   // params 包含: { callId, mediaType, reason, userId }
 * });
 */
function addCallListener(eventName: string, listener: ICallListener, listenerID?: string): void {
  const createListenerKeyObject = {
    type: 'state',
    store: 'CallStore',
    name: eventName,
    listenerID: listenerID ?? null,
    params: {
      createStoreParams: createStoreParams
    }
  };
  addListener(createListenerKeyObject, listener);

}

/**
 * 移除通话事件监听
 * @param {string} eventName - 事件名称
 * @param {string} [listenerID] - 监听器ID（可选，如果不传则移除该事件的所有监听器）
 * @returns {void}
 * @memberof module:CallState
 * @example
 * import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 * const { removeCallListener } = useCallState();
 *
 * // 移除特定监听器
 * removeCallListener('onCallReceived', 'myListener');
 *
 * // 移除该事件的所有监听器
 * removeCallListener('onCallReceived');
 */
function removeCallListener(eventName: string, listenerID?: string): void {
  const createListenerKeyObject = {
    type: 'state',
    store: 'CallStore',
    name: eventName,
    listenerID: listenerID ?? null,
    params: {
      createStoreParams: createStoreParams
    }
  };
  removeListener(createListenerKeyObject);
}


/**
 * 清除通话状态数据
 * @returns {void}
 * @memberof module:CallState
 * @internal
 */
function clearCallState(): void {
  // 解除事件绑定
  unbindEvent();

  const globalState = getGlobalState();
  // 清除所有状态
  globalState.activeCall.value = null;
  globalState.recentCalls.value = [];
  globalState.cursor.value = '';
  globalState.selfInfo.value = null;
  globalState.allParticipants.value = [];
  globalState.speakerVolumes.value = [];
  globalState.networkQualities.value = {};
  // 清除事件监听器
  // 重置绑定标志
  globalState.bindEventDone = false;
}

/**
 * 解除事件监听
 * @returns {void}
 * @memberof module:CallState
 * @internal
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

  // 解除状态监听
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
 * @returns {void}
 * @memberof module:CallState
 * @internal
 */
function bindEvent(): void {
  const globalState = getGlobalState();

  // 防止重复绑定事件
  if (globalState.bindEventDone) {
    return;
  }
  globalState.bindEventDone = true;

  // ============ 状态监听 ============

  // 监听活跃通话
  addListener({
    type: 'state',
    store: "CallStore",
    name: "activeCall",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      activeCall.value = safeJsonParse<CallInfo | null>(result.activeCall, null);
      console.log(`[activeCall listener] Data:`, activeCall.value);
    } catch (error) {
      console.error(`[activeCall listener] Error:`, error);
    }
  });

  // 监听最近通话记录
  addListener({
    type: 'state',
    store: "CallStore",
    name: "recentCalls",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      recentCalls.value = safeJsonParse<RecentCall[]>(result.recentCalls, []);
      console.log(`[recentCalls listener] Data:`, recentCalls.value);
    } catch (error) {
      console.error(`[recentCalls listener] Error:`, error);
    }
  });

  // 监听查询游标
  addListener({
    type: 'state',
    store: "CallStore",
    name: "cursor",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      cursor.value = result.cursor || '';
      console.log(`[cursor listener] Data:`, cursor.value);
    } catch (error) {
      console.error(`[cursor listener] Error:`, error);
    }
  });

  // 监听自身信息
  addListener({
    type: 'state',
    store: "CallStore",
    name: "selfInfo",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      selfInfo.value = safeJsonParse<CallParticipant | null>(result.selfInfo, null);
      console.log(`[selfInfo listener] Data:`, selfInfo.value);
    } catch (error) {
      console.error(`[selfInfo listener] Error:`, error);
    }
  });

  // 监听所有参与者
  addListener({
    type: 'state',
    store: "CallStore",
    name: "allParticipants",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      allParticipants.value = safeJsonParse<CallParticipant[]>(result.allParticipants, []);
      console.log(`[allParticipants listener] Data:`, allParticipants.value);
    } catch (error) {
      console.error(`[allParticipants listener] Error:`, error);
    }
  });

  // 监听音量信息
  addListener({
    type: 'state',
    store: "CallStore",
    name: "speakerVolumes",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      speakerVolumes.value = safeJsonParse<SpeakerVolume[]>(result.speakerVolumes, []);
      // console.log(`[speakerVolumes listener] Data count:`, speakerVolumes.value.length);
    } catch (error) {
      console.error(`[speakerVolumes listener] Error:`, error);
    }
  });

  // 监听网络质量
  addListener({
    type: 'state',
    store: "CallStore",
    name: "networkQualities",
    listenerID: "call",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data) => {
    try {
      const result = safeJsonParse<any>(data, {});
      networkQualities.value = safeJsonParse<Record<string, NetworkQuality>>(result.networkQualities, {});
      console.log(`[networkQualities listener] Data:`, networkQualities.value);
    } catch (error) {
      console.error(`[networkQualities listener] Error:`, error);
    }
  });
}
/**
 * 开启悬浮窗
 * @param {(code: number, message: string) => void} callback  code为0，表示开启悬浮窗成功，-1表示没有悬浮窗权限（仅Android）
 * @return
 * @internal
 */
function startFloatWindow(options?: StartFloatWindowOptions, callback?: (code: number, message: string) => void) {
  startFloatView(JSON.stringify(options), callback)
}
/**
 * 关闭悬浮窗
 * @return
 * @internal
 */
function stopFloatWindow() {
  stopFloatView()
}
/**
 * 开启振动
 * @return
 * @internal
 */
function startVibrate() {
  console.log('callState startVibrating')
  startVibrating()
}
/**
 * 关闭振动
 * @return
 * @internal
 */
function stopVibrate() {
  console.log('callState stopVibrating')
  stopVibrating()
}

/**
 * 添加悬浮窗点击事件的监听
 * @param {() => void} click
 * @return
 * @internal
 */
function addFloatWindowListener(click: () => void) {
  addFloatViewListener(click)
}
/**
 * 移除悬浮窗点击事件的监听
 * @return
 * @internal
 */
function removeFloatWindowListener() {
  removeFloatViewListener()
}

/**
 * 开启/关闭 TUICallEngine 的多设备登录模式
 * @internal
 */
function enableCallMultiDeviceAbility(enable: boolean) {
  enableMultiDeviceAbility(enable)
}
/**
 * 通话状态管理 Hook
 * @returns {Object} 通话状态和方法集合
 * @example
 * import { useCallState, CallMediaType } from '@/uni_modules/tuikit-atomic-x/state/CallState';
 *
 * const {
 *   // 状态
 *   activeCall,
 *   recentCalls,
 *   allParticipants,
 *   speakerVolumes,
 *   networkQualities,
 *   // 方法
 *   calls,
 *   accept,
 *   reject,
 *   hangup,
 *   join,
 *   invite,
 *   queryRecentCalls,
 *   deleteRecentCalls,
 *   addCallListener,
 *   removeCallListener
 * } = useCallState();
 *
 * // 添加事件监听（无需对象包裹，直接传函数）
 * addCallListener('onCallReceived', (params) => {
 *   console.log('收到通话邀请:', params);
 *   // 显示通话界面
 * }, 'myListenerId');
 *
 * // 发起视频通话
 * calls({
 *   participantIds: ['user123'],
 *   mediaType: CallMediaType.Video,
 *   success: () => console.log('通话发起成功')
 * });
 */
export function useCallState() {
  bindEvent();
  return {
    // 状态
    activeCall,           // 当前活跃通话
    recentCalls,          // 最近通话记录
    cursor,               // 查询游标
    selfInfo,             // 自身信息
    allParticipants,      // 所有参与者
    speakerVolumes,       // 音量信息
    networkQualities,     // 网络质量

    // 通话控制方法
    calls,                // 发起通话
    accept,               // 接听通话
    reject,               // 拒绝通话
    hangup,               // 挂断通话
    join,                 // 加入通话
    invite,               // 邀请加入
    enableVirtualBackground, // 设置背景模糊
    // 通话记录管理
    queryRecentCalls,     // 查询通话记录
    deleteRecentCalls,    // 删除通话记录

    // 事件监听管理
    addCallListener,      // 添加事件监听
    removeCallListener,   // 移除事件监听

    // 内部方法（一般不需要外部调用）
    clearCallState,       // 清除状态（内部使用）

    startFloatWindow,        // 开启悬浮窗
    stopFloatWindow,         // 关闭悬浮窗
    startVibrate,          // 开启振动
    stopVibrate,           // 关闭振动
    addFloatWindowListener,   // 添加悬浮窗点击事件的监听
    removeFloatWindowListener,// 移除悬浮窗点击事件的监听
    enableCallMultiDeviceAbility, // 开启多端登录
    startForegroundService,
    stopForegroundService,
    setFramework
  };
}

export default useCallState;