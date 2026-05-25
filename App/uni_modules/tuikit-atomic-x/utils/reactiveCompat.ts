/**
 * Vue2/Vue3 响应式兼容工具
 * - Vue2: 使用 Vue.observable()
 * - Vue3: 使用 reactive() / ref()
 *
 * 实现要点：
 * - 静态 import 具名 API（ref/reactive）——当前项目其它 state 文件已大量使用，
 *   HBuilderX 对缺失导出会在编译期警告但不阻断，运行时若拿到 undefined 也不影响我们的探测
 * - 同时 import 默认导出（Vue 构造器）——Vue2 下用于访问 Vue.observable
 * - 所有 API 都做 typeof 校验，两边都能安全运行
 */

// @ts-ignore
import Vue, { ref as _maybeRef, reactive as _maybeReactive } from 'vue';

const VueAny: any = Vue as any;
const _ref: any = _maybeRef;
const _reactive: any = _maybeReactive;

function _resolveReactive(): <T extends object>(obj: T) => T {
  // Vue3: 使用 named import 拿到的 reactive
  if (typeof _reactive === 'function') {
    return _reactive;
  }
  // Vue3: 默认导出对象上也挂有（uni-app 构建产物实测可用）
  if (VueAny && typeof VueAny.reactive === 'function') {
    return VueAny.reactive;
  }
  // Vue2: Vue.observable 静态方法
  if (VueAny && typeof VueAny.observable === 'function') {
    return VueAny.observable.bind(VueAny);
  }
  // fallback（不会走到）
  return function <T extends object>(obj: T): T { return obj; };
}

const _makeReactive = _resolveReactive();

/**
 * 创建响应式对象（Vue2/Vue3 通用）
 */
export function makeReactive<T extends object>(obj: T): T {
  return _makeReactive(obj);
}

/**
 * 统一的 Ref 接口（Vue2/Vue3 通用）
 * - Vue3：ref() 返回的 Ref<T>
 * - Vue2：一个对 makeReactive({ value: T }) 的包装，.value 同样具备响应式
 */
export interface CompatRef<T> {
  value: T;
}

/**
 * 创建 Ref（Vue3 原生 ref / Vue2 用 observable 模拟 .value 访问器）
 * - Vue3: 返回真正的 Ref<T>，可被 watch(ref, ...) / unref / isRef 等 API 识别
 * - Vue2: 返回 observable 包装的 { value } 对象，访问 .value 会触发依赖追踪
 */
export function makeRef<T>(initial: T): CompatRef<T> {
  // Vue3: named import 拿到的 ref
  if (typeof _ref === 'function') {
    return _ref(initial);
  }
  // Vue3: default 上的 ref
  if (VueAny && typeof VueAny.ref === 'function') {
    return VueAny.ref(initial);
  }
  // Vue2: 用 observable 包装 { value } 对象
  return makeReactive<{ value: T }>({ value: initial });
}
