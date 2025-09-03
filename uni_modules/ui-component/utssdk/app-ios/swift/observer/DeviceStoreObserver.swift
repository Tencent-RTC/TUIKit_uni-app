import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class DeviceStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = DeviceStoreObserver()
        
    public func deviceStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.microphoneStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("microphoneStatus", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.microphoneStatusReason))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("microphoneStatusReason", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.microphoneLastError))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("microphoneLastError", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.captureVolume))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("captureVolume", String(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.cameraStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("cameraStatus", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.cameraStatusReason))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("cameraStatusReason", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.isFrontCamera))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("isFrontCamera", String(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.isLocalMirror))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("isLocalMirror", String(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.localVideoQuality))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                guard let value = value else { return }
                callback("localVideoQuality", convertVideoQuality(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.cameraLastError))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("cameraLastError", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.currentAudioRoute))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("currentAudioRoute", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.screenStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("screenStatus", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.screenStatusReason))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("screenStatusReason", String(value.rawValue))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getDeviceStore()
            .state.subscribe(StateSelector(keyPath: \V2DeviceState.networkInfo))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(convertNetworkInfo(value)) {
                    callback("networkInfo", json)
                }
            })
            .store(in: &cancellables)
    }
    
    private func convertNetworkInfo(_ info: TUINetworkInfo) -> [String: Any] {
        var map = [String: Any]()
        map["userId"] = info.userId ?? ""
        map["quality"] = convertNetworkQuality(info.quality)
        map["upLoss"] = info.upLoss
        map["downLoss"] = info.downLoss
        map["delay"] = info.delay
        return map
    }
    
    private func convertNetworkQuality(_ quality: TUINetworkQuality?) -> String {
        guard let quality = quality else {
            return "UNKNOWN"
        }
        switch quality {
            case .veryBad:
                return "VBAD"
            case .bad:
                return "BAD"
            case .down:
                return "DOWN"
            case .poor:
                return "POOR"
            case .good:
                return "GOOD"
            case .excellent:
                return "EXCELLENT"
            default:
                return "UNKNOWN"
        }
    }
    
    private func convertVideoQuality(_ quality: TUIVideoQuality) -> String {
        switch quality {
            case TUIVideoQuality.quality540P:
                return "540P"
            case TUIVideoQuality.quality720P:
                return "720P"
            case TUIVideoQuality.quality1080P:
                return "1080P"
            default:
                return "360P"
        }
    }
} 
