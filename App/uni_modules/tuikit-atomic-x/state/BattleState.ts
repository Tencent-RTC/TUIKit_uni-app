/**
 * @module BattleState
 * @module_description
 * 直播 PK 管理模块
 * 核心功能：处理主播间的PK对战流程，包括PK请求、接受、拒绝、退出等完整的PK管理功能。
 * 技术特点：支持实时PK状态同步、分数统计、PK时长控制、结果计算等高级功能。
 * 业务价值：为直播平台提供丰富的互动玩法，增加主播收益和用户粘性。
 * 应用场景：主播PK、对战直播、分数统计、互动游戏等娱乐互动场景。
 */
import { ref } from "vue";
import { ILiveListener, RequestBattleOptions, CancelBattleRequestOptions, AcceptBattleOptions, RejectBattleOptions, ExitBattleOptions, BattleInfoParam, SeatUserInfoParam } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

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
 *     extensionInfo: "{"\"type\":\"standard\""}"
 *   },
 *   success: (battleInfo, result) => {
 *     console.log(' PK 请求成功:', battleInfo, result);
 *   },
 *   fail: (code, desc) => {
 *     console.error(' PK 请求失败:', code, desc);
 *   }
 * });
 */
function requestBattle(params : RequestBattleOptions) : void {
    callUTSFunction("requestBattle", params);
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
function cancelBattleRequest(params : CancelBattleRequestOptions) : void {
    callUTSFunction("cancelBattleRequest", params);
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
function acceptBattle(params : AcceptBattleOptions) : void {
    callUTSFunction("acceptBattle", params);
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
function rejectBattle(params : RejectBattleOptions) : void {
    callUTSFunction("rejectBattle", params);
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
function exitBattle(params : ExitBattleOptions) : void {
    callUTSFunction("exitBattle", params);
}

/**
 * 添加 PK 事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onBattleStarted'( PK 开始)<br>'onBattleEnded'( PK 结束)<br>'onUserJoinBattle'(当前有用户加入 PK 对战)<br>'onUserExitBattle'(当前有用户退出 PK 对战)<br>'onBattleRequestReceived'(收到 PK 请求)<br>'onBattleRequestCancelled'(取消 PK 请求)<br>'onBattleRequestTimeout'(当前 PK 对战请求超时)<br>'onBattleRequestAccept'(当前 PK 对战请求被接受)<br>'onBattleRequestReject'(当前 PK 对战请求被拒绝)
 * @param {ILiveListener} listener - 事件处理函数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { addBattleListener } = useBattleState('your_live_id');
 * addBattleListener('your_live_id', 'onBattleStarted', {
 * 	callback: (params) => {
 * 		console.log(' PK 已开始:', params);
 * 	}
 * });
 */
function addBattleListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().addBattleListener(liveID, eventName, listener);
}

/**
 * 移除 PK 事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onBattleStarted'( PK 开始)<br>'onBattleEnded'( PK 结束)<br>'onUserJoinBattle'(当前有用户加入 PK 对战)<br>'onUserExitBattle'(当前有用户退出 PK 对战)<br>'onBattleRequestReceived'(收到 PK 请求)<br>'onBattleRequestCancelled'(取消 PK 请求)<br>'onBattleRequestTimeout'(当前 PK 对战请求超时)<br>'onBattleRequestAccept'(当前 PK 对战请求被接受)<br>'onBattleRequestReject'(当前 PK 对战请求被拒绝)
 * @param {ILiveListener} listener - 事件处理函数
 * @returns {void}
 * @memberof module:BattleState
 * @example
 * import { useBattleState } from '@/uni_modules/tuikit-atomic-x/state/BattleState';
 * const { removeBattleListener } = useBattleState('your_live_id');
 * removeBattleListener('your_live_id', 'onBattleStarted', battleListener);
 */
function removeBattleListener(liveID : string, eventName : string, listener : ILiveListener) : void {
    getRTCRoomEngineManager().removeBattleListener(liveID, eventName, listener);
}

const onBattleStoreChanged = (eventName : string, res : string) : void => {
    try {
        switch (eventName) {
            case "currentBattleInfo":
                const battleData = safeJsonParse<BattleInfoParam | null>(res, null);
                currentBattleInfo.value = battleData;
                break;
            case "battleUsers":
                const requestsData = safeJsonParse<SeatUserInfoParam[]>(res, []);
                battleUsers.value = requestsData;
                break;
            case "battleScore":
                const scoreData = safeJsonParse<Map<string, number> | null>(res, null);
                battleScore.value = scoreData;
                break;
        }
    } catch (error) {
        console.error("onBattleStoreChanged JSON parse error:", error);
    }
};

function bindEvent(liveID : string) : void {
    getRTCRoomEngineManager().on("battleStoreChanged", onBattleStoreChanged, liveID);
}

export function useBattleState(liveID : string) {
    bindEvent(liveID);
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