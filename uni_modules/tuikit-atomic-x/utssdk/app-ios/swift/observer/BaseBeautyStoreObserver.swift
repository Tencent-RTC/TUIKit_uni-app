import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class BaseBeautyStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = BaseBeautyStoreObserver()

    public func beautyStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        BaseBeautyStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \BaseBeautyState.smoothLevel))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("smoothLevel", String(value))
            }).store(in: &cancellables)

        BaseBeautyStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \BaseBeautyState.whitenessLevel))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("whitenessLevel", String(value))
            }).store(in: &cancellables)

        BaseBeautyStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \BaseBeautyState.ruddyLevel))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                callback("ruddyLevel", String(value))
            }).store(in: &cancellables)
    }
}
