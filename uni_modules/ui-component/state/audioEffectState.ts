import { ref } from "vue";
import {
    SetVoiceEarMonitorEnableOptions,
    SetVoiceEarMonitorVolumeOptions,
    SetMicrophoneVolumeOptions,
    SetChangerTypeOptions,
    SetReverbTypeOptions,
} from "@/uni_modules/ui-component";
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// ============== 导出的枚举类型定义 ==============

/**
 * 变声器类型码枚举
 * 对应底层SDK返回的数字状态码
 */
export const ChangerTypeCode = {
    NONE: 0,
    CHILD: 1,
    LITTLE_GIRL: 2,
    MAN: 3,
    HEAVY_METAL: 4,
    COLD: 5,
    FOREIGNER: 6,
    TRAPPED_BEAST: 7,
    FATSO: 8,
    STRONG_CURRENT: 9,
    HEAVY_MACHINERY: 10,
    ETHEREAL: 11,
} as const;

/**
 * 变声器类型码类型
 */
export type ChangerTypeCodeType = typeof ChangerTypeCode[keyof typeof ChangerTypeCode];

/**
 * 变声器类型枚举常量
 * 对应变声器类型的字符串值
 */
export const ChangerType = {
    NONE: 'NONE',
    CHILD: 'CHILD',
    LITTLE_GIRL: 'LITTLE_GIRL',
    MAN: 'MAN',
    HEAVY_METAL: 'HEAVY_METAL',
    COLD: 'COLD',
    FOREIGNER: 'FOREIGNER',
    TRAPPED_BEAST: 'TRAPPED_BEAST',
    FATSO: 'FATSO',
    STRONG_CURRENT: 'STRONG_CURRENT',
    HEAVY_MACHINERY: 'HEAVY_MACHINERY',
    ETHEREAL: 'ETHEREAL',
} as const;

/**
 * 变声器类型
 */
export type ChangerTypeType = typeof ChangerType[keyof typeof ChangerType];

/**
 * 混响类型码枚举
 * 对应底层SDK返回的数字状态码
 */
export const ReverbTypeCode = {
    NONE: 0,
    KTV: 1,
    SMALL_ROOM: 2,
    AUDITORIUM: 3,
    DEEP: 4,
    LOUD: 5,
    METALLIC: 6,
    MAGNETIC: 7,
} as const;

/**
 * 混响类型码类型
 */
export type ReverbTypeCodeType = typeof ReverbTypeCode[keyof typeof ReverbTypeCode];

/**
 * 混响类型枚举常量
 * 对应混响类型的字符串值
 */
export const ReverbType = {
    NONE: 'NONE',
    KTV: 'KTV',
    SMALL_ROOM: 'SMALL_ROOM',
    AUDITORIUM: 'AUDITORIUM',
    DEEP: 'DEEP',
    LOUD: 'LOUD',
    METALLIC: 'METALLIC',
    MAGNETIC: 'MAGNETIC',
} as const;

/**
 * 混响类型
 */
export type ReverbTypeType = typeof ReverbType[keyof typeof ReverbType];

/**
 * 变声器类型码到变声器类型的映射
 */
const CHANGER_TYPE_MAP: Record<ChangerTypeCodeType, ChangerTypeType> = {
    [ChangerTypeCode.NONE]: ChangerType.NONE,
    [ChangerTypeCode.CHILD]: ChangerType.CHILD,
    [ChangerTypeCode.LITTLE_GIRL]: ChangerType.LITTLE_GIRL,
    [ChangerTypeCode.MAN]: ChangerType.MAN,
    [ChangerTypeCode.HEAVY_METAL]: ChangerType.HEAVY_METAL,
    [ChangerTypeCode.COLD]: ChangerType.COLD,
    [ChangerTypeCode.FOREIGNER]: ChangerType.FOREIGNER,
    [ChangerTypeCode.TRAPPED_BEAST]: ChangerType.TRAPPED_BEAST,
    [ChangerTypeCode.FATSO]: ChangerType.FATSO,
    [ChangerTypeCode.STRONG_CURRENT]: ChangerType.STRONG_CURRENT,
    [ChangerTypeCode.HEAVY_MACHINERY]: ChangerType.HEAVY_MACHINERY,
    [ChangerTypeCode.ETHEREAL]: ChangerType.ETHEREAL,
} as const;

/**
 * 混响类型码到混响类型的映射
 */
const REVERB_TYPE_MAP: Record<ReverbTypeCodeType, ReverbTypeType> = {
    [ReverbTypeCode.NONE]: ReverbType.NONE,
    [ReverbTypeCode.KTV]: ReverbType.KTV,
    [ReverbTypeCode.SMALL_ROOM]: ReverbType.SMALL_ROOM,
    [ReverbTypeCode.AUDITORIUM]: ReverbType.AUDITORIUM,
    [ReverbTypeCode.DEEP]: ReverbType.DEEP,
    [ReverbTypeCode.LOUD]: ReverbType.LOUD,
    [ReverbTypeCode.METALLIC]: ReverbType.METALLIC,
    [ReverbTypeCode.MAGNETIC]: ReverbType.MAGNETIC,
} as const;

// ============== 响应式状态定义 ==============

const isEarMonitorOpened = ref<boolean>(false);
const earMonitorVolume = ref<number>(0);
const microphoneVolume = ref<number>(0);
const changerType = ref<ChangerTypeType>(ChangerType.NONE);
const reverbType = ref<ReverbTypeType>(ReverbType.NONE);

// ============== 工具函数 ==============

/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
function callUTSFunction(funcName: string, args?: any): void {
    const defaultCallback = {
        success: (result: string) => {
            console.log(`AudioEffectStoreChanged.${funcName} success:`, result);
        },
        fail: (errCode: number, errMsg: string) => {
            console.error(`AudioEffectStoreChanged.${funcName} failed:`, errCode, errMsg);
        },
    };

    const finalArgs = args ? { ...args, ...defaultCallback } : defaultCallback;

    try {
        getV2RTCRoomEngineManager()[funcName](finalArgs);
    } catch (error) {
        console.error(`AudioEffectStoreChanged.${funcName} error:`, error);
    }
}

/**
 * 安全的JSON解析函数
 * @param jsonString JSON字符串
 * @param defaultValue 解析失败时的默认值
 */
function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("JSON parse error:", error);
        return defaultValue;
    }
}

/**
 * 将变声器类型码转换为变声器类型
 * @param typeCode 类型码
 */
function mapChangerTypeCodeToChangerType(typeCode: number): ChangerTypeType | null {
    const mappedType = CHANGER_TYPE_MAP[typeCode as ChangerTypeCodeType];
    if (!mappedType) {
        console.warn(`Unknown changer type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

/**
 * 将混响类型码转换为混响类型
 * @param typeCode 类型码
 */
function mapReverbTypeCodeToReverbType(typeCode: number): ReverbTypeType | null {
    const mappedType = REVERB_TYPE_MAP[typeCode as ReverbTypeCodeType];
    if (!mappedType) {
        console.warn(`Unknown reverb type code: ${typeCode}`);
        return null;
    }
    return mappedType;
}

// ============== 业务方法封装 ==============

/**
 * 设置语音耳返开关
 * @param params 耳返开关参数
 */
function setVoiceEarMonitorEnable(params: SetVoiceEarMonitorEnableOptions): void {
    callUTSFunction("setVoiceEarMonitorEnable", params);
}

/**
 * 设置语音耳返音量
 * @param params 耳返音量参数
 */
function setVoiceEarMonitorVolume(params: SetVoiceEarMonitorVolumeOptions): void {
    callUTSFunction("setVoiceEarMonitorVolume", params);
}

/**
 * 设置麦克风音量
 * @param params 麦克风音量参数
 */
function setMicrophoneVolume(params: SetMicrophoneVolumeOptions): void {
    callUTSFunction("setMicrophoneVolume", params);
}

/**
 * 设置变声器类型
 * @param params 变声器类型参数
 */
function setChangerType(params: SetChangerTypeOptions): void {
    callUTSFunction("setChangerType", params);
}

/**
 * 设置混响类型
 * @param params 混响类型参数
 */
function setReverbType(params: SetReverbTypeOptions): void {
    callUTSFunction("setReverbType", params);
}

// ============== 事件处理 ==============

/**
 * 音频效果状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onAudioEffectStoreChanged = (eventName: string, res: string): void => {
    try {
        if (eventName === "isEarMonitorOpened") {
            const data = safeJsonParse<boolean>(res, false);
            isEarMonitorOpened.value = data;
        } else if (eventName === "earMonitorVolume") {
            const data = safeJsonParse<number>(res, 0);
            earMonitorVolume.value = data;
        } else if (eventName === "microphoneVolume") {
            const data = safeJsonParse<number>(res, 0);
            microphoneVolume.value = data;
        } else if (eventName === "changerType") {
            const typeCode = safeJsonParse<number>(res, -1);
            const type = mapChangerTypeCodeToChangerType(typeCode);

            if (type) {
                changerType.value = type;
            } else {
                console.error(`Invalid changer type code received: ${typeCode}`);
            }
        } else if (eventName === "reverbType") {
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

/**
 * 绑定事件监听
 * @param liveId 直播间ID
 */
function bindEvent(liveId: string): void {
    getV2RTCRoomEngineManager().on(
        "audioEffectStoreChanged",
        onAudioEffectStoreChanged,
        liveId
    );
}

// ============== Composition API 导出 ==============

/**
 * 音频效果状态管理的Composition API
 * @param liveId 直播间ID
 */
export function useAudioEffectState(liveId: string) {
    bindEvent(liveId);

    return {
        // 响应式状态
        isEarMonitorOpened,
        earMonitorVolume,
        microphoneVolume,
        changerType,
        reverbType,

        // 操作方法
        setVoiceEarMonitorEnable,
        setVoiceEarMonitorVolume,
        setMicrophoneVolume,
        setChangerType,
        setReverbType,

        // 工具方法
        callUTSFunction,
    };
}

export default useAudioEffectState;
