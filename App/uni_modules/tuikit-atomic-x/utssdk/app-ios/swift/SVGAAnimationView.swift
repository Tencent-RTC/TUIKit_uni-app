import UIKit
import DCloudUTSFoundation
import SVGAPlayer

public class SVGAAnimationView: UIView {
    private var playerView: SVGAPlayer?
    private var svgaDelegate : SVGAAnimationViewDelegate?

    private func cleanupOldPlayer() {
        playerView?.removeFromSuperview()
        playerView?.delegate = nil
        playerView = nil
    }

    public func setDelegate(_ delegate : SVGAAnimationViewDelegate){
        self.svgaDelegate = delegate
    }

    // 保持内部 SVGAPlayer 始终与本视图同尺寸(约束已保证,这里再兜底一次)。
    public override func layoutSubviews() {
        super.layoutSubviews()
        playerView?.frame = bounds
    }

    // 确保容器已完成布局(bounds 非零)后再 setVideoItem + startAnimation。
    // 根因:SVGAPlayer 2.5.7 在 startAnimation 时按【当时的 self.bounds】计算 aspectFit 缩放,
    // 若此刻 bounds 为 0(nvue 尺寸 0→750rpx 的原生 relayout 尚未落地),缩放系数为 0 → 画面
    // 不可见,且之后 bounds 变大也不会自动重算 → 表现为"部分 iPhone 机型无动画"(布局时序
    // 竞态,与机型渲染/布局节奏相关)。此处轮询等待 bounds 非零再起播,从根上消除零尺寸起播。
    private func startWhenSized(_ videoItem: SVGAVideoEntity?, retries: Int) {
        guard let player = self.playerView, let videoItem = videoItem else { return }
        if bounds.width > 0, bounds.height > 0 {
            player.videoItem = videoItem
            player.startAnimation()
            return
        }
        if retries <= 0 {
            // 兜底:强制布局一次后仍以当前尺寸起播,避免极端情况下永不播放。
            setNeedsLayout()
            layoutIfNeeded()
            player.frame = bounds
            player.videoItem = videoItem
            player.startAnimation()
            return
        }
        // 下一 runloop 再试(等原生 relayout 把尺寸落到 750rpx)。
        DispatchQueue.main.async { [weak self] in
            self?.startWhenSized(videoItem, retries: retries - 1)
        }
    }

    public func startAnimation(_ playUrl: String) {
        console.log("======startAnimation, playUrl: ", playUrl)
        guard isSVGAFile(url: playUrl) else {
            console.error("======startAnimation error, playUrl is not svga")
            self.svgaDelegate?.onFinished()
            return
        }

        cleanupOldPlayer()

        let player = SVGAPlayer(frame: bounds)
        player.contentMode = .scaleAspectFit
        player.delegate = self
        player.loops = 1
        addSubview(player)

        player.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            player.leadingAnchor.constraint(equalTo: leadingAnchor),
            player.trailingAnchor.constraint(equalTo: trailingAnchor),
            player.topAnchor.constraint(equalTo: topAnchor),
            player.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])

        self.playerView = player // 保存实例

        // 异步加载并播放动画
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }
            let url: URL?

            if playUrl.hasPrefix("http://") || playUrl.hasPrefix("https://") {
                url = URL(string: playUrl)
            } else {
                url = URL(fileURLWithPath: playUrl)
            }
            guard let validUrl = url,
                  let animationData = try? Data(contentsOf: validUrl) else {
                DispatchQueue.main.async {
                    self.cleanupOldPlayer()
                    console.error("======startAnimation error, url parse error")
                    self.svgaDelegate?.onFinished()
                }
                return
            }

            let parser = SVGAParser()
            parser.parse(with: animationData, cacheKey: validUrl.lastPathComponent) { [weak self] videoItem in
                DispatchQueue.main.async {
                    console.error("======startAnimation begin")
                    guard let self = self else { return }
                    // 等容器 bounds 非零再起播(最多重试 ~20 帧),避免零尺寸起播导致无动画。
                    self.startWhenSized(videoItem, retries: 20)
                }
            } failureBlock: { [weak self] error in
                DispatchQueue.main.async {
                    console.error("======startAnimation failed")
                    self?.cleanupOldPlayer()
                    self?.svgaDelegate?.onFinished()
                }
            }
        }
    }

    public func stopAnimation() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.playerView?.stopAnimation()

            // 移除视图并清理代理
            self.playerView?.removeFromSuperview()
            self.playerView?.delegate = nil

            // 清空实例并通知中断
            self.playerView = nil
        }
    }

    private func isSVGAFile(url: String) -> Bool {
        guard let urlObj = URL(string: url) else { return false }
        let svgaExtension = "svga"
        return urlObj.pathExtension.lowercased() == svgaExtension
    }
}

// MARK: - SVGAPlayerDelegate
extension SVGAAnimationView: SVGAPlayerDelegate {
    public func svgaPlayerDidFinishedAnimation(_ player: SVGAPlayer) {
        UIView.animate(withDuration: 0.2, animations: {
            player.alpha = 0
        }) { _ in
            player.removeFromSuperview()
            self.cleanupOldPlayer()
            console.error("======startAnimation, onFinished")
            self.svgaDelegate?.onFinished()
        }
    }
}

public protocol SVGAAnimationViewDelegate: AnyObject {
    func onFinished()
}