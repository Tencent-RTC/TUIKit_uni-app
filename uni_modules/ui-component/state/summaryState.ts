import { ref } from "vue";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// 1. 响应式状态定义
const summaryData = ref();



const onLiveSummaryStateChanged = (eventName: string, res: string) => {
    try {
        if (eventName === "summaryData") {
            const data = JSON.parse(res);
            summaryData.value = data;
        }

    } catch (error) {
        console.error("onLiveSummaryStateChanged JSON parse error:", error);
    }
};

function bindEvent(liveId: string) {
    getV2RTCRoomEngineManager().on(
        "liveSummaryStateChanged",
        onLiveSummaryStateChanged,
        liveId
    );
}


export function useSummaryState(liveId: string) {
    bindEvent(liveId);
    return {
        summaryData,
    };
}

export default useSummaryState;
