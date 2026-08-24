/**
 * Toast 组件导出
 *
 * 用法示例:
 *   // 声明式
 *   <Toast v-model:visible="visible" :message="msg" type="success" />
 *
 *   // 通过 ref 调用 close
 *   const toastRef = ref()
 *   toastRef.value?.close()
 *
 *   // 类型导出
 *   import type { ToastType, ToastVerticalAlign } from '@/uni_modules/tuikit-atomic-x/components/Toast'
 */

export { default } from './Toast.nvue'
export type { ToastType, ToastVerticalAlign } from './Toast.nvue'
