/**
 * Vue2/Vue3 生命周期兼容工具
 * - Vue3: 使用 Composition API（onMounted / onUnmounted）
 * - Vue2: 动态解析，若无 Composition API 支持则返回 noop（由调用方主动释放）
 *
 * 实现要点：
 * - 静态 import 具名 API（onMounted/onUnmounted）——当前项目其它 state 文件已大量使用
 * - 同时 import 默认导出（Vue 构造器）——Vue2+composition-api 时也可能挂在上面
 * - 所有 API 都做 typeof 校验，两边都能安全运行
 */

// @ts-ignore
import Vue, { onMounted as _maybeOnMounted, onUnmounted as _maybeOnUnmounted } from 'vue';

const VueAny: any = Vue as any;
const _onMounted: any = _maybeOnMounted;
const _onUnmounted: any = _maybeOnUnmounted;

type LifecycleHook = (cb: () => void) => void;

function _resolveHook(name: 'onMounted' | 'onUnmounted'): LifecycleHook {
  const named = name === 'onMounted' ? _onMounted : _onUnmounted;
  if (typeof named === 'function') {
    return named as LifecycleHook;
  }
  if (VueAny && typeof VueAny[name] === 'function') {
    return VueAny[name] as LifecycleHook;
  }
  if (VueAny && VueAny.default && typeof VueAny.default[name] === 'function') {
    return VueAny.default[name] as LifecycleHook;
  }
  // Vue2 原生：noop
  return function (_cb: () => void) { /* no-op */ };
}

/**
 * 安全调用 onMounted：
 * - Vue3 / Vue2 + composition-api：走 Composition API
 * - Vue2 原生：noop，调用方需在 mounted() 生命周期里手动执行订阅逻辑
 */
export const tryOnMounted: LifecycleHook = _resolveHook('onMounted');

/**
 * 安全调用 onUnmounted：
 * - Vue3 / Vue2 + composition-api：走 Composition API
 * - Vue2 原生：noop，调用方需在 beforeDestroy/beforeUnmount 里手动调 destroy()
 */
export const tryOnUnmounted: LifecycleHook = _resolveHook('onUnmounted');

/**
 * 检测当前是否处于 Composition API 环境
 * - true：Vue3 或 Vue2+@vue/composition-api
 * - false：Vue2 原生 Options API
 */
export function hasCompositionAPI(): boolean {
  if (typeof _onMounted === 'function') return true;
  if (VueAny && typeof VueAny.onMounted === 'function') return true;
  if (VueAny && VueAny.default && typeof VueAny.default.onMounted === 'function') return true;
  return false;
}
