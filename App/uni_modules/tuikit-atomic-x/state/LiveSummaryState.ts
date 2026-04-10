/**
 * @module LiveSummaryState
 * @module_description
 * 统计信息状态管理模块
 * 核心功能：统计和展示直播过程中的关键数据，包括观看人数、点赞数、礼物数等实时统计。
 * 技术特点：支持实时数据采集、数据聚合、统计分析等功能，提供完整的直播数据视图。
 * 业务价值：为直播平台提供数据分析能力，支持直播效果评估和优化改进。
 * 应用场景：直播数据展示、主播分析、流量统计、商业数据报表等数据分析场景。
 */
import { ref, watch } from "vue";
import { addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 直播统计数据类型
 * @typedef {Object} LiveSummaryDataParam
 * @property {number} totalDuration - 直播总时长（秒）
 * @property {number} totalViewers - 累计观看人数
 * @property {number} totalGiftsSent - 累计收到礼物数量
 * @property {number} totalGiftUniqueSenders - 累计送礼人数
 * @property {number} totalGiftCoins - 累计礼物金币数
 * @property {number} totalLikesReceived - 累计点赞数
 * @property {number} totalMessageSent - 累计消息数
 */
export type LiveSummaryDataParam = {
  totalDuration: number;
  totalViewers: number;
  totalGiftsSent: number;
  totalGiftUniqueSenders: number;
  totalGiftCoins: number;
  totalLikesReceived: number;
  totalMessageSent: number;
};

/**
 * 直播间统计信息
 * @type {Ref<LiveSummaryDataParam | null>}
 * @memberof module:LiveSummaryState
 * @example
 * import { useLiveSummaryState } from '@/uni_modules/tuikit-atomic-x/state/LiveSummaryState';
 * const { summaryData } = useLiveSummaryState('your_live_id');
 *
 * // 监听统计数据变化
 * watch(summaryData, (newData) => {
 *   if (newData) {
 *     console.log('直播统计数据更新:', newData);
 *   }
 * });
 *
 * // 获取当前统计数据
 * const data = summaryData.value;
 * if (data) {
 *   console.log('当前直播统计数据:', data);
 * }
 */
const summaryData = ref<LiveSummaryDataParam | null>(null);

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  addListener({
    type: "state",
    store: "LiveSummaryStore",
    name: "summaryData",
    roomID: liveID,
    params: {}
  }, (data: string) => {
    try {
      const result = safeJsonParse<any>(data, {});
      console.log(`[${liveID}][summaryData] Data:`, result);
      summaryData.value = safeJsonParse<LiveSummaryDataParam | null>(result.summaryData, null);
    } catch (error) {
      console.error(`[${liveID}][summaryData] Error:`, error);
    }
  });
}

function unbindEvent(liveID: string): void {
  removeListener({
    type: "state",
    store: "LiveSummaryStore",
    name: "summaryData",
    roomID: liveID,
    params: {}
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

export function useLiveSummaryState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();
  return {
    summaryData,     // 直播间统计信息
  };
}

export default useLiveSummaryState;