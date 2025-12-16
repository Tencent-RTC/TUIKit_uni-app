/**
 * @module LiveListState
 * @module_description
 * 直播列表状态管理模块
 * 核心功能：管理直播间的完整生命周期，包括创建、加入、离开、结束等核心业务流程。
 * 技术特点：支持分页加载、实时状态同步、直播信息动态更新，采用响应式数据管理，确保UI与数据状态实时同步。
 * 业务价值：为直播平台提供核心的直播间管理能力，支持大规模并发直播场景，是直播业务的基础设施。
 * 应用场景：直播列表展示、直播间创建、直播状态管理、直播数据统计等核心业务场景。
 */
import { ref } from "vue";
import {
  LiveInfoParam, FetchLiveListOptions, CreateLiveOptions, JoinLiveOptions, LeaveLiveOptions, EndLiveOptions, UpdateLiveInfoOptions, UpdateLiveMetaDataOptions, CallExperimentalAPIOptions, ILiveListener,
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 直播列表数据
 * @type {Ref<LiveInfoParam[]>}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { liveList } = useLiveListState();
 * 
 * // 监听直播列表变化
 * watch(liveList, (newList) => {
 *   if (newList && newList.length > 0) {
 *     console.log('直播列表更新:', newList);
 *     newList.forEach(live => {
 *       console.log('直播ID:', live.liveID);
 *       console.log('直播标题:', live.title);
 *     });
 *   }
 * });
 * 
 * // 获取当前直播列表
 * const currentList = liveList.value;
 * console.log('当前直播数量:', currentList.length);
 */
const liveList = ref<LiveInfoParam[]>([]);

/**
 * 直播列表游标，用于分页加载
 * @type {Ref<string>}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { liveListCursor } = useLiveListState();
 * 
 * // 监听游标变化用于分页加载
 * watch(liveListCursor, (newCursor) => {
 *   console.log('直播列表游标更新:', newCursor);
 *   // 当游标更新时，可以获取下一页数据
 *   if (newCursor) {
 *     console.log('加载下一页直播列表');
 *   }
 * });
 * 
 * // 获取当前游标
 * const cursor = liveListCursor.value;
 * if (cursor) {
 *   console.log('当前分页游标:', cursor);
 * }
 */
const liveListCursor = ref<string>("");

/**
 * 当前直播信息
 * @type {Ref<LiveInfoParam | null>}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { currentLive } = useLiveListState();
 * 
 * // 监听当前直播信息变化
 * watch(currentLive, (newLive) => {
 *   if (newLive) {
 *     console.log('当前直播信息更新:', newLive);
 *     console.log('直播ID:', newLive.liveID);
 *     console.log('直播标题:', newLive.title);
 *     console.log('观看人数:', newLive.viewerCount);
 *   }
 * });
 * 
 * // 获取当前直播信息
 * const live = currentLive.value;
 * if (live) {
 *   console.log('当前进入的直播:', live.title);
 * }
 */
const currentLive = ref<LiveInfoParam | null>(null);

/**
 * 获取直播列表
 * @param {FetchLiveListOptions} params - 获取参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { fetchLiveList } = useLiveListState();
 * fetchLiveList({ cursor: "", count: 20 });
 */
function fetchLiveList(params : FetchLiveListOptions) : void {
  callUTSFunction("fetchLiveList", params);
}

/**
 * 创建直播间
 * @param {CreateLiveOptions} params - 创建参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { createLive } = useLiveListState();
 * createLive({ title: 'my live', coverUrl: 'https://example.com/cover.jpg'});
 */
function createLive(params : CreateLiveOptions) : void {
  callUTSFunction("createLive", params);
}

/**
 * 加入直播间
 * @param {JoinLiveOptions} params - 加入参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { joinLive } = useLiveListState();
 * joinLive({ liveID: 'host_live_id' });
 */
function joinLive(params : JoinLiveOptions) : void {
  callUTSFunction("joinLive", params);
}

/**
 * 离开直播间
 * @param {LeaveLiveOptions} [params] - 离开参数（可选）
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { leaveLive } = useLiveListState();
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
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { endLive } = useLiveListState();
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
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { updateLiveInfo } = useLiveListState();
 * updateLiveInfo({ liveID: 'your_live_id', title: 'new title' });
 */
function updateLiveInfo(params : UpdateLiveInfoOptions) : void {
  callUTSFunction("updateLiveInfo", params);
}

/**
 * 更新直播元数据
 * @param {UpdateLiveMetaDataOptions} params - 更新直播元数据, 监听 currentLive 获取更新结果
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { updateLiveMetaData } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { updateLiveMetaData } = useLiveListState();
 * updateLiveMetaData({metaData: '['key': 'value']' });
 */
function updateLiveMetaData(params : UpdateLiveMetaDataOptions) : void {
  callUTSFunction("updateLiveMetaData", params);
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
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { addLiveListListener } = useLiveListState();
 * addLiveListListener('onLiveEnded', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
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
 * import { useLiveListState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { removeLiveListListener } = useLiveListState();
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
    updateLiveMetaData,     // 更新直播元数据
    callExperimentalAPI,

    addLiveListListener,    // 添加事件监听
    removeLiveListListener, // 移除事件监听
  };
}

export default useLiveListState;