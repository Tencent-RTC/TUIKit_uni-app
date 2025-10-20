/**
 * 基础美颜管理模块
 * @module BaseBeautyState
 */
import { ref } from "vue";
import { SetSmoothLevelOptions, SetWhitenessLevelOptions, SetRuddyLevelOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 磨皮级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 */
const smoothLevel = ref<number>(0);

/**
 * 美白级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 */
const whitenessLevel = ref<number>(0);

/**
 * 红润级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 */
const ruddyLevel = ref<number>(0);

const realUiValues = ref({
    whiteness: 0,
    smooth: 0,
    ruddy: 0
});

/**
 * 设置磨皮级别
 * @param {SetSmoothLevelOptions} params - 磨皮参数，取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @returns {void}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setSmoothLevel } = useBeautyState('your_live_id');
 * setSmoothLevel({ smoothLevel: 5 });
 */
function setSmoothLevel(params: SetSmoothLevelOptions): void {
    callUTSFunction("setSmoothLevel", params);
}

/**
 * 设置美白级别
 * @param {SetWhitenessLevelOptions} params - 美白参数，取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @returns {void}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setWhitenessLevel } = useBeautyState('your_live_id');
 * setWhitenessLevel({ whitenessLevel: 6 });
 */
function setWhitenessLevel(params: SetWhitenessLevelOptions): void {
    callUTSFunction("setWhitenessLevel", params);
}

/**
 * 设置红润级别
 * @param {SetRuddyLevelOptions} params - 红润参数，取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @returns {void}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setRuddyLevel } = useBeautyState('your_live_id');
 * setRuddyLevel({ ruddyLevel: 4 });
 */
function setRuddyLevel(params: SetRuddyLevelOptions): void {
    callUTSFunction("setRuddyLevel", params);
}

function setRealUiValue(type: 'whiteness' | 'smooth' | 'ruddy', value: number): void {
    realUiValues.value[type] = value;
}

function getRealUiValue(type: 'whiteness' | 'smooth' | 'ruddy'): number {
    return realUiValues.value[type];
}

function resetRealUiValues(): void {
    realUiValues.value.whiteness = 0;
    realUiValues.value.smooth = 0;
    realUiValues.value.ruddy = 0;
}

const onBeautyStoreChanged = (eventName: string, res: string): void => {
    try {
        if (eventName === "smoothLevel") {
            const data = safeJsonParse<number>(res, 0);
            smoothLevel.value = data;
        } else if (eventName === "whitenessLevel") {
            const data = safeJsonParse<number>(res, 0);
            whitenessLevel.value = data;
        } else if (eventName === "ruddyLevel") {
            const data = safeJsonParse<number>(res, 0);
            ruddyLevel.value = data;
        }
    } catch (error) {
        console.error("onBeautyStoreChanged error:", error);
    }
};

function bindEvent(liveID: string): void {
    getRTCRoomEngineManager().on("beautyStoreChanged", onBeautyStoreChanged, liveID);
}

export function useBaseBeautyState(liveID: string) {
    bindEvent(liveID);
    return {
        smoothLevel,         // 磨皮级别状态
        whitenessLevel,      // 美白级别状态
        ruddyLevel,          // 红润级别状态
        setSmoothLevel,      // 设置磨皮级别方法
        setWhitenessLevel,   // 设置美白级别方法
        setRuddyLevel,       // 设置红润级别方法

        realUiValues,
        setRealUiValue,
        getRealUiValue,
        resetRealUiValues,
    };
}

export default useBaseBeautyState;