import AtomicXCore
import UIKit

/// Camera test preview view (native).
///
/// This view itself serves as the camera preview surface. When it moves into a window it registers
/// itself into `CameraTestViewManager` keyed by `viewID`, so the hybrid `startCameraTest` API can
/// resolve the real `UIView` from the string identifier passed by JS. On detach it unregisters to
/// avoid leaking a stale view reference.
public class CameraTestRenderView: UIView {

    private var cachedViewID: String = ""
    private var isAttached = false

    override init(frame: CGRect = .zero) {
        super.init(frame: frame)
        backgroundColor = .clear
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .clear
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            isAttached = true
            tryRegisterView()
        } else {
            isAttached = false
            unregisterView()
        }
    }

    // MARK: - vue -> native bridge
    public func setViewID(_ viewID: Any) {
        guard let viewIDStr = viewID as? String else { return }
        if cachedViewID == viewIDStr { return }
        // Unregister the previous identifier before switching to the new one.
        unregisterView()
        cachedViewID = viewIDStr
        tryRegisterView()
    }

    /// Set corner radius (in pt) for the preview view. A native view is NOT clipped by the
    /// parent's CSS `overflow:hidden` + `border-radius` in nvue, so the rounding must be applied
    /// on the native layer itself.
    public func setCornerRadius(_ radius: Any) {
        var value: CGFloat = 0
        if let num = radius as? NSNumber {
            value = CGFloat(num.doubleValue)
        } else if let str = radius as? String, let d = Double(str) {
            value = CGFloat(d)
        }
        layer.cornerRadius = value
        layer.masksToBounds = value > 0
    }

    private func tryRegisterView() {
        guard isAttached else { return }
        guard !cachedViewID.isEmpty else { return }
        CameraTestViewManager.shared.register(viewID: cachedViewID, view: self)
    }

    private func unregisterView() {
        guard !cachedViewID.isEmpty else { return }
        CameraTestViewManager.shared.unregister(viewID: cachedViewID)
    }
}
