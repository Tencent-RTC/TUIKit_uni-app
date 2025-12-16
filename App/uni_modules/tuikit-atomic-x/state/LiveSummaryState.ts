/**
 * @module LiveSummaryState
 * @module_description
 * 统计信息状态管理模块
 * 核心功能：统计和展示直播过程中的关键数据，包括观看人数、点赞数、礼物数等实时统计。
 * 技术特点：支持实时数据采集、数据聚合、统计分析等功能，提供完整的直播数据视图。
 * 业务价值：为直播平台提供数据分析能力，支持直播效果评估和优化改进。
 * 应用场景：直播数据展示、主播分析、流量统计、商业数据报表等数据分析场景。
 */
import { ref } from "vue";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";

/**
 * 直播间统计信息
 * @type {Ref<any>}
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
const summaryData = ref<any>();

const onLiveSummaryStoreChanged = (eventName : string, res : string) : void => {
  try {
    if (eventName === "summaryData") {
      const data = JSON.parse(res);
      summaryData.value = data;
    }
  } catch (error) {
    console.error("onLiveSummaryStoreChanged error:", error);
  }
};

function bindEvent(liveID : string) : void {
  getRTCRoomEngineManager().on("liveSummaryStoreChanged", onLiveSummaryStoreChanged, liveID);
}

export function useLiveSummaryState(liveID : string) {
  bindEvent(liveID);
  return {
    summaryData,     // 直播间统计信息
  };
}

export default useLiveSummaryState;