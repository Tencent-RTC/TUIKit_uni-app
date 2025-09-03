import DCloudUTSFoundation
import RTCRoomEngine_Plus
import UIKit

public class LiveRenderView: UIView {
    private let cornerRadius: CGFloat = 18  // 圆角半径

    // MARK: - 初始化
    override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        self.layer.cornerRadius = cornerRadius
        self.layer.masksToBounds = true
        self.layer.shouldRasterize = true
        self.layer.rasterizationScale = UIScreen.main.scale
    }

    // 保证圆角在布局变化时始终生效
    public override func layoutSubviews() {
        super.layoutSubviews()
        self.layer.cornerRadius = cornerRadius
        self.layer.masksToBounds = true
    }

    // MARK: - 渲染视图更新
    public func updateRenderView(_ liveId: Any) {
        console.log("iOS-LiveRenderView, updateRenderView, liveId: ", liveId)
        guard liveId != nil else {
            console.log("iOS-LiveRenderView, updateRenderView: liveId is empty")
            return
        }
        guard liveId is String else {
            console.log("iOS-LiveRenderView, updateRenderView: liveId is not String")
            return
        }

        subviews.forEach { $0.removeFromSuperview() }

        if let liveIdStr = liveId as? String {
            let renderView = V2LiveRenderView(liveId: liveIdStr)
            renderView.translatesAutoresizingMaskIntoConstraints = false
            addSubview(renderView)

            NSLayoutConstraint.activate([
                renderView.leadingAnchor.constraint(equalTo: leadingAnchor),
                renderView.trailingAnchor.constraint(equalTo: trailingAnchor),
                renderView.topAnchor.constraint(equalTo: topAnchor),
                renderView.bottomAnchor.constraint(equalTo: bottomAnchor),
            ])
        }
    }
}