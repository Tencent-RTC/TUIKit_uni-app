/**
 * @module LiveSeatState
 * @module_description
 * 直播间麦位管理模块
 * 核心功能：实现多人连麦场景下的座位控制，支持复杂的座位状态管理和音视频设备控制。
 * 技术特点：基于音视频技术，支持多路音视频流管理，提供座位锁定、设备控制、权限管理等高级功能。
 * 业务价值：为多人互动直播提供核心技术支撑，支持PK、连麦、多人游戏等丰富的互动场景。
 * 应用场景：多人连麦、主播PK、互动游戏、在线教育、会议直播等需要多人音视频互动的场景。
 */
import { ref } from "vue";
import {
    TakeSeatOptions, LeaveSeatOptions, MuteMicrophoneOptions, UnmuteMicrophoneOptions, KickUserOutOfSeatOptions,
    MoveUserToSeatOptions, UnlockSeatOptions, SeatUserInfoParam, LockSeatOptions,
    OpenRemoteCameraOptions, CloseRemoteCameraOptions, OpenRemoteMicrophoneOptions, CloseRemoteMicrophoneOptions, ILiveListener,
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 区域信息参数类型定义
 * @typedef {Object} RegionInfoParams
 * @property {number} x X坐标位置
 * @property {number} y Y坐标位置
 * @property {number} w 宽度
 * @property {number} h 高度
 * @property {number} zorder 层级顺序
 * @memberof module:LiveSeatState 
 */
export type RegionInfoParams = {
    x : number;
    y : number;
    w : number;
    h : number;
    zorder : number;
}

/**
 * 直播画布参数类型定义
 * @typedef {Object} LiveCanvasParams
 * @property {number} w 画布宽度
 * @property {number} h 画布高度
 * @property {string} [background] 背景色（可选）
 * @memberof module:LiveSeatState
 */
export type LiveCanvasParams = {
    w : number;
    h : number;
    background ?: string;
}

/**
 * 座位信息类型定义
 * @typedef {Object} SeatInfo
 * @property {number} index 座位索引
 * @property {boolean} isLocked 是否锁定
 * @property {SeatUserInfoParam} userInfo 座位上用户信息
 * @property {RegionInfoParams} region 座位区域信息
 * @memberof module:LiveSeatState
 */
export type SeatInfo = {
    index : number;
    isLocked : boolean;
    userInfo : SeatUserInfoParam;
    region : RegionInfoParams;
}

/**
 * 座位列表
 * @type {Ref<SeatInfo[]>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { seatList } = useLiveSeatState('your_live_id');
 * 
 * // 监听座位列表变化
 * watch(seatList, (newSeatList) => {
 *   if (newSeatList && newSeatList.length > 0) {
 *     console.log('座位列表更新:', newSeatList);
 *     newSeatList.forEach(seat => {
 *       console.log('座位索引:', seat.index);
 *       console.log('座位是否锁定:', seat.isLocked);
 *       if (seat.userInfo) {
 *         console.log('座位上用户ID:', seat.userInfo.userID);
 *       }
 *     });
 *   }
 * });
 * 
 * // 获取当前座位列表
 * const seats = seatList.value;
 * console.log('当前座位数:', seats.length);
 */
const seatList = ref<SeatInfo[]>([]);

/**
 * 画布信息
 * @type {Ref<LiveCanvasParams | null>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { canvas } = useLiveSeatState('your_live_id');
 * 
 * // 监听画布信息变化
 * watch(canvas, (newCanvas) => {
 *   if (newCanvas) {
 *     console.log('画布信息更新:', newCanvas);
 *   }
 * });
 * 
 * // 获取当前画布信息
 * const currentCanvas = canvas.value;
 * if (currentCanvas) {
 *   console.log('当前画布分辨率:', currentCanvas.w, 'x', currentCanvas.h);
 * }
 */
const canvas = ref<LiveCanvasParams | null>(null);

/**
 * 正在说话的用户列表
 * @type {Ref<Map<string, number> | null>}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { speakingUsers } = useLiveSeatState('your_live_id');
 * 
 * // 监听正在说话的用户列表变化
 * watch(speakingUsers, (newSpeakingUsers) => {
 *   if (newSpeakingUsers && newSpeakingUsers.size > 0) {
 *     console.log('正在说话的用户更新');
 *     newSpeakingUsers.forEach((volume, userID) => {
 *       console.log('用户ID:', userID);
 *       console.log('音量:', volume);
 *     });
 *   }
 * });
 * 
 * // 获取当前正在说话的用户数量
 * const users = speakingUsers.value;
 * if (users) {
 *   console.log('当前说话的用户数:', users.size);
 * }
 */
const speakingUsers = ref<Map<string, number> | null>(null);

/**
 * 用户上麦
 * @param {TakeSeatOptions} params - 上麦参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { takeSeat } = useLiveSeatState('your_live_id');
 * takeSeat({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('上麦成功'),
 *   onError: (error) => console.error('上麦失败:', error)
 * });
 */
function takeSeat(params : TakeSeatOptions) : void {
    callUTSFunction("takeSeat", params);
}

/**
 * 用户下麦
 * @param {LeaveSeatOptions} params - 下麦参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { leaveSeat } = useLiveSeatState('your_live_id');
 * leaveSeat({
 *   onSuccess: () => console.log('下麦成功'),
 *   onError: (error) => console.error('下麦失败:', error)
 * });
 */
function leaveSeat(params : LeaveSeatOptions) : void {
    callUTSFunction("leaveSeat", params);
}

/**
 * 静音麦克风
 * @param {MuteMicrophoneOptions} params - 静音参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { muteMicrophone } = useLiveSeatState('your_live_id');
 * muteMicrophone({
 *   onSuccess: () => console.log('麦克风静音成功'),
 *   onError: (error) => console.error('麦克风静音失败:', error)
 * });
 */
function muteMicrophone(params : MuteMicrophoneOptions) : void {
    callUTSFunction("muteMicrophone", params);
}

/**
 * 取消静音麦克风
 * @param {UnmuteMicrophoneOptions} params - 取消静音参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { unmuteMicrophone } = useLiveSeatState('your_live_id');
 * unmuteMicrophone({
 *   onSuccess: () => console.log('麦克风取消静音成功'),
 *   onError: (error) => console.error('麦克风取消静音失败:', error)
 * });
 */
function unmuteMicrophone(params : UnmuteMicrophoneOptions) : void {
    callUTSFunction("unmuteMicrophone", params);
}

/**
 * 将用户踢出座位
 * @param {KickUserOutOfSeatOptions} params - 踢出参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { kickUserOutOfSeat } = useLiveSeatState('your_live_id');
 * kickUserOutOfSeat({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('踢出用户成功'),
 *   onError: (error) => console.error('踢出用户失败:', error)
 * });
 */
function kickUserOutOfSeat(params : KickUserOutOfSeatOptions) : void {
    callUTSFunction("kickUserOutOfSeat", params);
}

/**
 * 移动用户到指定座位
 * @param {MoveUserToSeatOptions} params - 移动参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { moveUserToSeat } = useLiveSeatState('your_live_id');
 * moveUserToSeat({
 *   fromSeatIndex: 1,
 *   toSeatIndex: 3,
 *   onSuccess: () => console.log('用户移动成功'),
 *   onError: (error) => console.error('用户移动失败:', error)
 * });
 */
function moveUserToSeat(params : MoveUserToSeatOptions) : void {
    callUTSFunction("moveUserToSeat", params);
}

/**
 * 锁定座位
 * @param {LockSeatOptions} params - 锁定参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { lockSeat } = useLiveSeatState('your_live_id');
 * lockSeat({
 *   seatIndex: 2,
 *   onSuccess: () => console.log('座位锁定成功'),
 *   onError: (error) => console.error('座位锁定失败:', error)
 * });
 */
function lockSeat(params : LockSeatOptions) : void {
    callUTSFunction("lockSeat", params);
}

/**
 * 解锁座位
 * @param {UnlockSeatOptions} params - 解锁参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { unlockSeat } = useLiveSeatState('your_live_id');
 * unlockSeat({
 *   seatIndex: 2,
 *   onSuccess: () => console.log('座位解锁成功'),
 *   onError: (error) => console.error('座位解锁失败:', error)
 * });
 */
function unlockSeat(params : UnlockSeatOptions) : void {
    callUTSFunction("unlockSeat", params);
}

/**
 * 开启远程摄像头
 * @param {OpenRemoteCameraOptions} params - 开启摄像头参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { openRemoteCamera } = useLiveSeatState('your_live_id');
 * openRemoteCamera({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('远程摄像头开启成功'),
 *   onError: (error) => console.error('远程摄像头开启失败:', error)
 * });
 */
function openRemoteCamera(params : OpenRemoteCameraOptions) : void {
    callUTSFunction("openRemoteCamera", params);
}

/**
 * 关闭远程摄像头
 * @param {CloseRemoteCameraOptions} params - 关闭摄像头参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { closeRemoteCamera } = useLiveSeatState('your_live_id');
 * closeRemoteCamera({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('远程摄像头关闭成功'),
 *   onError: (error) => console.error('远程摄像头关闭失败:', error)
 * });
 */
function closeRemoteCamera(params : CloseRemoteCameraOptions) : void {
    callUTSFunction("closeRemoteCamera", params);
}

/**
 * 开启远程麦克风
 * @param {OpenRemoteMicrophoneOptions} params - 开启麦克风参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { openRemoteMicrophone } = useLiveSeatState('your_live_id');
 * openRemoteMicrophone({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('远程麦克风开启成功'),
 *   onError: (error) => console.error('远程麦克风开启失败:', error)
 * });
 */
function openRemoteMicrophone(params : OpenRemoteMicrophoneOptions) : void {
    callUTSFunction("openRemoteMicrophone", params);
}

/**
 * 关闭远程麦克风
 * @param {CloseRemoteMicrophoneOptions} params - 关闭麦克风参数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { closeRemoteMicrophone } = useLiveSeatState('your_live_id');
 * closeRemoteMicrophone({
 *   seatIndex: 1,
 *   onSuccess: () => console.log('远程麦克风关闭成功'),
 *   onError: (error) => console.error('远程麦克风关闭失败:', error)
 * });
 */
function closeRemoteMicrophone(params : CloseRemoteMicrophoneOptions) : void {
    callUTSFunction("closeRemoteMicrophone", params);
}

/**
 * 添加座位事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onLocalCameraOpenedByAdmin'(本地摄像头被管理员开启)<br>'onLocalCameraClosedByAdmin'(本地摄像头被管理员关闭)<br>'onLocalMicrophoneOpenedByAdmin'(本地麦克风被管理员开启)<br>'onLocalMicrophoneClosedByAdmin'(本地麦克风被管理员关闭)
 * @param {ILiveListener} listener - 事件处理函数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { addLiveSeatEventListener } = useLiveSeatState('your_live_id');
 * addLiveSeatEventListener('your_live_id', 'onLocalCameraOpenedByAdmin', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addLiveSeatEventListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().addLiveSeatEventListener(liveID, eventName, listener);
}

/**
 * 移除座位事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onLocalCameraOpenedByAdmin'(本地摄像头被管理员开启)<br>'onLocalCameraClosedByAdmin'(本地摄像头被管理员关闭)<br>'onLocalMicrophoneOpenedByAdmin'(本地麦克风被管理员开启)<br>'onLocalMicrophoneClosedByAdmin'(本地麦克风被管理员关闭)
 * @param {ILiveListener} listener - 事件处理函数
 * @returns {void}
 * @memberof module:LiveSeatState
 * @example
 * import { useLiveSeatState } from '@/uni_modules/tuikit-atomic-x/state/LiveSeatState';
 * const { removeLiveSeatEventListener } = useLiveSeatState('your_live_id');
 * removeLiveSeatEventListener('your_live_id', 'onLocalCameraOpenedByAdmin', seatListener);
 */
function removeLiveSeatEventListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().removeLiveSeatEventListener(liveID, eventName, listener);
}

const onLiveSeatStoreChanged = (eventName : string, res : string) : void => {
    try {
        if (eventName === "seatList") {
            seatList.value = safeJsonParse<SeatInfo[]>(res, []);
        } else if (eventName === "canvas") {
            canvas.value = safeJsonParse<LiveCanvasParams | null>(res, null);
        } else if (eventName === "speakingUsers") {
            speakingUsers.value = safeJsonParse<Map<string, number> | null>(res, null);
        }
    } catch (error) {
        console.error("onLiveSeatStoreChanged error:", error);
    }
};


function bindEvent(liveID : string) : void {
    getRTCRoomEngineManager().on("liveSeatStoreChanged", onLiveSeatStoreChanged, liveID);
}

export function useLiveSeatState(liveID : string) {
    bindEvent(liveID);
    return {
        seatList,                // 座位列表
        canvas,                  // 画布信息
        speakingUsers,           // 正在说话的用户列表

        takeSeat,                // 用户上麦
        leaveSeat,               // 用户下麦
        muteMicrophone,          // 静音麦克风
        unmuteMicrophone,        // 取消静音麦克风
        kickUserOutOfSeat,       // 将用户踢出座位
        moveUserToSeat,          // 移动用户到指定座位
        lockSeat,                // 锁定座位
        unlockSeat,              // 解锁座位
        openRemoteCamera,        // 开启远程摄像头
        closeRemoteCamera,       // 关闭远程摄像头
        openRemoteMicrophone,    // 开启远程麦克风
        closeRemoteMicrophone,   // 关闭远程麦克风

        addLiveSeatEventListener,    // 添加座位事件监听
        removeLiveSeatEventListener, // 移除座位事件监听
    };
}

export default useLiveSeatState;