/**
 * @module AudioEffectState
 * @module_description
 * 音效设置管理模块
 * 核心功能：提供变声、混响、耳返等高级音效功能，支持多种音效效果和实时音效调节。
 * 技术特点：基于音频处理算法，支持实时音效处理、低延迟音频传输、音质优化等高级技术。
 * 业务价值：为直播平台提供差异化的音效体验，增强用户参与度和直播趣味性。
 * 应用场景：变声直播、K歌直播、音效娱乐、专业音效等需要音频处理的场景。
 */
import { ref } from "vue";
import {
    SetAudioChangerTypeOptions, SetAudioReverbTypeOptions, SetVoiceEarMonitorEnableOptions,
    VolumeOptions, AudioChangerTypeParam, AudioReverbTypeParam
} from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 变声器类型映射表
 * @internal
 */
const CHANGER_TYPE_MAP: Record<number, AudioChangerTypeParam> = {
    0: 'NONE',
    1: 'CHILD',
    2: 'LITTLE_GIRL',
    3: 'MAN',
    4: 'HEAVY_METAL',
    5: 'COLD',
    6: 'FOREIGNER',
    7: 'TRAPPED_BEAST',
    8: 'FATSO',
    9: 'STRONG_CURRENT',
    10: 'HEAVY_MACHINERY',
    11: 'ETHEREAL',
} as const;

/**
 * 混响类型映射表
 * @internal
 */
const REVERB_TYPE_MAP: Record<number, AudioReverbTypeParam> = {
    0: 'NONE',
    1: 'KTV',
    2: 'SMALL_ROOM',
    3: 'AUDITORIUM',
    4: 'DEEP',
    5: 'LOUD',
    6: 'METALLIC',
    7: 'MAGNETIC',
} as const;

/**
 * 耳返开关状态
 * @type {Ref<boolean>}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { isEarMonitorOpened } = useAudioEffectState('your_live_id');
 * 
 * // 监听耳返开关状态变化
 * watch(isEarMonitorOpened, (newStatus) => {
 *   console.log('耳返开关状态:', newStatus);
 * });
 * 
 * // 获取当前耳返开关状态
 * const isOpen = isEarMonitorOpened.value;
 * console.log('当前耳返状态:', isOpen);
 */
const isEarMonitorOpened = ref<boolean>(false);

/**
 * 耳返音量大小
 * @type {Ref<number>}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { earMonitorVolume } = useAudioEffectState('your_live_id');
 * 
 * // 监听耳返音量变化
 * watch(earMonitorVolume, (newVolume) => {
 *   console.log('耳返音量:', newVolume);
 * });
 * 
 * // 获取当前耳返音量
 * const volume = earMonitorVolume.value;
 * console.log('当前耳返音量:', volume);
 */
const earMonitorVolume = ref<number>(0);

/**
 * 变声状态
 * @type {Ref<AudioChangerTypeParam>}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { audioChangerType } = useAudioEffectState('your_live_id');
 * 
 * // 监听变声类型变化
 * watch(audioChangerType, (newType) => {
 *   console.log('变声类型:', newType);
 * });
 * 
 * // 获取当前变声类型
 * const type = audioChangerType.value;
 * console.log('当前变声类型:', type);
 */
const audioChangerType = ref<AudioChangerTypeParam>('NONE');

/**
 * 混响状态
 * @type {Ref<AudioReverbTypeParam>}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { audioReverbType } = useAudioEffectState('your_live_id');
 * 
 * // 监听混响类型变化
 * watch(audioReverbType, (newType) => {
 *   console.log('混响类型:', newType);
 * });
 * 
 * // 获取当前混响类型
 * const type = audioReverbType.value;
 * console.log('当前混响类型:', type);
 */
const audioReverbType = ref<AudioReverbTypeParam>('NONE');

/**
 * 设置变声效果
 * @param {SetAudioChangerTypeOptions} params - 变声效果参数
 * @returns {void}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setAudioChangerType } = useAudioEffectState("your_live_id");
 * setAudioChangerType({ changerType: 'MAN' });
 */
function setAudioChangerType(params: SetAudioChangerTypeOptions): void {
    callUTSFunction("setAudioChangerType", params);
}

/**
 * 设置混响效果
 * @param {SetAudioReverbTypeOptions} params - 混响效果参数
 * @returns {void}
 * @memberof module:AudioEffectState 
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setAudioReverbType } = useAudioEffectState("your_live_id");
 * setAudioReverbType({ reverbType: 'KTV' });
 */
function setAudioReverbType(params: SetAudioReverbTypeOptions): void {
    callUTSFunction("setAudioReverbType", params);
}

/**
 * 设置耳返开关状态
 * @param {SetVoiceEarMonitorEnableOptions} params - 耳返开关参数
 * @returns {void}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setVoiceEarMonitorEnable } = useAudioEffectState("your_live_id");
 * setVoiceEarMonitorEnable({ enable: true });
 */
function setVoiceEarMonitorEnable(params: SetVoiceEarMonitorEnableOptions): void {
    callUTSFunction("setVoiceEarMonitorEnable", params);
}

/**
 * 设置耳返音量大小
 * @param {VolumeOptions} params - 耳返音量参数
 * @returns {void}
 * @memberof module:AudioEffectState 
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setVoiceEarMonitorVolume } = useAudioEffectState("your_live_id");
 * setVoiceEarMonitorVolume({ volume: 50 });
 */
function setVoiceEarMonitorVolume(params: VolumeOptions): void {
    callUTSFunction("setVoiceEarMonitorVolume", params);
}

const onAudioEffectStoreChanged = (eventName: string, res: string): void => {
    try {
        if (eventName === "isEarMonitorOpened") {
            const data = safeJsonParse<boolean>(res, false);
            isEarMonitorOpened.value = data;
        } else if (eventName === "earMonitorVolume") {
            const data = safeJsonParse<number>(res, 0);
            earMonitorVolume.value = data;
        } else if (eventName === "audioChangerType") {
            const typeCode = safeJsonParse<number>(res, -1);
            const type = mapChangerTypeCodeToChangerType(typeCode);

            if (type) {
                audioChangerType.value = type;
            } else {
                console.error(`Invalid changer type code received: ${typeCode}`);
            }
        } else if (eventName === "audioReverbType") {
            const typeCode = safeJsonParse<number>(res, -1);
            const type = mapReverbTypeCodeToReverbType(typeCode);

            if (type) {
                audioReverbType.value = type;
            } else {
                console.error(`Invalid reverb type code received: ${typeCode}`);
            }
        }
    } catch (error) {
        console.error("onAudioEffectStoreChanged error:", error);
    }
};
function mapChangerTypeCodeToChangerType(typeCode: number): AudioChangerTypeParam | null {
    const mappedType = CHANGER_TYPE_MAP[typeCode];
    if (mappedType === undefined) {
        console.warn(`Unknown changer type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

function mapReverbTypeCodeToReverbType(typeCode: number): AudioReverbTypeParam | null {
    const mappedType = REVERB_TYPE_MAP[typeCode];
    if (mappedType === undefined) {
        console.warn(`Unknown reverb type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

function bindEvent(liveID: string): void {
    getRTCRoomEngineManager().on("audioEffectStoreChanged", onAudioEffectStoreChanged, liveID);
}

export function useAudioEffectState(liveID: string) {
    bindEvent(liveID);

    return {
        audioChangerType,         // 变声状态
        audioReverbType,          // 混响状态
        isEarMonitorOpened,       // 耳返开关状态
        earMonitorVolume,         // 耳返音量大小

        setAudioChangerType,      // 设置变声效果
        setAudioReverbType,       // 设置混响效果
        setVoiceEarMonitorEnable, // 设置耳返开关
        setVoiceEarMonitorVolume, // 设置耳返音量
    };
}

export default useAudioEffectState;