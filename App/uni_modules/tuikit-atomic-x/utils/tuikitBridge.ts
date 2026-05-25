/**
 * UTS 插件安全桥接层
 * 当 UTS 插件编译失败时提供空实现，防止整个应用崩溃
 */

// @ts-ignore
import * as plugin from '@/uni_modules/tuikit-atomic-x';

const _callAPI = plugin && plugin.callAPI;
const _addListener = plugin && plugin.addListener;
const _removeListener = plugin && plugin.removeListener;
const _reportUIPlatform = plugin && plugin.reportUIPlatform;
const _pluginReady = typeof _callAPI === 'function';

if (!_pluginReady) {
  console.warn('[tuikit-bridge] UTS 插件未就绪，使用空实现');
}

function noop(..._args: any[]): void {}
function noopCallback(_json: string, callback?: (res: string) => void): void {
  if (callback) {
    callback(JSON.stringify({ code: -1, message: 'UTS plugin not available' }));
  }
}

export const callAPI: (json: string, callback: (res: string) => void) => void =
  _pluginReady && _callAPI ? _callAPI : noopCallback;

export const addListener: (options: any, callback: (data: string) => void) => void =
  _pluginReady && _addListener ? _addListener : noop;

export const removeListener: (options: any) => void =
  _pluginReady && _removeListener ? _removeListener : noop;

export const reportUIPlatform: () => void =
  _pluginReady && _reportUIPlatform ? _reportUIPlatform : noop;

// ========== CallState 需要的原生能力 ==========
const _setVirtualBackground = plugin && plugin.setVirtualBackground;
const _startFloatView = plugin && plugin.startFloatView;
const _stopFloatView = plugin && plugin.stopFloatView;
const _addFloatViewListener = plugin && plugin.addFloatViewListener;
const _removeFloatViewListener = plugin && plugin.removeFloatViewListener;
const _startVibrating = plugin && plugin.startVibrating;
const _stopVibrating = plugin && plugin.stopVibrating;
const _enableMultiDeviceAbility = plugin && plugin.enableMultiDeviceAbility;
const _startForegroundService = plugin && plugin.startForegroundService;
const _stopForegroundService = plugin && plugin.stopForegroundService;
const _setCallFramework = plugin && plugin.setCallFramework;

export const setVirtualBackground: (enable: boolean) => void =
  _pluginReady && _setVirtualBackground ? _setVirtualBackground : noop;
export const startFloatView: (options: string, callback?: (code: number, message: string) => void) => void =
  _pluginReady && _startFloatView ? _startFloatView : noop;
export const stopFloatView: () => void =
  _pluginReady && _stopFloatView ? _stopFloatView : noop;
export const addFloatViewListener: (click: () => void) => void =
  _pluginReady && _addFloatViewListener ? _addFloatViewListener : noop;
export const removeFloatViewListener: () => void =
  _pluginReady && _removeFloatViewListener ? _removeFloatViewListener : noop;
export const startVibrating: () => void =
  _pluginReady && _startVibrating ? _startVibrating : noop;
export const stopVibrating: () => void =
  _pluginReady && _stopVibrating ? _stopVibrating : noop;
export const enableMultiDeviceAbility: (enable: boolean) => void =
  _pluginReady && _enableMultiDeviceAbility ? _enableMultiDeviceAbility : noop;
export const startForegroundService: (...args: any[]) => void =
  _pluginReady && _startForegroundService ? _startForegroundService : noop;
export const stopForegroundService: (...args: any[]) => void =
  _pluginReady && _stopForegroundService ? _stopForegroundService : noop;
export const setCallFramework: (framework: number) => void =
  _pluginReady && _setCallFramework ? _setCallFramework : noop;

export const isPluginReady = (): boolean => _pluginReady;

/** HybridCallOptions 类型（从 UTS 接口复制） */
export type HybridCallOptions = {
  api: string;
  params: Record<string, any>;
};

export type HybridResponseData<T = any> = {
  code: number;
  message?: string;
  data?: T;
};
