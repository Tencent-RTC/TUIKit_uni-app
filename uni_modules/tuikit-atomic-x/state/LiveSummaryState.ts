/**
 * 统计信息状态管理
 * @module LiveSummaryState
 */
import { ref } from "vue";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";

/**
 * 直播间统计信息
 * @type {Ref<any>}
 * @memberof module:LiveSummaryState
 */
const summaryData = ref<any>();

const onLiveSummaryStoreChanged = (eventName: string, res: string): void => {
    try {
        if (eventName === "summaryData") {
            const data = JSON.parse(res);
            summaryData.value = data;
        }
    } catch (error) {
        console.error("onLiveSummaryStoreChanged error:", error);
    }
};

function bindEvent(liveID: string): void {
    getRTCRoomEngineManager().on("liveSummaryStoreChanged", onLiveSummaryStoreChanged, '');
}

export function useLiveSummaryState(liveID: string) {
    bindEvent(liveID);
    return {
        summaryData,     // 直播间统计信息
    };
}

export default useLiveSummaryState;