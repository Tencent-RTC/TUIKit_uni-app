import AtomicXCore
import Combine
import DCloudUTSFoundation
import Foundation
import RTCRoomEngine

public class LiveListStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var liveListEventCancellables = Set<AnyCancellable>()
    public static let shared = LiveListStoreObserver()

    public func liveStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        LiveListStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \LiveListState.liveList))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] liveList in
                guard let self = self else { return }
                let dict = liveList.map { TypeConvert.convertLiveInfoToDic(liveInfo: $0) }
                if let jsonList = JsonUtil.toJson(dict) {
                    callback("liveList", jsonList)
                }
            }).store(in: &cancellables)

        LiveListStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \LiveListState.liveListCursor))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { liveListCursor in
                if let json = JsonUtil.toJson(liveListCursor) {
                    callback("liveListCursor", json)
                }
            }).store(in: &cancellables)

        LiveListStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \LiveListState.currentLive))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] liveInfo in
                guard let self = self else { return }
                let dict = TypeConvert.convertLiveInfoToDic(liveInfo: liveInfo)
                if let json = JsonUtil.toJson(dict) {
                    callback("currentLive", json)
                }
            }).store(in: &cancellables)
    }

    public func setupLiveListEvent(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        liveListEventCancellables.removeAll()
        LiveListStore.shared.liveListEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onLiveEnded(let liveID, let reason, let message):
                    var dict: [String: Any] = [:]
                    dict["liveID"] = liveID
                    dict["reason"] = convertLiveEndedReason(reason)
                    dict["message"] = message
                    if let json = JsonUtil.toJson(dict) {
                        callback("onLiveEnded", json)
                    }
                case .onKickedOutOfLive(let liveID, let reason, let message):
                    var dict: [String: Any] = [:]
                    dict["liveID"] = liveID
                    dict["reason"] = convertLiveKickedOutReason(reason)
                    dict["message"] = message
                    if let json = JsonUtil.toJson(dict) {
                        callback("onKickedOutOfLive", json)
                    }
                }
            }.store(in: &liveListEventCancellables)
    }

    private func convertLiveEndedReason(_ reason: LiveEndedReason) -> String {
        if reason == LiveEndedReason.endedByServer {
            return "ENDED_BY_SERVER"
        }
        return "ENDED_BY_HOST"
    }

    private func convertLiveKickedOutReason(_ reason: LiveKickedOutReason) -> String {
        switch reason {
        case .byLoggedOnOtherDevice:
            return "BY_LOGGED_ON_OTHER_DEVICE"
        case .byServer:
            return "BY_SERVER"
        case .forNetworkDisconnected:
            return "FOR_NETWORK_DISCONNECTED"
        case .forJoinRoomStatusInvalidDuringOffline:
            return "FOR_JOIN_ROOM_STATUS_INVALID_DURING_OFFLINE"
        case .forCountOfJoinedRoomsExceedLimit:
            return "FOR_COUNT_OF_JOINED_ROOMS_EXCEED_LIMIT"
        default:
            return "BY_ADMIN"
        }
    }
}
