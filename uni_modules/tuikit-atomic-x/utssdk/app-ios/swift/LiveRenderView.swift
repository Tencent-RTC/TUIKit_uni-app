import AtomicXCore
import DCloudUTSFoundation
import RTCRoomEngine
import UIKit

public class LiveRenderView: UIView {
    private let cornerRadius: CGFloat = 18  // 圆角半径
    private var nativeViewType = CoreViewType.playView

    // MARK: - 初始化
    override init(frame: CGRect = .zero) {
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

    public func updateViewType(_ viewType: Any) {
        guard viewType != nil else {
            return
        }
        guard viewType is String else {
            return
        }
        if let viewTypeStr = viewType as? String {
            if viewTypeStr == "PUSH_VIEW" {
                nativeViewType = CoreViewType.pushView
            }
        }
    }

    // MARK: - 渲染视图更新
    public func updateRenderView(_ liveID: Any) {
        console.log("iOS-LiveRenderView, updateRenderView, liveID: ", liveID)
        guard liveID != nil else {
            console.log("iOS-LiveRenderView, updateRenderView: liveID is empty")
            return
        }
        guard liveID is String else {
            console.log("iOS-LiveRenderView, updateRenderView: liveID is not String")
            return
        }

        subviews.forEach { $0.removeFromSuperview() }

        console.log("iOS-LiveRenderView, updateRenderView, viewType: ", self.nativeViewType)
        if let liveIDStr = liveID as? String , !liveIDStr.isEmpty {
            let renderView = LiveCoreView(viewType: self.nativeViewType, frame : .zero)
            renderView.setLiveID(liveIDStr)
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
