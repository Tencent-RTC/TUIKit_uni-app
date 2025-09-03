// interface ISystemInfo = {
//   safeArea: {
//     width: number;
//   }
// }

let systemInfo = {};

const standardWidth: number = 750; // uni-app 规定屏幕基准宽度 750rpx。ref: https://uniapp.dcloud.net.cn/tutorial/syntax-css.html
let standardHeight: number = standardWidth * (16 / 9); // 默认使用 9:16
let deviceWidthRatio: number = 1;
let devicePixelRatio: number = 2;


async function initConstants() {
  return new Promise((resolve, reject) => {
    uni?.getSystemInfo({
      success: (res) => {
        systemInfo = res || {};
        deviceWidthRatio = standardWidth / res.windowWidth;
        console.log(`systemInfo: ${JSON.stringify(systemInfo)}, deviceWidthRatio: ${deviceWidthRatio}`);
        
        resolve(systemInfo);
      },
      fail: (error) => {
        console.error(`getSystemInfo fail: ${JSON.stringify(error)}`);
        reject({});
      },
    });
  });
}

async function getSystemInfo() {
  if (Object.keys(systemInfo).length === 0){
    await initConstants();
  }
  return systemInfo;
}


function calculateScale(originalWidth: number, originalHeight: number, displayWidth: number, displayHeight: number) {
  // 等比缩放（以宽度或高度中较小的比例为准）
  const scaleX = displayWidth / originalWidth;
  const scaleY = displayHeight / originalHeight;
  
  return { scaleX, scaleY }; // 确保不变形
}

export {
  deviceWidthRatio,
  
  initConstants,
  getSystemInfo,
  
  calculateScale,
};
