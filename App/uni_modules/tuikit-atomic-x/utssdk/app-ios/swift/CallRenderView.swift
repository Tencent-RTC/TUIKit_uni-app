import AtomicXCore
import DCloudUTSFoundation
import RTCRoomEngine
import UIKit

public class CallRenderView: UIView {
    private static let TAG = "iOS-CallRenderView: "
    
    private var nativeCallCoreView: AtomicXCore.CallCoreView?
    
    private var cachedLayoutTemplate: AtomicXCore.CallLayoutTemplate = .grid
    private var cachedWaitingAnimation: String = ""
    private var cachedVolumeLevelIcons: [AtomicXCore.VolumeLevel: String] = [:]
    private var cachedNetworkQualityIcons: [NetworkQuality: String] = [:]
    private var cachedParticipantAvatars: [String: String] = [:]
    private var isNativeViewInitialized = false
    
    override public init(frame: CGRect = .zero) {
        super.init(frame: frame)
        commonInit()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }
    
    private func commonInit() {
        console.log(Self.TAG, "init CallRenderView wrapper")
    }
    
    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            console.log(Self.TAG, "didMoveToWindow - view attached")
            initializeView()
        } else {
            console.log(Self.TAG, "didMoveToWindow - view detached")
        }
    }
    
    public override func removeFromSuperview() {
        console.log(Self.TAG, "removeFromSuperview")
        super.removeFromSuperview()
        nativeCallCoreView?.removeFromSuperview()
        nativeCallCoreView = nil
        isNativeViewInitialized = false
    }
    
    public override func layoutSubviews() {
        super.layoutSubviews()
        nativeCallCoreView?.frame = bounds
    }
    
    public func setLayoutTemplate(_ layoutTemplate: Any) {
        console.warn(Self.TAG, "setLayoutTemplate:", layoutTemplate)
        
        guard let layoutTemplateStr = layoutTemplate as? String else {
            console.error(Self.TAG, "setLayoutTemplate: layoutTemplate is not String")
            return
        }
        
        switch layoutTemplateStr {
        case "Float", "float":
            cachedLayoutTemplate = .float
        case "Grid", "grid":
            cachedLayoutTemplate = .grid
        case "Pip", "pip":
            cachedLayoutTemplate = .pip
        default:
            console.warn(Self.TAG, "Unknown layoutTemplate:", layoutTemplateStr, ", using Grid")
            cachedLayoutTemplate = .grid
        }
        
        nativeCallCoreView?.setLayoutTemplate(cachedLayoutTemplate)
    }
    
    public func setWaitingAnimation(_ animationPath: Any) {
        console.warn(Self.TAG, "setWaitingAnimation:", animationPath)
        
        guard let pathStr = animationPath as? String else {
            console.error(Self.TAG, "setWaitingAnimation: animationPath is not String")
            return
        }
        
        cachedWaitingAnimation = pathStr
        
        if !cachedWaitingAnimation.isEmpty {
            nativeCallCoreView?.setWaitingAnimation(path: cachedWaitingAnimation)
        }
    }
    
    public func setVolumeLevelIcons(_ icons: Any) {
        console.warn(Self.TAG, "setVolumeLevelIcons:", icons)
        
        guard let iconsStr = icons as? String,
              let data = iconsStr.data(using: .utf8),
              let iconsDict = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            console.error(Self.TAG, "setVolumeLevelIcons: failed to parse icons JSON, actual type:", String(describing: type(of: icons)))
            return
        }
        
        var volumeIconMap: [AtomicXCore.VolumeLevel: String] = [:]
        for (key, value) in iconsDict {
            let volumeLevel: AtomicXCore.VolumeLevel?
            switch key {
            case "Mute", "mute":
                volumeLevel = .mute
            case "Low", "low":
                volumeLevel = .low
            case "Medium", "medium":
                volumeLevel = .medium
            case "High", "high":
                volumeLevel = .high
            case "Peak", "peak":
                volumeLevel = .peak
            default:
                volumeLevel = nil
            }
            
            if let level = volumeLevel {
                volumeIconMap[level] = value
            }
        }
        
        cachedVolumeLevelIcons = volumeIconMap
        
        if !cachedVolumeLevelIcons.isEmpty {
            nativeCallCoreView?.setVolumeLevelIcons(icons: cachedVolumeLevelIcons)
        }
    }
    
    public func setNetworkQualityIcons(_ icons: Any) {
        console.warn(Self.TAG, "setNetworkQualityIcons:", icons)
        
        guard let iconsStr = icons as? String,
              let data = iconsStr.data(using: .utf8),
              let iconsDict = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            console.error(Self.TAG, "setNetworkQualityIcons: failed to parse icons JSON, actual type:", String(describing: type(of: icons)))
            return
        }
        
        var networkIconMap: [NetworkQuality: String] = [:]
        for (key, value) in iconsDict {
            let networkQuality: NetworkQuality?
            switch key {
            case "UNKNOWN", "unknown":
                networkQuality = .unknown
            case "EXCELLENT", "excellent":
                networkQuality = .excellent
            case "GOOD", "good":
                networkQuality = .good
            case "POOR", "poor":
                networkQuality = .poor
            case "BAD", "bad":
                networkQuality = .bad
            case "VERY_BAD", "veryBad", "very_bad":
                networkQuality = .veryBad
            case "DOWN", "down":
                networkQuality = .down
            default:
                networkQuality = nil
            }
            
            if let quality = networkQuality {
                networkIconMap[quality] = value
            }
        }
        
        cachedNetworkQualityIcons = networkIconMap
        
        if !cachedNetworkQualityIcons.isEmpty {
            nativeCallCoreView?.setNetworkQualityIcons(icons: cachedNetworkQualityIcons)
        }
    }
    
    public func setParticipantAvatars(_ avatars: Any) {
        console.warn(Self.TAG, "setParticipantAvatars:", avatars)
        
        guard let avatarsStr = avatars as? String,
              let data = avatarsStr.data(using: .utf8),
              let avatarsDict = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            console.error(Self.TAG, "setParticipantAvatars: failed to parse avatars JSON, actual type:", String(describing: type(of: avatars)))
            return
        }
        
        cachedParticipantAvatars = avatarsDict
        
        if !cachedParticipantAvatars.isEmpty {
            nativeCallCoreView?.setParticipantAvatars(avatars: cachedParticipantAvatars)
        }
    }
    
    public func initializeView() {
        console.warn(Self.TAG, "initializeView")
        
        if isNativeViewInitialized {
            console.warn(Self.TAG, "initializeView: already initialized")
            return
        }
        
        subviews.forEach { $0.removeFromSuperview() }
        
        let nativeView = AtomicXCore.CallCoreView(frame: bounds)
        
        nativeView.setLayoutTemplate(cachedLayoutTemplate)
        
        if !cachedWaitingAnimation.isEmpty {
            nativeView.setWaitingAnimation(path: cachedWaitingAnimation)
        }
        
        if !cachedVolumeLevelIcons.isEmpty {
            nativeView.setVolumeLevelIcons(icons: cachedVolumeLevelIcons)
        }
        
        if !cachedNetworkQualityIcons.isEmpty {
            nativeView.setNetworkQualityIcons(icons: cachedNetworkQualityIcons)
        }
        
        if !cachedParticipantAvatars.isEmpty {
            nativeView.setParticipantAvatars(avatars: cachedParticipantAvatars)
        }
        
        nativeView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(nativeView)
        
        NSLayoutConstraint.activate([
            nativeView.leadingAnchor.constraint(equalTo: leadingAnchor),
            nativeView.trailingAnchor.constraint(equalTo: trailingAnchor),
            nativeView.topAnchor.constraint(equalTo: topAnchor),
            nativeView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
        
        nativeCallCoreView = nativeView
        isNativeViewInitialized = true
        
        console.log(Self.TAG, "initializeView success")
    }
}
