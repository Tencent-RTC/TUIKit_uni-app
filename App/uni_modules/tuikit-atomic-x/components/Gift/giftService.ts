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

  const showGift = async (giftData : GiftData, options ?: { onlyDisplay ?: boolean; isFromSelf ?: boolean; count ?: number }) => {
    if (!giftData) return
    const isFromSelf = !!options?.isFromSelf
    const count = Math.max(1, Math.floor(Number(options?.count) || 1))

    if (giftData.gift.resourceURL !== "") {
      isGiftPlaying.value = true
      // 传递 isFromSelf 参数，用于队列优先级管理。
      // 兼容两种持有方式：pusher 端直接传 ref 对象（取 .value）；
      // 观众端经 GiftLayer 透传时传普通容器对象（取 .current，避免 iOS nvue 把 ref 对象当 prop 透传时解包丢失）。
      const playerInst = params.giftPlayerRef && (params.giftPlayerRef.value || params.giftPlayerRef.current);
      playerInst?.playGift?.(giftData.gift, isFromSelf, count);
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

/**
 * 生成礼物 SVGA 缓存 key。GiftPicker 预下载与 GiftPlayer 播放必须用同一份规则，否则缓存命中失败。
 * 规则：{giftID}-{urlFileName || nameFallback}
 */
export function buildGiftCacheKey(resourceURL : string, name : string, giftID : string | number) : string {
  const giftIdStr = String(giftID || '')
  let urlHash = ''
  try {
    const urlObj = new URL(resourceURL)
    const fileName = (urlObj.pathname.split('/').pop() || '').replace(/\.(svga|SVGA)$/, '')
    urlHash = fileName
  } catch (_) {
    urlHash = resourceURL.substring(resourceURL.lastIndexOf('/') + 1).replace(/\.(svga|SVGA)$/i, '')
  }
  const fallbackName = (name || '').replace(/\s+/g, '').substring(0, 10)
  return `${giftIdStr}-${(urlHash || fallbackName)}`
}

/**
 * 预下载单个礼物 SVGA 资源（未缓存则下载并写入 plus.storage；已缓存则立即返回）。
 */
export async function preloadGiftAnimation(giftData : GiftData) : Promise<void> {
  const resourceURL = String(giftData.resourceURL || '')
  if (!resourceURL) return
  const cacheKey = buildGiftCacheKey(resourceURL, String(giftData.name || ''), giftData.giftID || 0)
  try {
    const cached = plus?.storage?.getItem(cacheKey)
    if (cached && !cached.startsWith('http://') && !cached.startsWith('https://')) return
    const filePath = await downloadAndSaveToPath(resourceURL) as string
    if (filePath && !filePath.startsWith('http')) {
      plus?.storage?.setItem(cacheKey, filePath)
    }
  } catch (_) {
    // 预下载失败静默忽略，不阻塞其他礼物；播放时会再次尝试
  }
}

/**
 * 批量预下载礼物 SVGA 资源。兼容分类树 [{giftList:[...]}] 与扁平列表 [gift]。
 * 并发触发下载，不 await，不阻塞调用方。
 */
export function preloadGiftAnimations(giftListOrCategories : any[]) : void {
  if (!Array.isArray(giftListOrCategories) || giftListOrCategories.length === 0) return
  const flat : GiftData[] = []
  const first = giftListOrCategories[0]
  if (first && Array.isArray(first.giftList)) {
    for (const cat of giftListOrCategories) {
      const list = Array.isArray(cat.giftList) ? cat.giftList : []
      for (const g of list) flat.push(g)
    }
  } else {
    for (const g of giftListOrCategories) flat.push(g)
  }
  for (const gift of flat) {
    if (gift && gift.resourceURL) preloadGiftAnimation(gift)
  }
}