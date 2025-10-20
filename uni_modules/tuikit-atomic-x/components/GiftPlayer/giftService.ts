import { ref } from 'vue'
import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState'

type GiftData = {
    giftID?: string
    name?: string
    iconURL?: string
    resourceURL?: string
    coins?: number
    [k: string]: any
}

export function giftService(params: {
    roomId: string
    giftPlayerRef: any
    giftToastRef?: any
    autoHideMs?: number
}) {
    const { sendGift } = useGiftState(uni?.$liveID)
    const isGiftPlaying = ref(false)

    const showGift = async (giftData: GiftData, options?: { onlyDisplay?: boolean }) => {
        if (!giftData) return
        const onlyDisplay = !!options?.onlyDisplay

        // SVGA 类型
        if (giftData.resourceURL) {
            isGiftPlaying.value = true
            params.giftPlayerRef?.value?.playGift(giftData)
        } else if (params.giftToastRef?.value) {
            // 普通礼物提示
            params.giftToastRef?.value?.showToast({
                ...giftData,
                duration: 1500,
            })
        }

        if (!onlyDisplay) {
            sendGift({
                liveID: params.roomId,
                giftID: giftData.giftID,
                count: 1,
                success: () => { },
                fail: () => { },
            })
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
export function downloadAndSaveToPath(url: string) {
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
                        imageFilePath = plus.io.convertLocalFileSystemURL(imageFilePath)
                        resolve(imageFilePath)
                    },
                    fail: () => {
                        reject(new Error('保存文件失败'))
                    },
                })
            },
            fail: (err) => reject(err),
        })
    })
}
