/**
 * Toast 工具模块
 * 基于 plus.nativeUI.toast 实现自定义样式的 Toast 提示
 */

const ICON_BASE = '/uni_modules/tuikit-atomic-x/static/icon/';

// 内置图标
const ICONS: Record<string, string> = {
  success: ICON_BASE + 'success-icon.png',
  error: ICON_BASE + 'error-icon.png'
};

declare const plus: any;

export type ToastType = 'none' | 'success' | 'error';

export interface ToastOptions {
  /** 提示消息 */
  message: string;
  /** Toast 类型：none | success | error，默认 none */
  type?: ToastType;
  /** 自定义图标路径，支持本地路径、网络URL、base64（优先级高于 type） */
  icon?: string;
  /** 显示时长：short 短 | long 长，默认 short */
  duration?: 'short' | 'long';
  /** 垂直位置：top | center | bottom，默认 center */
  verticalAlign?: 'top' | 'center' | 'bottom';
}

/**
 * 显示 Toast 提示
 * @param options Toast 配置或消息字符串
 * @example
 * // 成功提示
 * showToast({ message: '操作成功', type: 'success' });
 * 
 * // 错误提示
 * showToast({ message: '操作失败', type: 'error' });
 * 
 * // 自定义图标（优先级高于 type）
 * showToast({ message: '自定义提示', icon: '/static/my-icon.png' });
 * 
 * // 简单调用（无图标）
 * showToast('操作成功');
 */
export function showToast(options: ToastOptions | string): void {
  const opts: ToastOptions = typeof options === 'string' 
    ? { message: options } 
    : options;

  const {
    message,
    type = 'none',
    icon,
    duration = 'short',
    verticalAlign = 'center'
  } = opts;

  // 确定最终使用的图标：自定义 icon > type 对应的内置图标 > 无图标
  const finalIcon = icon || (type !== 'none' ? ICONS[type] : undefined);

  // 使用 plus.nativeUI.toast
  if (typeof plus !== 'undefined' && plus.nativeUI) {
    const toastOptions: any = {
      duration: duration,
      align: 'center',
      verticalAlign: verticalAlign,
      style: 'inline',
    };

    // 仅在有图标时添加图标相关配置
    if (finalIcon) {
      toastOptions.icon = finalIcon;
      toastOptions.iconWidth = '20px';
      toastOptions.iconHeight = '20px';
    }

    plus.nativeUI.toast(message, toastOptions);
  } else {
    // 降级使用 uni.showToast（uni-app 标准 icon 仅支持 success/error/none/loading）
    const uniIcon: 'success' | 'error' | 'none' = type === 'success' ? 'success' : (type === 'error' ? 'error' : 'none');
    uni.showToast({
      title: message,
      icon: uniIcon,
      duration: duration === 'short' ? 2000 : 3500
    });
  }
}

export default {
  show: showToast
};
