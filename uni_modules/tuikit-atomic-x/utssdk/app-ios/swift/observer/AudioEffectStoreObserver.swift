import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class AudioEffectStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = AudioEffectStoreObserver()

    public func audioEffectStoreChanged(
        _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        AudioEffectStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \AudioEffectState.audioChangerType))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("audioChangerType", String(value.rawValue))
            }).store(in: &cancellables)

        AudioEffectStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \AudioEffectState.audioReverbType))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("audioReverbType", String(value.rawValue))
            }).store(in: &cancellables)

        AudioEffectStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \AudioEffectState.isEarMonitorOpened))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("isEarMonitorOpened", String(value))
            }).store(in: &cancellables)

        AudioEffectStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \AudioEffectState.earMonitorVolume))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("earMonitorVolume", String(value))
            }).store(in: &cancellables)
    }
}
