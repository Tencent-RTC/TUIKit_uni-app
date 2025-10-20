import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class DeviceStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = DeviceStoreObserver()

    public func deviceStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.microphoneStatus))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("microphoneStatus", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.microphoneLastError))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("microphoneLastError", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.captureVolume))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("captureVolume", String(value))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.currentMicVolume))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("currentMicVolume", String(value))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.outputVolume))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("outputVolume", String(value))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.cameraStatus))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("cameraStatus", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.cameraLastError))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("cameraLastError", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.isFrontCamera))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("isFrontCamera", String(value))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.localMirrorType))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(convertLocalMirrorType(value)) {
                    callback("localMirrorType", json)
                }
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.localVideoQuality))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("localVideoQuality", convertVideoQuality(value))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.currentAudioRoute))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("currentAudioRoute", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.screenStatus))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("screenStatus", String(value.rawValue))
            }).store(in: &cancellables)

        DeviceStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \DeviceState.networkInfo))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(convertNetworkInfo(value)) {
                    callback("networkInfo", json)
                }
            }).store(in: &cancellables)
    }

    private func convertNetworkInfo(_ info: NetworkInfo) -> [String: Any] {
        var map = [String: Any]()
        map["userID"] = info.userID ?? ""
        map["quality"] = convertNetworkQuality(info.quality)
        map["upLoss"] = info.upLoss
        map["downLoss"] = info.downLoss
        map["delay"] = info.delay
        return map
    }

    private func convertNetworkQuality(_ quality: NetworkQuality?) -> String {
        guard let quality = quality else {
            return "UNKNOWN"
        }
        switch quality {
        case .excellent:
            return "EXCELLENT"
        case .good:
            return "GOOD"
        case .poor:
            return "POOR"
        case .veryBad:
            return "VBAD"
        case .bad:
            return "BAD"
        case .down:
            return "DOWN"
        default:
            return "UNKNOWN"
        }
    }

    private func convertVideoQuality(_ quality: VideoQuality) -> String {
        switch quality {
        case VideoQuality.quality540P:
            return "540P"
        case VideoQuality.quality720P:
            return "720P"
        case VideoQuality.quality1080P:
            return "1080P"
        default:
            return "360P"
        }
    }
    private func convertLocalMirrorType(_ type: MirrorType) -> String {
        switch type {
        case MirrorType.enable:
            return "ENABLE"
        case MirrorType.disable:
            return "DISABLE"
        default:
            return "AUTO"
        }
    }
}
