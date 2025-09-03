import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LiveAudienceStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LiveAudienceStoreObserver()
    
    public func liveAudienceStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getLiveAudienceStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LiveAudienceState.audienceList))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] audienceList in
                guard let self = self else { return }
                var list: [[String: Any]] = []
                for info in audienceList {
                    list.append(convertAudienceInfoToDic(info: info))
                }
                if let jsonList = JsonUtil.toJson(list) {
                    callback("audienceList", jsonList)
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLiveAudienceStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LiveAudienceState.audienceListCursor))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] cursor in
                guard let self = self else { return }
                if let cursor = cursor {
                    callback("audienceListCursor", String(cursor))
                } else {
                    callback("audienceListCursor", "")
                }
            })
            .store(in: &cancellables)
    }

    private func convertAudienceInfoToDic(info: AudienceInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "userId": info.userId,
            "userName": info.userName,
            "avatarUrl": info.avatarUrl,
            "customInfo": info.customInfo,
            "userRole": TypeConvert.convertUserRole(info.userRole),
            "isMessageDisabled": info.isMessageDisabled,
            "joinedTimestamp": info.joinedTimestamp,
        ]
        return dict
    }   
}
