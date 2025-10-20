/**
 * 直播间观众状态管理
 * @module LiveAudienceState
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
 */
const audienceList = ref<LiveUserInfoParam[]>([]);

/**
 * 直播间观众数量
 * @type {Ref<number>}
 * @memberof module:LiveAudienceState
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
 * fetchAudienceList();
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
 * setAdministrator({ userID: 'user123' });
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
 * revokeAdministrator({ userID: 'user123' });
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
 * kickUserOutOfRoom({ userID: 'user123' });
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
 * disableSendMessage({ userID: 'user123', disable: true });
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
 * addAudienceListener('your_live_id', 'onAudienceJoined', (params) => {
 *   console.log('result:', params);
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