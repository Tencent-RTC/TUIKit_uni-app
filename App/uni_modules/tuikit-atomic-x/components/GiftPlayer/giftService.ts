import { ref } from 'vue'
import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState'

type GiftData = {
  giftID ?: string
  name ?: string
  iconURL ?: string
  resourceURL ?: string
  coins ?: number
  [k : string] : any
}

export function giftService(params : {
  roomId : string
  giftPlayerRef : any
  giftToastRef ?: any
  autoHideMs ?: number
}) {
  const isGiftPlaying = ref(false)

  const showGift = async (giftData : GiftData, options ?: { onlyDisplay ?: boolean; isFromSelf ?: boolean }) => {
    if (!giftData) return
    const isFromSelf = !!options?.isFromSelf  // 是否为自送礼物（用户自己送的）

    // SVGA 类型
    if (giftData.gift.resourceURL !== "") {
      isGiftPlaying.value = true
      // 传递 isFromSelf 参数，用于队列优先级管理
      params.giftPlayerRef?.value?.playGift(giftData.gift, isFromSelf)
    }
  }

  const onGiftFinished = () => {
    isGiftPlaying.value = false
  }

  return {
    showGift,
    onGiftFinished,
    isGiftPlaying,
  }
}

/**
 * 下载文件并保存到自定义路径
 * @param {string} url - 文件网络地址
 * @return {Promise<string>} 返回文件本地绝对路径
 */
export function downloadAndSaveToPath(url : string) {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('下载失败'))
          return
        }
        let imageFilePath = ''
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: (res) => {
            imageFilePath = res.savedFilePath

            // 转换为本地文件系统 URL
            if (plus && plus.io && plus.io.convertLocalFileSystemURL) {
              imageFilePath = plus.io.convertLocalFileSystemURL(imageFilePath)
            }

            resolve(imageFilePath)
          },
          fail: (err) => {
            reject(new Error('保存文件失败'))
          },
        })
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}