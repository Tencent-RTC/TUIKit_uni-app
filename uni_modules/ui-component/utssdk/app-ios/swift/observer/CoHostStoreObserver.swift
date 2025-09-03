import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class CoHostStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = CoHostStoreObserver()

    public func coHostStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2CoHostState.localStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                callback("localStatus", String(value.rawValue))
            })
            .store(in: &cancellables)

        let arrayKeys: [(String, KeyPath<V2CoHostState, [SeatUserInfo]>)] = [
            ("invitees", \V2CoHostState.invitees),
            ("applicants", \V2CoHostState.applicants),
            ("connectedHosts", \V2CoHostState.connectedHosts),
            ("invitableHosts", \V2CoHostState.invitableHosts),
        ]
        for (key, kp) in arrayKeys {
            V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
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

        // let requestKeys: [(String, KeyPath<V2CoHostState, CoHostRequestInfo?>)] = [
        //     ("latestReceivedRequest", \V2CoHostState.latestReceivedRequest),
        //     ("latestCancelledRequest", \V2CoHostState.latestCancelledRequest),
        //     ("latestAcceptedRequest", \V2CoHostState.latestAcceptedRequest),
        //     ("latestRejectedRequest", \V2CoHostState.latestRejectedRequest),
        //     ("latestTimeoutRequest", \V2CoHostState.latestTimeoutRequest),
        // ]
        // for (key, kp) in requestKeys {
        //     V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
        //         .state.subscribe(StateSelector(keyPath: kp), removeDuplicates: false)
        //         .compactMap{ $0 }
        //         .receive(on: DispatchQueue.main)
        //         .sink(receiveValue: { [weak self] req in
        //             guard let self = self else { return }
        //             if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
        //                 callback(key, json)
        //             } else {
        //                 callback(key, "")
        //             }
        //         })
        //         .store(in: &cancellables)
        // }

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .latestReceivedRequest
            .receive(on: RunLoop.main)
            .sink { [weak self] req in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
                    callback("latestReceivedRequest", json)
                } else {
                    callback("latestReceivedRequest", "")
                }
            }
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .latestCancelledRequest
            .receive(on: RunLoop.main)
            .sink { [weak self] req in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
                    callback("latestCancelledRequest", json)
                } else {
                    callback("latestCancelledRequest", "")
                }
            }
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .latestAcceptedRequest
            .receive(on: RunLoop.main)
            .sink { [weak self] req in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
                    callback("latestAcceptedRequest", json)
                } else {
                    callback("latestAcceptedRequest", "")
                }
            }
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .latestRejectedRequest
            .receive(on: RunLoop.main)
            .sink { [weak self] req in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
                    callback("latestRejectedRequest", json)
                } else {
                    callback("latestRejectedRequest", "")
                }
            }
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getCoHostStore(liveId: liveId)
            .latestTimeoutRequest
            .receive(on: RunLoop.main)
            .sink { [weak self] req in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(self.convertCoHostRequestInfoToDic(info: req)) {
                    callback("latestTimeoutRequest", json)
                } else {
                    callback("latestTimeoutRequest", "")
                }
            }
            .store(in: &cancellables)
    }

    private func convertCoHostRequestInfoToDic(info: CoHostRequestInfo) -> [String: Any] {
        return [
            "inviter": info.inviter != nil ? TypeConvert.convertSeatUserInfoToDic(userInfo: info.inviter!) : NSNull(),
            "inviteeList": info.inviteeList.map { TypeConvert.convertSeatUserInfoToDic(userInfo: $0) },
            "extensionInfo": info.extensionInfo,
        ]
    }
}
