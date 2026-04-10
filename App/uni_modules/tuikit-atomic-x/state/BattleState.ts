/**
 * @module BattleState
 * @module_description
 * 直播 PK 管理模块
 * 核心功能：处理主播间的PK对战流程，包括PK请求、接受、拒绝、退出等完整的PK管理功能。
 * 技术特点：支持实时PK状态同步、分数统计、PK时长控制、结果计算等高级功能。
 * 业务价值：为直播平台提供丰富的互动玩法，增加主播收益和用户粘性。
 * 应用场景：主播PK、对战直播、分数统计、互动游戏等娱乐互动场景。
 */
import { ref, watch } from "vue";
import { callAPI, addListener, removeListener, reportUIPlatform } from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";
import { SeatUserInfoParam } from "./LiveSeatState";

/**
 * PK 配置参数
 * @interface BattleConfigParam
 */
export type BattleConfigParam = {
  duration: number;
  needResponse: boolean;
  extensionInfo: string;
}

/**
 * PK 信息参数
 * @interface BattleInfoParam
 */
export type BattleInfoParam = {
  battleID: string;
  config: BattleConfigParam;
  startTime: number;
  endTime: number;
};

/**
 * 发起 PK 请求参数
 * @interface RequestBattleOptions
 */
export type RequestBattleOptions = {
  liveID: string;
  config: BattleConfigParam;
  userIDList: string[];
  timeout: number;
  success?: (battleInfo: string, resultMap: string) => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 取消 PK 请求参数
 * @interface CancelBattleRequestOptions
 */
export type CancelBattleRequestOptions = {
  liveID: string;
  battleID: string;
  userIDList: string[];
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 接受 PK 请求参数
 * @interface AcceptBattleOptions
 */
export type AcceptBattleOptions = {
  liveID: string;
  battleID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 拒绝 PK 请求参数
 * @interface RejectBattleOptions
 */
export type RejectBattleOptions = {
  liveID: string;
  battleID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 退出 PK 请求参数
 * @interface ExitBattleOptions
 */
export type ExitBattleOptions = {
  liveID: string;
  battleID: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
}

/**
 * 当前 PK 信息
 * @type {Ref<BattleInfoParam | null>}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { currentBattleInfo } = useBattleState('your_live_id');
 *
 * // 监听当前 PK 信息变化
 * watch(currentBattleInfo, (newBattle) => {
 *   if (newBattle) {
 *     console.log(' PK 已开始:', newBattle.battleID);
 *   }
 * });
 *
 * // 获取当前 PK 信息
 * const battle = currentBattleInfo.value;
 */
const currentBattleInfo = ref<BattleInfoParam | null>(null);

/**
 *  PK 用户列表
 * @type {Ref<SeatUserInfoParam[]>}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { battleUsers } = useBattleState('your_live_id');
 *
 * // 监听当前 PK 用户列表变化
 * watch(battleUsers, (newUsers) => {
 *   console.log('PK 用户列表更新:', newUsers);
 * });
 *
 * // 获取当前 PK 用户列表
 * const users = battleUsers.value;
 * console.log('PK 用户列表更新:', users);
 */
const battleUsers = ref<SeatUserInfoParam[]>([]);

/**
 *  PK 分数映射
 * @type {Ref<Map<string, number>> | null}
 * @memberof module:BattleState
* @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { battleScore } = useBattleState('your_live_id');
 *
 * // 监听当前 PK 分数变化
 * watch(battleScore, (newScore) => {
 *   console.log('PK 分数更新:', newScore);
 * });
 *
 * // 获取当前 PK 分数
 * const score = battleScore.value;
 * console.log('当前 PK 分数:', score);
 */
const battleScore = ref<Map<string, number> | null>(null);

/**
 * 请求 PK
 * @param {RequestBattleOptions} params - 请求 PK 参数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { requestBattle } = useBattleState("your_live_id");
 * requestBattle({
 *   liveID: "your_live_id",
 *   userIDList: ["target_user_id"],
 *   timeout: 10,
 *   config: {
 *     duration: 300,
 *     needResponse: true,
 *     extensionInfo: '{"type":"standard"}'
 *   },
 *   success: (battleInfo, result) => {
 *     console.log(' PK 请求成功:', battleInfo, result);
 *   },
 *   fail: (code, desc) => {
 *     console.error(' PK 请求失败:', code, desc);
 *   }
 * });
 */
function requestBattle(params: RequestBattleOptions): void {
  callAPI(JSON.stringify({
    api: "requestBattle",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('requestBattle =====>: ', data)
      if (data?.code === 0) {
        params?.success?.(data.battleInfo, data.result);
      } else {
        params?.fail?.(data.code, data.message);
      }
    } catch (error) {
      params?.fail?.(-1, error.message);
    }
  });
}

/**
 * 取消 PK 请求
 * @param {CancelBattleRequestOptions} params - 取消 PK 请求参数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { cancelBattleRequest } = useBattleState("your_live_id");
 * cancelBattleRequest({
 *   liveID: "your_live_id",
 *   battleID: "battle_id",
 *   userIDList: ["target_user_id"],
 *   success: () => {
 *     console.log('取消 PK 请求成功');
 *   },
 *   fail: (code, desc) => {
 *     console.error('取消 PK 请求失败:', code, desc);
 *   }
 * });
 */
function cancelBattleRequest(params: CancelBattleRequestOptions): void {
  callAPI(JSON.stringify({
    api: "cancelBattleRequest",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('cancelBattleRequest =====>: ', data)
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
 * 接受 PK
 * @param {AcceptBattleOptions} params - 接受 PK 参数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { acceptBattle } = useBattleState("your_live_id");
 * acceptBattle({
 *   liveID: "your_live_id",
 *   battleID: "battle_id",
 *   success: () => {
 *     console.log('接受 PK 成功');
 *   },
 *   fail: (code, desc) => {
 *     console.error('接受 PK 失败:', code, desc);
 *   }
 * });
 */
function acceptBattle(params: AcceptBattleOptions): void {
  callAPI(JSON.stringify({
    api: "acceptBattle",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('acceptBattle =====>: ', data)
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
 * 拒绝 PK
 * @param {RejectBattleOptions} params - 拒绝 PK 参数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { rejectBattle } = useBattleState("your_live_id");
 * rejectBattle({
 *   liveID: "your_live_id",
 *   battleID: "battle_id",
 *   success: () => {
 *     console.log('拒绝 PK 成功');
 *   },
 *   fail: (code, desc) => {
 *     console.error('拒绝 PK 失败:', code, desc);
 *   }
 * });
 */
function rejectBattle(params: RejectBattleOptions): void {
  callAPI(JSON.stringify({
    api: "rejectBattle",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('rejectBattle =====>: ', data)
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
 * 退出 PK
 * @param {ExitBattleOptions} params - 退出 PK 参数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { exitBattle } = useBattleState("your_live_id");
 * exitBattle({
 *   liveID: "your_live_id",
 *   battleID: "battle_id",
 *   success: () => {
 *     console.log('退出 PK 成功');
 *   },
 *   fail: (code, desc) => {
 *     console.error('退出 PK 失败:', code, desc);
 *   }
 * });
 */
function exitBattle(params: ExitBattleOptions): void {
  callAPI(JSON.stringify({
    api: "exitBattle",
    params: params,
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.error('exitBattle =====>: ', data)
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
type ListenerCallback = (eventData: string) => void;
const listenerIDMap = new WeakMap<ListenerCallback, string>();
const listenerLiveIDMap = new WeakMap<ListenerCallback, string>();
let listenerIDCounter = 0;
function getOrCreateListenerID(listener: ListenerCallback): string {
  let id = listenerIDMap.get(listener);
  if (id === undefined) {
    id = `battle_listener_${++listenerIDCounter}`;
    listenerIDMap.set(listener, id);
  }
  return id;
}
/**
 * 添加 PK 事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onBattleStarted'( PK 开始)<br>'onBattleEnded'( PK 结束)<br>'onUserJoinBattle'(当前有用户加入 PK 对战)<br>'onUserExitBattle'(当前有用户退出 PK 对战)<br>'onBattleRequestReceived'(收到 PK 请求)<br>'onBattleRequestCancelled'(取消 PK 请求)<br>'onBattleRequestTimeout'(当前 PK 对战请求超时)<br>'onBattleRequestAccept'(当前 PK 对战请求被接受)<br>'onBattleRequestReject'(当前 PK 对战请求被拒绝)
 * @param {(eventData: string) => void} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { addBattleListener } = useBattleState('your_live_id');
 * addBattleListener('your_live_id', 'onBattleStarted', (eventData) => {
 * 	console.log('eventData:', eventData);
 * });
 */
function addBattleListener(liveID: string, eventName: string, listener: ListenerCallback) {
  const listenerID = getOrCreateListenerID(listener);
  listenerLiveIDMap.set(listener, liveID);
  addListener({
    type: "",
    store: "BattleStore",
    name: eventName,
    listenerID: listenerID,
    roomID: liveID,
    params: {}
  }, listener);
}

/**
 * 移除 PK 事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onBattleStarted'( PK 开始)<br>'onBattleEnded'( PK 结束)<br>'onUserJoinBattle'(当前有用户加入 PK 对战)<br>'onUserExitBattle'(当前有用户退出 PK 对战)<br>'onBattleRequestReceived'(收到 PK 请求)<br>'onBattleRequestCancelled'(取消 PK 请求)<br>'onBattleRequestTimeout'(当前 PK 对战请求超时)<br>'onBattleRequestAccept'(当前 PK 对战请求被接受)<br>'onBattleRequestReject'(当前 PK 对战请求被拒绝)
 * @param {(eventData: string) => void} listener - 事件监听器函数，需要传入添加时相同的函数引用
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { addBattleListener, removeBattleListener } = useBattleState('your_live_id');
 * const onBattleStarted = (eventData) => {
 * 	console.log('eventData:', eventData);
 * };
 * addBattleListener('your_live_id', 'onBattleStarted', onBattleStarted);
 * // 移除监听时传入相同的函数引用
 * removeBattleListener('your_live_id', 'onBattleStarted', onBattleStarted);
 */
function removeBattleListener(liveID: string, eventName: string, listener: ListenerCallback): void {
  const listenerID = listenerIDMap.get(listener);
  const actualLiveID = listenerLiveIDMap.get(listener) || liveID;
  removeListener({
    type: "",
    store: "BattleStore",
    name: eventName,
    listenerID: listenerID,
    roomID: actualLiveID,
    params: {}
  });
  listenerIDMap.delete(listener);
  listenerLiveIDMap.delete(listener);
}

const BINDABLE_DATA_NAMES = [
  "currentBattleInfo",
  "battleUsers",
  "battleScore"
] as const;

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "BattleStore",
      name: dataName,
      roomID: liveID,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[battle][${dataName}] Data:`, result);
        onBattleStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[battle][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "BattleStore",
      name: dataName,
      roomID: liveID,
      params: {}
    });
  });
  if (boundLiveID === liveID) {
    boundLiveID = null;
  }
}

let stopWatchingCurrentLive: (() => void) | null = null;

function ensureWatchCurrentLive() {
  if (stopWatchingCurrentLive) return;
  stopWatchingCurrentLive = watch(
    () => currentLive.value,
    (newVal, oldVal) => {
      if (oldVal && oldVal.liveID !== '') {
        if (newVal.liveID === '' && boundLiveID) {
          unbindEvent(boundLiveID);
        }
      }
    }
  );
}

const onBattleStoreChanged: Record<string, (result: any) => void> = {
  currentBattleInfo: (res) => {
    const data = safeJsonParse<BattleInfoParam | null>(res.currentBattleInfo, null);
    currentBattleInfo.value = data;
  },
  battleUsers: (res) => {
    const data = safeJsonParse<SeatUserInfoParam[]>(res.battleUsers, []);
    battleUsers.value = data;
  },
  battleScore: (res) => {
    const data = safeJsonParse<Map<string, number> | null>(res.battleScore, null);
    battleScore.value = data;
  },
};

export function useBattleState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    currentBattleInfo,    // 当前 PK 信息
    battleUsers,          // PK 用户列表
    battleScore,          // PK 分数映射

    requestBattle,        // 请求 PK
    cancelBattleRequest,  // 取消 PK 请求
    acceptBattle,         // 接受 PK
    rejectBattle,         // 拒绝 PK
    exitBattle,           // 退出 PK

    addBattleListener,    // 添加 PK 事件监听
    removeBattleListener  // 移除 PK 事件监听
  };
}

export default useBattleState;