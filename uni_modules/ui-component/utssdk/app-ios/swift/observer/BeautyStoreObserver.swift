import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class BeautyStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = BeautyStoreObserver()

    public func beautyStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getBaseBeautyStore()
            .state.subscribe(StateSelector(keyPath: \V2BaseBeautyState.smoothLevel))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("smoothLevel", String(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getBaseBeautyStore()
            .state.subscribe(StateSelector(keyPath: \V2BaseBeautyState.whitenessLevel))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("whitenessLevel", String(value))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getBaseBeautyStore()
            .state.subscribe(StateSelector(keyPath: \V2BaseBeautyState.ruddyLevel))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("ruddyLevel", String(value))
            })
            .store(in: &cancellables)
    }
} 