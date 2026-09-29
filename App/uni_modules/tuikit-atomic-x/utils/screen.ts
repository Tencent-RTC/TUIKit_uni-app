/**
 * 屏幕尺寸工具：获取屏幕宽高（px/rpx），用于根据屏幕尺寸设置 drawer 等组件的高度。
 * nvue 不支持 vh/vw 单位，需通过 uni.getSystemInfo 获取像素后自行换算 rpx。
 * rpx 换算基准：750rpx = 屏幕宽度 px。
 */

interface ScreenSizeInfo {
  /** 屏幕宽度 px */
  widthPx: number;
  /** 屏幕高度 px */
  heightPx: number;
  /** 屏幕宽度 rpx（恒为 750） */
  widthRpx: number;
  /** 屏幕高度 rpx */
  heightRpx: number;
}

// uni-app 全局对象在独立 ts 文件里无类型声明，需显式声明。
declare const uni: any;

let cached: ScreenSizeInfo | null = null;

/**
 * 同步获取缓存的屏幕尺寸信息（若已调用过 getScreenSizeAsync 则返回缓存值，否则返回默认值）。
 */
function getScreenSize(): ScreenSizeInfo {
  if (cached) return cached;
  return {
    widthPx: 375,
    heightPx: 812,
    widthRpx: 750,
    heightRpx: 1624,
  };
}

/**
 * 异步获取屏幕尺寸信息并缓存，首次调用后后续 getScreenSize 同步可用。
 */
async function getScreenSizeAsync(): Promise<ScreenSizeInfo> {
  if (cached) return cached;
  try {
    const info = await uni.getSystemInfo();
    const widthPx = info.windowWidth || info.screenWidth || 375;
    const heightPx = info.windowHeight || info.screenHeight || 812;
    const heightRpx = Math.round(heightPx * 750 / widthPx);
    cached = {
      widthPx,
      heightPx,
      widthRpx: 750,
      heightRpx,
    };
    return cached;
  } catch (_) {
    return getScreenSize();
  }
}

/**
 * 将屏幕高度百分比换算为 rpx。例如传入 0.5 返回屏幕高度 50% 对应的 rpx。
 * 需先调用 getScreenSizeAsync 初始化缓存，否则用默认尺寸计算。
 */
function heightPercentToRpx(percent: number): number {
  const size = getScreenSize();
  return Math.round(size.heightRpx * percent);
}

export { getScreenSize, getScreenSizeAsync, heightPercentToRpx };
export type { ScreenSizeInfo };
