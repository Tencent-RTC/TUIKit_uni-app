import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LiveStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LiveStoreObserver()

    public func liveStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getLiveStore()
            .state.subscribe(StateSelector(keyPath: \V2LiveState.liveList))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] liveList in
                guard let self = self else { return }
                var list = []
                for liveInfo in liveList {
                    list.append(convertLiveInfoToDic(liveInfo: liveInfo))
                }
                if let jsonList = JsonUtil.toJson(list) {
                    callback("liveList", jsonList)
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLiveStore()
            .state.subscribe(StateSelector(keyPath: \V2LiveState.liveListCursor))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] cursor in
                guard let self = self else { return }
                callback("liveListCursor", cursor)
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLiveStore()
            .state.subscribe(StateSelector(keyPath: \V2LiveState.currentLive))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] liveInfo in
                guard let self = self else { return }
                if let liveInfo = liveInfo {
                    let dict = convertLiveInfoToDic(liveInfo: liveInfo)
                    if let json = JsonUtil.toJson(dict) {
                        callback("currentLive", json)
                    }
                } else {
                    callback("currentLive", "")
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLiveStore()
            .state.subscribe(StateSelector(keyPath: \V2LiveState.localLiveStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] status in
                guard let self = self else { return }
                callback("localLiveStatus", String(status.rawValue))
            })
            .store(in: &cancellables)
    }

    private func convertLiveInfoToDic(liveInfo: LiveInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "liveId": liveInfo.liveId,
            "liveName": liveInfo.liveName ?? "",
            "liveDescription": liveInfo.liveDescription ?? "",
            "categoryList": liveInfo.categoryList ?? [],
            "coverUrl": liveInfo.coverUrl ?? "",
            "backgroundUrl": liveInfo.backgroundUrl ?? "",
            "liveOwner": convertTUILoginUserToDic(userInfo: liveInfo.liveOwner),
            "currentViewerCount": liveInfo.currentViewerCount,
            "totalViewerCount": liveInfo.totalViewerCount,
            "createTime": liveInfo.createTime,
            "isMessageDisable": liveInfo.isMessageDisable,
            "isGiftEnabled": liveInfo.isGiftEnabled,
            "isPublicVisible": liveInfo.isPublicVisible,
            "isSeatEnabled": liveInfo.isSeatEnabled,
            "seatMode": convertSeatMode(liveInfo.seatMode),
            "maxSeatCount": liveInfo.maxSeatCount,
            "layoutTemplate": liveInfo.layoutTemplate,
            "customInfo": liveInfo.customInfo,
        ]
        return dict
    }
    private func convertSeatMode(_ mode: TUISeatMode) -> String {
        switch mode {
            case .freeToTake:
                return "FREE_TO_TAKE"
            case .applyToTake:
                return "APPLY_TO_TAKE"
            default:
                return ""
        }
    }
    private func convertTUILoginUserToDic(userInfo: TUILoginUserInfo?) -> [String: Any] {
        let dict: [String: Any] = [
            "userId": userInfo?.userId ?? "",
            "userName": userInfo?.userName ?? "",
            "avatarUrl": userInfo?.avatarUrl ?? "",
        ]
        return dict
    }
}
