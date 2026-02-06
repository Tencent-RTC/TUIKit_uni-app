/**
 * @module LiveAudienceState
 * @module_description
 * 直播间观众状态管理模块
 * 核心功能：管理直播间观众列表，提供观众权限控制、管理员设置等直播间秩序维护功能。
 * 技术特点：支持实时观众列表更新、权限分级管理、批量操作等高级功能，确保直播间秩序和用户体验。
 * 业务价值：为直播平台提供完整的观众管理解决方案，支持大规模观众场景下的秩序维护。
 * 应用场景：观众管理、权限控制、直播间秩序维护、观众互动管理等核心业务场景。
 */
import { ref } from "vue";
import {
    FetchAudienceListOptions, SetAdministratorOptions, RevokeAdministratorOptions, KickUserOutOfRoomOptions,
    DisableSendMessageOptions, LiveUserInfoParam, ILiveListener
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 直播间观众列表
 * @type {Ref<LiveUserInfoParam[]>}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { audienceList } = useLiveAudienceState('your_live_id');
 * 
 * // 监听观众列表变化
 * watch(audienceList, (newAudienceList) => {
 *   if (newAudienceList && newAudienceList.length > 0) {
 *     console.log('观众列表更新:', newAudienceList);
 *     newAudienceList.forEach(audience => {
 *       console.log('观众ID:', audience.userID);
 *     });
 *   }
 * });
 * 
 * // 获取当前观众列表
 * const audiences = audienceList.value;
 * console.log('当前观众数:', audiences.length);
 */
const audienceList = ref<LiveUserInfoParam[]>([]);

/**
 * 直播间观众数量
 * @type {Ref<number>}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { audienceCount } = useLiveAudienceState('your_live_id');
 * 
 * // 监听观众数量变化
 * watch(audienceCount, (newCount) => {
 *   console.log('观众数量更新:', newCount);
 *   // 当观众数量达到某个阈值时可以进行特殊处理
 *   if (newCount >= 100) {
 *     console.log('直播热度很高，观众数超过100');
 *   }
 * });
 * 
 * // 获取当前观众数量
 * const count = audienceCount.value;
 * console.log('当前观众数量:', count);
 */
const audienceCount = ref<number>(0);

/**
 * 获取直播间观众列表
 * @param {FetchAudienceListOptions} [params] - 获取观众列表参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { fetchAudienceList } = useLiveAudienceState("your_live_id");
 * fetchAudienceList({
 *   liveID: 'your_live_id',
 * });
 */
function fetchAudienceList(params ?: FetchAudienceListOptions) : void {
    callUTSFunction("fetchAudienceList", params || {});
}

/**
 * 设置管理员
 * @param {SetAdministratorOptions} params - 设置管理员参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { setAdministrator } = useLiveAudienceState("your_live_id");
 * setAdministrator({ liveID: 'your_live_id', userID: 'user123' });
 */
function setAdministrator(params : SetAdministratorOptions) : void {
    callUTSFunction("setAdministrator", params);
}

/**
 * 撤销管理员权限
 * @param {RevokeAdministratorOptions} params - 撤销管理员参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { revokeAdministrator } = useLiveAudienceState("your_live_id");
 * revokeAdministrator({ liveID: 'your_live_id', userID: 'user123' });
 */
function revokeAdministrator(params : RevokeAdministratorOptions) : void {
    callUTSFunction("revokeAdministrator", params);
}

/**
 * 将用户踢出直播间
 * @param {KickUserOutOfRoomOptions} params - 踢出用户参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { kickUserOutOfRoom } = useLiveAudienceState("your_live_id");
 * kickUserOutOfRoom({ liveID: 'your_live_id', userID: 'user123' });
 */
function kickUserOutOfRoom(params : KickUserOutOfRoomOptions) : void {
    callUTSFunction("kickUserOutOfRoom", params);
}

/**
 * 禁用用户发送消息
 * @param {DisableSendMessageOptions} params - 禁用发送消息参数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { disableSendMessage } = useLiveAudienceState("your_live_id");
 * disableSendMessage({ liveID: 'your_live_id', userID: 'user123', isDisable: true });
 */
function disableSendMessage(params : DisableSendMessageOptions) : void {
    callUTSFunction("disableSendMessage", params);
}

/**
 * 添加观众事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onAudienceJoined'(观众加入)<br>'onAudienceLeft'(观众离开)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { addAudienceListener } = useLiveAudienceState("your_live_id");
 * addAudienceListener('your_live_id', 'onAudienceJoined', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addAudienceListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().addAudienceListener(liveID, eventName, listener);
}

/**
 * 移除观众事件监听
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onAudienceJoined'(观众加入)<br>'onAudienceLeft'(观众离开)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LiveAudienceState
 * @example
 * import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
 * const { removeAudienceListener } = useLiveAudienceState("your_live_id");
 * removeAudienceListener('your_live_id', 'onAudienceJoined', audienceListener);
 */
function removeAudienceListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().removeAudienceListener(liveID, eventName, listener);
}

const onLiveAudienceStoreChanged = (eventName : string, res : string) : void => {
    try {
        if (eventName === "audienceList") {
            audienceList.value = safeJsonParse<LiveUserInfoParam[]>(res, []);
        } else if (eventName === "audienceCount") {
            audienceCount.value = safeJsonParse<number>(res, 0);
        }
    } catch (error) {
        console.error("onLiveAudienceStoreChanged error:", error);
    }
};

function bindEvent(liveID : string) : void {
    getRTCRoomEngineManager().on("liveAudienceStoreChanged", onLiveAudienceStoreChanged, liveID);
}

export function useLiveAudienceState(liveID : string) {
    bindEvent(liveID);
    return {
        audienceList,           // 直播间观众列表
        audienceCount,          // 直播间观众数量

        fetchAudienceList,      // 获取观众列表
        setAdministrator,       // 设置管理员
        revokeAdministrator,    // 撤销管理员权限
        kickUserOutOfRoom,      // 将用户踢出直播间
        disableSendMessage,     // 禁用用户发送消息

        addAudienceListener,    // 添加观众事件监听
        removeAudienceListener, // 移除观众事件监听
    };
}

export default useLiveAudienceState;