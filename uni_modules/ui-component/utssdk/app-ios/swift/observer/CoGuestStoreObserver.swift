import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class CoGuestStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = CoGuestStoreObserver()
    
    public func coGuestStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getCoGuestStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2CoGuestState.localStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("localStatus", String(value.rawValue))
            })
            .store(in: &cancellables)

        let arrayKeys: [(String, KeyPath<V2CoGuestState, [SeatUserInfo]>)] = [
            ("invitees", \V2CoGuestState.invitees),
            ("applicants", \V2CoGuestState.applicants),
            ("connectedGuests", \V2CoGuestState.connectedGuests),
            ("invitableGuests", \V2CoGuestState.invitableGuests),
        ]
        for (key, kp) in arrayKeys {
            V2RTCRoomEngine.shared.getCoGuestStore(liveId: liveId)
                .state.subscribe(StateSelector(keyPath: kp))
                .removeDuplicates()
                .receive(on: DispatchQueue.main)
                .sink(receiveValue: { [weak self] arr in
                    guard let self = self else { return }
                    let list = arr.map { TypeConvert.convertSeatUserInfoToDic(userInfo: $0) }
                    if let json = JsonUtil.toJson(list) {
                        callback(key, json)
                    }
                })
                .store(in: &cancellables)
        }

        let requestKeys: [(String, KeyPath<V2CoGuestState, CoGuestRequestInfo?>)] = [
            ("latestReceivedRequest", \V2CoGuestState.latestReceivedRequest),
            ("latestCancelledRequest", \V2CoGuestState.latestCancelledRequest),
            ("latestAcceptedRequest", \V2CoGuestState.latestAcceptedRequest),
            ("latestRejectedRequest", \V2CoGuestState.latestRejectedRequest),
            ("latestTimeoutRequest", \V2CoGuestState.latestTimeoutRequest),
        ]
        for (key, kp) in requestKeys {
            V2RTCRoomEngine.shared.getCoGuestStore(liveId: liveId)
                .state.subscribe(StateSelector(keyPath: kp))
                .removeDuplicates()
                .receive(on: DispatchQueue.main)
                .sink(receiveValue: { [weak self] req in
                    guard let self = self else { return }
                    if let req = req, let json = JsonUtil.toJson(self.convertCoGuestRequestInfoToDic(info: req)) {
                        callback(key, json)
                    } else {
                        callback(key, "")
                    }
                })
                .store(in: &cancellables)
        }
    }

    private func convertCoGuestRequestInfoToDic(info: CoGuestRequestInfo) -> [String: Any] {
        return [
            "requestId": info.requestId,
            "userId": info.userId,
            "userName": info.userName,
            "nameCard": info.nameCard,
            "avatarUrl": info.avatarUrl,
            "timestamp": info.timestamp,
        ]
    }
}