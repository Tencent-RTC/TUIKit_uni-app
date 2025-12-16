/**
 * @module BaseBeautyState
 * @module_description
 * 基础美颜管理模块
 * 核心功能：提供磨皮、美白、红润等基础美颜效果调节，支持实时美颜参数调整。
 * 技术特点：支持实时美颜处理、参数平滑调节、性能优化等高级技术。
 * 业务价值：为直播平台提供基础的美颜能力，提升用户形象和直播质量。
 * 应用场景：美颜直播、形象优化、美颜调节、直播美化等需要美颜功能的场景。
 */
import { ref } from "vue";
import { SetSmoothLevelOptions, SetWhitenessLevelOptions, SetRuddyLevelOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 磨皮级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { smoothLevel } = useBaseBeautyState('your_live_id');
 * 
 * // 监听磨皮级别变化
 * watch(smoothLevel, (newLevel) => {
 *   console.log('磨皮级别:', newLevel);
 * });
 * 
 * // 获取当前磨皮级别
 * const level = smoothLevel.value;
 * console.log('当前磨皮级别:', level);
 */
const smoothLevel = ref<number>(0);

/**
 * 美白级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { whitenessLevel } = useBaseBeautyState('your_live_id');
 * 
 * // 监听美白级别变化
 * watch(whitenessLevel, (newLevel) => {
 *   console.log('美白级别:', newLevel);
 * });
 * 
 * // 获取当前美白级别
 * const level = whitenessLevel.value;
 * console.log('当前美白级别:', level);
 */
const whitenessLevel = ref<number>(0);

/**
 * 红润级别 取值范围[0,9]: 0 表示关闭，9 表示效果最明显
 * @type {Ref<number>}
 * @memberof module:BaseBeautyState
 * @example
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { ruddyLevel } = useBaseBeautyState('your_live_id');
 * 
 * // 监听红润级别变化
 * watch(ruddyLevel, (newLevel) => {
 *   console.log('红润级别:', newLevel);
 * });
 * 
 * // 获取当前红润级别
 * const level = ruddyLevel.value;
 * console.log('当前红润级别:', level);
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
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setSmoothLevel } = useBaseBeautyState('your_live_id');
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
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setWhitenessLevel } = useBaseBeautyState('your_live_id');
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
 * import { useBaseBeautyState } from '@/uni_modules/tuikit-atomic-x/state/BaseBeautyState';
 * const { setRuddyLevel } = useBaseBeautyState('your_live_id');
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