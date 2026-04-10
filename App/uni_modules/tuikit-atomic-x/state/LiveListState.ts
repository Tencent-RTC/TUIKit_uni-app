/**
 * @module LiveListState
 * @module_description
 * 直播列表状态管理模块
 * 核心功能：管理直播间列表的获取、刷新、分页加载等操作，提供直播间创建、销毁、状态查询等基础服务。
 * 技术特点：支持直播列表分页加载、实时状态同步、多端数据一致性保证等高级功能。
 * 业务价值：为直播平台提供直播间发现和管理的核心入口，是所有直播业务的基础。
 * 应用场景：直播列表展示、直播间创建与管理、直播状态查询、用户信息管理等核心场景。
 */
import { ref } from "vue";
import {
  CallExperimentalAPIOptions, setFramework,
  callAPI, addListener, removeListener, HybridResponseData, hybirdCallExperimentalAPI, startForegroundService, stopForegroundService
} from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";

declare const uni: any;

// 全局状态存储 key
const LIVE_LIST_STATE_KEY = '__TUIKIT_LIVE_LIST_STATE__';

// 初始化全局状态存储
function getGlobalState() {
  if (!uni[LIVE_LIST_STATE_KEY]) {
    uni[LIVE_LIST_STATE_KEY] = {
      liveList: ref<LiveInfoParam[]>([]),
      liveListCursor: ref<string>(""),
      currentLive: ref<LiveInfoParam | null>(null),
      bindEventDone: false
    };
  }
  return uni[LIVE_LIST_STATE_KEY];
}

/**
 * 上麦模式类型
 * @remarks
 * 可用值：
 * - `FREE`: 自由上麦模式
 * - `APPLY`: 申请上麦模式
 */
export enum TakeSeatMode {
  FREE = 0,
  APPLY = 1,
}

/**
 * 移动座位策略类型
 * @remarks
 * 可用值：
 * - `ABORT_WHEN_OCCUPIED`: 当目标座位被占用时中止操作
 * - `FORCE_REPLACE`: 强制替换目标座位上的用户
 * - `SWAP_POSITION`: 交换位置
 */
export enum MoveSeatPolicy {
  ABORT_WHEN_OCCUPIED = 0,
  FORCE_REPLACE = 1,
  SWAP_POSITION = 2,
}

/**
 * 直播间信息修改标志类型
 */
export enum LiveModifyFlag {
  NONE = 0,
  LIVE_NAME = 1 << 0,
  NOTICE = 1 << 1,
  IS_MESSAGE_DISABLE = 1 << 2,
  IS_PUBLIC_VISIBLE = 1 << 5,
  SEAT_MODE = 1 << 6,
  COVER_URL = 1 << 7,
  BACKGROUND_URL = 1 << 8,
  CATEGORY_LIST = 1 << 9,
  ACTIVITY_STATUS = 1 << 10,
  SEAT_LAYOUT_TEMPLATE_ID = 1 << 11,
}
/**
 * 直播间用户信息参数
 * @interface LiveUserInfoParam
 * @description 直播间用户信息结构
 * @param {string} userID - 用户ID（必填）
 * @param {string} userName - 用户名（可选）
 * @param {string} avatarURL - 头像URL（可选）
 */
export type LiveUserInfoParam = {
  userID?: string;
  userName?: string;
  avatarURL?: string;
};

/**
 * 直播间信息参数
 * @interface LiveInfoParam
 * @description 直播间信息结构
 */
export type LiveInfoParam = {
  liveID: string;
  liveName?: string;
  notice?: string;
  isMessageDisable?: boolean;
  isPublicVisible?: boolean;
  isSeatEnabled?: boolean;
  keepOwnerOnSeat?: boolean;
  maxSeatCount?: number;
  seatMode?: TakeSeatMode;
  seatLayoutTemplateID?: number;
  coverURL?: string;
  backgroundURL?: string;
  categoryList?: number[];
  activityStatus?: number;
  readonly totalViewerCount?: number;
  readonly liveOwner?: LiveUserInfoParam;
  readonly createTime?: number;
  isGiftEnabled?: boolean;
  metaData?: Map<string, string>;
};

/**
 * 获取直播间列表参数
 * @interface FetchLiveListOptions
 */
export type FetchLiveListOptions = {
  cursor: string;
  count: number;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 创建直播间参数
 * @interface CreateLiveOptions
 */
export type CreateLiveOptions = {
  liveInfo: LiveInfoParam;
  success?: (liveInfo: string) => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 加入直播间参数
 * @interface JoinLiveOptions
 */
export type JoinLiveOptions = {
  liveID: string;
  success?: (liveInfo: string) => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 离开直播间参数
 * @interface LeaveLiveOptions
 */
export type LeaveLiveOptions = {
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 结束直播间参数
 * @interface EndLiveOptions
 */
export type EndLiveOptions = {
  success?: (data: string) => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 更新直播间信息参数
 * @interface UpdateLiveInfoOptions
 */
export type UpdateLiveInfoOptions = {
  liveInfo: LiveInfoParam;
  modifyFlagList: LiveModifyFlag[]
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 更新直播间元数据参数
 * @interface UpdateLiveMetaDataOptions
 */
export type UpdateLiveMetaDataOptions = {
  metaData: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 直播列表数据
 * @type {Ref<LiveInfoParam[]>}
 * @memberof module:LiveListState
 */
const liveList = getGlobalState().liveList;

/**
 * 直播列表游标，用于分页加载
 * @type {Ref<string>}
 * @memberof module:LiveListState
 */
const liveListCursor = getGlobalState().liveListCursor;

/**
 * 当前直播信息
 * @type {Ref<LiveInfoParam | null>}
 * @memberof module:LiveListState
 */
export const currentLive = getGlobalState().currentLive;

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
function fetchLiveList(params: FetchLiveListOptions): void {
  console.log('fetchLiveList: ', params)
  callAPI(JSON.stringify({
    api: "fetchLiveList",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('fetchLiveList =====>: ', data)

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
 * 创建直播
 * @param {CreateLiveOptions} params - 创建参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { createLive } = useLiveState();
 * createLive({ liveID: 'xxx', coverUrl: 'https://example.com/cover.jpg'});
 */
function createLive(params: CreateLiveOptions): void {
  setFramework(21)
  callAPI(JSON.stringify({
    api: 'createLive',
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as HybridResponseData;
      if (data?.code === 0) {
        params?.success?.(data?.message);
        startForegroundService()
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
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
function joinLive(params: JoinLiveOptions): void {
  setFramework(21)
  callAPI(JSON.stringify({
    api: "joinLive",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.(data?.message);
        startForegroundService()
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
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
function leaveLive(params?: LeaveLiveOptions): void {
  callAPI(JSON.stringify({
    api: "leaveLive",
    params: {},
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
    stopForegroundService()
  });
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
function endLive(params?: EndLiveOptions): void {
  callAPI(JSON.stringify({
    api: "endLive",
    params: {},
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      if (data?.code === 0) {
        params?.success?.();
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
    stopForegroundService()
  });
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
function updateLiveInfo(params: UpdateLiveInfoOptions): void {
  callAPI(JSON.stringify({
    api: "updateLiveInfo",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
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
 * 更新直播元数据
 * - 只有管理员或房主可以调用此接口。
 * - 元数据更新后，房间内所有用户都会收到 {currentLive.meta} 数据更新。
 * - 键长度不能超过 50 字节，值长度不超过 200 字节。
 * @param {UpdateLiveMetaDataOptions} params - 更新参数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { updateLiveMetaData } = useLiveState();
 * updateLiveMetaData({ metaData: JSON.stringify({ key: 'value' }) });
 */
function updateLiveMetaData(params: UpdateLiveMetaDataOptions): void {
  callAPI(JSON.stringify({
    api: "updateLiveMetaData",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
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

function callExperimentalAPI(params: CallExperimentalAPIOptions): void {
  console.error('callExperimentalAPI: ', params)
  hybirdCallExperimentalAPI(params);
}
type ListenerCallback = (eventData: string) => void;
const listenerIDMap = new WeakMap<ListenerCallback, string>();
let listenerIDCounter = 0;
function getOrCreateListenerID(listener: ListenerCallback): string {
  let id = listenerIDMap.get(listener);
  if (id === undefined) {
    id = `livelist_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加直播列表事件监听
 * @param {string} eventName - 事件名称，可选值: 'onLiveEnded'(直播结束)<br>'onKickedOutOfLive'(被踢出直播间)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { addLiveListListener } = useLiveState();
 * addLiveListListener('onLiveEnded', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addLiveListListener(eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  addListener({
    type: "",
    store: "LiveListStore",
    name: eventName,
    listenerID: listenerID,
    params: {}
  }, listener);
}

/**
 * 移除直播列表事件监听
 * @param {string} eventName - 事件名称，可选值: 'onLiveEnded'(直播结束)<br>'onKickedOutOfLive'(被踢出直播间)
 * @param {(eventData: string) => void} listener - 事件监听器函数，需要传入添加时相同的函数引用
 * @returns {void}
 * @memberof module:LiveListState
 * @example
 * import { useLiveState } from '@/uni_modules/tuikit-atomic-x/state/LiveListState';
 * const { addLiveListListener, removeLiveListListener } = useLiveState();
 * const onLiveEnded = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addLiveListListener('onLiveEnded', onLiveEnded);
 * // 移除监听时传入相同的函数引用
 * removeLiveListListener('onLiveEnded', onLiveEnded);
 */
function removeLiveListListener(eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  removeListener({
    type: "",
    store: "LiveListStore",
    name: eventName,
    listenerID: listenerID,
    params: {}
  });
  listenerIDMap.delete(listener);
}

const BINDABLE_DATA_NAMES = [
  "liveList",
  "liveListCursor",
  "currentLive"
] as const;

function bindEvent(): void {
  const globalState = getGlobalState();

  // 防止重复绑定事件
  if (globalState.bindEventDone) {
    return;
  }
  globalState.bindEventDone = true;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "LiveListStore",
      name: dataName,
      listenerID: 'LiveListStore',
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[liveList][${dataName}] Data:`, result);
        onLiveStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[liveList][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "LiveListStore",
      name: dataName,
      listenerID: 'LiveListStore',
      params: {}
    });
  });
}

const onLiveStoreChanged: Record<string, (result: any) => void> = {
  liveList: (res) => {
    liveList.value = safeJsonParse<LiveInfoParam[]>(res.liveList, []);
  },
  liveListCursor: (res) => {
    liveListCursor.value = res.liveListCursor;
  },
  currentLive: (res) => {
    currentLive.value = safeJsonParse<LiveInfoParam | null>(res.currentLive, null);
  },
};

/**
 * 清除直播列表状态数据
 * @returns {void}
 * @memberof module:LiveListState
 * @internal
 */
function clearLiveListState(): void {
  // 解除事件绑定
  unbindEvent();

  const globalState = getGlobalState();
  // 清除所有状态
  globalState.liveList.value = [];
  globalState.liveListCursor.value = "";
  globalState.currentLive.value = null;
  // 重置绑定标志
  globalState.bindEventDone = false;
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
    callExperimentalAPI,    // 调用实验性API
    addLiveListListener,    // 添加事件监听
    removeLiveListListener, // 移除事件监听

    // 内部方法（一般不需要外部调用）
    clearLiveListState,     // 清除状态（内部使用）
  };
}

export default useLiveListState;