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
    
    public func startAnimation(_ playUrl: String) {
        console.log("======startAnimation, playUrl: ", playUrl)
        guard isSVGAFile(url: playUrl) else {
            console.error("======startAnimation error, playUrl is not svga")
            self.svgaDelegate?.onFinished()
            return
        }

        cleanupOldPlayer()

        let player = SVGAPlayer(frame: bounds)
        player.contentMode = .scaleAspectFill
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
                    self.playerView?.videoItem = videoItem
                    self.playerView?.startAnimation()
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