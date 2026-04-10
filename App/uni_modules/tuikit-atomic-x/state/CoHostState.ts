/**
 * @module CoHostState
 * @module_description
 * 连线主播管理模块
 * 核心功能：实现主播间的连线功能，支持主播邀请、连线申请、连线状态管理等主播间互动功能。
 * 技术特点：支持多主播音视频同步、画中画显示、音视频质量优化等高级技术，确保连线体验的流畅性。
 * 业务价值：为直播平台提供主播间协作的核心能力，支持PK、合作直播等高级业务场景。
 * 应用场景：主播连线、合作直播、跨平台连线、主播互动等高级直播场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener, HybridResponseData
} from "@/uni_modules/tuikit-atomic-x";
import { LiveUserInfoParam, currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 连麦布局模板类型
 * @remarks
 * 可用值：
 * - `HOST_VOICE_CONNECTION`: 语音连线布局
 * - `HOST_DYNAMIC_GRID`: 动态网格布局
 * - `HOST_DYNAMIC_1V6`: 1制6布局
 */
export enum CoHostLayoutTemplateType {
  HOST_VOICE_CONNECTION = 2,
  HOST_DYNAMIC_GRID = 600,
  HOST_DYNAMIC_1V6 = 601,
}
/**
 * 连线状态类型
 * @remarks
 * 可用值：
 * - `CONNECTED`: 0，已连接
 * - `DISCONNECTED`: 1，已断开
 */
export enum CoHostStatusType {
  CONNECTED = 0,
  DISCONNECTED = 1,
}

/**
 * 请求主播连麦参数
 * @interface RequestHostConnectionOptions
 */
export type RequestHostConnectionOptions = {
  liveID: string;
  targetHostLiveID: string;
  layoutTemplate: CoHostLayoutTemplateType;
  timeout: number;
  extraInfo?: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 取消主播连麦请求参数
 * @interface CancelHostConnectionOptions
 */
export type CancelHostConnectionOptions = {
  liveID: string;
  toHostLiveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 接受主播连麦请求参数
 * @interface AcceptHostConnectionOptions
 */
export type AcceptHostConnectionOptions = {
  liveID: string;
  fromHostLiveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 拒绝主播连麦请求参数
 * @interface RejectHostConnectionOptions
 */
export type RejectHostConnectionOptions = {
  liveID: string;
  fromHostLiveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 退出主播连麦参数
 * @interface ExitHostConnectionOptions
 */
export type ExitHostConnectionOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 已连接的连线主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { connected } = useCoHostState('your_live_id');
 *
 * // 监听已连接的连线主播列表变化
 * watch(connected, (newConnected) => {
 *   if (newConnected && newConnected.length > 0) {
 *     console.log('已连接的主播列表:', newConnected);
 *   }
 * });
 *
 * // 获取当前已连接的连线主播数量
 * const coHosts = connected.value;
 * console.log('已连接的主播数:', coHosts.length);
 */
const connected = ref<LiveUserInfoParam[]>([]);

/**
 * 被邀请连线的主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { invitees } = useCoHostState('your_live_id');
 *
 * // 监听被邀请的主播列表变化
 * watch(invitees, (newInvitees) => {
 *   if (newInvitees && newInvitees.length > 0) {
 *     console.log('被邀请的主播列表:', newInvitees);
 *   }
 * });
 *
 * // 获取当前被邀请的主播列表
 * const invitedHosts = invitees.value;
 * console.log('被邀请的主播数:', invitedHosts.length);
 */
const invitees = ref<LiveUserInfoParam[]>([]);

/**
 * 当前申请连线的主播信息
 * @type {Ref<LiveUserInfoParam | undefined>}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { applicant } = useCoHostState('your_live_id');
 *
 * // 监听申请连线的主播信息变化
 * watch(applicant, (newApplicant) => {
 *   if (newApplicant) {
 *     console.log('申请主播:', newApplicant.userID);
 *   }
 * });
 *
 * // 获取当前申请连线的主播信息
 * const currentApplicant = applicant.value;
 * if (currentApplicant) {
 *   console.log('当前申请连线的主播:', currentApplicant.userName);
 * }
 */
const applicant = ref<LiveUserInfoParam | null>(null);

/**
 * 可邀请连线的候选主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @internal
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { candidates } = useCoHostState('your_live_id');
 *
 * // 监听候选主播列表变化
 * watch(candidates, (newCandidates) => {
 *   if (newCandidates && newCandidates.length > 0) {
 *     console.log('候选主播列表:', newCandidates);
 *   }
 * });
 *
 * // 获取当前候选主播列表
 * const candidateHosts = candidates.value;
 * console.log('候选主播数:', candidateHosts.length);
 */
const candidates = ref<LiveUserInfoParam[]>([]);

/**
 * 当前连线状态
 * @type {Ref<string>}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { coHostStatus } = useCoHostState('your_live_id');
 *
 * // 监听连线状态变化
 * watch(coHostStatus, (newStatus) => {
 *   console.log('连线状态:', newStatus);
 * });
 *
 * // 获取当前连线状态
 * const status = coHostStatus.value;
 * console.log('当前连线状态:', status);
 */
const coHostStatus = ref<CoHostStatusType | number>(-1)

/**
 * 请求连线
 * @param {RequestHostConnectionOptions} params - 请求连线参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { requestHostConnection } = useCoHostState("your_live_id");
 * requestHostConnection({
 *  liveID: 'your_live_id',
 *  targetHostLiveID: 'target_live_id',
 *  layoutTemplate: 600,
 *  timeout: 30,
 * });
 */
function requestHostConnection(params: RequestHostConnectionOptions): void {
  callAPI(JSON.stringify({
    api: "requestHostConnection",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
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
 * 取消连线请求
 * @param {CancelHostConnectionOptions} params - 取消连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { cancelHostConnection } = useCoHostState("your_live_id");
 * cancelHostConnection({ liveID: 'your_live_id', toHostLiveID : "target_live_id" });
 */
function cancelHostConnection(params: CancelHostConnectionOptions): void {
  console.error('cancelHostConnection: ', params)
  callAPI(JSON.stringify({
    api: "cancelHostConnection",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('cancelHostConnection =====>: ', data)
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
 * 接受连线请求
 * @param {AcceptHostConnectionOptions} params - 接受连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { acceptHostConnection } = useCoHostState("your_live_id");
 * acceptHostConnection({ liveID: 'your_live_id', fromHostLiveID: "from_live_id" });
 */
function acceptHostConnection(params: AcceptHostConnectionOptions): void {
  callAPI(JSON.stringify({
    api: "acceptHostConnection",
    params: params,
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
 * 拒绝连线请求
 * @param {RejectHostConnectionOptions} params - 拒绝连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { rejectHostConnection } = useCoHostState("your_live_id");
 * rejectHostConnection({ liveID: 'your_live_id', fromHostLiveID: "from_live_id" });
 */
function rejectHostConnection(params: RejectHostConnectionOptions): void {
  callAPI(JSON.stringify({
    api: "rejectHostConnection",
    params: params,
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
 * 退出连线
 * @param {ExitHostConnectionOptions} params - 退出连线参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { exitHostConnection } = useCoHostState("your_live_id");
 * exitHostConnection({ liveID: 'your_live_id' });
 */
function exitHostConnection(params: ExitHostConnectionOptions): void {
  console.error('exitHostConnection: ', params)
  callAPI(JSON.stringify({
    api: "exitHostConnection",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('exitHostConnection =====>: ', data)
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
type ListenerCallback = (eventData: string) => void;
const listenerIDMap = new WeakMap<ListenerCallback, string>();
const listenerLiveIDMap = new WeakMap<ListenerCallback, string>();
let listenerIDCounter = 0;
function getOrCreateListenerID(listener: ListenerCallback): string {
  let id = listenerIDMap.get(listener);
  if (id === undefined) {
    id = `cohost_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加连线主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连线请求)<br>'onCoHostRequestCancelled'(连线请求被取消)<br>'onCoHostRequestAccepted'(连线请求被接受)<br>'onCoHostRequestRejected'(连线请求被拒绝)<br>'onCoHostRequestTimeout'(连线请求超时)<br>'onCoHostUserJoined'(连线用户加入)<br>'onCoHostUserLeft'(连线用户离开)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { addCoHostListener } = useCoHostState("your_live_id");
 * addCoHostListener('your_live_id', 'onCoHostRequestReceived', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addCoHostListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "CoHostStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除连线主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连线请求)<br>'onCoHostRequestCancelled'(连线请求被取消)<br>'onCoHostRequestAccepted'(连线请求被接受)<br>'onCoHostRequestRejected'(连线请求被拒绝)<br>'onCoHostRequestTimeout'(连线请求超时)<br>'onCoHostUserJoined'(连线用户加入)<br>'onCoHostUserLeft'(连线用户离开)
 * @param {(eventData: string) => void} listener - 事件监听器函数，需要传入添加时相同的函数引用
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { addCoHostListener, removeCoHostListener } = useCoHostState("your_live_id");
 * const onCoHostRequest = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addCoHostListener('your_live_id', 'onCoHostRequestReceived', onCoHostRequest);
 * // 移除监听时传入相同的函数引用
 * removeCoHostListener('your_live_id', 'onCoHostRequestReceived', onCoHostRequest);
 */
function removeCoHostListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "CoHostStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

const BINDABLE_DATA_NAMES = [
  "connected",
  "invitees",
  "applicant",
  "candidates",
  "coHostStatus"
] as const;

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "CoHostStore",
      name: dataName,
      roomID: liveID,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[CoHostState][${dataName}] Data:`, result);
        onCoHostStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[CoHostState][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "CoHostStore",
      name: dataName,
      roomID: liveID,
      params: {}
    });
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
}

let stopWatchingCurrentLive: (() => void) | null = null;

function ensureWatchCurrentLive() {
  if (stopWatchingCurrentLive) return;
  stopWatchingCurrentLive = watch(
    () => currentLive.value,
    (newVal, oldVal) => {
      if (oldVal && oldVal.liveID !== '') {
        if (newVal.liveID === '' && boundLiveID) {
          unbindEvent(boundLiveID);
        }
      }
    }
  );
}

const onCoHostStoreChanged: Record<string, (result: any) => void> = {
  connected: (res) => {
    connected.value = safeJsonParse<LiveUserInfoParam[]>(res.connected, []);
  },
  invitees: (res) => {
    invitees.value = safeJsonParse<LiveUserInfoParam[]>(res.invitees, []);
  },
  applicant: (res) => {
    applicant.value = safeJsonParse<LiveUserInfoParam | null>(res.applicant, null);
  },
  candidates: (res) => {
    candidates.value = safeJsonParse<LiveUserInfoParam[]>(res.candidates, []);
  },
  coHostStatus: (res) => {
    coHostStatus.value = safeJsonParse<CoHostStatusType | number>(res.coHostStatus, -1);
  },
};

export function useCoHostState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();

  return {
    coHostStatus,           // 当前连线状态
    connected,              // 已连接的连线主播列表
    invitees,               // 被邀请连线的主播列表
    applicant,              // 当前申请连线的主播信息
    // candidates,          // 可邀请连线的候选主播列表： TODO：待支持

    requestHostConnection,  // 请求连线
    cancelHostConnection,   // 取消连线请求
    acceptHostConnection,   // 接受连线请求
    rejectHostConnection,   // 拒绝连线请求
    exitHostConnection,     // 退出连线

    addCoHostListener,      // 添加连线事件监听
    removeCoHostListener,   // 移除连线事件监听
  };
}

export default useCoHostState;