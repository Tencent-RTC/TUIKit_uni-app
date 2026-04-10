/**
 * @module AudioEffectState
 * @module_description
 * 音效设置管理模块
 * 核心功能：提供变声、混响、耳返等高级音效功能，支持多种音效效果和实时音效调节。
 * 技术特点：基于音频处理算法，支持实时音效处理、低延迟音频传输、音质优化等高级技术。
 * 业务价值：为直播平台提供差异化的音效体验，增强用户参与度和直播趣味性。
 * 应用场景：变声直播、K歌直播、音效娱乐、专业音效等需要音频处理的场景。
 */
import { ref, watch } from "vue";
import {
  callAPI, addListener, removeListener
} from "@/uni_modules/tuikit-atomic-x";
import { currentLive } from "./LiveListState";
import { VolumeOptions } from "./DeviceState";
import { safeJsonParse } from "../utils/utsUtils";

/**
 * 音频变声效果
 * @remarks
 * 可用值：
 * - `NONE`: 0，无效果
 * - `CHILD`: 1，小孩
 * - `LITTLE_GIRL`: 2，小女孩
 * - `MAN`: 3，男人
 * - `HEAVY_METAL`: 4，重金属
 * - `COLD`: 5，冷酷
 * - `FOREIGNER`: 6，外国人
 * - `TRAPPED_BEAST`: 7，野兽
 * - `FATSO`: 8，胖子
 * - `STRONG_CURRENT`: 9，电流
 * - `HEAVY_MACHINERY`: 10，机械
 * - `ETHEREAL`: 11，空灵
 */
export enum AudioChangerType {
  NONE = 0,
  CHILD = 1,
  LITTLE_GIRL = 2,
  MAN = 3,
  HEAVY_METAL = 4,
  COLD = 5,
  FOREIGNER = 6,
  TRAPPED_BEAST = 7,
  FATSO = 8,
  STRONG_CURRENT = 9,
  HEAVY_MACHINERY = 10,
  ETHEREAL = 11,
}

/**
 * 音频混响效果
 * @remarks
 * 可用值：
 * - `NONE`: 0，无效果
 * - `KTV`: 1，KTV
 * - `SMALL_ROOM`: 2，小房间
 * - `AUDITORIUM`: 3，礼堂
 * - `DEEP`: 4，深沉
 * - `LOUD`: 5，洪亮
 * - `METALLIC`: 6，金属
 * - `MAGNETIC`: 7，磁性
 */
export enum AudioReverbType {
  NONE = 0,
  KTV = 1,
  SMALL_ROOM = 2,
  AUDITORIUM = 3,
  DEEP = 4,
  LOUD = 5,
  METALLIC = 6,
  MAGNETIC = 7,
}

/**
 * 设置音频变声器类型参数
 * @interface SetAudioChangerTypeOptions
 */
export type SetAudioChangerTypeOptions = {
  changerType: AudioChangerType;
}

/**
 * 设置音频混响类型参数
 * @interface SetAudioReverbTypeOptions
 */
export type SetAudioReverbTypeOptions = {
  reverbType: AudioReverbType;
}

/**
 * 设置语音耳返开关参数
 * @interface SetVoiceEarMonitorEnableOptions
 */
export type SetVoiceEarMonitorEnableOptions = {
  enable: boolean;
}

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
const earMonitorVolume = ref<number>(100);

/**
 * 变声状态
 * @type {Ref<AudioChangerType>}
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
const audioChangerType = ref<AudioChangerType>(AudioChangerType.NONE); // 底层返回 number，与枚举值对应

/**
 * 混响状态
 * @type {Ref<AudioReverbType>}
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
const audioReverbType = ref<AudioReverbType>(AudioReverbType.NONE);

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
  callAPI(JSON.stringify({
    api: "setAudioChangerType",
    params: { changerType: params.changerType }
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "setAudioReverbType",
    params: { reverbType: params.reverbType }
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "setVoiceEarMonitorEnable",
    params: params
  }), () => { });
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
  callAPI(JSON.stringify({
    api: "setVoiceEarMonitorVolume",
    params: params
  }), () => { });
}

const BINDABLE_DATA_NAMES = [
  "isEarMonitorOpened",
  "earMonitorVolume",
  "audioChangerType",
  "audioReverbType",
] as const;

let boundLiveID: string | null = null;

function bindEvent(liveID: string): void {
  if (boundLiveID === liveID) {
    return;
  }
  if (boundLiveID) {
    unbindEvent(boundLiveID);
  }
  boundLiveID = liveID;

  BINDABLE_DATA_NAMES.forEach(dataName => {
    addListener({
      type: "state",
      store: "AudioEffectStore",
      name: dataName,
      params: {}
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[audioEffect][${dataName}] Data:`, result);
        onAudioEffectStoreChanged[dataName]?.(result);
      } catch (error) {
        console.error(`[audioEffect][${dataName}] Error:`, error);
      }
    });
  });
}

function unbindEvent(liveID: string): void {
  BINDABLE_DATA_NAMES.forEach(dataName => {
    removeListener({
      type: "state",
      store: "AudioEffectStore",
      name: dataName,
      params: {}
    });
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

const onAudioEffectStoreChanged: Record<string, (result: any) => void> = {
  isEarMonitorOpened: (res) => {
    isEarMonitorOpened.value = safeJsonParse<boolean>(res.isEarMonitorOpened, false);
  },
  earMonitorVolume: (res) => {
    earMonitorVolume.value = safeJsonParse<number>(res.earMonitorVolume, 100);
  },
  audioChangerType: (res) => {
    audioChangerType.value = safeJsonParse<AudioChangerType>(res.audioChangerType, AudioChangerType.NONE);
  },
  audioReverbType: (res) => {
    audioReverbType.value = safeJsonParse<AudioReverbType>(res.audioReverbType, AudioReverbType.NONE);
  },
};

export function useAudioEffectState(liveID: string) {
  bindEvent(liveID);
  ensureWatchCurrentLive();

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