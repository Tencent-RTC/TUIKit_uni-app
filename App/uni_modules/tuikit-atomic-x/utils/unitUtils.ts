const systemInfo = uni.getSystemInfoSync();
const screenWidth: number = systemInfo.screenWidth || 375;

export const rpxToPx = (rpx: number): number => {
    return (rpx / 750) * screenWidth;
};

export const pxToRpx = (px: number): number => {
    return Math.round((px / screenWidth) * 750);
};