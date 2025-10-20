/**
 * 连麦主播状态管理
 * @module CoHostState
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
 * 已连接的连麦主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
 */
const connected = ref<LiveUserInfoParam[]>([]);

/**
 * 被邀请连麦的主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
 */
const invitees = ref<LiveUserInfoParam[]>([]);

/**
 * 当前申请连麦的主播信息
 * @type {Ref<LiveUserInfoParam | undefined>}
 * @memberof module:CoHostState
 */
const applicant = ref<LiveUserInfoParam | undefined>();

/**
 * 可邀请连麦的候选主播列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:CoHostState
 */
const candidates = ref<LiveUserInfoParam[]>([]);

/**
 * 当前连麦状态
 * @type {Ref<string>}
 * @memberof module:CoHostState
 */
const coHostStatus = ref<string>('')

/**
 * 请求连麦
 * @param {RequestHostConnectionOptions} params - 请求连麦参数
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
 * 取消连麦请求
 * @param {CancelHostConnectionOptions} params - 取消连麦请求参数
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
 * 接受连麦请求
 * @param {AcceptHostConnectionOptions} params - 接受连麦请求参数
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
 * 拒绝连麦请求
 * @param {RejectHostConnectionOptions} params - 拒绝连麦请求参数
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
 * 退出连麦
 * @param {ExitHostConnectionOptions} params - 退出连麦参数
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
 * 添加连麦主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连麦请求)<br>'onCoHostRequestCancelled'(连麦请求被取消)<br>'onCoHostRequestAccepted'(连麦请求被接受)<br>'onCoHostRequestRejected'(连麦请求被拒绝)<br>'onCoHostRequestTimeout'(连麦请求超时)<br>'onCoHostUserJoined'(连麦用户加入)<br>'onCoHostUserLeft'(连麦用户离开)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoHostState
 * @example
 * import { useCoHostState } from '@/uni_modules/tuikit-atomic-x/state/CoHostState';
 * const { addCoHostListener } = useCoHostState("your_live_id");
 * addCoHostListener('your_live_id', 'onCoHostRequestReceived', (params) => {
 *   console.log('result:', params);
 * });
 */
function addCoHostListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().addCoHostListener(liveID, eventName, listener);
}

/**
 * 移除连麦主播事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onCoHostRequestReceived'(收到连麦请求)<br>'onCoHostRequestCancelled'(连麦请求被取消)<br>'onCoHostRequestAccepted'(连麦请求被接受)<br>'onCoHostRequestRejected'(连麦请求被拒绝)<br>'onCoHostRequestTimeout'(连麦请求超时)<br>'onCoHostUserJoined'(连麦用户加入)<br>'onCoHostUserLeft'(连麦用户离开)
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
    coHostStatus,           // 当前连麦状态
    connected,              // 已连接的连麦主播列表
    invitees,               // 被邀请连麦的主播列表
    applicant,              // 当前申请连麦的主播信息
    // candidates,          // 可邀请连麦的候选主播列表： TODO：待支持

    requestHostConnection,  // 请求连麦
    cancelHostConnection,   // 取消连麦请求
    acceptHostConnection,   // 接受连麦请求
    rejectHostConnection,   // 拒绝连麦请求
    exitHostConnection,     // 退出连麦

    addCoHostListener,      // 添加连麦事件监听
    removeCoHostListener,   // 移除连麦事件监听
  };
}

export default useCoHostState;