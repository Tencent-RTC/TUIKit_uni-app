/**
 * 点赞状态管理
 * @module LikeState
 */
import { ref } from "vue";
import { ILiveListener, SendLikeOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 总点赞数量
 * @type {Ref<number>}
 * @memberof module:LikeState
 */
const totalLikeCount = ref<number>(0);

/**
 * 发送点赞
 * @param {SendLikeOptions} params - 点赞参数
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { sendLike } = useLikeState("your_live_id");
 * sendLike({ count: 1 });
 */
function sendLike(params : SendLikeOptions) : void {
    callUTSFunction("sendLike", params);
}

/**
 * 添加点赞事件监听
 * @param {string} liveID - 直播ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveLikesMessage'(收到点赞消息)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { addLikeListener } = useLikeState("your_live_id");
 * addLikeListener('your_live_id', 'onReceiveLikesMessage', (params) => {
 *   console.log('result:', params);
 * });
 */
function addLikeListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().addLikeListener(liveID, eventName, listener);
}

/**
 * 移除点赞事件监听
 * @param {string} liveID - 直播ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveLikesMessage'(收到点赞消息)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LikeState
 * @example
 * import { useLikeState } from '@/uni_modules/tuikit-atomic-x/state/LikeState';
 * const { removeLikeListener } = useLikeState("your_live_id");
 * removeLikeListener('your_live_id', 'onReceiveLikesMessage', likeListener);
 */
function removeLikeListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().removeLikeListener(liveID, eventName, listener);
}

const onLikeStoreChanged = (eventName : string, res : string) : void => {
    try {
        if (eventName === "totalLikeCount") {
            const data = safeJsonParse<number>(res, 0);
            totalLikeCount.value = data;
        }
    } catch (error) {
        console.error("onLikeStoreChanged JSON parse error:", error);
    }
};

function bindEvent(liveID : string) : void {
    getRTCRoomEngineManager().on("likeStoreChanged", onLikeStoreChanged, liveID);
}

export function useLikeState(liveID : string) {
    bindEvent(liveID);
    return {
        totalLikeCount,       // 总点赞数量
        sendLike,             // 发送点赞
        addLikeListener,      // 添加点赞事件监听
        removeLikeListener,   // 移除点赞事件监听
    };
}
export default useLikeState;