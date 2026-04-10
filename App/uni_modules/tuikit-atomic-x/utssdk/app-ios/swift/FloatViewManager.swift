import AtomicXCore
import DCloudUTSFoundation
import UIKit

public class FloatViewManager: NSObject {
    private static let TAG = "UTS-FloatViewManager: "

    public static let shared: FloatViewManager = FloatViewManager()

    private var floatWindow: UIWindow?
    private var callCoreView: AtomicXCore.CallCoreView?
    private var clickCallback: (() -> Void)?
    public private(set) var isFloatWindowVisible = false

    private override init() {
        super.init()
    }

    /// 启动悬浮窗
    public func startFloatView(
        _ options: String,
        _ callback: @escaping (_ code: NSNumber, _ message: String) -> Void
    ) {
        DispatchQueue.main.async {

            if self.isFloatWindowVisible {
                console.warn(
                    Self.TAG, "There is already a floatWindow on display, do not open it again.")
                return
            }
            console.log(Self.TAG, "startFloatView called, options: ", options)

            self.createFloatWindow(options)
            self.floatWindow?.isHidden = false
            self.isFloatWindowVisible = true

            callback(NSNumber(value: 0), "show FloatWindow success")
        }
    }

    /// 停止悬浮窗
    public func stopFloatView() {
        DispatchQueue.main.async {
            console.log(Self.TAG, "stopFloatView called")

            self.floatWindow?.isHidden = true
            self.floatWindow = nil
            self.callCoreView = nil
            self.isFloatWindowVisible = false
        }
    }

    /// 添加悬浮窗点击监听器
    public func addFloatViewListener(_ click: @escaping () -> Void) {
        DispatchQueue.main.async {
            console.log(Self.TAG, "addFloatViewListener called")
            self.clickCallback = click
        }
    }

    /// 移除悬浮窗点击监听器
    public func removeFloatViewListener() {
        DispatchQueue.main.async {
            console.log(Self.TAG, "removeFloatViewListener called")
            self.clickCallback = nil
        }
    }

    private func createFloatWindow(_ options: String = "") {
        let windowScene = UIApplication.shared.connectedScenes
            .first { $0.activationState == .foregroundActive }
            .flatMap { $0 as? UIWindowScene }

        guard let scene = windowScene else {
            console.error(Self.TAG, "No active window scene found")
            return
        }

        let floatWindow = UIWindow(windowScene: scene)
        floatWindow.windowLevel = .alert + 1

        let floatSize = CGSize(width: 120, height: 180)
        let callCoreView = AtomicXCore.CallCoreView()
        callCoreView.setLayoutTemplate(.pip)
        applyOptions(callCoreView, options)

        let containerViewController = FloatContainerViewController()
        containerViewController.callCoreView = callCoreView
        containerViewController.clickHandler = { [weak self] in
            console.log(Self.TAG, "Float window clicked")
            self?.clickCallback?()
        }

        floatWindow.rootViewController = containerViewController
        let screenBounds = UIScreen.main.bounds
        floatWindow.frame = CGRect(
            x: screenBounds.width - floatSize.width - 10,
            y: screenBounds.height / 4,
            width: floatSize.width,
            height: floatSize.height
        )

        floatWindow.layer.cornerRadius = 10
        floatWindow.layer.masksToBounds = true
        floatWindow.layer.shadowColor = UIColor.black.cgColor
        floatWindow.layer.shadowOffset = CGSize(width: 0, height: 2)
        floatWindow.layer.shadowRadius = 4
        floatWindow.layer.shadowOpacity = 0.3

        self.floatWindow = floatWindow
        self.callCoreView = callCoreView
    }

    private func applyOptions(_ callCoreView: AtomicXCore.CallCoreView, _ options: String) {
        guard !options.isEmpty,
            let data = options.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return }

        // waitingAnimation
        if let animationPath = json["waitingAnimation"] as? String, !animationPath.isEmpty {
            callCoreView.setWaitingAnimation(path: animationPath)
        }

        // avatars: [String: String]
        if let avatarsPath = json["avatars"] as? [String: String], !avatarsPath.isEmpty {
            callCoreView.setParticipantAvatars(avatars: avatarsPath)
        }

        // volumeLevelIcon: [String: String] -> [VolumeLevel: String]
        if let volumeMap = json["volumeLevelIcon"] as? [String: String] {
            var result: [AtomicXCore.VolumeLevel: String] = [:]
            for (key, value) in volumeMap {
                switch key {
                case "Mute": result[.mute] = value
                case "Low": result[.low] = value
                case "Medium": result[.medium] = value
                case "High": result[.high] = value
                case "Peak": result[.peak] = value
                default: break
                }
            }
            if !result.isEmpty { callCoreView.setVolumeLevelIcons(icons: result) }
        }

        // networkQualityIcon: [String: String] -> [NetworkQuality: String]
        if let networkMap = json["networkQualityIcon"] as? [String: String] {
            var result: [AtomicXCore.NetworkQuality: String] = [:]
            for (key, value) in networkMap {
                switch key {
                case "UNKNOWN": result[.unknown] = value
                case "EXCELLENT": result[.excellent] = value
                case "GOOD": result[.good] = value
                case "POOR": result[.poor] = value
                case "BAD": result[.bad] = value
                case "VERY_BAD": result[.veryBad] = value
                case "DOWN": result[.down] = value
                default: break
                }
            }
            if !result.isEmpty { callCoreView.setNetworkQualityIcons(icons: result) }
        }
    }
}

private class FloatContainerViewController: UIViewController {
    var callCoreView: AtomicXCore.CallCoreView?
    var clickHandler: (() -> Void)?

    private let gestureView = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        guard let callCoreView = callCoreView else { return }

        view.backgroundColor = .clear
        view.addSubview(callCoreView)
        view.addSubview(gestureView)

        callCoreView.translatesAutoresizingMaskIntoConstraints = false
        gestureView.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            callCoreView.topAnchor.constraint(equalTo: view.topAnchor),
            callCoreView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            callCoreView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            callCoreView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            gestureView.topAnchor.constraint(equalTo: view.topAnchor),
            gestureView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            gestureView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            gestureView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        gestureView.backgroundColor = UIColor.clear

        let tapGesture = UITapGestureRecognizer(
            target: self, action: #selector(handleTapGesture(_:)))
        gestureView.addGestureRecognizer(tapGesture)

        let panGesture = UIPanGestureRecognizer(
            target: self, action: #selector(handlePanGesture(_:)))
        gestureView.addGestureRecognizer(panGesture)
    }

    @objc private func handleTapGesture(_ tapGesture: UITapGestureRecognizer) {
        clickHandler?()
    }

    @objc private func handlePanGesture(_ panGesture: UIPanGestureRecognizer) {
        guard let window = view.window else { return }

        let translation = panGesture.translation(in: view)

        switch panGesture.state {
        case .changed:
            window.center = CGPoint(
                x: window.center.x + translation.x,
                y: window.center.y + translation.y
            )
            panGesture.setTranslation(.zero, in: view)

        case .ended:
            let screenBounds = UIScreen.main.bounds
            let finalFrame = window.frame
            let centerX = finalFrame.midX
            let centerY = finalFrame.midY

            var newCenter = window.center

            if centerX < screenBounds.width / 2 {
                newCenter.x = finalFrame.width / 2 + 10
            } else {
                newCenter.x = screenBounds.width - finalFrame.width / 2 - 10
            }

            if centerY < finalFrame.height / 2 + 50 {
                newCenter.y = finalFrame.height / 2 + 50
            } else if centerY > screenBounds.height - finalFrame.height / 2 - 50 {
                newCenter.y = screenBounds.height - finalFrame.height / 2 - 50
            }

            UIView.animate(withDuration: 0.3) {
                window.center = newCenter
            }

        default:
            break
        }
    }
}
