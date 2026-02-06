/**
 * @module CoGuestState
 * @module_description
 * 直播连麦管理相关接口
 * 核心功能：处理观众与主播之间的连麦互动，管理连麦申请、邀请、接受、拒绝等完整的连麦流程。
 * 技术特点：基于音视频技术，支持连麦状态实时同步、音视频质量自适应、网络状况监控等高级功能。
 * 业务价值：为直播平台提供观众参与互动的核心能力，增强用户粘性和直播趣味性。
 * 应用场景：观众连麦、互动问答、在线K歌、游戏直播等需要观众参与的互动场景。
 */
import { ref } from "vue";
import {
  ApplyForSeatOptions, CancelApplicationOptions, AcceptApplicationOptions, RejectApplicationOptions,
  InviteToSeatOptions, CancelInvitationOptions, AcceptInvitationOptions, RejectInvitationOptions, DisconnectOptions,
  LiveUserInfoParam, SeatUserInfoParam, ILiveListener,
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

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
 *       console.log('嘉宾昵称:', guest.nickname);
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
 *       console.log('被邀请用户昵称:', user.nickname);
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
 *       console.log('申请用户昵称:', user.nickname);
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
 *       console.log('候选用户昵称:', user.nickname);
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
  callUTSFunction("applyForSeat", params);
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
  callUTSFunction("cancelApplication", params);
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
  callUTSFunction("acceptApplication", params);
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
  callUTSFunction("rejectApplication", params);
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
  callUTSFunction("inviteToSeat", params);
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
  callUTSFunction("cancelInvitation", params);
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
  callUTSFunction("acceptInvitation", params);
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
  callUTSFunction("rejectInvitation", params);
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
  callUTSFunction("disconnect", params);
}

/**
 * 添加连麦嘉宾侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onHostInvitationReceived'(收到主播邀请)<br>'onHostInvitationCancelled'(主播取消邀请)<br>'onGuestApplicationResponded'(嘉宾申请响应)<br>'onGuestApplicationNoResponse'(嘉宾申请无响应)<br>'onKickedOffSeat'(被踢下座位)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { addCoGuestGuestListener } = useCoGuestState("your_live_id");
 * addCoGuestGuestListener('your_live_id', 'onHostInvitationReceived', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addCoGuestGuestListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().addCoGuestGuestListener(liveID, eventName, listener);
}

/**
 * 移除连麦嘉宾侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onHostInvitationReceived'(收到主播邀请)<br>'onHostInvitationCancelled'(主播取消邀请)<br>'onGuestApplicationResponded'(嘉宾申请响应)<br>'onGuestApplicationNoResponse'(嘉宾申请无响应)<br>'onKickedOffSeat'(被踢下座位)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { removeCoGuestGuestListener } = useCoGuestState("your_live_id");
 * removeCoGuestGuestListener('your_live_id', 'onHostInvitationReceived', guestListener);
 */
function removeCoGuestGuestListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().removeCoGuestGuestListener(liveID, eventName, listener);
}

/**
 * 添加连麦主播侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onGuestApplicationReceived'(收到嘉宾申请)<br>'onGuestApplicationCancelled'(嘉宾取消申请)<br>'onGuestApplicationProcessedByOtherHost'(嘉宾申请被其他主播处理)<br>'onHostInvitationResponded'(主播邀请得到回应)<br>'onHostInvitationNoResponse'(主播邀请无响应)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { addCoGuestHostListener } = useCoGuestState("your_live_id");
 * addCoGuestHostListener('your_live_id', 'onGuestApplicationReceived', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addCoGuestHostListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().addCoGuestHostListener(liveID, eventName, listener);
}

/**
 * 移除连麦主播侧事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onGuestApplicationReceived'(收到嘉宾申请)<br>'onGuestApplicationCancelled'(嘉宾取消申请)<br>'onGuestApplicationProcessedByOtherHost'(嘉宾申请被其他主播处理)<br>'onHostInvitationResponded'(主播邀请得到回应)<br>'onHostInvitationNoResponse'(主播邀请无响应)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:CoGuestState
 * @example
 * import { useCoGuestState } from '@/uni_modules/tuikit-atomic-x/state/CoGuestState';
 * const { removeCoGuestHostListener } = useCoGuestState("your_live_id");
 * removeCoGuestHostListener('your_live_id', 'onGuestApplicationReceived', hostListener);
 */
function removeCoGuestHostListener(liveID: string, eventName: string, listener: ILiveListener): void {
  getRTCRoomEngineManager().removeCoGuestHostListener(liveID, eventName, listener);
}

const onCoGuestStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "connected") {
      const data = safeJsonParse<SeatUserInfoParam[]>(res, []);
      connected.value = data;
    } else if (eventName === "invitees") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      invitees.value = data;
    } else if (eventName === "applicants") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      applicants.value = data;
    } else if (eventName === "candidates") {
      const data = safeJsonParse<LiveUserInfoParam[]>(res, []);
      candidates.value = data;
    }
  } catch (error) {
    console.error("onCoGuestStoreChanged error:", error);
  }
};

function bindEvent(liveID: string): void {
  getRTCRoomEngineManager().on("coGuestStoreChanged", onCoGuestStoreChanged, liveID);
}

export function useCoGuestState(liveID: string) {
  bindEvent(liveID);

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