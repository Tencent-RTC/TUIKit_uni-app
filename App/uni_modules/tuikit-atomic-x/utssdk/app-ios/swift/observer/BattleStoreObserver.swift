import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class BattleStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var battleEventCancellables = Set<AnyCancellable>()
    public static let shared = BattleStoreObserver()

    public func battleStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        BattleStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \BattleState.currentBattleInfo))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] currentBattleInfo in
                guard let self = self else { return }
                if let battleInfo = currentBattleInfo {
                    if let json = JsonUtil.toJson(
                        self.convertBattleInfoToDic(battleInfo: battleInfo))
                    {
                        callback("currentBattleInfo", json)
                    }
                }
            }).store(in: &cancellables)

        BattleStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \BattleState.battleUsers))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] battleUsers in
                guard let self = self else { return }
                let userList = battleUsers.map {
                    TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0)
                }
                if let json = JsonUtil.toJson(userList) {
                    callback("battleUsers", json)
                }
            }).store(in: &cancellables)

        BattleStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \BattleState.battleScore))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] battleScore in
                guard let self = self else { return }
                if let json = JsonUtil.toJson(battleScore) {
                    callback("battleScore", json)
                }
            }).store(in: &cancellables)
    }

    private func convertBattleInfoToDic(battleInfo: BattleInfo) -> [String: Any] {
        return [
            "battleID": battleInfo.battleID,
            "config": convertBattleConfigToDic(config: battleInfo.config),
            "startTime": battleInfo.startTime,
            "endTime": battleInfo.endTime,
        ]
    }

    private func convertBattleConfigToDic(config: BattleConfig) -> [String: Any] {
        return [
            "duration": config.duration,
            "needResponse": config.needResponse,
            "extensionInfo": config.extensionInfo,
        ]
    }

    public func setupBattleEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        battleEventCancellables.removeAll()
        BattleStore.create(liveID: liveID).battleEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onBattleStarted(let battleInfo, let inviter, let invitees):
                    let dict: [String: Any] = [
                        "battleInfo": self.convertBattleInfoToDic(battleInfo: battleInfo),
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitees": invitees.map {
                            TypeConvert.convertSeatUserInfoToDic(seatUserInfo: $0)
                        },
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleStarted", json)
                    }
                case .onBattleEnded(let battleInfo, let reason):
                    let reasonStr = reason == .allMemberExit ? "ALL_MEMBER_EXIT" : "TIME_OVER"
                    let dict: [String: Any] = [
                        "battleInfo": self.convertBattleInfoToDic(battleInfo: battleInfo),
                        "reason": reasonStr,
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleEnded", json)
                    }
                case .onUserJoinBattle(let battleID, let battleUser):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "battleUser": TypeConvert.convertSeatUserInfoToDic(
                            seatUserInfo: battleUser),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onUserJoinBattle", json)
                    }
                case .onUserExitBattle(let battleID, let battleUser):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "battleUser": TypeConvert.convertSeatUserInfoToDic(
                            seatUserInfo: battleUser),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onUserExitBattle", json)
                    }
                case .onBattleRequestReceived(let battleID, let inviter, let invitee):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleRequestReceived", json)
                    }
                case .onBattleRequestCancelled(let battleID, let inviter, let invitee):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleRequestCancelled", json)
                    }
                case .onBattleRequestTimeout(let battleID, let inviter, let invitee):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleRequestTimeout", json)
                    }
                case .onBattleRequestAccept(let battleID, let inviter, let invitee):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleRequestAccept", json)
                    }
                case .onBattleRequestReject(let battleID, let inviter, let invitee):
                    let dict: [String: Any] = [
                        "battleID": battleID,
                        "inviter": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: inviter),
                        "invitee": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: invitee),
                    ]
                    if let json = JsonUtil.toJson(dict) {
                        callback("onBattleRequestReject", json)
                    }
                }
            }.store(in: &battleEventCancellables)
    }
}
