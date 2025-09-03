/**
 * 下载文件并保存到自定义路径
 * @param {string} url - 文件网络地址
 * @return {Promise<string>} 返回文件本地绝对路径
 */
export function downloadAndSaveToPath(url: string) {
  return new Promise((resolve, reject) => {
    // 1. 下载文件
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error("下载失败"));
          return;
        }
        
        let imageFilePath = '';
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: (res) => {
            console.warn('保存文件成功 = ', JSON.stringify(res)); // 获取的是相对路径
            imageFilePath = res.savedFilePath;
            imageFilePath = plus.io.convertLocalFileSystemURL(imageFilePath); // 转绝对路径
            
            resolve(imageFilePath);
          },
          fail: (err) => {
            reject(new Error(`保存文件失败`))
          },
        });
      },
      fail: (err) => reject(err),
    });
  });
}
