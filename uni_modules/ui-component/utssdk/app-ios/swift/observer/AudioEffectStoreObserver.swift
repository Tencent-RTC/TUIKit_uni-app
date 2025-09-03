import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class AudioEffectStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = AudioEffectStoreObserver()

    public func audioEffectStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()
    
        V2RTCRoomEngine.shared.getAudioEffectStore()
            .state.subscribe(StateSelector(keyPath: \V2AudioEffectState.isEarMonitorOpened))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("isEarMonitorOpened", String(value))
            })
            .store(in: &cancellables)
    
        V2RTCRoomEngine.shared.getAudioEffectStore()
            .state.subscribe(StateSelector(keyPath: \V2AudioEffectState.earMonitorVolume))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("earMonitorVolume", String(value))
            })
            .store(in: &cancellables)
    
        V2RTCRoomEngine.shared.getAudioEffectStore()
            .state.subscribe(StateSelector(keyPath: \V2AudioEffectState.microphoneVolume))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("microphoneVolume", String(value))
            })
            .store(in: &cancellables)
        V2RTCRoomEngine.shared.getAudioEffectStore()
            .state.subscribe(StateSelector(keyPath: \V2AudioEffectState.changerType))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("changerType", String(value.rawValue))
            })
            .store(in: &cancellables)
        V2RTCRoomEngine.shared.getAudioEffectStore()
            .state.subscribe(StateSelector(keyPath: \V2AudioEffectState.reverbType))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("reverbType", String(value.rawValue))
            })
            .store(in: &cancellables)
    }
}