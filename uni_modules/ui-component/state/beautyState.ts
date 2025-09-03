import { ref } from "vue";
import {
    SetSmoothLevelOptions,
    SetWhitenessLevelOptions,
    SetRuddyLevelOptions
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// 1. 响应式状态定义
const smoothLevel = ref(0);
const whitenessLevel = ref(0);
const ruddyLevel = ref(0);

// 真实的UI拖动值（不受90限制）
const realUiValues = ref({
    whiteness: 0,
    smooth: 0,
    ruddy: 0
});

// 3. 统一调用方法
function callUTSFunction(funcName: string, args?: any) {
    const defaultCallback = {
        success: (result: string) => {
            console.log(`BeautyState.${funcName} success:`, result);
        },
        fail: (errCode: number, errMsg: string) => {
            console.error(`BeautyState.${funcName} failed:`, errCode, errMsg);
        },
    };

    const finalArgs = args ? { ...args, ...defaultCallback } : defaultCallback;

    try {
        getV2RTCRoomEngineManager()[funcName](finalArgs);
    } catch (error) {
        console.error(`BeautyState.${funcName} error:`, error);
    }
}


function setSmoothLevel(params: SetSmoothLevelOptions) {
    callUTSFunction("setSmoothLevel", params);
}


function setWhitenessLevel(params: SetWhitenessLevelOptions) {
    callUTSFunction("setWhitenessLevel", params);
}

function setRuddyLevel(params: SetRuddyLevelOptions) {
    callUTSFunction("setRuddyLevel", params);
}

// 设置真实的UI拖动值
function setRealUiValue(type: 'whiteness' | 'smooth' | 'ruddy', value: number) {
    realUiValues.value[type] = value;
}

// 获取真实的UI拖动值
function getRealUiValue(type: 'whiteness' | 'smooth' | 'ruddy'): number {
    return realUiValues.value[type];
}

// 重置所有真实的UI拖动值
function resetRealUiValues() {
    realUiValues.value.whiteness = 0;
    realUiValues.value.smooth = 0;
    realUiValues.value.ruddy = 0;
}

const onBeautyStoreChanged = (eventName: string, res: string) => {
    try {
        if (eventName === "smoothLevel") {
            const data = JSON.parse(res);
            smoothLevel.value = data;
        }
        if (eventName === "whitenessLevel") {
            const data = JSON.parse(res);
            whitenessLevel.value = data;
        }
        if (eventName === "ruddyLevel") {
            const data = JSON.parse(res);
            ruddyLevel.value = data;
        }
    } catch (error) {
        console.error("onBeautyStoreChanged JSON parse error:", error);
    }
};

function bindEvent(liveId: string) {
    getV2RTCRoomEngineManager().on(
        "beautyStoreChanged",
        onBeautyStoreChanged,
        liveId
    );
}


export function useBeautyState(liveId: string) {
    bindEvent(liveId);
    return {
        smoothLevel,
        whitenessLevel,
        ruddyLevel,
        setSmoothLevel,
        setWhitenessLevel,
        setRuddyLevel,
        realUiValues,
        setRealUiValue,
        getRealUiValue,
        resetRealUiValues,

        // 统一调用方法
        callUTSFunction,
    };
}

export default useBeautyState;
