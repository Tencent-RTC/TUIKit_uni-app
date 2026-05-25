/**
 * 全局音频播放器 Hook（Vue2/Vue3 兼容）
 * 
 * 功能：
 * - 复用 callService 的全局单例 uni.$innerAudioContext 播放音频
 *   与铃音共用一个实例，互相打断（铃音 -> 音频 或 音频 -> 铃音 都能无缝切换）
 * - 支持播放状态管理和播放互斥
 * - 使用 plus.io.resolveLocalFileSystemURL 确认音频资源是否存在
 * - 私有目录文件（/data/user/0/、/data/data/）无法被 createInnerAudioContext 访问，
 *   必须先复制到 Android/data/<pkg>/cache/hybrid_media/ 目录下才能播放
 * 
 * Vue2/Vue3 兼容方式：
 * - 响应式用 makeRef（Vue3 ref() / Vue2 Vue.observable({value}) 模拟）
 * - 生命周期用 tryOnMounted/tryOnUnmounted（Vue3 走 Composition API，Vue2 原生则为 noop）
 * - isPlaying 在 Vue3 下是真 Ref<boolean>（可被 watch 识别），Vue2 下是 {value} 响应式对象
 *   两者都通过 .value 访问，读写均响应式
 * - 返回值增加 destroy()，Vue2 原生 Options API 需在 beforeDestroy/beforeUnmount 中手动调用
 *   另需在 mounted() 中调用 setup() 订阅全局事件
 */

import { makeRef, type CompatRef } from '../utils/reactiveCompat'
import { tryOnMounted, tryOnUnmounted } from '../utils/lifecycleCompat'

// 当前正在播放的消息 ID（存在 uni.$audioPlayingMessageId 上，跨 Runtime 共享）
function getPlayingMessageId(): string | undefined {
  // @ts-ignore
  return uni.$audioPlayingMessageId
}
function setPlayingMessageId(id: string | undefined): void {
  // @ts-ignore
  uni.$audioPlayingMessageId = id
}

/**
 * 全局活跃的回调（跨 Runtime 共享，存在 uni.$audioActiveCallbacks 上）
 * 每次 play 覆盖，ctx 事件触发时通过这个对象分发
 */
interface AudioActiveCallbacks {
  onEnded?: () => void
  onError?: (err: any) => void
  onStop?: () => void
}

function getActiveCallbacks(): AudioActiveCallbacks {
  // @ts-ignore
  if (!uni.$audioActiveCallbacks) {
    // @ts-ignore
    uni.$audioActiveCallbacks = {}
  }
  // @ts-ignore
  return uni.$audioActiveCallbacks
}

function setActiveCallbacks(cbs: AudioActiveCallbacks): void {
  // @ts-ignore
  uni.$audioActiveCallbacks = cbs
}

/**
 * 获取全局共享的 innerAudioContext 单例
 * 与 callService 共用 uni.$innerAudioContext，实现铃音与音频消息互斥播放：
 * - 音频播放时 stop() 会打断铃音
 * - 铃音播放时（callService.playRingtone 内部的 stop()）会打断音频消息
 */
function getSharedAudioContext(): any {
  // @ts-ignore
  if (!uni.$innerAudioContext) {
    // @ts-ignore
    uni.$innerAudioContext = uni.createInnerAudioContext()
  }
  // @ts-ignore
  return uni.$innerAudioContext
}

/**
 * 给共享 ctx 绑定事件回调（全局只绑定一次）
 * 
 * 绑定状态保存在 uni.$audioHandlersBound，这样在 nvue 和 Vue 页的
 * 不同 JS Runtime 下都能共享状态（模块级变量不跨 Runtime 共享），
 * 避免 onStop 等回调被重复绑定导致日志/副作用触发多次
 * 
 * 回调内部只通过 uni.$audioActiveCallbacks 对象分发，每次 play 覆盖即可，
 * 不需要重新绑定 ctx，也就不会产生监听器累积问题
 */
function bindSharedCtxHandlers() {
  // @ts-ignore
  if (uni.$audioHandlersBound) return
  const ctx = getSharedAudioContext()
  // @ts-ignore
  uni.$audioHandlersBound = true
  ctx.onEnded(() => {
    getActiveCallbacks().onEnded?.()
  })
  ctx.onError((err: any) => {
    console.error('[useAudioPlayer] (shared ctx) onError:', err)
    getActiveCallbacks().onError?.(err)
  })
  ctx.onStop(() => {
    getActiveCallbacks().onStop?.()
  })
}

/**
 * 停止全局播放器（只 stop，不 destroy，保留单例复用）
 * 与 callService.stopAndResetAudio 行为一致，避免 iOS 频繁 create/destroy 导致资源竞争
 */
export function stopGlobalAudioPlayer(): void {
  // @ts-ignore
  const ctx = uni.$innerAudioContext
  if (ctx) {
    try {
      ctx.stop()
    } catch (e) {
    }
  }
  // 清空活跃回调，避免后续错误触发
  setActiveCallbacks({})
  setPlayingMessageId(undefined)
}

/**
 * 获取当前正在播放的消息 ID
 */
export function getCurrentPlayingMessageId(): string | undefined {
  return getPlayingMessageId()
}

/**
 * 录音时用于广播 audioPlayerStart 的伪消息 ID
 * - 录音前广播这个 ID，让所有 AudioMessage 组件判定非自己从而重置 UI
 * - 真实消息 msgID 不会与此冲突（加了项目前缀做唯一性保护）
 */
export const RECORDING_PSEUDO_ID = '__tuikit_audio_recording__'

/**
 * 检查资源是否存在
 * - 优先使用 plus.io.resolveLocalFileSystemURL（App 端 Vue2/Vue3 均可用）
 * - 降级使用 uni.getFileSystemManager().accessSync（仅 Vue3 uni-app-x 可用）
 * @see https://doc.dcloud.net.cn/uni-app-x/api/get-file-system-manager.html
 */
export function checkFileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 方案 1：plus.io.resolveLocalFileSystemURL（App 端 Vue2/Vue3 均可靠）
    // iOS 上该 API 对裸绝对路径（如 /var/mobile/Containers/...）解析会失败，
    // 必须加 file:// 前缀；Android 上裸路径可以。这里依次尝试两种格式。
    // #ifdef APP-PLUS
    try {
      // @ts-ignore
      if (typeof plus !== 'undefined' && plus.io && typeof plus.io.resolveLocalFileSystemURL === 'function') {
        const candidates: string[] = [filePath]
        if (filePath.indexOf('://') < 0 && filePath.charAt(0) === '/') {
          candidates.push('file://' + filePath)
        }

        const tryResolve = (idx: number) => {
          if (idx >= candidates.length) {
            resolve(false)
            return
          }
          plus.io.resolveLocalFileSystemURL(
            candidates[idx],
            () => { resolve(true) },
            () => { tryResolve(idx + 1) }
          )
        }
        tryResolve(0)
        return
      }
    } catch (e) {
      // plus.io 不可用，降级
    }
    // #endif

    // 方案 2：uni.getFileSystemManager（仅 uni-app-x / Vue3 可用，Vue2 App 端未实现）
    try {
      // @ts-ignore
      if (typeof uni.getFileSystemManager === 'function') {
        try {
          const fsm = uni.getFileSystemManager()
          fsm.accessSync(filePath)
          resolve(true)
          return
        } catch (e: any) {
          // accessSync 抛异常可能是 "not implemented" 或 "file not found"
          var errMsg = (e && (e.message || e.errMsg)) || ''
          if (errMsg.indexOf('not yet implemented') >= 0 || errMsg.indexOf('not implemented') >= 0) {
            // API 未实现，不代表文件不存在，降级到 resolve(true) 乐观策略
            resolve(true)
            return
          }
          resolve(false)
          return
        }
      }
    } catch (e) {
      // FSM 不可用，降级
    }

    // 方案 3：两种方式都不可用，乐观返回 true（让播放器自己报错）
    resolve(true)
  })
}

/**
 * 使用 plus.io 的 FileEntry.copyTo 把私有目录文件复制到可播放目录
 * createInnerAudioContext 底层 MediaPlayer 无法访问应用私有目录（MEDIA_ERROR_IO -5），
 * 必须先复制到公共沙盒目录才能播放
 * 
 * 目标目录：Android/data/<pkg>/cache/hybrid_media/audio_cache/
 * 选择原因：该目录是 uni-app hybrid WebView 的媒体缓存目录，
 *          已验证 createInnerAudioContext 可直接访问该目录下的 mp3 文件
 * 
 * @param srcPath 源文件路径（如 /data/user/0/.../xxx.mp3）
 * @returns 返回可直接用于 createInnerAudioContext 的 file:// 路径
 */
export function copyToSharedDir(srcPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const fileName = srcPath.split('/').pop() || `audio_${Date.now()}.mp3`
    
    
    // 计算目标目录（绝对路径）：
    // /storage/emulated/0/Android/data/<pkg>/cache/hybrid_media/audio_cache/
    let destDirRealPath = ''
    try {
      // 先尝试解析已知能播放的 hybrid_media 目录的父级：_www 或 cache
      // plus 并没有 _cache 相对路径，用 _downloads 的兄弟目录推算：
      // _downloads = Android/data/<pkg>/downloads
      // 我们需要: Android/data/<pkg>/cache/hybrid_media
      const downloadsAbs = plus.io.convertLocalFileSystemURL('_downloads').replace(/^file:\/\//, '')
      // downloadsAbs 形如 /storage/emulated/0/Android/data/<pkg>/downloads/
      // 去掉末尾的 "downloads/" 或 "downloads"，拼上 "cache/hybrid_media"
      const appDataRoot = downloadsAbs.replace(/\/?downloads\/?$/, '/')
      destDirRealPath = `${appDataRoot}cache/hybrid_media/audio_cache`
    } catch (e) {
      console.error('[useAudioPlayer] compute hybrid_media path failed:', e)
      reject(e)
      return
    }
    
    const destFileRealPath = `${destDirRealPath}/${fileName}`
    const destFileUrl = `file://${destFileRealPath}`
    
    // 1. 解析源文件
    plus.io.resolveLocalFileSystemURL(srcPath, (srcEntry: any) => {
      // 2. 解析/创建目标目录（通过其绝对路径）
      //    由于 plus.io.resolveLocalFileSystemURL 只接受绝对路径或相对路径，我们用 file:// 形式
      const tryResolveDestDir = (onResolved: (destDirEntry: any) => void) => {
        plus.io.resolveLocalFileSystemURL(destDirRealPath, 
          (destDirEntry: any) => onResolved(destDirEntry),
          () => {
            // 目录不存在，需要创建：逐级创建 cache -> hybrid_media -> audio_cache
            createDirectoryRecursive(destDirRealPath, onResolved, (mkdirErr: any) => {
              console.error('[useAudioPlayer] create hybrid_media dir failed:', JSON.stringify(mkdirErr))
              reject(mkdirErr)
            })
          }
        )
      }
      
      tryResolveDestDir((destDirEntry: any) => {
        // 3. 检查目标文件是否已存在
        //    注意：plus.io 的 getFile({ create: false }) 对已存在文件有时也会走 fail 回调，
        //    不可靠。改为用 resolveLocalFileSystemURL 直接判断绝对路径是否存在，
        //    并对比源文件和目标文件大小来判断是否命中缓存
        const checkCacheAndCopy = () => {
          plus.io.resolveLocalFileSystemURL(destFileRealPath,
            (existFile: any) => {
              // 文件存在：比较大小决定是否复用
              try {
                existFile.file((meta: any) => {
                  srcEntry.file((srcMeta: any) => {
                    if (meta?.size && srcMeta?.size && meta.size === srcMeta.size) {
                      resolve(existFile.toLocalURL ? existFile.toLocalURL() : destFileUrl)
                    } else {
                      // 大小不一致 → 删除旧文件再复制
                      existFile.remove(() => doCopy(destDirEntry), (rmErr: any) => {
                        console.error('[useAudioPlayer] remove old file failed:', JSON.stringify(rmErr))
                        // 即使删除失败也尝试复用（下次可能也能播）
                        resolve(existFile.toLocalURL ? existFile.toLocalURL() : destFileUrl)
                      })
                    }
                  }, () => {
                    // 源文件 meta 获取失败，直接复用缓存
                    resolve(existFile.toLocalURL ? existFile.toLocalURL() : destFileUrl)
                  })
                }, () => {
                  // 目标文件 meta 获取失败，直接复用缓存
                  resolve(existFile.toLocalURL ? existFile.toLocalURL() : destFileUrl)
                })
              } catch (metaErr) {
                resolve(existFile.toLocalURL ? existFile.toLocalURL() : destFileUrl)
              }
            },
            () => {
              // 文件不存在 → 直接复制
              doCopy(destDirEntry)
            }
          )
        }
        
        const doCopy = (dirEntry: any) => {
          srcEntry.copyTo(dirEntry, fileName, (newEntry: any) => {
            resolve(newEntry.toLocalURL ? newEntry.toLocalURL() : destFileUrl)
          }, (copyErr: any) => {
            console.error('[useAudioPlayer] copyToSharedDir copyTo failed:', JSON.stringify(copyErr))
            reject(copyErr)
          })
        }
        
        checkCacheAndCopy()
      })
    }, (resolveSrcErr: any) => {
      console.error('[useAudioPlayer] copyToSharedDir resolve src failed:', JSON.stringify(resolveSrcErr))
      reject(resolveSrcErr)
    })
    // #endif
    // #ifndef APP-PLUS
    resolve(srcPath)
    // #endif
  })
}

/**
 * 递归创建目录
 * plus.io 不支持直接创建多级目录，需要逐级创建
 */
function createDirectoryRecursive(
  absPath: string,
  onSuccess: (entry: any) => void,
  onError: (err: any) => void
): void {
  // #ifdef APP-PLUS
  // 找到存在的最近祖先目录，然后逐级 getDirectory({create: true})
  const segments = absPath.split('/').filter(s => s.length > 0)
  
  // 从完整路径逐级向上查找已存在的祖先
  const tryFindAncestor = (level: number) => {
    if (level < 0) {
      onError({ code: -1, message: 'no accessible ancestor' })
      return
    }
    const ancestorPath = '/' + segments.slice(0, level + 1).join('/')
    plus.io.resolveLocalFileSystemURL(ancestorPath,
      (ancestorEntry: any) => {
        // 从 ancestorEntry 逐级创建下去
        const remaining = segments.slice(level + 1)
        createChildrenSequentially(ancestorEntry, remaining, onSuccess, onError)
      },
      () => {
        tryFindAncestor(level - 1)
      }
    )
  }
  
  tryFindAncestor(segments.length - 1)
  // #endif
}

/**
 * 在已有 entry 下逐级创建子目录
 */
function createChildrenSequentially(
  parentEntry: any,
  segments: string[],
  onSuccess: (entry: any) => void,
  onError: (err: any) => void
): void {
  if (segments.length === 0) {
    onSuccess(parentEntry)
    return
  }
  const [head, ...rest] = segments
  parentEntry.getDirectory(head, { create: true },
    (childEntry: any) => {
      if (rest.length === 0) {
        onSuccess(childEntry)
      } else {
        createChildrenSequentially(childEntry, rest, onSuccess, onError)
      }
    },
    (err: any) => onError(err)
  )
}

interface UseAudioPlayerOptions {
  messageId: string
  onComplete?: () => void
  onError?: (error: any) => void
  /**
   * 播放状态变化回调（每次 isPlaying 变化时同步触发）
   * 
   * Vue2 原生 Options API 推荐使用此回调替代轮询 isPlaying.value：
   *   因为 makeRef 在 Vue2 下是 Vue.observable({value})，
   *   跨 observable 域读取的响应式依赖追踪不稳定（需显式桥接）
   * 
   * Vue3 场景下无需使用（直接 watch(isPlaying) 即可）
   */
  onPlayingChange?: (playing: boolean) => void
}

/**
 * 音频播放器 Hook（Vue2/Vue3 兼容）
 * 
 * Vue3 用法（Composition API）：
 *   const { isPlaying, play, stop } = useAudioPlayer({ messageId })
 *   watch(isPlaying, ...) // 组件卸载时自动释放
 * 
 * Vue2 用法（Options API）：
 *   mounted() {
 *     this.player = useAudioPlayer({
 *       messageId: this.msgID,
 *       onPlayingChange: (playing) => { this.playingFlag = playing }
 *     })
 *     this.player.setup()
 *   }
 *   beforeDestroy() { this.player.destroy() }
 */
export function useAudioPlayer(options: UseAudioPlayerOptions) {
  const { messageId, onComplete, onError, onPlayingChange } = options
  
  // Vue3: 真正的 Ref<boolean>，可被 watch(ref, ...) 识别
  // Vue2: 带 .value getter/setter 的 observable 对象，.value 读写同样响应式
  const isPlaying: CompatRef<boolean> = makeRef<boolean>(false)
  
  /**
   * 写入 isPlaying 的统一入口：
   * - 更新 .value（触发响应式）
   * - 同步触发 onPlayingChange 回调（Vue2 原生 Options API 用于替代轮询桥接）
   * 使用此方法代替直接 `isPlaying.value = xxx`
   */
  const setPlaying = (v: boolean) => {
    if (isPlaying.value === v) return
    isPlaying.value = v
    if (onPlayingChange) {
      try { onPlayingChange(v) } catch (e) { console.error('[useAudioPlayer] onPlayingChange error:', e) }
    }
  }
  
  // 每次 play 生成唯一 token，异步操作中用于校验是否被中途打断
  let playToken = 0
  // 保存当前 setTimeout 句柄，用于在卸载/停止/被打断时及时清除
  let playTimer: ReturnType<typeof setTimeout> | null = null
  
  /**
   * 清理 play 中 setTimeout 延迟器（幂等）
   */
  const clearPlayTimer = () => {
    if (playTimer !== null) {
      clearTimeout(playTimer)
      playTimer = null
    }
  }
  
  /**
   * 内部工具：重置本组件播放状态（幂等）
   */
  const resetPlayState = () => {
    setPlaying(false)
    if (getPlayingMessageId() === messageId) {
      setPlayingMessageId(undefined)
    }
  }
  
  const play = async (url: string) => {
    if (!url) {
      console.error('[useAudioPlayer] play: url is empty')
      return
    }
    
    
    // 生成本次播放的 token
    const currentToken = ++playToken
    const isTokenValid = () => currentToken === playToken && getPlayingMessageId() === messageId
    
    // 1. 立即停止其他正在播放的音频（互斥）——必须最先执行
    //    广播 audioPlayerStart 事件，让其他所有 AudioMessage 组件判断是否需要重置自身
    uni.$emit('audioPlayerStart', { messageId: messageId })
    const prevPlayingId = getPlayingMessageId()
    if (prevPlayingId && prevPlayingId !== messageId) {
      uni.$emit('audioPlayerStop', { messageId: prevPlayingId })
    }
    stopGlobalAudioPlayer()
    
    // 2. 占用全局播放位，UI 立即进入播放动画
    setPlayingMessageId(messageId)
    setPlaying(true)
    
    // 3. 准备实际播放 URL（App 端私有目录文件需先复制到共享目录）
    let playUrl = url
    
    // #ifdef APP-PLUS
    if (url.startsWith('/') || url.startsWith('file://')) {
      const localPath = url.replace(/^file:\/\//, '')
      
      // 3.1 检查资源是否存在
      const exists = await checkFileExists(localPath)
      if (!isTokenValid()) {
        return
      }
      if (!exists) {
        console.error('[useAudioPlayer] audio file not exists:', localPath)
        uni.showToast({ title: '音频文件不存在', icon: 'none' })
        resetPlayState()
        onError && onError({ errMsg: 'file not exists' })
        return
      }
      
      // 3.2 私有目录文件需要复制到共享目录
      if (localPath.startsWith('/data/user/') || localPath.startsWith('/data/data/')) {
        try {
          playUrl = await copyToSharedDir(localPath)
        } catch (e) {
          console.error('[useAudioPlayer] copyToSharedDir failed, try original:', e)
        }
        if (!isTokenValid()) {
          return
        }
      }
    }
    // #endif
    
    // 4. 延迟使用共享播放器播放，确保 stop() 生效（避免 -99 错误）
    //    保存 timer 句柄，以便在卸载/停止/被打断时清除
    clearPlayTimer()
    playTimer = setTimeout(() => {
      playTimer = null
      if (!isTokenValid()) {
        return
      }
      
      // 获取与 callService 共享的 innerAudioContext 单例
      const ctx = getSharedAudioContext()
      bindSharedCtxHandlers()
      
      // 注册本次播放的回调（每次 play 都会覆盖上次的回调）
      setActiveCallbacks({
        onEnded: () => {
          if (!isTokenValid()) return
          resetPlayState()
          onComplete && onComplete()
        },
        onError: (err: any) => {
          if (!isTokenValid()) return
          resetPlayState()
          onError && onError(err)
        },
        onStop: () => {
          if (!isTokenValid()) return
          resetPlayState()
        }
      })
      
      // 关闭循环（防止上次播放（如铃声）残留的 loop 状态）
      try { ctx.loop = false } catch (e) {}
      ctx.src = playUrl
      ctx.play()
    }, 50)
  }
  
  const stop = () => {
    // 让正在进行的异步 play 流程作废
    playToken++
    // 清理未触发的播放延迟器
    clearPlayTimer()
    if (getPlayingMessageId() === messageId) {
      stopGlobalAudioPlayer()
    }
    // 无论 global 是否匹配，都重置本组件的 UI 状态
    setPlaying(false)
    // 主动调用 onComplete，确保动画立即停止
    onComplete && onComplete()
  }
  
  const handleOtherAudioStop = (data: { messageId: string }) => {
    // 收到其他音频开始播放的通知，重置本组件的播放状态
    if (data.messageId === messageId) {
      // 让正在进行的异步 play 流程作废
      playToken++
      // 清理未触发的播放延迟器
      clearPlayTimer()
      if (isPlaying.value) {
        setPlaying(false)
        // 主动调用 onComplete，确保 UI 动画立即停止
        onComplete && onComplete()
      }
    }
  }
  
  /**
   * 资源清理（幂等）
   * - Vue3 / Vue2+composition-api：由 tryOnUnmounted 自动调用
   * - Vue2 原生 Options API：调用方需在 beforeDestroy/beforeUnmount 中手动调
   */
  let isDestroyed = false
  const destroy = () => {
    if (isDestroyed) return
    isDestroyed = true
    // 清理未触发的延迟器，防止组件销毁后回调仍然执行
    clearPlayTimer()
    // 作废正在进行的 play 异步流程
    playToken++
    if (getPlayingMessageId() === messageId) {
      stopGlobalAudioPlayer()
    }
    uni.$off('audioPlayerStop', handleOtherAudioStop)
  }
  
  // 生命周期订阅：Vue3/Vue2+composition-api 自动绑定；Vue2 原生 noop，由调用方主动处理
  tryOnMounted(() => {
    // 在生命周期内订阅事件，避免 SSR/预渲染时 uni 未就绪
    uni.$on('audioPlayerStop', handleOtherAudioStop)
  })
  tryOnUnmounted(() => {
    destroy()
  })
  
  return {
    isPlaying,
    play,
    stop,
    /** Vue2 原生 Options API 需在 beforeDestroy/beforeUnmount 中调用 */
    destroy,
    /**
     * Vue2 原生 Options API 需在 mounted 中调用，用于订阅全局事件
     * (Vue3 下由 tryOnMounted 自动完成，调用此方法会被幂等保护掉)
     */
    setup: () => {
      uni.$on('audioPlayerStop', handleOtherAudioStop)
    }
  }
}
