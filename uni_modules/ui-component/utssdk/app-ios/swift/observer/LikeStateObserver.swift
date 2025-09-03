import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LikeStateObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LikeStateObserver()

    public func likeStateChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getLikeStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LikeState.totalLikeCount))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] totalLikeCount in
                guard let self = self else { return }
                callback("totalLikeCount", String(totalLikeCount))
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLikeStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LikeState.latestSender))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] latestSender in
                guard let self = self else { return }
                guard let latestSender = latestSender else { return }
                let dic = TypeConvert.convertTUIUserInfoToDic(userInfo: latestSender)
                if let json = JsonUtil.toJson(dic) {
                    callback("latestSender", json)
                }
            })
            .store(in: &cancellables)
    }
}
