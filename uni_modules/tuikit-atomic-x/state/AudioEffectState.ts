/**
 * 音频效果状态管理模块
 * @module AudioEffectState
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
const CHANGER_TYPE_MAP : Record<number, AudioChangerTypeParam> = {
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
const REVERB_TYPE_MAP : Record<number, AudioReverbTypeParam> = {
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
 * @internal
 */
const isEarMonitorOpened = ref<boolean>(false);

/**
 * 耳返音量大小
 * @internal
 */
const earMonitorVolume = ref<number>(0);

/**
 * 当前变声器类型
 * @internal
 */
const changerType = ref<AudioChangerTypeParam>('NONE');

/**
 * 当前混响类型
 * @internal
 */
const reverbType = ref<AudioReverbTypeParam>('NONE');

/**
 * 设置变声器类型
 * @param {SetAudioChangerTypeOptions} params - 变声器类型参数
 * @returns {void}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setAudioChangerType } = useAudioEffectState("your_live_id");
 * setAudioChangerType({ changerType: 'MAN' });
 */
function setAudioChangerType(params : SetAudioChangerTypeOptions) : void {
    callUTSFunction("setAudioChangerType", params);
}

/**
 * 设置混响类型
 * @param {SetAudioReverbTypeOptions} params - 混响类型参数
 * @returns {void}
 * @memberof module:AudioEffectState 
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setAudioReverbType } = useAudioEffectState("your_live_id");
 * setAudioReverbType({ reverbType: 'KTV' });
 */
function setAudioReverbType(params : SetAudioReverbTypeOptions) : void {
    callUTSFunction("setAudioReverbType", params);
}

/**
 * 设置语音耳返开关
 * @param {SetVoiceEarMonitorEnableOptions} params - 耳返开关参数
 * @returns {void}
 * @memberof module:AudioEffectState
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setVoiceEarMonitorEnable } = useAudioEffectState("your_live_id");
 * setVoiceEarMonitorEnable({ enable: true });
 */
function setVoiceEarMonitorEnable(params : SetVoiceEarMonitorEnableOptions) : void {
    callUTSFunction("setVoiceEarMonitorEnable", params);
}

/**
 * 设置语音耳返音量
 * @param {VolumeOptions} params - 耳返音量参数
 * @returns {void}
 * @memberof module:AudioEffectState 
 * @example
 * import { useAudioEffectState } from '@/uni_modules/tuikit-atomic-x/state/AudioEffectState';
 * const { setVoiceEarMonitorVolume } = useAudioEffectState("your_live_id");
 * setVoiceEarMonitorVolume({ volume: 50 });
 */
function setVoiceEarMonitorVolume(params : VolumeOptions) : void {
    callUTSFunction("setVoiceEarMonitorVolume", params);
}

const onAudioEffectStoreChanged = (eventName : string, res : string) : void => {
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
                changerType.value = type;
            } else {
                console.error(`Invalid changer type code received: ${typeCode}`);
            }
        } else if (eventName === "audioReverbType") {
            const typeCode = safeJsonParse<number>(res, -1);
            const type = mapReverbTypeCodeToReverbType(typeCode);

            if (type) {
                reverbType.value = type;
            } else {
                console.error(`Invalid reverb type code received: ${typeCode}`);
            }
        }
    } catch (error) {
        console.error("onAudioEffectStoreChanged error:", error);
    }
};
function mapChangerTypeCodeToChangerType(typeCode : number) : AudioChangerTypeParam | null {
    const mappedType = CHANGER_TYPE_MAP[typeCode];
    if (mappedType === undefined) {
        console.warn(`Unknown changer type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

function mapReverbTypeCodeToReverbType(typeCode : number) : AudioReverbTypeParam | null {
    const mappedType = REVERB_TYPE_MAP[typeCode];
    if (mappedType === undefined) {
        console.warn(`Unknown reverb type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

function bindEvent(liveID : string) : void {
    getRTCRoomEngineManager().on("audioEffectStoreChanged", onAudioEffectStoreChanged, liveID);
}

export function useAudioEffectState(liveID : string) {
    bindEvent(liveID);

    return {
        changerType,              // 当前变声器类型
        reverbType,               // 当前混响类型
        isEarMonitorOpened,       // 耳返开关状态
        earMonitorVolume,         // 耳返音量大小
        setAudioChangerType,      // 设置变声器类型
        setAudioReverbType,       // 设置混响类型
        setVoiceEarMonitorEnable, // 设置耳返开关
        setVoiceEarMonitorVolume, // 设置耳返音量
    };
}

export default useAudioEffectState;