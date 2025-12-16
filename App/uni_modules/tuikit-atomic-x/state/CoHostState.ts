/**
 * @module CoHostState
 * @module_description
 * 连线主播管理模块
 * 核心功能：实现主播间的连线功能，支持主播邀请、连线申请、连线状态管理等主播间互动功能。
 * 技术特点：支持多主播音视频同步、画中画显示、音视频质量优化等高级技术，确保连线体验的流畅性。
 * 业务价值：为直播平台提供主播间协作的核心能力，支持PK、合作直播等高级业务场景。
 * 应用场景：主播连线、合作直播、跨平台连线、主播互动等高级直播场景。
 */
import { ref } from "vue";
import {
  LiveUserInfoParam,
  RequestHostConnectionOptions, CancelHostConnectionOptions, AcceptHostConnectionOptions,
  RejectHostConnectionOptions, ExitHostConnectionOptions, ILiveListener
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

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
 *   console.log('当前申请连线的主播:', currentApplicant.nickname);
 * }
 */
const applicant = ref<LiveUserInfoParam | undefined>();

/**
 * 可邀请连线的候选主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
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
const coHostStatus = ref<string>('')

/**
 * 请求连线
 * @param {RequestHostConnectionOptions} params - 请求连线参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { requestHostConnection } = useCoHostState("your_live_id");
 * requestHostConnection({});
 */
function requestHostConnection(params: RequestHostConnectionOptions): void {
  callUTSFunction("requestHostConnection", params);
}

/**
 * 取消连线请求
 * @param {CancelHostConnectionOptions} params - 取消连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { cancelHostConnection } = useCoHostState(“your_live_id”);
 * cancelHostConnection({ toHostLiveID : "target_live_id" });
 */
function cancelHostConnection(params: CancelHostConnectionOptions): void {
  callUTSFunction("cancelHostConnection", params);
}

/**
 * 接受连线请求
 * @param {AcceptHostConnectionOptions} params - 接受连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { acceptHostConnection } = useCoHostState(“your_live_id”);
 * acceptHostConnection({ fromHostLiveID: "from_live_id" });
 */
function acceptHostConnection(params: AcceptHostConnectionOptions): void {
  callUTSFunction("acceptHostConnection", params);
}

/**
 * 拒绝连线请求
 * @param {RejectHostConnectionOptions} params - 拒绝连线请求参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { rejectHostConnection } = useCoHostState(“your_live_id”);
 * rejectHostConnection({ fromHostLiveID: "from_live_id" });
 */
function rejectHostConnection(params: RejectHostConnectionOptions): void {
  callUTSFunction("rejectHostConnection", params);
}

/**
 * 退出连线
 * @param {ExitHostConnectionOptions} params - 退出连线参数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { exitHostConnection } = useCoHostState(“your_live_id”);
 * exitHostConnection({});
 */
function exitHostConnection(params: ExitHostConnectionOptions): void {
  callUTSFunction("exitHostConnection", params);
}

/**
 * 添加连线主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连线请求)<br>'onCoHostRequestCancelled'(连线请求被取消)<br>'onCoHostRequestAccepted'(连线请求被接受)<br>'onCoHostRequestRejected'(连线请求被拒绝)<br>'onCoHostRequestTimeout'(连线请求超时)<br>'onCoHostUserJoined'(连线用户加入)<br>'onCoHostUserLeft'(连线用户离开)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { addCoHostListener } = useCoHostState("your_live_id");
 * addCoHostListener('your_live_id', 'onCoHostRequestReceived', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addCoHostListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().addCoHostListener(liveID, eventName, listener);
}

/**
 * 移除连线主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连线请求)<br>'onCoHostRequestCancelled'(连线请求被取消)<br>'onCoHostRequestAccepted'(连线请求被接受)<br>'onCoHostRequestRejected'(连线请求被拒绝)<br>'onCoHostRequestTimeout'(连线请求超时)<br>'onCoHostUserJoined'(连线用户加入)<br>'onCoHostUserLeft'(连线用户离开)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { removeCoHostListener } = useCoHostState("your_live_id");
 * removeCoHostListener('your_live_id', 'onCoHostRequestReceived', hostListener);
 */
function removeCoHostListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().removeCoHostListener(liveID, eventName, listener);
}

const onCoHostStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "connected") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      connected.value = data;
    } else if (eventName === "invitees") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      invitees.value = data;
    } else if (eventName === "applicant") {
      const data = safeJsonParse<LiveUserInfoParam | null>(res, null);
      applicant.value = data;
    } else if (eventName === "candidates") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      candidates.value = data;
    } else if (eventName === "coHostStatus") {
      coHostStatus.value = JSON.parse(res);
    }
  } catch (error) {
    console.error("onCoHostStoreChanged error:", error);
  }
};

function bindEvent(liveID: string): void {
  getRTCRoomEngineManager().on("coHostStoreChanged", onCoHostStoreChanged, liveID);
}

export function useCoHostState(liveID: string) {
  bindEvent(liveID);

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