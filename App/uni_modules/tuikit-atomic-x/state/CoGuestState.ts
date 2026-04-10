/**
 * @module CoGuestState
 * @module_description
 * 直播连麦管理相关接口
 * 核心功能：处理观众与主播之间的连麦互动，管理连麦申请、邀请、接受、拒绝等完整的连麦流程。
 * 技术特点：基于音视频技术，支持连麦状态实时同步、音视频质量自适应、网络状况监控等高级功能。
 * 业务价值：为直播平台提供观众参与互动的核心能力，增强用户粘性和直播趣味性。
 * 应用场景：观众连麦、互动问答、在线K歌、游戏直播等需要观众参与的互动场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener, HybridResponseData
} from "@/uni_modules/tuikit-atomic-x";
import { LiveUserInfoParam, currentLive } from "./LiveListState";
import { SeatUserInfoParam } from "./LiveSeatState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 申请上麦参数
 * @interface ApplyForSeatOptions
 */
export type ApplyForSeatOptions = {
  liveID: string;
  seatIndex: number;
  timeout: number;
  extraInfo?: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 取消申请参数
 * @interface CancelApplicationOptions
 */
export type CancelApplicationOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 接受申请参数
 * @interface AcceptApplicationOptions
 */
export type AcceptApplicationOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 拒绝申请参数
 * @interface RejectApplicationOptions
 */
export type RejectApplicationOptions = {
  liveID: string;
  userID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 邀请上麦参数
 * @interface InviteToSeatOptions
 */
export type InviteToSeatOptions = {
  liveID: string;
  inviteeID: string;
  seatIndex: number;
  timeout: number;
  extraInfo?: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 取消邀请参数
 * @interface CancelInvitationOptions
 */
export type CancelInvitationOptions = {
  liveID: string;
  inviteeID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 接受邀请参数
 * @interface AcceptInvitationOptions
 */
export type AcceptInvitationOptions = {
  liveID: string;
  inviterID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 拒绝邀请参数
 * @interface RejectInvitationOptions
 */
export type RejectInvitationOptions = {
  liveID: string;
  inviterID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 断开连接参数
 * @interface DisconnectOptions
 */
export type DisconnectOptions = {
  liveID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 无响应原因枚举
 * 用于 onGuestApplicationNoResponse / onHostInvitationNoResponse 回调中标识无响应的具体原因
 * @enum {number}
 */
export enum NoResponseReason {
  /** 超时未响应 */
  TIMEOUT = 0,
}

/**
 * 已连接的连麦嘉宾列表
 * @type {Ref<SeatUserInfoParam[]>}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { connected } = useCoGuestState('your_live_id');
 *
 * // 监听已连接的连麦嘉宾列表变化
 * watch(connected, (newConnected) => {
 *   if (newConnected && newConnected.length > 0) {
 *     console.log('连麦嘉宾列表更新:', newConnected);
 *     newConnected.forEach(guest => {
 *       console.log('嘉宾用户ID:', guest.userID);
 *       console.log('嘉宾名称:', guest.userName);
 *     });
 *   }
 * });
 *
 * // 获取当前连麦嘉宾列表
 * const guests = connected.value;
 * console.log('当前连麦嘉宾数量:', guests.length);
 */
const connected = ref<SeatUserInfoParam[]>([]);

/**
 * 被邀请上麦的用户列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { invitees } = useCoGuestState('your_live_id');
 *
 * // 监听被邀请用户列表变化
 * watch(invitees, (newInvitees) => {
 *   if (newInvitees && newInvitees.length > 0) {
 *     console.log('被邀请用户列表更新:', newInvitees);
 *     newInvitees.forEach(user => {
 *       console.log('被邀请用户ID:', user.userID);
 *       console.log('被邀请用户名称:', user.userName);
 *     });
 *   }
 * });
 *
 * // 获取当前被邀请用户列表
 * const invitedUsers = invitees.value;
 * console.log('当前被邀请用户数量:', invitedUsers.length);
 */
const invitees = ref<LiveUserInfoParam[]>([]);

/**
 * 申请上麦的用户列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoGuestState

 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { applicants } = useCoGuestState('your_live_id');
 *
 * // 监听申请上麦用户列表变化
 * watch(applicants, (newApplicants) => {
 *   if (newApplicants && newApplicants.length > 0) {
 *     console.log('申请上麦用户列表更新:', newApplicants);
 *     newApplicants.forEach(user => {
 *       console.log('申请用户ID:', user.userID);
 *       console.log('申请用户名称:', user.userName);
 *     });
 *   }
 * });
 *
 * // 获取当前申请上麦用户列表
 * const applyingUsers = applicants.value;
 * console.log('当前申请用户数量:', applyingUsers.length);
 */
const applicants = ref<LiveUserInfoParam[]>([]);

/**
 * 可邀请上麦的候选用户列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { candidates } = useCoGuestState('your_live_id');
 *
 * // 监听候选用户列表变化
 * watch(candidates, (newCandidates) => {
 *   if (newCandidates && newCandidates.length > 0) {
 *     console.log('候选用户列表更新:', newCandidates);
 *     newCandidates.forEach(user => {
 *       console.log('候选用户ID:', user.userID);
 *       console.log('候选用户名称:', user.userName);
 *     });
 *   }
 * });
 *
 * // 获取当前候选用户列表
 * const candidateUsers = candidates.value;
 * console.log('当前候选用户数量:', candidateUsers.length);
 */
const candidates = ref<LiveUserInfoParam[]>([]);

/**
 * 申请连麦座位
 * @param {ApplyForSeatOptions} params - 申请连麦座位参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { applyForSeat } = useCoGuestState("your_live_id");
 * applyForSeat({ liveID: 'your_live_id', seatIndex: 2, timeout: 30 , extension: 'extra info'});
 */
function applyForSeat(params: ApplyForSeatOptions): void {
  callAPI(JSON.stringify({
    api: "applyForSeat",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('applyForSeat =====>: ', data)
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
 * 取消申请
 * @param {CancelApplicationOptions} params - 取消申请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { cancelApplication } = useCoGuestState("your_live_id");
 * cancelApplication({ liveID: 'your_live_id' });
 */
function cancelApplication(params: CancelApplicationOptions): void {
  callAPI(JSON.stringify({
    api: "cancelApplication",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('cancelApplication =====>: ', data)
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
 * 接受申请
 * @param {AcceptApplicationOptions} params - 接受申请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { acceptApplication } = useCoGuestState("your_live_id");
 * acceptApplication({ liveID: 'your_live_id', userID: 'user123', seatIndex: 0 });
 */
function acceptApplication(params: AcceptApplicationOptions): void {
  callAPI(JSON.stringify({
    api: "acceptApplication",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('acceptApplication =====>: ', data)
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
 * 拒绝申请
 * @param {RejectApplicationOptions} params - 拒绝申请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { rejectApplication } = useCoGuestState("your_live_id");
 * rejectApplication({ liveID: 'your_live_id', userID: 'user123' });
 */
function rejectApplication(params: RejectApplicationOptions): void {
  callAPI(JSON.stringify({
    api: "rejectApplication",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('rejectApplication =====>: ', data)
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
 * 邀请上麦
 * @param {InviteToSeatOptions} params - 邀请上麦参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { inviteToSeat } = useCoGuestState("your_live_id");
 * inviteToSeat({ liveID: 'your_live_id', inviteeID: 'user123', seatIndex: 2, timeout: 30 , extension: 'extra info'});
 */
function inviteToSeat(params: InviteToSeatOptions): void {
  callAPI(JSON.stringify({
    api: "inviteToSeat",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('inviteToSeat =====>: ', data)
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
 * 取消邀请
 * @param {CancelInvitationOptions} params - 取消邀请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { cancelInvitation } = useCoGuestState("your_live_id");
 * cancelInvitation({ inviteeID: 'user123' });
 */
function cancelInvitation(params: CancelInvitationOptions): void {
  callAPI(JSON.stringify({
    api: "cancelInvitation",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('cancelInvitation =====>: ', data)
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
 * 接受邀请
 * @param {AcceptInvitationOptions} params - 接受邀请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { acceptInvitation } = useCoGuestState("your_live_id");
 * acceptInvitation({ liveID: 'your_live_id', inviterID: 'user123' });
 */
function acceptInvitation(params: AcceptInvitationOptions): void {
  callAPI(JSON.stringify({
    api: "acceptInvitation",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('acceptInvitation =====>: ', data)
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
 * 拒绝邀请
 * @param {RejectInvitationOptions} params - 拒绝邀请参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { rejectInvitation } = useCoGuestState("your_live_id");
 * rejectInvitation({ liveID: 'your_live_id', inviterID: 'user123'});
 */
function rejectInvitation(params: RejectInvitationOptions): void {
  callAPI(JSON.stringify({
    api: "rejectInvitation",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('rejectInvitation =====>: ', data)
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
 * 断开连麦连接
 * @param {DisconnectOptions} params - 断开连接参数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { disconnect } = useCoGuestState("your_live_id");
 * disconnect({ liveID: 'your_live_id' });
 */
function disconnect(params: DisconnectOptions): void {
  callAPI(JSON.stringify({
    api: "disconnect",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
      console.error('disconnect =====>: ', data)
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
    id = `coguest_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}

/**
 * 添加连麦嘉宾侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onHostInvitationReceived'(收到主播邀请)<br>'onHostInvitationCancelled'(主播取消邀请)<br>'onGuestApplicationResponded'(嘉宾申请响应)<br>'onGuestApplicationNoResponse'(嘉宾申请无响应)<br>'onKickedOffSeat'(被踢下座位)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { addCoGuestGuestListener } = useCoGuestState("your_live_id");
 * addCoGuestGuestListener('your_live_id', 'onHostInvitationReceived', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addCoGuestGuestListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "CoGuestStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除连麦嘉宾侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onHostInvitationReceived'(收到主播邀请)<br>'onHostInvitationCancelled'(主播取消邀请)<br>'onGuestApplicationResponded'(嘉宾申请响应)<br>'onGuestApplicationNoResponse'(嘉宾申请无响应)<br>'onKickedOffSeat'(被踢下座位)
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { addCoGuestGuestListener, removeCoGuestGuestListener } = useCoGuestState("your_live_id");
 * const onHostInvitation = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addCoGuestGuestListener('your_live_id', 'onHostInvitationReceived', onHostInvitation);
 * // 移除监听时传入相同的函数引用
 * removeCoGuestGuestListener('your_live_id', 'onHostInvitationReceived', onHostInvitation);
 */
function removeCoGuestGuestListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "CoGuestStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

/**
 * 添加连麦主播侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onGuestApplicationReceived'(收到嘉宾申请)<br>'onGuestApplicationCancelled'(嘉宾取消申请)<br>'onGuestApplicationProcessedByOtherHost'(嘉宾申请被其他主播处理)<br>'onHostInvitationResponded'(主播邀请得到回应)<br>'onHostInvitationNoResponse'(主播邀请无响应)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { addCoGuestHostListener } = useCoGuestState("your_live_id");
 * addCoGuestHostListener('your_live_id', 'onGuestApplicationReceived', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addCoGuestHostListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  // 记录 listener 注册时的 liveID，remove 时用记录值兜底
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "CoGuestStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除连麦主播侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onGuestApplicationReceived'(收到嘉宾申请)<br>'onGuestApplicationCancelled'(嘉宾取消申请)<br>'onGuestApplicationProcessedByOtherHost'(嘉宾申请被其他主播处理)<br>'onHostInvitationResponded'(主播邀请得到回应)<br>'onHostInvitationNoResponse'(主播邀请无响应)
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { removeCoGuestHostListener } = useCoGuestState("your_live_id");
 * removeCoGuestHostListener('your_live_id', 'onGuestApplicationReceived', 'listener_001');
 */
function removeCoGuestHostListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "CoGuestStore",
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
  "applicants",
  "candidates"

] as const;

/**
 * 绑定事件监听（内部方法）
 * 同一个 liveID 只绑定一次，通过 boundLiveID 防止重复绑定
 */
let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  // 已经绑定过该 liveID，无需重复绑定
  if (boundLiveID === liveID) {
    return;
  }

  // 如果之前绑定了其他 liveID，先解绑
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }

  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "CoGuestStore",
      name: dataName,
      roomID: liveID,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[CoGuestStore:${liveID}][${dataName} listener] Data:`, result);
        onCoGuestStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[${liveID}][${dataName} listener] Error:`, error);
      }
    });
  });
}

/**
 * 解除事件监听（内部方法）
 */
function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "CoGuestStore",
      name: dataName,
      roomID: liveID,
      params: {}
    });
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
}

// 监听 currentLive 变化，当 currentLive 为空时自动解绑
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

const onCoGuestStoreChanged: Record<string, (result: any) => void> = {
  connected: (res) => {
    const data = safeJsonParse<SeatUserInfoParam[]>(res.connected, []);
    connected.value = data;
  },
  invitees: (res) => {
    const data = safeJsonParse<LiveUserInfoParam[]>(res.invitees, []);
    invitees.value = data;
  },
  applicants: (res) => {
    const data = safeJsonParse<LiveUserInfoParam[]>(res.applicants, []);
    applicants.value = data;
  },
  candidates: (res) => {
    const data = safeJsonParse<LiveUserInfoParam[]>(res.candidates, []);
    candidates.value = data;
  }
};

export function useCoGuestState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();

  return {
    connected,                 // 已连接的连麦嘉宾列表
    invitees,                  // 被邀请上麦的用户列表
    applicants,                // 申请上麦的用户列表
    candidates,                // 可邀请上麦的候选用户列表

    applyForSeat,              // 申请连麦座位
    cancelApplication,         // 取消申请
    acceptApplication,         // 接受申请
    rejectApplication,         // 拒绝申请
    inviteToSeat,              // 邀请上麦
    cancelInvitation,          // 取消邀请
    acceptInvitation,          // 接受邀请
    rejectInvitation,          // 拒绝邀请
    disconnect,                // 断开连麦连接

    addCoGuestGuestListener,   // 添加嘉宾侧事件监听
    removeCoGuestGuestListener,// 移除嘉宾侧事件监听
    addCoGuestHostListener,    // 添加主播侧事件监听
    removeCoGuestHostListener, // 移除主播侧事件监听
  };
}

export default useCoGuestState;