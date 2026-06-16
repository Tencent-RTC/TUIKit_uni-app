import AlbumPicker
import DCloudUTSFoundation
import UIKit

private let APM_TAG: String = "iOS-AlbumPickerManager: "

private struct SessionCallbacks {
    let onPickConfirm: (String) -> Void
    let onMediaProcessing: (String) -> Void
    let onMediaProcessed: () -> Void
    let onCancel: () -> Void
}

public class AlbumPickerManager: NSObject {

    public static let shared = AlbumPickerManager()

    private var hostVC: UIViewController?
    private var pickerView: AlbumPicker.AlbumPickerView?
    private var sessionCallbacks: [String: SessionCallbacks] = [:]
    private var delegateProxies: [String: AlbumPickerDelegateProxy] = [:]
    private var currentSessionId: String?

    private override init() {
        super.init()
    }

    // MARK: - Public API

    public func show(
        _ configJSON: String,
        _ themeJSON: String,
        sessionId: String,
        viewController: UIViewController,
        onPickConfirm: @escaping (String) -> Void,
        onMediaProcessing: @escaping (String) -> Void,
        onMediaProcessed: @escaping () -> Void,
        onCancel: @escaping () -> Void
    ) {
        console.log(APM_TAG, "show called with sessionId:", sessionId)

        sessionCallbacks[sessionId] = SessionCallbacks(
            onPickConfirm: onPickConfirm,
            onMediaProcessing: onMediaProcessing,
            onMediaProcessed: onMediaProcessed,
            onCancel: onCancel
        )
        currentSessionId = sessionId

        // Dismiss existing if any
        if let existingVC = hostVC {
            existingVC.dismiss(animated: false)
            self.hostVC = nil
            self.pickerView = nil
        }

        let vc = UIViewController()
        vc.modalPresentationStyle = .fullScreen
        vc.view.backgroundColor = .black

        let config = parseConfig(configJSON)
        let theme = parseTheme(themeJSON)

        let picker = AlbumPicker.AlbumPickerView(frame: vc.view.bounds)

        let proxy = AlbumPickerDelegateProxy(sessionId: sessionId, manager: self)
        delegateProxies[sessionId] = proxy
        picker.delegate = proxy

        picker.initialize(config: config, theme: theme)

        picker.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(picker)

        NSLayoutConstraint.activate([
            picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
            picker.topAnchor.constraint(equalTo: vc.view.topAnchor),
            picker.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor)
        ])

        self.pickerView = picker
        self.hostVC = vc

        if viewController.presentedViewController != nil {
            viewController.dismiss(animated: false) {
                viewController.present(vc, animated: true)
            }
        } else {
            viewController.present(vc, animated: true)
        }
        console.log(APM_TAG, "show: presented picker VC, sessionId:", sessionId)
    }

    public func hide() {
        console.log(APM_TAG, "hide called")
        guard let vc = hostVC else {
            console.warn(APM_TAG, "hide: no active picker to dismiss")
            return
        }
        vc.dismiss(animated: true) { [weak self] in
            self?.hostVC = nil
            console.log(APM_TAG, "cleanupView done")
        }
    }

    fileprivate func getCallbacks(sessionId: String) -> SessionCallbacks? {
        return sessionCallbacks[sessionId]
    }

    fileprivate func cleanup(sessionId: String) {
        sessionCallbacks.removeValue(forKey: sessionId)
        delegateProxies.removeValue(forKey: sessionId)
        if currentSessionId == sessionId {
            pickerView?.removeFromSuperview()
            pickerView = nil
            hostVC = nil
            currentSessionId = nil
        }
        console.log(APM_TAG, "cleanup done for sessionId:", sessionId)
    }

    fileprivate func dismissHost(sessionId: String) {
        hostVC?.dismiss(animated: true) { [weak self] in
            self?.cleanup(sessionId: sessionId)
        }
    }

    // MARK: - JSON Parsing

    private func parseConfig(_ jsonStr: String) -> AlbumPicker.AlbumPickerConfig {
        var config = AlbumPicker.AlbumPickerConfig()

        guard let data = jsonStr.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return config
        }

        if let pickMode = dict["pickMode"] as? Int {
            switch pickMode {
            case 0: config.mediaFilter = .imageOnly
            case 1: config.mediaFilter = .videoOnly
            case 2: config.mediaFilter = .imageAndVideo
            default: break
            }
        }

        if let maxCount = dict["maxCount"] as? Int { config.maxSelectionCount = maxCount }
        if let gridCount = dict["gridCount"] as? Int { config.itemsPerRow = gridCount }
        if let showsCamera = dict["showsCameraItem"] as? Bool { config.showsCameraItem = showsCamera }

        if let style = dict["style"] as? Int {
            switch style {
            case 0: config.style = .likeWeChat
            case 1: config.style = .likeWhatsApp
            default: break
            }
        }

        if let language = dict["language"] as? Int {
            switch language {
            case 0: config.language = .system
            case 1: config.language = .en
            case 2: config.language = .zhHans
            case 3: config.language = .zhHant
            case 4: config.language = .ar
            default: break
            }
        }

        if let compressQuality = dict["compressQuality"] as? Int {
            switch compressQuality {
            case 0: config.compressQuality = .standard
            case 1: config.compressQuality = .high
            default: break
            }
        }

        if let maxVideoDuration = dict["maxVideoDurationInSeconds"] as? Int {
            config.maxVideoDurationInSeconds = maxVideoDuration
        }
        if let maxOutputFileSize = dict["maxOutputFileSizeInMB"] as? Int {
            config.maxOutputFileSizeInMB = maxOutputFileSize
        }

        return config
    }

    private func parseTheme(_ jsonStr: String) -> AlbumPicker.AlbumPickerTheme {
        var theme = AlbumPicker.AlbumPickerTheme()

        guard let data = jsonStr.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return theme
        }

        theme.currentPrimaryColor = parseColor(dict["primaryColor"])
        theme.backgroundColor = parseColor(dict["backgroundColor"])
        theme.backgroundColorSecondary = parseColor(dict["backgroundColorSecondary"])
        theme.textColor = parseColor(dict["textColor"])
        theme.textColorSecondary = parseColor(dict["textColorSecondary"])

        if let v = dict["bigFontSize"] as? Double { theme.bigFontSize = CGFloat(v) }
        if let v = dict["normalFontSize"] as? Double { theme.normalFontSize = CGFloat(v) }
        if let v = dict["smallFontSize"] as? Double { theme.smallFontSize = CGFloat(v) }
        if let v = dict["bigRadius"] as? Double { theme.bigRadius = CGFloat(v) }
        if let v = dict["normalRadius"] as? Double { theme.normalRadius = CGFloat(v) }
        if let v = dict["smallRadius"] as? Double { theme.smallRadius = CGFloat(v) }

        return theme
    }

    private func parseColor(_ value: Any?) -> UIColor? {
        guard let hexStr = value as? String else { return nil }
        let hex = hexStr.replacingOccurrences(of: "0x", with: "")
                        .replacingOccurrences(of: "0X", with: "")
                        .replacingOccurrences(of: "#", with: "")
        guard hex.count == 8, let intVal = UInt64(hex, radix: 16) else { return nil }

        let a = CGFloat((intVal >> 24) & 0xFF) / 255.0
        let r = CGFloat((intVal >> 16) & 0xFF) / 255.0
        let g = CGFloat((intVal >> 8) & 0xFF) / 255.0
        let b = CGFloat(intVal & 0xFF) / 255.0
        return UIColor(red: r, green: g, blue: b, alpha: a)
    }

    fileprivate func serializeAlbumMedia(_ media: AlbumPicker.AlbumMedia) -> [String: Any] {
        var dict: [String: Any] = [
            "id": media.id,
            "mediaType": media.mediaType == .video ? 1 : 0,
            "mediaPath": media.mediaPath ?? "",
            "fileExtension": "",
            "fileSize": 0,
            "duration": media.duration,
        ]
        if let thumbnail = media.videoThumbnailPath {
            dict["videoThumbnailPath"] = thumbnail
        }
        return dict
    }

    fileprivate func toJSONString(_ obj: Any) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: obj),
              let str = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return str
    }
}

// MARK: - AlbumPickerDelegateProxy

class AlbumPickerDelegateProxy: NSObject, AlbumPicker.AlbumPickerDelegate {
    let sessionId: String
    private weak var manager: AlbumPickerManager?

    init(sessionId: String, manager: AlbumPickerManager) {
        self.sessionId = sessionId
        self.manager = manager
        super.init()
    }

    public func onPickConfirm(pickedAlbumMedias: [AlbumPicker.AlbumMedia], textMessage: String?) {
        console.log(APM_TAG, "onPickConfirm, count:", pickedAlbumMedias.count, ", sessionId:", sessionId)

        guard let manager = manager, let callbacks = manager.getCallbacks(sessionId: sessionId) else {
            console.error(APM_TAG, "onPickConfirm: callbacks not found for sessionId:", sessionId)
            return
        }

        manager.hide()

        let serialized = pickedAlbumMedias.map { manager.serializeAlbumMedia($0) }
        let payload: [String: Any] = [
            "pickedAlbumMedias": serialized,
            "textMessage": textMessage ?? ""
        ]
        callbacks.onPickConfirm(manager.toJSONString(payload))
    }

    public func onMediaProcessing(albumMedia: AlbumPicker.AlbumMedia, progress: Float, error: Bool) {

        guard let manager = manager, let callbacks = manager.getCallbacks(sessionId: sessionId) else {
            console.error(APM_TAG, "onMediaProcessing: callbacks not found for sessionId:", sessionId)
            return
        }

        let payload: [String: Any] = [
            "albumMedia": manager.serializeAlbumMedia(albumMedia),
            "progress": Double(progress),
            "error": error
        ]
        callbacks.onMediaProcessing(manager.toJSONString(payload))
    }

    public func onMediaProcessed() {
        console.log(APM_TAG, "onMediaProcessed, sessionId:", sessionId)

        guard let manager = manager, let callbacks = manager.getCallbacks(sessionId: sessionId) else {
            console.error(APM_TAG, "onMediaProcessed: callbacks not found for sessionId:", sessionId)
            return
        }

        callbacks.onMediaProcessed()
        manager.cleanup(sessionId: sessionId)
    }

    public func onCancel() {
        console.log(APM_TAG, "onCancel, sessionId:", sessionId)

        guard let manager = manager, let callbacks = manager.getCallbacks(sessionId: sessionId) else {
            console.error(APM_TAG, "onCancel: callbacks not found for sessionId:", sessionId)
            return
        }

        manager.dismissHost(sessionId: sessionId)
        callbacks.onCancel()
    }
}
