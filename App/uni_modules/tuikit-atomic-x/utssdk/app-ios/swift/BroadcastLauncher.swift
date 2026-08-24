import Foundation
import ReplayKit
import UIKit

class BroadcastLauncher {

    // MARK: - Singleton

    static let shared = BroadcastLauncher()

    // MARK: - Properties

    private let systemExtensionPicker: RPSystemBroadcastPickerView

    private var prevLaunchEventTime: CFTimeInterval = 0

    // MARK: - Init

    private init() {
        systemExtensionPicker = RPSystemBroadcastPickerView(frame: CGRect(x: 0, y: 0, width: 44, height: 44))
        systemExtensionPicker.showsMicrophoneButton = false
        systemExtensionPicker.autoresizingMask = [.flexibleTopMargin, .flexibleRightMargin]

        let pluginPath = Bundle.main.builtInPlugInsURL?.path ?? ""
        let fileManager = FileManager.default
        if let contents = try? fileManager.contentsOfDirectory(atPath: pluginPath) {
            for content in contents where content.hasSuffix(".appex") {
                let bundlePath = (pluginPath as NSString).appendingPathComponent(content)
                let standardizedPath = (bundlePath as NSString).standardizingPath
                guard let bundle = Bundle(path: standardizedPath) else { continue }
                guard let infoDictionary = bundle.infoDictionary,
                      let extensionDictionary = infoDictionary["NSExtension"] as? [String: Any],
                      let identifier = extensionDictionary["NSExtensionPointIdentifier"] as? String,
                      identifier == "com.apple.broadcast-services-upload" else {
                    continue
                }
                systemExtensionPicker.preferredExtension = bundle.bundleIdentifier
                break
            }
        }
    }

    // MARK: - Public

    static func launch() {
        BroadcastLauncher.shared.launch()
    }

    // MARK: - Private

    private func launch() {
        let now = CFAbsoluteTimeGetCurrent()
        if now - prevLaunchEventTime < 1.0 {
            return
        }
        prevLaunchEventTime = now

        for view in systemExtensionPicker.subviews {
            if let button = view as? UIButton {
                button.sendActions(for: .allTouchEvents)
                break
            }
        }
    }

    deinit {
        NSLog("deinit \(self)")
    }
}
