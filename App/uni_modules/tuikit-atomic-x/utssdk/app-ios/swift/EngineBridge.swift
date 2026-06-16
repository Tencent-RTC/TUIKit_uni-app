import DCloudUTSFoundation
import Foundation
import RTCRoomEngine

// MARK: - Public protocols

@objc public protocol EngineBridgeResultCallback: NSObjectProtocol {
    func onResult(_ code: Int, _ message: String, _ data: String)
}

/// uts 侧持有同一份 callback 实例进行 add / remove，按引用相等判定。
@objc public protocol EngineBridgeObserver: NSObjectProtocol {
    func onEvent(_ eventName: String, _ jsonData: String)
}

// MARK: - EngineBridge

/// uts ↔ native 引擎统一桥接入口（iOS）。
/// invoke 按 api 分发到 query / conference / participant / 通用 call；
/// 事件统一为 `(eventName, jsonData)` fan-out 给所有 uts observer。
@objc public final class EngineBridge: NSObject {

    // MARK: - API key 常量

    // Conference API
    static let GET_SCHEDULED_ROOM_LIST     = "roomStore.getScheduledRoomList"
    static let GET_SCHEDULED_ATTENDEES     = "roomStore.getScheduledAttendees"
    static let SCHEDULE_ROOM               = "roomStore.scheduleRoom"
    static let UPDATE_SCHEDULED_ROOM       = "roomStore.updateScheduledRoom"
    static let ADD_SCHEDULED_ATTENDEES     = "roomStore.addScheduledAttendees"
    static let REMOVE_SCHEDULED_ATTENDEES  = "roomStore.removeScheduledAttendees"
    static let CANCEL_SCHEDULED_ROOM       = "roomStore.cancelScheduledRoom"
    static let GET_PENDING_CALLS           = "roomStore.getPendingCalls"
    static let CALL_USER_TO_ROOM           = "roomStore.callUserToRoom"
    static let CANCEL_CALL                 = "roomStore.cancelCall"
    static let ACCEPT_CALL                 = "roomStore.acceptCall"
    static let REJECT_CALL                 = "roomStore.rejectCall"

    // Conference Event
    static let EVT_ON_ADDED_TO_SCHEDULED_ROOM      = "roomListener.onAddedToScheduledRoom"
    static let EVT_ON_REMOVED_FROM_SCHEDULED_ROOM  = "roomListener.onRemovedFromScheduledRoom"
    static let EVT_ON_SCHEDULED_ROOM_CANCELLED     = "roomListener.onScheduledRoomCancelled"
    static let EVT_ON_SCHEDULED_ROOM_STARTING_SOON = "roomListener.onScheduledRoomStartingSoon"
    static let EVT_ON_CALL_RECEIVED                = "roomListener.onCallReceived"
    static let EVT_ON_CALL_CANCELLED               = "roomListener.onCallCancelled"
    static let EVT_ON_CALL_TIMEOUT                 = "roomListener.onCallTimeout"
    static let EVT_ON_CALL_ACCEPTED                = "roomListener.onCallAccepted"
    static let EVT_ON_CALL_REJECTED                = "roomListener.onCallRejected"
    static let EVT_ON_CALL_HANDLED_BY_OTHER_DEVICE = "roomListener.onCallHandledByOtherDevice"
    static let EVT_ON_CALL_REVOKED_BY_ADMIN        = "roomListener.onCallRevokedByAdmin"
    static let EVT_ON_SCHEDULE_ATTENDEES_UPDATED   = "roomListener.onScheduleAttendeesUpdated"
    static let EVT_ON_CONFERENCE_STATUS_UPDATED    = "roomListener.onConferenceStatusUpdated"

    // Participant API
    static let TRANSFER_OWNER                  = "roomParticipantStore.transferOwner"
    static let SET_ADMIN                       = "roomParticipantStore.setAdmin"
    static let REVOKE_ADMIN                    = "roomParticipantStore.revokeAdmin"
    static let KICK_USER                       = "roomParticipantStore.kickUser"
    static let UPDATE_PARTICIPANT_NAME_CARD    = "roomParticipantStore.updateParticipantNameCard"
    static let UPDATE_PARTICIPANT_META_DATA    = "roomParticipantStore.updateParticipantMetaData"
    static let CLOSE_PARTICIPANT_DEVICE        = "roomParticipantStore.closeParticipantDevice"
    static let DISABLE_USER_MESSAGE            = "roomParticipantStore.disableUserMessage"
    static let DISABLE_ALL_DEVICES             = "roomParticipantStore.disableAllDevices"
    static let DISABLE_ALL_MESSAGES            = "roomParticipantStore.disableAllMessages"
    static let MUTE_MICROPHONE                 = "roomParticipantStore.muteMicrophone"
    static let UNMUTE_MICROPHONE               = "roomParticipantStore.unmuteMicrophone"
    static let REQUEST_TO_OPEN_DEVICE          = "roomParticipantStore.requestToOpenDevice"
    static let CANCEL_OPEN_DEVICE_REQUEST      = "roomParticipantStore.cancelOpenDeviceRequest"
    static let APPROVE_OPEN_DEVICE_REQUEST     = "roomParticipantStore.approveOpenDeviceRequest"
    static let REJECT_OPEN_DEVICE_REQUEST      = "roomParticipantStore.rejectOpenDeviceRequest"
    static let INVITE_TO_OPEN_DEVICE           = "roomParticipantStore.inviteToOpenDevice"
    static let CANCEL_OPEN_DEVICE_INVITATION   = "roomParticipantStore.cancelOpenDeviceInvitation"
    static let ACCEPT_OPEN_DEVICE_INVITATION   = "roomParticipantStore.acceptOpenDeviceInvitation"
    static let DECLINE_OPEN_DEVICE_INVITATION  = "roomParticipantStore.declineOpenDeviceInvitation"

    // Participant Event
    static let EVT_ON_KICKED_FROM_ROOM                = "roomParticipantListener.onKickedFromRoom"
    static let EVT_ON_DEVICE_REQUEST_RECEIVED         = "roomParticipantListener.onDeviceRequestReceived"
    static let EVT_ON_DEVICE_REQUEST_CANCELLED        = "roomParticipantListener.onDeviceRequestCancelled"
    static let EVT_ON_DEVICE_REQUEST_TIMEOUT          = "roomParticipantListener.onDeviceRequestTimeout"
    static let EVT_ON_DEVICE_REQUEST_APPROVED         = "roomParticipantListener.onDeviceRequestApproved"
    static let EVT_ON_DEVICE_REQUEST_REJECTED         = "roomParticipantListener.onDeviceRequestRejected"
    static let EVT_ON_DEVICE_REQUEST_PROCESSED        = "roomParticipantListener.onDeviceRequestProcessed"
    static let EVT_ON_DEVICE_INVITATION_RECEIVED      = "roomParticipantListener.onDeviceInvitationReceived"
    static let EVT_ON_DEVICE_INVITATION_CANCELLED     = "roomParticipantListener.onDeviceInvitationCancelled"
    static let EVT_ON_DEVICE_INVITATION_TIMEOUT       = "roomParticipantListener.onDeviceInvitationTimeout"
    static let EVT_ON_DEVICE_INVITATION_ACCEPTED      = "roomParticipantListener.onDeviceInvitationAccepted"
    static let EVT_ON_DEVICE_INVITATION_DECLINED      = "roomParticipantListener.onDeviceInvitationDeclined"
    static let EVT_ON_USER_VOICE_VOLUME_CHANGED       = "roomParticipantState.onUserVoiceVolumeChanged"
    static let EVT_ON_USER_NETWORK_QUALITY_CHANGED    = "roomParticipantState.onUserNetworkQualityChanged"
    static let EVT_ON_PARTICIPANT_DEVICE_CLOSED       = "roomParticipantListener.onParticipantDeviceClosed"

    // 会议邀请 / 预约成员事件：SDK 不走 on(key,json)，桥层主动 fan-out 到 ts。
    static let EVT_ON_PARTICIPANT_INVITATION_ADDED          = "roomParticipantState.onInvitationAdded"
    static let EVT_ON_PARTICIPANT_INVITATION_REMOVED        = "roomParticipantState.onInvitationRemoved"
    static let EVT_ON_PARTICIPANT_INVITATION_STATUS_CHANGED = "roomParticipantState.onInvitationStatusChanged"
    static let EVT_ON_PARTICIPANT_SCHEDULE_ATTENDEES_UPDATED = "roomParticipantState.onScheduleAttendeesUpdated"

    static let FETCH_LIST_COUNT: Int = 20

    /// fire-and-forget：底层 query 不通过 callback 返回，结果经 observer 通道 push 回 ts。
    private static let QUERY_API_SET: Set<String> = [
        "roomParticipantState.queryAdminList",
        "roomParticipantState.queryMessageDisabledUserList",
    ]

    private static let CONFERENCE_API_SET: Set<String> = [
        GET_SCHEDULED_ROOM_LIST, GET_SCHEDULED_ATTENDEES, SCHEDULE_ROOM, UPDATE_SCHEDULED_ROOM,
        ADD_SCHEDULED_ATTENDEES, REMOVE_SCHEDULED_ATTENDEES, CANCEL_SCHEDULED_ROOM,
        GET_PENDING_CALLS, CALL_USER_TO_ROOM, CANCEL_CALL, ACCEPT_CALL, REJECT_CALL,
    ]

    private static let PARTICIPANT_API_SET: Set<String> = [
        TRANSFER_OWNER, SET_ADMIN, REVOKE_ADMIN, KICK_USER,
        UPDATE_PARTICIPANT_NAME_CARD, UPDATE_PARTICIPANT_META_DATA, CLOSE_PARTICIPANT_DEVICE,
        DISABLE_USER_MESSAGE, DISABLE_ALL_DEVICES, DISABLE_ALL_MESSAGES,
        MUTE_MICROPHONE, UNMUTE_MICROPHONE,
        REQUEST_TO_OPEN_DEVICE, CANCEL_OPEN_DEVICE_REQUEST,
        APPROVE_OPEN_DEVICE_REQUEST, REJECT_OPEN_DEVICE_REQUEST,
        INVITE_TO_OPEN_DEVICE, CANCEL_OPEN_DEVICE_INVITATION,
        ACCEPT_OPEN_DEVICE_INVITATION, DECLINE_OPEN_DEVICE_INVITATION,
    ]

    // MARK: - 单例 / 内部状态

    private static let shared = EngineBridge()

    /// 主线程串行化：所有 SDK 调用、observer 增删、事件分发统一在主线程，
    /// 避免业务线程 ↔ SDK 事件线程之间的 AB-BA 死锁（曾导致登录后白屏）。
    /// observers 与 observerWrapper 仅在主线程读写，不需要锁。
    private var observers: [EngineBridgeObserver] = []
    fileprivate let deviceRequestHandler = DeviceRequestHandler()
    private var observerWrapper: ObserverWrapper?

    /// 当前已在主线程则直接同步执行，避免不必要的 hop。
    private static func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    private lazy var engine: TUIRoomEngine = TUIRoomEngine.sharedInstance()
    private lazy var listManager: TUIConferenceListManager? =
        engine.getExtension(extensionType: .conferenceListManager) as? TUIConferenceListManager
    private lazy var invitationManager: TUIConferenceInvitationManager? =
        engine.getExtension(extensionType: .conferenceInvitationManager) as? TUIConferenceInvitationManager

    private override init() {
        super.init()
    }

    // MARK: - Public entry points

    @objc public static func invoke(api: String,
                                    params: String,
                                    callback: EngineBridgeResultCallback) {
        runOnMain { [api, params] in
            shared.invokeInternal(api: api, params: params, callback: callback)
        }
    }

    @objc public static func addObserver(_ observer: EngineBridgeObserver) {
        runOnMain {
            shared.addObserverInternal(observer)
        }
    }

    @objc public static func removeObserver(_ observer: EngineBridgeObserver) {
        runOnMain {
            shared.removeObserverInternal(observer)
        }
    }

    // MARK: - invoke 分发

    private func invokeInternal(api: String, params: String, callback: EngineBridgeResultCallback) {
        if Self.QUERY_API_SET.contains(api) {
            engine.query(api: api, param: params)
            callback.onResult(0, "", "")
            return
        }
        if Self.CONFERENCE_API_SET.contains(api) {
            dispatchConferenceApi(api: api, json: Codec.parseObject(params), callback: callback)
            return
        }
        if Self.PARTICIPANT_API_SET.contains(api) {
            dispatchParticipantApi(api: api, json: Codec.parseObject(params), callback: callback)
            return
        }
        engine.call(api: api, param: params) { code, message, data in
            callback.onResult(Int(code), message ?? "", data ?? "")
        }
    }

    // MARK: - observer 管理

    private func addObserverInternal(_ observer: EngineBridgeObserver) {
        if observers.contains(where: { $0 === observer }) { return }
        observers.append(observer)
        ensureNativeObserversInstalled()
    }

    private func removeObserverInternal(_ observer: EngineBridgeObserver) {
        observers.removeAll { $0 === observer }
        // native observer 一旦安装就保持注册，避免反复装卸引发 SDK 线程竞态。
    }

    private func ensureNativeObserversInstalled() {
        guard observerWrapper == nil else { return }
        let wrapper = ObserverWrapper(owner: self)
        observerWrapper = wrapper
        engine.addObserver(wrapper)
        listManager?.addObserver(wrapper)
        invitationManager?.addObserver(wrapper)
    }

    fileprivate func dispatchEvent(_ eventName: String, _ jsonData: String) {
        // 切到主线程派发：与 invoke / addObserver / removeObserver 串行，杜绝 AB-BA 死锁。
        EngineBridge.runOnMain { [weak self] in
            guard let self = self else { return }
            // 浅拷贝快照，避免 onEvent 中重入修改 observers 导致迭代越界。
            let snapshot = self.observers
            for o in snapshot {
                o.onEvent(eventName, jsonData)
            }
        }
    }

    fileprivate func emit(_ key: String, _ payload: [String: Any]) {
        dispatchEvent(key, Codec.stringify(payload))
    }

    // MARK: - Conference API 分发

    private func dispatchConferenceApi(api: String, json: [String: Any]?, callback cb: EngineBridgeResultCallback) {
        switch api {
        case Self.GET_SCHEDULED_ROOM_LIST:    handleGetScheduledRoomList(json: json, cb: cb)
        case Self.GET_SCHEDULED_ATTENDEES:    handleGetScheduledAttendees(json: json, cb: cb)
        case Self.SCHEDULE_ROOM:              handleScheduleRoom(json: json, cb: cb)
        case Self.UPDATE_SCHEDULED_ROOM:      handleUpdateScheduledRoom(json: json, cb: cb)
        case Self.ADD_SCHEDULED_ATTENDEES:    handleAddScheduledAttendees(json: json, cb: cb)
        case Self.REMOVE_SCHEDULED_ATTENDEES: handleRemoveScheduledAttendees(json: json, cb: cb)
        case Self.CANCEL_SCHEDULED_ROOM:      handleCancelScheduledRoom(json: json, cb: cb)
        case Self.GET_PENDING_CALLS:          handleGetPendingCalls(json: json, cb: cb)
        case Self.CALL_USER_TO_ROOM:          handleCallUserToRoom(json: json, cb: cb)
        case Self.CANCEL_CALL:                handleCancelCall(json: json, cb: cb)
        case Self.ACCEPT_CALL:                handleAcceptCall(json: json, cb: cb)
        case Self.REJECT_CALL:                handleRejectCall(json: json, cb: cb)
        default:
            cb.onResult(-1, "unsupported conference api: \(api)", "")
        }
    }

    private func handleGetScheduledRoomList(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let cursor = Codec.string(json, "cursor")
        manager.fetchScheduledConferenceList(status: [.notStarted, .running], cursor: cursor, count: Self.FETCH_LIST_COUNT) { conferenceInfoList, newCursor in
            let data: [String: Any] = [
                "scheduledRoomList": Codec.conferenceInfoListToArray(conferenceInfoList),
                "cursor": newCursor,
            ]
            cb.onResult(0, "", Codec.stringify(data))
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleGetScheduledAttendees(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let cursor = Codec.string(json, "cursor")
        manager.fetchAttendeeList(roomId: roomID, cursor: cursor, count: Self.FETCH_LIST_COUNT) { userInfoList, newCursor, totalCount in
            let data: [String: Any] = [
                "attendees": Codec.userInfoListToArray(userInfoList),
                "cursor": newCursor,
                "totalAttendeesCount": totalCount,
            ]
            cb.onResult(0, "", Codec.stringify(data))
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleScheduleRoom(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let opts = Codec.object(json, "options")
        let info = Codec.buildConferenceInfo(roomID: roomID, opts: opts)
        manager.scheduleConference(info) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleUpdateScheduledRoom(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let opts = Codec.object(json, "options")
        let info = Codec.buildConferenceInfo(roomID: roomID, opts: opts)
        let modifyFlag = Codec.buildModifyFlag(opts: opts)
        manager.updateConferenceInfo(conferenceInfo: info, modifyFlag: modifyFlag) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleAddScheduledAttendees(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let userIDList = Codec.stringList(json, "userIDList")
        manager.addAttendeesByAdmin(roomId: roomID, userIdList: userIDList) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleRemoveScheduledAttendees(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let userIDList = Codec.stringList(json, "userIDList")
        manager.removeAttendeesByAdmin(roomId: roomID, userIdList: userIDList) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleCancelScheduledRoom(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = listManager else {
            cb.onResult(-1, "conferenceListManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        manager.cancelConference(roomID) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleGetPendingCalls(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = invitationManager else {
            cb.onResult(-1, "conferenceInvitationManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let cursor = Codec.string(json, "cursor")
        manager.getInvitationList(roomID, cursor: cursor, count: Self.FETCH_LIST_COUNT) { invitationList, newCursor in
            let data: [String: Any] = [
                "calls": Codec.invitationListToArray(invitationList),
                "cursor": newCursor,
            ]
            cb.onResult(0, "", Codec.stringify(data))
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleCallUserToRoom(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = invitationManager else {
            cb.onResult(-1, "conferenceInvitationManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let userIDList = Codec.stringList(json, "userIDList")
        let timeout = Codec.int(json, "timeout", 30)
        let extensionInfo = Codec.string(json, "extensionInfo")
        manager.inviteUsers(roomID, userIdList: userIDList, timeout: TimeInterval(timeout), extensionInfo: extensionInfo) { resultMap in
            var results: [String: Any] = [:]
            for (userId, code) in resultMap {
                results[userId] = code.intValue
            }
            cb.onResult(0, "", Codec.stringify(["results": results]))
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleCancelCall(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = invitationManager else {
            cb.onResult(-1, "conferenceInvitationManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let userIDList = Codec.stringList(json, "userIDList")
        manager.cancelInvitation(roomID, userIdList: userIDList) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleAcceptCall(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = invitationManager else {
            cb.onResult(-1, "conferenceInvitationManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        manager.accept(roomID) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    private func handleRejectCall(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        guard let manager = invitationManager else {
            cb.onResult(-1, "conferenceInvitationManager unavailable", ""); return
        }
        let roomID = Codec.string(json, "roomID")
        let ext = Codec.string(json, "extensionInfo")
        let reason: TUIInvitationRejectedReason =
            ext.contains("inOtherRoom") ? .inOtherConference : .rejectToEnter
        manager.reject(roomID, reason: reason) {
            cb.onResult(0, "", "")
        } onError: { error, message in
            cb.onResult(error.rawValue, message, "")
        }
    }

    // MARK: - Participant API 分发

    private func dispatchParticipantApi(api: String, json: [String: Any]?, callback cb: EngineBridgeResultCallback) {
        switch api {
        case Self.TRANSFER_OWNER:
            engine.changeUserRole(userId: Codec.string(json, "userID"), role: .roomOwner) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.SET_ADMIN:
            engine.changeUserRole(userId: Codec.string(json, "userID"), role: .administrator) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.REVOKE_ADMIN:
            engine.changeUserRole(userId: Codec.string(json, "userID"), role: .generalUser) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.KICK_USER:
            engine.kickRemoteUserOutOfRoom(Codec.string(json, "userID")) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.UPDATE_PARTICIPANT_NAME_CARD:
            engine.changeUserNameCard(userId: Codec.string(json, "userID"), nameCard: Codec.string(json, "nameCard")) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.UPDATE_PARTICIPANT_META_DATA:
            let userID = Codec.string(json, "userID")
            let metaData = Codec.stringMap(json, "metaData")
            var dataMap: [String: Data] = [:]
            for (k, v) in metaData { dataMap[k] = v.data(using: .utf8) ?? Data() }
            engine.setCustomInfoForUser(userId: userID, customInfo: dataMap) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.CLOSE_PARTICIPANT_DEVICE:
            let device = DeviceKind(value: Codec.int(json, "device"))
            engine.closeRemoteDeviceByAdmin(userId: Codec.string(json, "userID"), device: device.toMediaDevice()) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.DISABLE_USER_MESSAGE:
            engine.disableSendingMessageByAdmin(userId: Codec.string(json, "userID"), isDisable: Codec.bool(json, "disable")) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.DISABLE_ALL_DEVICES:
            let device = DeviceKind(value: Codec.int(json, "device"))
            engine.disableDeviceForAllUserByAdmin(device: device.toMediaDevice(), isDisable: Codec.bool(json, "disable")) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.DISABLE_ALL_MESSAGES:
            engine.disableSendingMessageForAllUser(isDisable: Codec.bool(json, "disable")) {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.MUTE_MICROPHONE:
            engine.muteLocalAudio()
            cb.onResult(0, "", "")

        case Self.UNMUTE_MICROPHONE:
            engine.unmuteLocalAudio {
                cb.onResult(0, "", "")
            } onError: { e, m in cb.onResult(e.rawValue, m, "") }

        case Self.REQUEST_TO_OPEN_DEVICE:         handleRequestToOpenDevice(json: json, cb: cb)
        case Self.CANCEL_OPEN_DEVICE_REQUEST:     handleCancelOpenDeviceRequest(json: json, cb: cb)
        case Self.APPROVE_OPEN_DEVICE_REQUEST:    handleResponseDeviceApplication(json: json, isAccept: true,  cb: cb)
        case Self.REJECT_OPEN_DEVICE_REQUEST:     handleResponseDeviceApplication(json: json, isAccept: false, cb: cb)
        case Self.INVITE_TO_OPEN_DEVICE:          handleInviteToOpenDevice(json: json, cb: cb)
        case Self.CANCEL_OPEN_DEVICE_INVITATION:  handleCancelOpenDeviceInvitation(json: json, cb: cb)
        case Self.ACCEPT_OPEN_DEVICE_INVITATION:  handleResponseDeviceInvitation(json: json, isAccept: true,  cb: cb)
        case Self.DECLINE_OPEN_DEVICE_INVITATION: handleResponseDeviceInvitation(json: json, isAccept: false, cb: cb)

        default:
            cb.onResult(-1, "unsupported participant api: \(api)", "")
        }
    }

    /// 申请管理员开启本地设备：onAccepted/onRejected/onTimeout/onCancelled 均视为成功，仅 onError 透传错误码。
    private func handleRequestToOpenDevice(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        let device = DeviceKind(value: Codec.int(json, "device"))
        let timeout = Codec.int(json, "timeout", 0)
        let request = engine.applyToAdminToOpenLocalDevice(
            device: device.toMediaDevice(),
            timeout: TimeInterval(timeout),
            onAccepted: { [weak self] _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceApplication(device) {
                    self.deviceRequestHandler.removeSentDeviceApplication(device)
                    self.emit(Self.EVT_ON_DEVICE_REQUEST_APPROVED, [
                        "request": Codec.requestToDeviceRequestInfo(cached),
                        "operator": Codec.userInfoToDict(cached.toUser),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onRejected: { [weak self] _, _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceApplication(device) {
                    self.deviceRequestHandler.removeSentDeviceApplication(device)
                    self.emit(Self.EVT_ON_DEVICE_REQUEST_REJECTED, [
                        "request": Codec.requestToDeviceRequestInfo(cached),
                        "operator": Codec.userInfoToDict(cached.toUser),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onCancelled: { [weak self] _, _ in
                self?.deviceRequestHandler.removeSentDeviceApplication(device)
                cb.onResult(0, "", "")
            },
            onTimeout: { [weak self] _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceApplication(device) {
                    self.deviceRequestHandler.removeSentDeviceApplication(device)
                    self.emit(Self.EVT_ON_DEVICE_REQUEST_TIMEOUT, [
                        "request": Codec.requestToDeviceRequestInfo(cached),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onError: { [weak self] _, _, error, message in
                self?.deviceRequestHandler.removeSentDeviceApplication(device)
                cb.onResult(error.rawValue, message ?? "", "")
            }
        )
        deviceRequestHandler.addSentDeviceApplication(device, request: request)
    }

    private func handleCancelOpenDeviceRequest(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        let device = DeviceKind(value: Codec.int(json, "device"))
        guard let request = deviceRequestHandler.getSentDeviceApplication(device) else {
            cb.onResult(TUIError.failed.rawValue, "No device application is requesting", "")
            return
        }
        engine.cancelRequest(request.requestId) { [weak self] in
            self?.deviceRequestHandler.removeSentDeviceApplication(device)
            cb.onResult(0, "", "")
        } onError: { e, m in cb.onResult(e.rawValue, m, "") }
    }

    private func handleResponseDeviceApplication(json: [String: Any]?, isAccept: Bool, cb: EngineBridgeResultCallback) {
        let userID = Codec.string(json, "userID")
        let device = DeviceKind(value: Codec.int(json, "device"))
        guard let request = deviceRequestHandler.getReceivedDeviceApplication(userID: userID, device: device) else {
            cb.onResult(TUIError.failed.rawValue, "Not receiving requests", "")
            return
        }
        engine.responseRemoteRequest(requestId: request.requestId, agree: isAccept, extensionInfo: "") { [weak self] in
            self?.deviceRequestHandler.removeReceivedDeviceApplication(userID: userID, device: device)
            cb.onResult(0, "", "")
        } onError: { e, m in cb.onResult(e.rawValue, m, "") }
    }

    /// 管理员邀请远端用户开启设备。
    private func handleInviteToOpenDevice(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        let userID = Codec.string(json, "userID")
        let device = DeviceKind(value: Codec.int(json, "device"))
        let timeout = Codec.int(json, "timeout", 0)
        let request = engine.openRemoteDeviceByAdmin(
            userId: userID,
            device: device.toMediaDevice(),
            timeout: TimeInterval(timeout),
            onAccepted: { [weak self] _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceInvitation(userID: userID, device: device) {
                    self.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
                    self.emit(Self.EVT_ON_DEVICE_INVITATION_ACCEPTED, [
                        "invitation": Codec.requestToDeviceRequestInfo(cached),
                        "operator": Codec.userInfoToDict(cached.toUser),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onRejected: { [weak self] _, _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceInvitation(userID: userID, device: device) {
                    self.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
                    self.emit(Self.EVT_ON_DEVICE_INVITATION_DECLINED, [
                        "invitation": Codec.requestToDeviceRequestInfo(cached),
                        "operator": Codec.userInfoToDict(cached.toUser),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onCancelled: { [weak self] _, _ in
                self?.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
                cb.onResult(0, "", "")
            },
            onTimeout: { [weak self] _, _ in
                guard let self = self else { return }
                if let cached = self.deviceRequestHandler.getSentDeviceInvitation(userID: userID, device: device) {
                    self.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
                    self.emit(Self.EVT_ON_DEVICE_INVITATION_TIMEOUT, [
                        "invitation": Codec.requestToDeviceRequestInfo(cached),
                    ])
                }
                cb.onResult(0, "", "")
            },
            onError: { [weak self] _, _, error, message in
                self?.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
                cb.onResult(error.rawValue, message ?? "", "")
            }
        )
        deviceRequestHandler.addSentDeviceInvitation(userID: userID, device: device, request: request)
    }

    private func handleCancelOpenDeviceInvitation(json: [String: Any]?, cb: EngineBridgeResultCallback) {
        let userID = Codec.string(json, "userID")
        let device = DeviceKind(value: Codec.int(json, "device"))
        guard let request = deviceRequestHandler.getSentDeviceInvitation(userID: userID, device: device) else {
            cb.onResult(TUIError.failed.rawValue, "No invitation is sent", "")
            return
        }
        engine.cancelRequest(request.requestId) { [weak self] in
            self?.deviceRequestHandler.removeSentDeviceInvitation(userID: userID, device: device)
            cb.onResult(0, "", "")
        } onError: { e, m in cb.onResult(e.rawValue, m, "") }
    }

    private func handleResponseDeviceInvitation(json: [String: Any]?, isAccept: Bool, cb: EngineBridgeResultCallback) {
        let userID = Codec.string(json, "userID")
        let device = DeviceKind(value: Codec.int(json, "device"))
        guard let request = deviceRequestHandler.getReceivedDeviceInvitation(userID: userID, device: device) else {
            cb.onResult(TUIError.failed.rawValue, "Not receiving invitations", "")
            return
        }
        engine.responseRemoteRequest(requestId: request.requestId, agree: isAccept, extensionInfo: "") { [weak self] in
            self?.deviceRequestHandler.removeReceivedDeviceInvitation(userID: userID, device: device)
            cb.onResult(0, "", "")
        } onError: { e, m in cb.onResult(e.rawValue, m, "") }
    }

}

// MARK: - ObserverWrapper

/// 同时实现 TUIRoomObserver / TUIConferenceListManagerObserver / TUIConferenceInvitationObserver。
private final class ObserverWrapper: NSObject {
    fileprivate weak var owner: EngineBridge?
    init(owner: EngineBridge) { self.owner = owner; super.init() }
}

// MARK: TUIRoomObserver
extension ObserverWrapper: TUIRoomObserver {
    /// RoomEngine 的统一字符串事件通道，桥层透传给所有 uts observer。
    func on(key: String, data jsonData: String) {
        owner?.dispatchEvent(key, jsonData)
    }

    func onKickedOutOfRoom(roomId: String, reason: TUIKickedOutOfRoomReason, message: String) {
        owner?.emit(EngineBridge.EVT_ON_KICKED_FROM_ROOM, [
            "roomID": roomId,
            "reason": Codec.kickedOutOfRoomReasonToTs(reason),
            "message": message,
        ])
    }

    func onRequestReceived(request: TUIRequest) {
        guard let owner = owner else { return }
        let fromUserId = request.fromUser.userId
        switch request.requestAction {
        case .applyToAdminToOpenLocalCamera:
            owner.deviceRequestHandler.addReceivedDeviceApplication(device: .camera, userID: fromUserId, request: request)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_RECEIVED, ["request": Codec.requestToDeviceRequestInfo(request)])
        case .applyToAdminToOpenLocalMicrophone:
            owner.deviceRequestHandler.addReceivedDeviceApplication(device: .microphone, userID: fromUserId, request: request)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_RECEIVED, ["request": Codec.requestToDeviceRequestInfo(request)])
        case .openRemoteCamera:
            owner.deviceRequestHandler.addReceivedDeviceInvitation(userID: fromUserId, device: .camera, request: request)
            owner.emit(EngineBridge.EVT_ON_DEVICE_INVITATION_RECEIVED, ["invitation": Codec.requestToDeviceRequestInfo(request)])
        case .openRemoteMicrophone:
            owner.deviceRequestHandler.addReceivedDeviceInvitation(userID: fromUserId, device: .microphone, request: request)
            owner.emit(EngineBridge.EVT_ON_DEVICE_INVITATION_RECEIVED, ["invitation": Codec.requestToDeviceRequestInfo(request)])
        // 管理员强制关闭本地设备：仅 emit 不缓存 request。
        case .closeRemoteMicrophone:
            owner.emit(EngineBridge.EVT_ON_PARTICIPANT_DEVICE_CLOSED, [
                "device": DeviceKind.microphone.value,
                "operator": Codec.userInfoToDict(request.fromUser),
            ])
        case .closeRemoteCamera:
            owner.emit(EngineBridge.EVT_ON_PARTICIPANT_DEVICE_CLOSED, [
                "device": DeviceKind.camera.value,
                "operator": Codec.userInfoToDict(request.fromUser),
            ])
        case .closeRemoteScreenShare:
            owner.emit(EngineBridge.EVT_ON_PARTICIPANT_DEVICE_CLOSED, [
                "device": DeviceKind.screenShare.value,
                "operator": Codec.userInfoToDict(request.fromUser),
            ])
        default:
            break
        }
    }

    func onRequestCancelled(request: TUIRequest, operateUser: TUIUserInfo) {
        guard let owner = owner else { return }
        let fromUserId = request.fromUser.userId
        switch request.requestAction {
        case .applyToAdminToOpenLocalCamera:
            owner.deviceRequestHandler.removeReceivedDeviceApplication(userID: fromUserId, device: .camera)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_CANCELLED, ["request": Codec.requestToDeviceRequestInfo(request)])
        case .applyToAdminToOpenLocalMicrophone:
            owner.deviceRequestHandler.removeReceivedDeviceApplication(userID: fromUserId, device: .microphone)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_CANCELLED, ["request": Codec.requestToDeviceRequestInfo(request)])
        case .openRemoteCamera:
            owner.deviceRequestHandler.removeReceivedDeviceInvitation(userID: fromUserId, device: .camera)
            owner.emit(EngineBridge.EVT_ON_DEVICE_INVITATION_CANCELLED, ["invitation": Codec.requestToDeviceRequestInfo(request)])
        case .openRemoteMicrophone:
            owner.deviceRequestHandler.removeReceivedDeviceInvitation(userID: fromUserId, device: .microphone)
            owner.emit(EngineBridge.EVT_ON_DEVICE_INVITATION_CANCELLED, ["invitation": Codec.requestToDeviceRequestInfo(request)])
        default:
            break
        }
    }

    func onRequestProcessed(request: TUIRequest, operateUser: TUIUserInfo) {
        guard let owner = owner else { return }
        let fromUserId = request.fromUser.userId
        switch request.requestAction {
        case .applyToAdminToOpenLocalCamera:
            owner.deviceRequestHandler.removeReceivedDeviceApplication(userID: fromUserId, device: .camera)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_PROCESSED, [
                "request": Codec.requestToDeviceRequestInfo(request),
                "operator": Codec.userInfoToDict(operateUser),
            ])
        case .applyToAdminToOpenLocalMicrophone:
            owner.deviceRequestHandler.removeReceivedDeviceApplication(userID: fromUserId, device: .microphone)
            owner.emit(EngineBridge.EVT_ON_DEVICE_REQUEST_PROCESSED, [
                "request": Codec.requestToDeviceRequestInfo(request),
                "operator": Codec.userInfoToDict(operateUser),
            ])
        default:
            break
        }
    }

    func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        var map: [String: Any] = [:]
        for (uid, vol) in volumeMap { map[uid] = vol.intValue }
        owner?.emit(EngineBridge.EVT_ON_USER_VOICE_VOLUME_CHANGED, ["volumeMap": map])
    }

    func onUserNetworkQualityChanged(networkList: [TUINetworkInfo]) {
        var map: [String: Any] = [:]
        for info in networkList {
            let uid = info.userId ?? ""
            map[uid] = Codec.networkInfoToDict(info)
        }
        owner?.emit(EngineBridge.EVT_ON_USER_NETWORK_QUALITY_CHANGED, ["networkMap": map])
    }
}

// MARK: TUIConferenceListManagerObserver
extension ObserverWrapper: TUIConferenceListManagerObserver {
    func onConferenceScheduled(conferenceInfo: TUIConferenceInfo) {
        owner?.emit(EngineBridge.EVT_ON_ADDED_TO_SCHEDULED_ROOM, [
            "roomInfo": Codec.conferenceInfoToDict(conferenceInfo),
        ])
    }

    func onConferenceWillStart(conferenceInfo: TUIConferenceInfo) {
        owner?.emit(EngineBridge.EVT_ON_SCHEDULED_ROOM_STARTING_SOON, [
            "roomInfo": Codec.conferenceInfoToDict(conferenceInfo),
        ])
    }

    func onConferenceDidCancelled(conferenceInfo: TUIConferenceInfo,
                                  reason: TUIConferenceCancelReason,
                                  operateUser: TUIUserInfo) {
        let eventKey: String
        switch reason {
        case .cancelledByAdmin:     eventKey = EngineBridge.EVT_ON_SCHEDULED_ROOM_CANCELLED
        case .removedFromAttendees: eventKey = EngineBridge.EVT_ON_REMOVED_FROM_SCHEDULED_ROOM
        @unknown default:           eventKey = EngineBridge.EVT_ON_SCHEDULED_ROOM_CANCELLED
        }
        owner?.emit(eventKey, [
            "roomInfo": Codec.conferenceInfoToDict(conferenceInfo),
            "operator": Codec.userInfoToDict(operateUser),
        ])
    }

    func onConferenceInfoChanged(conferenceInfo: TUIConferenceInfo, modifyFlag: TUIConferenceModifyFlag) {
        // ts 侧目前没有该事件需求，按需扩展
    }

    func onScheduleAttendeesUpdated(conferenceInfo: TUIConferenceInfo,
                                    leftUsers: [TUIUserInfo],
                                    joinedUsers: [TUIUserInfo]) {
        owner?.emit(EngineBridge.EVT_ON_SCHEDULE_ATTENDEES_UPDATED, [
            "roomInfo": Codec.conferenceInfoToDict(conferenceInfo),
            "leftUsers": Codec.userInfoListToArray(leftUsers),
            "joinedUsers": Codec.userInfoListToArray(joinedUsers),
        ])
        // fan-out 到 ts RoomParticipantState，joinedUsers 转 RoomParticipant，status = Scheduled(1)。
        owner?.emit(EngineBridge.EVT_ON_PARTICIPANT_SCHEDULE_ATTENDEES_UPDATED, [
            "leftUsers": Codec.userInfoListToArray(leftUsers),
            "joinedUsers": Codec.participantListFromUserInfoToArray(joinedUsers,
                                                                   roomStatus: ParticipantStatus.scheduled.rawValue),
        ])
    }

    func onConferenceStatusUpdated(conferenceInfo: TUIConferenceInfo, status: TUIConferenceStatus) {
        owner?.emit(EngineBridge.EVT_ON_CONFERENCE_STATUS_UPDATED, [
            "roomInfo": Codec.conferenceInfoToDict(conferenceInfo),
            "status": Codec.conferenceStatusToTs(status),
        ])
    }
}

// MARK: TUIConferenceInvitationObserver
extension ObserverWrapper: TUIConferenceInvitationObserver {
    func onReceiveInvitation(roomInfo: TUIRoomInfo, invitation: TUIInvitation, extensionInfo: String) {
        owner?.emit(EngineBridge.EVT_ON_CALL_RECEIVED, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
            "extensionInfo": extensionInfo,
        ])
    }

    func onInvitationCancelled(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_CALL_CANCELLED, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
        ])
    }

    func onInvitationTimeout(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_CALL_TIMEOUT, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
        ])
    }

    func onInvitationAccepted(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_CALL_ACCEPTED, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
        ])
    }

    func onInvitationRejected(roomInfo: TUIRoomInfo,
                              invitation: TUIInvitation,
                              reason: TUIInvitationRejectedReason) {
        owner?.emit(EngineBridge.EVT_ON_CALL_REJECTED, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
            "reason": Codec.rejectedReasonToTs(reason),
        ])
    }

    func onInvitationRevokedByAdmin(roomInfo: TUIRoomInfo, invitation: TUIInvitation, admin: TUIUserInfo) {
        owner?.emit(EngineBridge.EVT_ON_CALL_REVOKED_BY_ADMIN, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "call": Codec.invitationToDict(invitation),
            "operator": Codec.userInfoToDict(admin),
        ])
    }

    func onInvitationHandledByOtherDevice(roomInfo: TUIRoomInfo, accepted: Bool) {
        owner?.emit(EngineBridge.EVT_ON_CALL_HANDLED_BY_OTHER_DEVICE, [
            "roomInfo": Codec.roomInfoToDict(roomInfo),
            "isAccepted": accepted,
        ])
    }

    // ---- 透传到 ts RoomParticipantState（pending invitation 侧）----

    func onInvitationAdded(roomId: String, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_PARTICIPANT_INVITATION_ADDED, [
            "roomID": roomId,
            "participant": Codec.participantFromUserInfoToDict(
                invitation.invitee,
                roomStatus: Codec.invitationStatusToParticipantStatus(invitation.status)
            ),
        ])
    }

    func onInvitationRemoved(roomId: String, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_PARTICIPANT_INVITATION_REMOVED, [
            "roomID": roomId,
            "userID": invitation.invitee.userId,
        ])
    }

    func onInvitationStatusChanged(roomId: String, invitation: TUIInvitation) {
        owner?.emit(EngineBridge.EVT_ON_PARTICIPANT_INVITATION_STATUS_CHANGED, [
            "roomID": roomId,
            "participant": Codec.participantFromUserInfoToDict(
                invitation.invitee,
                roomStatus: Codec.invitationStatusToParticipantStatus(invitation.status)
            ),
        ])
    }
}

// MARK: - DeviceKind / ParticipantStatus

/// 数值与 ts `DeviceType` 严格一致：0 = MICROPHONE, 1 = CAMERA, 2 = SCREEN_SHARE。
fileprivate enum DeviceKind: Int {
    case microphone = 0
    case camera = 1
    case screenShare = 2

    var value: Int { rawValue }

    init(value: Int) {
        self = DeviceKind(rawValue: value) ?? .microphone
    }

    func toMediaDevice() -> TUIMediaDevice {
        switch self {
        case .microphone: return .microphone
        case .camera:     return .camera
        case .screenShare:return .screenSharing
        }
    }
}

/// ts 侧 RoomParticipantStatus 数值（对齐 types/roomParticipant.ts）：
///   1 = Scheduled, 2 = InCalling, 3 = CallTimeout, 4 = CallRejected, 5 = InRoom
fileprivate enum ParticipantStatus: Int {
    case scheduled = 1
    case inCalling = 2
    case callTimeout = 3
    case callRejected = 4
    case inRoom = 5
}

// MARK: - DeviceRequestHandler

/// 桥层管理 SDK Request 对象生命周期：
///   sentApplications:    (device) → Request           本端发起申请
///   sentInvitations:     (userID, device) → Request   管理员邀请
///   receivedApplications:(userID, device) → Request
///   receivedInvitations: (userID, device) → Request
/// pending* 列表的快照维护交给 ts 侧。
fileprivate final class DeviceRequestHandler {
    private let lock = NSLock()
    private var sentApplications: [DeviceKind: TUIRequest] = [:]
    private var sentInvitations: [String: TUIRequest] = [:]
    private var receivedApplications: [String: TUIRequest] = [:]
    private var receivedInvitations: [String: TUIRequest] = [:]

    private static func key(_ userID: String, _ device: DeviceKind) -> String {
        return "\(userID)|\(device.rawValue)"
    }

    func addSentDeviceApplication(_ device: DeviceKind, request: TUIRequest) {
        lock.lock(); defer { lock.unlock() }
        sentApplications[device] = request
    }
    func removeSentDeviceApplication(_ device: DeviceKind) {
        lock.lock(); defer { lock.unlock() }
        sentApplications.removeValue(forKey: device)
    }
    func getSentDeviceApplication(_ device: DeviceKind) -> TUIRequest? {
        lock.lock(); defer { lock.unlock() }
        return sentApplications[device]
    }

    func addSentDeviceInvitation(userID: String, device: DeviceKind, request: TUIRequest) {
        lock.lock(); defer { lock.unlock() }
        sentInvitations[Self.key(userID, device)] = request
    }
    func removeSentDeviceInvitation(userID: String, device: DeviceKind) {
        lock.lock(); defer { lock.unlock() }
        sentInvitations.removeValue(forKey: Self.key(userID, device))
    }
    func getSentDeviceInvitation(userID: String, device: DeviceKind) -> TUIRequest? {
        lock.lock(); defer { lock.unlock() }
        return sentInvitations[Self.key(userID, device)]
    }

    func addReceivedDeviceApplication(device: DeviceKind, userID: String, request: TUIRequest) {
        lock.lock(); defer { lock.unlock() }
        receivedApplications[Self.key(userID, device)] = request
    }
    func removeReceivedDeviceApplication(userID: String, device: DeviceKind) {
        lock.lock(); defer { lock.unlock() }
        receivedApplications.removeValue(forKey: Self.key(userID, device))
    }
    func getReceivedDeviceApplication(userID: String, device: DeviceKind) -> TUIRequest? {
        lock.lock(); defer { lock.unlock() }
        return receivedApplications[Self.key(userID, device)]
    }

    func addReceivedDeviceInvitation(userID: String, device: DeviceKind, request: TUIRequest) {
        lock.lock(); defer { lock.unlock() }
        receivedInvitations[Self.key(userID, device)] = request
    }
    func removeReceivedDeviceInvitation(userID: String, device: DeviceKind) {
        lock.lock(); defer { lock.unlock() }
        receivedInvitations.removeValue(forKey: Self.key(userID, device))
    }
    func getReceivedDeviceInvitation(userID: String, device: DeviceKind) -> TUIRequest? {
        lock.lock(); defer { lock.unlock() }
        return receivedInvitations[Self.key(userID, device)]
    }
}

// MARK: - Codec（JSON 编解码 / 枚举映射）

/// 字段协议与 ts 侧 `state/RoomState.ts` 对齐（roomID/userID 大写、roomStatus、scheduled* 等）。
fileprivate enum Codec {

    // MARK: stringify / parseObject

    static func stringify(_ obj: Any) -> String {
        guard JSONSerialization.isValidJSONObject(obj),
              let data = try? JSONSerialization.data(withJSONObject: obj, options: []),
              let str = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return str
    }

    static func parseObject(_ params: String?) -> [String: Any]? {
        guard let params = params, !params.isEmpty,
              let data = params.data(using: .utf8) else { return nil }
        let json = try? JSONSerialization.jsonObject(with: data, options: [])
        return json as? [String: Any]
    }

    // MARK: 入参解析工具

    static func string(_ json: [String: Any]?, _ key: String, _ def: String = "") -> String {
        guard let v = json?[key] else { return def }
        if let s = v as? String { return s }
        if let n = v as? NSNumber { return n.stringValue }
        return def
    }

    static func int(_ json: [String: Any]?, _ key: String, _ def: Int = 0) -> Int {
        guard let v = json?[key] else { return def }
        if let n = v as? NSNumber { return n.intValue }
        if let s = v as? String, let i = Int(s) { return i }
        return def
    }

    static func long(_ json: [String: Any]?, _ key: String, _ def: Int64 = 0) -> Int64 {
        guard let v = json?[key] else { return def }
        if let n = v as? NSNumber { return n.int64Value }
        if let s = v as? String, let i = Int64(s) { return i }
        return def
    }

    static func bool(_ json: [String: Any]?, _ key: String, _ def: Bool = false) -> Bool {
        guard let v = json?[key] else { return def }
        if let b = v as? Bool { return b }
        if let n = v as? NSNumber { return n.boolValue }
        return def
    }

    static func stringList(_ json: [String: Any]?, _ key: String) -> [String] {
        guard let arr = json?[key] as? [Any] else { return [] }
        return arr.compactMap { ($0 as? String) ?? ($0 as? NSNumber)?.stringValue }
    }

    /// updateParticipantMetaData 的 metaData: Record<string,string> 入参解析；非 string 值跳过。
    static func stringMap(_ json: [String: Any]?, _ key: String) -> [String: String] {
        guard let obj = json?[key] as? [String: Any] else { return [:] }
        var map: [String: String] = [:]
        for (k, v) in obj {
            if let s = v as? String { map[k] = s }
        }
        return map
    }

    static func object(_ json: [String: Any]?, _ key: String) -> [String: Any]? {
        return json?[key] as? [String: Any]
    }

    // MARK: SDK 对象 -> JSON 字典

    static func userInfoToDict(_ user: TUIUserInfo?) -> [String: Any] {
        guard let user = user else {
            return ["userID": "", "userName": "", "avatarURL": ""]
        }
        return [
            "userID": user.userId,
            "userName": user.userName,
            "avatarURL": user.avatarUrl,
        ]
    }

    /// SDK UserInfo + status → ts RoomParticipant 字典（字段对齐 types/roomParticipant.ts）。
    static func participantFromUserInfoToDict(_ user: TUIUserInfo?, roomStatus: Int) -> [String: Any] {
        guard let user = user else {
            return [
                "userID": "",
                "userName": "",
                "avatarURL": "",
                "nameCard": "",
                "role": 2,
                "roomStatus": roomStatus,
                "microphoneStatus": 0,
                "cameraStatus": 0,
                "screenShareStatus": 0,
                "isMessageDisabled": false,
                "metaData": [String: String](),
            ]
        }
        var meta: [String: String] = [:]
        for (k, data) in user.roomCustomInfo ?? [:] {
            if let s = String(data: data, encoding: .utf8) {
                meta[k] = s
            }
        }
        return [
            "userID": user.userId,
            "userName": user.userName,
            "avatarURL": user.avatarUrl,
            "nameCard": user.nameCard,
            "role": roleToTs(user.userRole),
            "roomStatus": roomStatus,
            "microphoneStatus": user.hasAudioStream ? 1 : 0,
            "cameraStatus": user.hasVideoStream ? 1 : 0,
            "screenShareStatus": user.hasScreenStream ? 1 : 0,
            "isMessageDisabled": user.isMessageDisabled,
            "metaData": meta,
        ]
    }

    static func participantListFromUserInfoToArray(_ users: [TUIUserInfo]?, roomStatus: Int) -> [[String: Any]] {
        guard let users = users else { return [] }
        return users.map { participantFromUserInfoToDict($0, roomStatus: roomStatus) }
    }

    static func userInfoListToArray(_ users: [TUIUserInfo]?) -> [[String: Any]] {
        guard let users = users else { return [] }
        return users.map { userInfoToDict($0) }
    }

    /// SDK Role → ts RoomParticipantRole：Owner=0 / Admin=1 / GeneralUser=2。
    private static func roleToTs(_ role: TUIRole) -> Int {
        switch role {
        case .roomOwner: return 0
        case .administrator: return 1
        case .generalUser: return 2
        @unknown default: return 2
        }
    }

    /// SDK TUIInvitationStatus → ts RoomParticipantStatus：
    /// pending → InCalling(2) / timeout → CallTimeout(3) / rejected → CallRejected(4) / 其它 → InRoom(5)。
    static func invitationStatusToParticipantStatus(_ status: TUIInvitationStatus) -> Int {
        switch status {
        case .pending:  return ParticipantStatus.inCalling.rawValue
        case .timeout:  return ParticipantStatus.callTimeout.rawValue
        case .rejected: return ParticipantStatus.callRejected.rawValue
        default:        return ParticipantStatus.inRoom.rawValue
        }
    }

    static func roomInfoToDict(_ roomInfo: TUIRoomInfo?) -> [String: Any] {
        guard let info = roomInfo else { return ["roomID": ""] }
        let owner: [String: Any] = [
            "userID": info.ownerId,
            "userName": info.ownerName,
            "avatarURL": info.ownerAvatarUrl,
        ]
        return [
            "roomID": info.roomId,
            "roomName": info.name,
            "roomType": info.roomType.rawValue,
            "roomOwner": owner,
            "createTime": info.createTime,
            "isMicrophoneDisableForAllUser": info.isMicrophoneDisableForAllUser,
            "isCameraDisableForAllUser": info.isCameraDisableForAllUser,
            "isScreenShareDisableForAllUser": info.isScreenShareDisableForAllUser,
            "isMessageDisableForAllUser": info.isMessageDisableForAllUser,
        ]
    }

    static func conferenceInfoToDict(_ info: TUIConferenceInfo?) -> [String: Any] {
        guard let info = info else { return ["roomID": ""] }
        var dict = roomInfoToDict(info.basicRoomInfo)
        dict["scheduledStartTime"] = info.scheduleStartTime
        dict["scheduledEndTime"] = info.scheduleEndTime
        dict["startReminderInSeconds"] = info.reminderSecondsBeforeStart
        dict["roomStatus"] = conferenceStatusToTs(info.status)
        return dict
    }

    static func conferenceInfoListToArray(_ list: [TUIConferenceInfo]?) -> [[String: Any]] {
        guard let list = list else { return [] }
        return list.map { conferenceInfoToDict($0) }
    }

    static func invitationToDict(_ inv: TUIInvitation?) -> [String: Any] {
        guard let inv = inv else { return [:] }
        return [
            "caller": userInfoToDict(inv.inviter),
            "callee": userInfoToDict(inv.invitee),
            "status": inv.status.rawValue,
        ]
    }

    static func invitationListToArray(_ list: [TUIInvitation]?) -> [[String: Any]] {
        guard let list = list else { return [] }
        return list.map { invitationToDict($0) }
    }

    // MARK: options 字典 -> SDK 对象

    static func buildConferenceInfo(roomID: String, opts: [String: Any]?) -> TUIConferenceInfo {
        let info = TUIConferenceInfo()
        let basic = TUIRoomInfo()
        basic.roomId = roomID
        basic.name = string(opts, "roomName")
        basic.password = string(opts, "password")
        basic.isMicrophoneDisableForAllUser = bool(opts, "isAllMicrophoneDisabled")
        basic.isCameraDisableForAllUser = bool(opts, "isAllCameraDisabled")
        basic.isScreenShareDisableForAllUser = bool(opts, "isAllScreenShareDisabled")
        basic.isMessageDisableForAllUser = bool(opts, "isAllMessageDisabled")
        info.basicRoomInfo = basic
        info.scheduleStartTime = UInt(long(opts, "scheduleStartTime", 0))
        info.scheduleEndTime = UInt(long(opts, "scheduleEndTime", 0))
        info.reminderSecondsBeforeStart = int(opts, "reminderSecondsBeforeStart", 0)
        // SDK scheduleAttendees 是 [String]（userId 列表），非 UserInfo 列表。
        info.scheduleAttendees = stringList(opts, "scheduleAttendees")
        return info
    }

    /// 按 options 中实际存在的字段推断 modifyFlag（OptionSet）。
    static func buildModifyFlag(opts: [String: Any]?) -> TUIConferenceModifyFlag {
        guard let opts = opts else { return [] }
        var flag: TUIConferenceModifyFlag = []
        if opts["roomName"] != nil { flag.insert(.roomName) }
        if opts["scheduleStartTime"] != nil { flag.insert(.scheduleStartTime) }
        if opts["scheduleEndTime"] != nil { flag.insert(.scheduleEndTime) }
        return flag
    }

    // MARK: 枚举映射

    /// `TUIInvitationRejectedReason` → ts `CallRejectionReason`：rejectToEnter→0 / inOtherConference→1。
    static func rejectedReasonToTs(_ reason: TUIInvitationRejectedReason) -> Int {
        switch reason {
        case .inOtherConference: return 1
        case .rejectToEnter:     return 0
        @unknown default:        return 0
        }
    }

    /// `TUIConferenceStatus` 是 OptionSet，映射到 ts RoomStatus：running=2 / 其它兜底=1。
    static func conferenceStatusToTs(_ status: TUIConferenceStatus) -> Int {
        if status.contains(.running) { return 2 }
        return 1
    }

    /// SDK KickedOutOfRoomReason → ts KickedOutOfRoomReason：
    ///   byAdmin=0 / byLoggedOnOtherDevice=1 / byServer=2 /
    ///   forNetworkDisconnected=3 / forJoinRoomStatusInvalidDuringOffline=4 / forCountOfJoinedRoomsExceedLimit=5。
    static func kickedOutOfRoomReasonToTs(_ reason: TUIKickedOutOfRoomReason) -> Int {
        switch reason {
        case .byAdmin: return 0
        case .byLoggedOnOtherDevice: return 1
        case .byServer: return 2
        case .forNetworkDisconnected: return 3
        case .forJoinRoomStatusInvalidDuringOffline: return 4
        case .forCountOfJoinedRoomsExceedLimit: return 5
        @unknown default: return 0
        }
    }

    // MARK: Participant 相关 SDK -> JSON

    /// SDK Request → ts `DeviceRequestInfo`（types/roomParticipant.ts）。
    /// device 数值与 ts `DeviceType` 一致（0/1/2），通过 requestAction 推断。
    static func requestToDeviceRequestInfo(_ request: TUIRequest?) -> [String: Any] {
        guard let request = request else {
            return [
                "senderUserID": "",
                "senderUserName": "",
                "senderNameCard": "",
                "senderAvatarURL": "",
                "device": 0,
                "content": "",
                "timestamp": 0,
            ]
        }
        let from = request.fromUser
        return [
            "senderUserID": from.userId,
            "senderUserName": from.userName,
            "senderNameCard": from.nameCard,
            "senderAvatarURL": from.avatarUrl,
            "device": deviceKindFromRequestAction(request.requestAction),
            "content": request.content,
            "timestamp": request.timestamp,
        ]
    }

    private static func deviceKindFromRequestAction(_ action: TUIRequestAction) -> Int {
        switch action {
        case .openRemoteCamera, .applyToAdminToOpenLocalCamera:
            return DeviceKind.camera.value
        case .openRemoteMicrophone, .applyToAdminToOpenLocalMicrophone:
            return DeviceKind.microphone.value
        case .applyToAdminToOpenLocalScreenShare:
            return DeviceKind.screenShare.value
        default:
            return DeviceKind.microphone.value
        }
    }

    /// SDK NetworkInfo → ts NetworkInfo（userID/quality/upLoss/downLoss/delay）。
    static func networkInfoToDict(_ info: TUINetworkInfo?) -> [String: Any] {
        guard let info = info else {
            return ["userID": "", "quality": 0, "upLoss": 0, "downLoss": 0, "delay": 0]
        }
        return [
            "userID": info.userId ?? "",
            "quality": info.quality.rawValue,
            "upLoss": info.upLoss,
            "downLoss": info.downLoss,
            "delay": info.delay,
        ]
    }

}

// MARK: - EngineBridgeFacade

public class EngineBridgeFacade: NSObject {

    public static let shared: EngineBridgeFacade = EngineBridgeFacade()

    private let lock = NSLock()
    private var nextToken: Int = 1
    private var tokenToObserver: [Int: ClosureObserver] = [:]

    private override init() {
        super.init()
    }

    public func invoke(
        _ api: String,
        _ params: String,
        _ callback: @escaping (_ code: NSNumber, _ message: String, _ data: String) -> Void
    ) {
        let wrapper = ClosureResultCallback(callback)
        EngineBridge.invoke(api: api, params: params, callback: wrapper)
    }

    /// 返回 token 用于后续 removeObserver。
    public func addObserver(
        _ onEvent: @escaping (_ eventName: String, _ jsonData: String) -> Void
    ) -> NSNumber {
        let observer = ClosureObserver(onEvent)
        lock.lock()
        let token = nextToken
        nextToken += 1
        tokenToObserver[token] = observer
        lock.unlock()
        EngineBridge.addObserver(observer)
        return NSNumber(value: token)
    }

    public func removeObserver(_ token: NSNumber) {
        let key = token.intValue
        lock.lock()
        let observer = tokenToObserver.removeValue(forKey: key)
        lock.unlock()
        guard let observer = observer else { return }
        EngineBridge.removeObserver(observer)
    }
}

private final class ClosureResultCallback: NSObject, EngineBridgeResultCallback {
    private let callback: (_ code: NSNumber, _ message: String, _ data: String) -> Void

    init(_ callback: @escaping (_ code: NSNumber, _ message: String, _ data: String) -> Void) {
        self.callback = callback
    }

    func onResult(_ code: Int, _ message: String, _ data: String) {
        callback(NSNumber(value: code), message, data)
    }
}

private final class ClosureObserver: NSObject, EngineBridgeObserver {
    private let onEventCallback: (_ eventName: String, _ jsonData: String) -> Void

    init(_ onEvent: @escaping (_ eventName: String, _ jsonData: String) -> Void) {
        self.onEventCallback = onEvent
    }

    func onEvent(_ eventName: String, _ jsonData: String) {
        onEventCallback(eventName, jsonData)
    }
}
