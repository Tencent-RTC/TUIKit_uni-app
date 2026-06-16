import AtomicXCore
import UIKit

private let logger = RoomViewLogger.getLogger("RoomRenderView")

public class RoomRenderView: UIView {

    // MARK: - Cached props
    private var cachedRoomID: String = ""
    private var cachedRoomType: RoomType = .standard
    private var cachedIcons: RoomViewIcons = RoomViewIcons()

    // MARK: - Native child & state
    private var nativeRoomView: RoomView?
    private var isNativeViewInitialized = false
    private var isAttached = false

    // MARK: - Init
    override init(frame: CGRect = .zero) {
        super.init(frame: frame)
        backgroundColor = .clear
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .clear
    }

    // MARK: - Lifecycle
    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            logger.info("didMoveToWindow: attached")
            isAttached = true
            tryInitializeView()
        } else {
            logger.info("didMoveToWindow: detached")
            isAttached = false
            tearDownNativeView()
        }
    }

    // MARK: - vue -> native bridge
    public func setRoomID(_ roomID: Any) {
        guard let roomIDStr = roomID as? String else {
            logger.warn("setRoomID: ignore non-String value=\(roomID)")
            return
        }
        if cachedRoomID == roomIDStr { return }
        logger.info("setRoomID: \(roomIDStr) (prev=\(cachedRoomID))")
        cachedRoomID = roomIDStr
        tearDownNativeView()
        tryInitializeView()
    }

    public func setRoomType(_ roomType: Any) {
        let intValue: Int
        if let n = roomType as? NSNumber {
            intValue = n.intValue
        } else if let i = roomType as? Int {
            intValue = i
        } else if let d = roomType as? Double {
            intValue = Int(d)
        } else {
            logger.warn("setRoomType: ignore non-Number value=\(roomType)")
            return
        }
        let newType = parseRoomType(intValue)
        if cachedRoomType == newType && isNativeViewInitialized { return }
        logger.info("setRoomType: \(intValue) -> \(newType)")
        cachedRoomType = newType
        tearDownNativeView()
        tryInitializeView()
    }

    public func setIcons(_ icons: Any) {
        guard let jsonString = icons as? String else {
            logger.warn("setIcons: ignore non-String value")
            return
        }
        guard let data = jsonString.data(using: .utf8),
              let mapData = (try? JSONSerialization.jsonObject(with: data, options: [])) as? [String: Any] else {
            logger.error("setIcons: failed to parse JSON, raw=\(jsonString)")
            return
        }
        if mapData.isEmpty {
            logger.warn("setIcons: empty map, fallback to default icons")
        }

        cachedIcons = RoomViewIcons(
            defaultAvatar: resolveImage(mapData["defaultAvatar"]),
            microphoneOn: resolveImage(mapData["microphoneOn"]),
            microphoneOff: resolveImage(mapData["microphoneOff"]),
            roleOwner: resolveImage(mapData["roleOwner"]),
            roleManager: resolveImage(mapData["roleManager"]),
            arrowLeft: resolveImage(mapData["arrowLeft"]),
            arrowRight: resolveImage(mapData["arrowRight"])
        )

        if isNativeViewInitialized, let nativeRoomView = nativeRoomView {
            nativeRoomView.setIcons(cachedIcons)
        } else {
            tryInitializeView()
        }
    }

    // MARK: - Helpers
    private func parseRoomType(_ value: Int) -> RoomType {
        switch value {
        case 2:
            return .webinar
        default:
            return .standard
        }
    }

    private func resolveImage(_ raw: Any?) -> UIImage? {
        guard let name = raw as? String, !name.isEmpty else { return nil }

        if name.hasPrefix("file://") || name.hasPrefix("/") {
            let path: String
            if name.hasPrefix("file://"), let url = URL(string: name) {
                path = url.path
            } else {
                path = name
            }
            if FileManager.default.fileExists(atPath: path) {
                return UIImage(contentsOfFile: path)
            }
            logger.warn("resolveImage: file not found: \(path)")
            return nil
        }

        return UIImage(named: name)
    }

    private func tryInitializeView() {
        if isNativeViewInitialized { return }
        guard isAttached else { return }
        guard !cachedRoomID.isEmpty else { return }

        subviews.forEach { $0.removeFromSuperview() }

        let roomView = RoomView(roomID: cachedRoomID, roomType: cachedRoomType)
        roomView.setIcons(cachedIcons)
        roomView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(roomView)
        NSLayoutConstraint.activate([
            roomView.leadingAnchor.constraint(equalTo: leadingAnchor),
            roomView.trailingAnchor.constraint(equalTo: trailingAnchor),
            roomView.topAnchor.constraint(equalTo: topAnchor),
            roomView.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])

        nativeRoomView = roomView
        isNativeViewInitialized = true
        logger.info("initializeView: roomID=\(cachedRoomID) roomType=\(cachedRoomType)")
    }

    private func tearDownNativeView() {
        guard isNativeViewInitialized || nativeRoomView != nil else { return }
        nativeRoomView?.removeFromSuperview()
        nativeRoomView = nil
        isNativeViewInitialized = false
    }
}
