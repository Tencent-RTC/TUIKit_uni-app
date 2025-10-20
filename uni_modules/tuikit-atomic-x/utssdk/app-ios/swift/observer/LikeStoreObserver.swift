import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class LikeStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var likeEventCancellables = Set<AnyCancellable>()
    public static let shared = LikeStoreObserver()

    public func likeStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()
        LikeStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LikeState.totalLikeCount))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { totalLikeCount in
                callback("totalLikeCount", String(totalLikeCount))
            }).store(in: &cancellables)
    }
    
    public func setupLikeEvent(_ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        likeEventCancellables.removeAll()
        LikeStore.create(liveID: liveID).likeEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onReceiveLikesMessage(liveID: let liveID, totalLikesReceived: let totalLikesReceived, sender: let sender):
                    var dict: [String: Any] = [:]
                    dict["liveID"] = liveID
                    dict["totalLikesReceived"] = totalLikesReceived
                    dict["sender"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: sender)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onReceiveLikesMessage", json)
                    }
                }
            }.store(in: &likeEventCancellables)
    }
}
