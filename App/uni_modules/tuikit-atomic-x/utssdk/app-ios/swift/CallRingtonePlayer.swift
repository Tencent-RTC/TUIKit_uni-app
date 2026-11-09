import Foundation
import RTCRoomEngine

#if canImport(TXLiteAVSDK_TRTC)
import TXLiteAVSDK_TRTC
#elseif canImport(TXLiteAVSDK_Professional)
import TXLiteAVSDK_Professional
#endif

/// 通话铃声播放器（iOS）
///
/// 问题背景：
///   主叫开麦后，TRTC 接管 AVAudioSession（playAndRecord + voiceChat 模式），
///   uni-app 的 InnerAudioContext 播放的音频会被系统抑制，导致"在播放但无声"。
///
/// 解决方案（对齐 TUICallKit 官方 CallingBellFeature.startPlayMusicByTRTCPlayer）：
///   通过 TUICallEngine 内部持有的同一个 TRTCCloud 实例的音效混音器
///   TXAudioEffectManager.startPlayMusic 播放铃声，与麦克风采集共用同一个
///   TRTC 音频引擎 / AVAudioSession，彻底避免冲突。
@objc public final class CallRingtonePlayer: NSObject {

    @objc public static let shared = CallRingtonePlayer()

    /// 铃声占用的音乐 ID
    private let musicID: Int32 = 48

    private var isPlaying = false
    /// 当前正在播放的文件路径，用于去重，避免重复调用叠加播放导致断断续续
    private var currentPath: String = ""

    private override init() {
        super.init()
    }

    /// 获取通话引擎使用的 TRTC 音效管理器
    private func audioEffectManager() -> TXAudioEffectManager {
        return TUICallEngine.createInstance().getTRTCCloudInstance().getAudioEffectManager()
    }

    /// 将可能是 file:// URL 的路径转换为 TRTC 需要的纯文件系统路径
    private func normalizePath(_ path: String) -> String {
        if path.hasPrefix("file://") {
            if let url = URL(string: path) {
                return url.path
            }
            // 兜底：直接去掉前缀
            return String(path.dropFirst("file://".count))
        }
        return path
    }

    /// 播放铃声
    /// - Parameters:
    ///   - path: 铃声文件路径（支持 file:// URL 或纯路径）
    ///   - loop: 是否循环
    @objc public func play(_ path: String, loop: Bool) {
        let realPath = normalizePath(path)
        guard !realPath.isEmpty else {
            NSLog("[CallRingtonePlayer] play skipped: empty path")
            return
        }
        // 去重：同一铃声正在播放时忽略重复调用，避免叠加导致断断续续
        if isPlaying && currentPath == realPath {
            NSLog("[CallRingtonePlayer] already playing same ringtone, skip")
            return
        }
        let manager = audioEffectManager()
        if isPlaying {
            manager.stopPlayMusic(musicID)
        }
        let param = TXAudioMusicParam()
        param.id = musicID
        param.path = realPath
        param.isShortFile = true
        param.loopCount = loop ? Int(Int32.max) : 0
        param.publish = false
        isPlaying = true
        currentPath = realPath
        manager.startPlayMusic(param, onStart: { code in
            NSLog("[CallRingtonePlayer] startPlayMusic onStart code=\(code) path=\(realPath)")
        }, onProgress: { _, _ in })
        manager.setMusicPlayoutVolume(musicID, volume: 100)
    }

    /// 停止铃声
    @objc public func stop() {
        guard isPlaying else { return }
        isPlaying = false
        currentPath = ""
        audioEffectManager().stopPlayMusic(musicID)
    }
}
