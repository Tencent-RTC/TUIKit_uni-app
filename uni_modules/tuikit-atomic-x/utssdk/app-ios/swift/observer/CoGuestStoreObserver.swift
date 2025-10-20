import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class CoGuestStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var hostEventCancellables = Set<AnyCancellable>()
    private var guestEventCancellables = Set<AnyCancellable>()
    public static let shared = CoGuestStoreObserver()

    public func coGuestStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()
        CoGuestStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \CoGuestState.connected))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { arr in
                let dict = arr.map { TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0) }
                if let json = JsonUtil.toJson(dict) {
                    callback("connected", json)
                }
            }).store(in: &cancellables)

        let arrayKeys: [(String, KeyPath<CoGuestState, [LiveUserInfo]>)] = [
            ("invitees", \CoGuestState.invitees),
            ("applicants", \CoGuestState.applicants),
            ("candidates", \CoGuestState.candidates),
        ]
        for (key, kp) in arrayKeys {
            CoGuestStore.create(liveID: liveID)
                .state.subscribe(StatePublisherSelector(keyPath: kp))
                .receive(on: DispatchQueue.main)
                .sink(receiveValue: { arr in
                    let dict = arr.map { TypeConvert.convertLiveUserInfoToDic(liveUserInfo: $0) }
                    if let json = JsonUtil.toJson(dict) {
                        callback(key, json)
                    }
                }).store(in: &cancellables)
        }
    }

    public func setupHostEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        hostEventCancellables.removeAll()
        CoGuestStore.create(liveID: liveID).hostEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onGuestApplicationReceived(let guestUser):
                    let dict: [String: Any] = [
                        "guestUser" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: guestUser)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onGuestApplicationReceived", json)
                    }
                case .onGuestApplicationCancelled(let guestUser):
                    let dict: [String: Any] = [
                        "guestUser" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: guestUser)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onGuestApplicationCancelled", json)
                    }
                case .onGuestApplicationProcessedByOtherHost(let guestUser, let hostUser):
                    var dict: [String: Any] = [:]
                    dict["guestUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: guestUser)
                    dict["hostUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: hostUser)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onGuestApplicationProcessedByOtherHost", json)
                    }
                case .onHostInvitationResponded(let isAccept, let guestUser):
                    var dict: [String: Any] = [:]
                    dict["isAccept"] = isAccept
                    dict["guestUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: guestUser)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onHostInvitationResponded", json)
                    }
                case .onHostInvitationNoResponse(let guestUser, let reason):
                    var dict: [String: Any] = [:]
                    dict["guestUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: guestUser)
                    dict["reason"] = convertNoResponseReason(reason)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onHostInvitationNoResponse", json)
                    }
                }
            }.store(in: &hostEventCancellables)
    }

    private func convertNoResponseReason(_ reason: NoResponseReason) -> String {
        if reason == NoResponseReason.alreadySeated {
            return "ALREADY_SEATED"
        }
        return "TIMEOUT"
    }

    public func setupGuestEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        guestEventCancellables.removeAll()
        CoGuestStore.create(liveID: liveID).guestEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onHostInvitationReceived(let hostUser):
                    let dict: [String: Any] = [
                        "hostUser" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: hostUser)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onHostInvitationReceived", json)
                    }
                case .onHostInvitationCancelled(let hostUser):
                    let dict: [String: Any] = [
                        "hostUser" : TypeConvert.convertLiveUserInfoToDic(liveUserInfo: hostUser)
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onHostInvitationCancelled", json)
                    }
                case .onGuestApplicationResponded(let isAccept, let hostUser):
                    var dict: [String: Any] = [:]
                    dict["isAccept"] = isAccept
                    dict["hostUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: hostUser)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onGuestApplicationResponded", json)
                    }
                case .onGuestApplicationNoResponse(let reason):
                    var dict: [String: Any] = [:]
                    dict["reason"] = convertNoResponseReason(reason)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onGuestApplicationNoResponse", json)
                    }
                case .onKickedOffSeat(let seatIndex, let hostUser):
                    var dict: [String: Any] = [:]
                    dict["seatIndex"] = seatIndex
                    dict["hostUser"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: hostUser)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onKickedOffSeat", json)
                    }
                }
            }.store(in: &guestEventCancellables)
    }
}
