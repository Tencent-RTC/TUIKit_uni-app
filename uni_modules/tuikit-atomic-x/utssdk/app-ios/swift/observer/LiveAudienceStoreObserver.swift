import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class LiveAudienceStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var audienceCancellables = Set<AnyCancellable>()
    public static let shared = LiveAudienceStoreObserver()

    public func liveAudienceStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        LiveAudienceStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LiveAudienceState.audienceList))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { audienceList in
                let dict = audienceList.map {
                    TypeConvert.convertLiveUserInfoToDic(liveUserInfo: $0)
                }
                if let jsonList = JsonUtil.toJson(dict) {
                    callback("audienceList", jsonList)
                }
            })
            .store(in: &cancellables)

        LiveAudienceStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LiveAudienceState.audienceCount))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { count in
                callback("audienceCount", String(count))
            }).store(in: &cancellables)
    }

    public func setupAudienceEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        audienceCancellables.removeAll()
        LiveAudienceStore.create(liveID: liveID).liveAudienceEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onAudienceJoined(let audience):
                    let dict: [String: Any] = [
                        "audience" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: audience)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onAudienceJoined", json)
                    }
                case .onAudienceLeft(let audience):
                    let dict: [String: Any] = [
                        "audience" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: audience)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onAudienceLeft", json)
                    }
                    break
                }
            }.store(in: &audienceCancellables)
    }
}
