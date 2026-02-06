/**
 * 直播列表状态管理
 * @module LiveListState
 */
import { ref } from "vue";
import {
    LiveInfoParam, FetchLiveListOptions, CreateLiveOptions, JoinLiveOptions, LeaveLiveOptions, EndLiveOptions, UpdateLiveInfoOptions, CallExperimentalAPIOptions, ILiveListener,
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 直播列表数据
 * @type {Ref<LiveInfoParam[]>}
 * @memberof module:LiveListState
 */
const liveList = ref<LiveInfoParam[]>([]);

/**
 * 直播列表游标，用于分页加载
 * @type {Ref<string>}
 * @memberof module:LiveListState
 */
const liveListCursor = ref<string>("");

/**
 * 当前直播信息
 * @type {Ref<LiveInfoParam | null>}
 * @memberof module:LiveListState
 */
const currentLive = ref<LiveInfoParam | null>(null);

/**
 * 获取直播列表
 * @param {FetchLiveListOptions} params - 获取参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { fetchLiveList } = useLiveState();
 * fetchLiveList({ cursor: "", count: 20 });
 */
function fetchLiveList(params : FetchLiveListOptions) : void {
    callUTSFunction("fetchLiveList", params);
}

/**
 * 创建直播
 * @param {CreateLiveOptions} params - 创建参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { createLive } = useLiveState();
 * createLive({ liveID: 'xxx', coverUrl: 'https://example.com/cover.jpg'});
 */
function createLive(params : CreateLiveOptions) : void {
    callUTSFunction("createLive", params);
}

/**
 * 加入直播
 * @param {JoinLiveOptions} params - 加入参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { joinLive } = useLiveState();
 * joinLive({ liveID: 'host_live_id' });
 */
function joinLive(params : JoinLiveOptions) : void {
    callUTSFunction("joinLive", params);
}

/**
 * 离开直播
 * @param {LeaveLiveOptions} [params] - 离开参数（可选）
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { leaveLive } = useLiveState();
 * leaveLive();
 */
function leaveLive(params ?: LeaveLiveOptions) : void {
    callUTSFunction("leaveLive", params || {});
}

/**
 * 结束直播
 * @param {EndLiveOptions} [params] - 结束参数（可选）
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { endLive } = useLiveState();
 * endLive();
 */
function endLive(params ?: EndLiveOptions) : void {
    callUTSFunction("endLive", params || {});
}

/**
 * 更新直播信息
 * @param {UpdateLiveInfoOptions} params - 更新参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { updateLiveInfo } = useLiveState();
 * updateLiveInfo({ liveID: 'your_live_id', title: 'new title' });
 */
function updateLiveInfo(params : UpdateLiveInfoOptions) : void {
    callUTSFunction("updateLiveInfo", params);
}

function callExperimentalAPI(params : CallExperimentalAPIOptions) : void {
    const defaultCallback = {
        onResponse: (res ?: string) => {
            console.log("onExperimentalAPIResponse: ", res);
        },
    };
    const finalParams = {
        ...params,
        onResponse: params.onResponse || defaultCallback.onResponse,
    };

    console.log("callExperimentalAPI", finalParams);
    getRTCRoomEngineManager().callExperimentalAPI(finalParams);
}

/**
 * 添加直播列表事件监听
 * @param {string} eventName - 事件名称，可选值: 'onLiveEnded'(直播结束)<br>'onKickedOutOfLive'(被踢出直播间)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { addLiveListListener } = useLiveState();
 * addLiveListListener('onLiveEnded', (params) => {
 *   console.log('result:', params);
 * });
 */
function addLiveListListener(eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().addLiveListListener(eventName, listener);
}

/**
 * 移除直播列表事件监听
 * @param {string} eventName - 事件名称，可选值: 'onLiveEnded'(直播结束)<br>'onKickedOutOfLive'(被踢出直播间)
 * @param {ILiveListener} listener - 事件回调函数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { removeLiveListListener } = useLiveState();
 * removeLiveListListener('onLiveEnded', liveEndedListener);
 */
function removeLiveListListener(eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().removeLiveListListener(eventName, listener);
}

const onLiveStoreChanged = (eventName : string, res : string) : void => {
    try {
        if (eventName === "liveList") {
            const data = safeJsonParse<LiveInfoParam[]>(res, []);
            liveList.value = data;
        } else if (eventName === "liveListCursor") {
            const data = safeJsonParse<string>(res, "");
            liveListCursor.value = data;
        } else if (eventName === "currentLive") {
            const data = safeJsonParse<LiveInfoParam | null>(res, null);
            currentLive.value = data;
        }
    } catch (error) {
        console.error("onLiveStoreChanged error:", error);
    }
};

function bindEvent() : void {
    getRTCRoomEngineManager().on("liveStoreChanged", onLiveStoreChanged, "");
}

export function useLiveListState() {
    bindEvent();

    return {
        liveList,               // 直播列表数据
        liveListCursor,         // 直播列表分页游标
        currentLive,            // 当前直播信息

        fetchLiveList,          // 获取直播列表
        createLive,             // 创建直播
        joinLive,               // 加入直播
        leaveLive,              // 离开直播
        endLive,                // 结束直播
        updateLiveInfo,         // 更新直播信息
        callExperimentalAPI,    // 调用实验性API
        addLiveListListener,    // 添加事件监听
        removeLiveListListener, // 移除事件监听
    };
}

export default useLiveListState;