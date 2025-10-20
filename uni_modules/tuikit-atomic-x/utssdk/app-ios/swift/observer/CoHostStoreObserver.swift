import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class CoHostStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var coHostEventCancellables = Set<AnyCancellable>()
    public static let shared = CoHostStoreObserver()

    public func coHostStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        CoHostStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \CoHostState.coHostStatus))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                var coHostStatus = "DISCONNECTED"
                if value == .connected {
                    coHostStatus = "CONNECTED"
                }
                if let json = JsonUtil.toJson(coHostStatus) {
                    callback("coHostStatus", json)
                }
            }).store(in: &cancellables)

        CoHostStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \CoHostState.connected))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { arr in
                let dict = arr.map { TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0) }
                if let json = JsonUtil.toJson(dict) {
                    callback("connected", json)
                }
            }).store(in: &cancellables)
        //TODO: 底层未实现，暂时删除
        // CoHostStore.create(liveID: liveID)
        //     .state.subscribe(StatePublisherSelector(keyPath: \CoHostState.candidates))
        //     .receive(on: DispatchQueue.main)
        //     .sink(receiveValue: { arr in
        //         let dict = arr.map { TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0) }
        //         if let json = JsonUtil.toJson(dict) {
        //             callback("candidates", json)
        //         }
        //     }).store(in: &cancellables)

        CoHostStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \CoHostState.invitees))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { arr in
                let dict = arr.map { TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0) }
                if let json = JsonUtil.toJson(dict) {
                    callback("invitees", json)
                }
            }).store(in: &cancellables)

        CoHostStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \CoHostState.applicant))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] value in
                guard let self = self else { return }
                guard let value = value else { return }
                let userInfo = TypeConvert.convertSeatUserInfoToDic(seatUserInfo: value)
                if let json = JsonUtil.toJson(userInfo) {
                    callback("applicant", json)
                }
            }).store(in: &cancellables)
    }

    public func setupCoHostEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        coHostEventCancellables.removeAll()
        CoHostStore.create(liveID: liveID).coHostEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onCoHostRequestReceived(let inviter, let extensionInfo):
                    var dict: [String: Any] = [
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "extensionInfo": extensionInfo,
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostRequestReceived", json)
                    }
                case .onCoHostRequestCancelled(let inviter, let invitee):
                    var dict: [String: Any] = [
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                    ]
                    if let invitee = invitee {
                        dict["invitee"] = TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee)
                    }
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostRequestCancelled", json)
                    }
                case .onCoHostRequestAccepted(let invitee):
                    var dict: [String: Any] = [
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostRequestAccepted", json)
                    }
                case .onCoHostRequestRejected(let invitee):
                    var dict: [String: Any] = [
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostRequestRejected", json)
                    }
                case .onCoHostRequestTimeout(let inviter, let invitee):
                    var dict: [String: Any] = [
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostRequestTimeout", json)
                    }
                case .onCoHostUserJoined(let userInfo):
                    var dict: [String: Any] = [
                        "userInfo": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: userInfo)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostUserJoined", json)
                    }
                case .onCoHostUserLeft(let userInfo):
                    var dict: [String: Any] = [
                        "userInfo": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: userInfo)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onCoHostUserLeft", json)
                    }
                }
            }.store(in: &coHostEventCancellables)
    }
}
