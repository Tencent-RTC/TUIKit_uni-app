package uts.sdk.modules.atomicx.kotlin

import android.os.Handler
import android.os.Looper
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine
import com.tencent.cloud.tuikit.engine.extension.TUIConferenceInvitationManager
import com.tencent.cloud.tuikit.engine.extension.TUIConferenceListManager
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver

/**
 * uts ↔ native 引擎统一桥接入口（Android）。
 * invoke 按 api 分发到 query / conference / participant / 通用 call；
 * 事件统一为 `(eventName, jsonData)` fan-out 给所有 uts observer。
 */
object EngineBridge {

    interface ResultCallback {
        fun onResult(code: Int, message: String, data: String)
    }

    interface Observer {
        fun onEvent(eventName: String, jsonData: String)
    }

    /* ===== Conference API / Event keys ===== */

    private const val GET_SCHEDULED_ROOM_LIST = "roomStore.getScheduledRoomList"
    private const val GET_SCHEDULED_ATTENDEES = "roomStore.getScheduledAttendees"
    private const val SCHEDULE_ROOM = "roomStore.scheduleRoom"
    private const val UPDATE_SCHEDULED_ROOM = "roomStore.updateScheduledRoom"
    private const val ADD_SCHEDULED_ATTENDEES = "roomStore.addScheduledAttendees"
    private const val REMOVE_SCHEDULED_ATTENDEES = "roomStore.removeScheduledAttendees"
    private const val CANCEL_SCHEDULED_ROOM = "roomStore.cancelScheduledRoom"
    private const val GET_PENDING_CALLS = "roomStore.getPendingCalls"
    private const val CALL_USER_TO_ROOM = "roomStore.callUserToRoom"
    private const val CANCEL_CALL = "roomStore.cancelCall"
    private const val ACCEPT_CALL = "roomStore.acceptCall"
    private const val REJECT_CALL = "roomStore.rejectCall"

    private const val EVT_ON_ADDED_TO_SCHEDULED_ROOM = "roomListener.onAddedToScheduledRoom"
    private const val EVT_ON_REMOVED_FROM_SCHEDULED_ROOM = "roomListener.onRemovedFromScheduledRoom"
    private const val EVT_ON_SCHEDULED_ROOM_CANCELLED = "roomListener.onScheduledRoomCancelled"
    private const val EVT_ON_SCHEDULED_ROOM_STARTING_SOON = "roomListener.onScheduledRoomStartingSoon"
    private const val EVT_ON_CALL_RECEIVED = "roomListener.onCallReceived"
    private const val EVT_ON_CALL_CANCELLED = "roomListener.onCallCancelled"
    private const val EVT_ON_CALL_TIMEOUT = "roomListener.onCallTimeout"
    private const val EVT_ON_CALL_ACCEPTED = "roomListener.onCallAccepted"
    private const val EVT_ON_CALL_REJECTED = "roomListener.onCallRejected"
    private const val EVT_ON_CALL_HANDLED_BY_OTHER_DEVICE = "roomListener.onCallHandledByOtherDevice"
    private const val EVT_ON_CALL_REVOKED_BY_ADMIN = "roomListener.onCallRevokedByAdmin"
    private const val EVT_ON_SCHEDULE_ATTENDEES_UPDATED = "roomListener.onScheduleAttendeesUpdated"
    private const val EVT_ON_CONFERENCE_STATUS_UPDATED = "roomListener.onConferenceStatusUpdated"
    private const val EVT_ON_CONFERENCE_INFO_CHANGED = "roomListener.onConferenceInfoChanged"

    private const val FETCH_LIST_COUNT = 20

    private val CONFERENCE_API_SET: Set<String> = setOf(
        GET_SCHEDULED_ROOM_LIST,
        GET_SCHEDULED_ATTENDEES,
        SCHEDULE_ROOM,
        UPDATE_SCHEDULED_ROOM,
        ADD_SCHEDULED_ATTENDEES,
        REMOVE_SCHEDULED_ATTENDEES,
        CANCEL_SCHEDULED_ROOM,
        GET_PENDING_CALLS,
        CALL_USER_TO_ROOM,
        CANCEL_CALL,
        ACCEPT_CALL,
        REJECT_CALL,
    )

    /**
     * fire-and-forget：底层 query 不通过 callback 返回，结果经 observer 通道 push 回 ts。
     */
    private val QUERY_API_SET: Set<String> = setOf(
        "roomParticipantState.queryAdminList",
        "roomParticipantState.queryMessageDisabledUserList",
    )

    /*
     * ===== Participant API / Event keys =====
     * 直接分发到 TUIRoomEngine 具体方法，不走 `call(api,…)` 通道；
     * 设备申请/邀请类需在桥层缓存 Request，按 (device, userID) 取回 requestId 走 cancelRequest / responseRemoteRequest。
     */
    private const val TRANSFER_OWNER = "roomParticipantStore.transferOwner"
    private const val SET_ADMIN = "roomParticipantStore.setAdmin"
    private const val REVOKE_ADMIN = "roomParticipantStore.revokeAdmin"
    private const val KICK_USER = "roomParticipantStore.kickUser"
    private const val UPDATE_PARTICIPANT_NAME_CARD = "roomParticipantStore.updateParticipantNameCard"
    private const val UPDATE_PARTICIPANT_META_DATA = "roomParticipantStore.updateParticipantMetaData"
    private const val CLOSE_PARTICIPANT_DEVICE = "roomParticipantStore.closeParticipantDevice"
    private const val DISABLE_USER_MESSAGE = "roomParticipantStore.disableUserMessage"
    private const val DISABLE_ALL_DEVICES = "roomParticipantStore.disableAllDevices"
    private const val DISABLE_ALL_MESSAGES = "roomParticipantStore.disableAllMessages"
    private const val MUTE_MICROPHONE = "roomParticipantStore.muteMicrophone"
    private const val UNMUTE_MICROPHONE = "roomParticipantStore.unmuteMicrophone"
    private const val REQUEST_TO_OPEN_DEVICE = "roomParticipantStore.requestToOpenDevice"
    private const val CANCEL_OPEN_DEVICE_REQUEST = "roomParticipantStore.cancelOpenDeviceRequest"
    private const val APPROVE_OPEN_DEVICE_REQUEST = "roomParticipantStore.approveOpenDeviceRequest"
    private const val REJECT_OPEN_DEVICE_REQUEST = "roomParticipantStore.rejectOpenDeviceRequest"
    private const val INVITE_TO_OPEN_DEVICE = "roomParticipantStore.inviteToOpenDevice"
    private const val CANCEL_OPEN_DEVICE_INVITATION = "roomParticipantStore.cancelOpenDeviceInvitation"
    private const val ACCEPT_OPEN_DEVICE_INVITATION = "roomParticipantStore.acceptOpenDeviceInvitation"
    private const val DECLINE_OPEN_DEVICE_INVITATION = "roomParticipantStore.declineOpenDeviceInvitation"

    private const val EVT_ON_KICKED_FROM_ROOM = "roomParticipantListener.onKickedFromRoom"
    private const val EVT_ON_DEVICE_REQUEST_RECEIVED = "roomParticipantListener.onDeviceRequestReceived"
    private const val EVT_ON_DEVICE_REQUEST_CANCELLED = "roomParticipantListener.onDeviceRequestCancelled"
    private const val EVT_ON_DEVICE_REQUEST_TIMEOUT = "roomParticipantListener.onDeviceRequestTimeout"
    private const val EVT_ON_DEVICE_REQUEST_APPROVED = "roomParticipantListener.onDeviceRequestApproved"
    private const val EVT_ON_DEVICE_REQUEST_REJECTED = "roomParticipantListener.onDeviceRequestRejected"
    private const val EVT_ON_DEVICE_REQUEST_PROCESSED = "roomParticipantListener.onDeviceRequestProcessed"
    private const val EVT_ON_DEVICE_INVITATION_RECEIVED = "roomParticipantListener.onDeviceInvitationReceived"
    private const val EVT_ON_DEVICE_INVITATION_CANCELLED = "roomParticipantListener.onDeviceInvitationCancelled"
    private const val EVT_ON_DEVICE_INVITATION_TIMEOUT = "roomParticipantListener.onDeviceInvitationTimeout"
    private const val EVT_ON_DEVICE_INVITATION_ACCEPTED = "roomParticipantListener.onDeviceInvitationAccepted"
    private const val EVT_ON_DEVICE_INVITATION_DECLINED = "roomParticipantListener.onDeviceInvitationDeclined"
    private const val EVT_ON_USER_VOICE_VOLUME_CHANGED = "roomParticipantState.onUserVoiceVolumeChanged"
    private const val EVT_ON_USER_NETWORK_QUALITY_CHANGED = "roomParticipantState.onUserNetworkQualityChanged"

    // 远端管理员关闭本地设备：SDK 通过 onRequestReceived 下发 closeRemote* RequestAction，
    // 不走 on(key,json) 通道，桥层主动 fan-out 到 ts EventKey。
    private const val EVT_ON_PARTICIPANT_DEVICE_CLOSED = "roomParticipantListener.onParticipantDeviceClosed"

    // 会议邀请 / 预约成员事件：SDK 不走 on(key,json)，桥层主动 fan-out 到 ts。
    private const val EVT_ON_PARTICIPANT_INVITATION_ADDED = "roomParticipantState.onInvitationAdded"
    private const val EVT_ON_PARTICIPANT_INVITATION_REMOVED = "roomParticipantState.onInvitationRemoved"
    private const val EVT_ON_PARTICIPANT_INVITATION_STATUS_CHANGED = "roomParticipantState.onInvitationStatusChanged"
    private const val EVT_ON_PARTICIPANT_SCHEDULE_ATTENDEES_UPDATED = "roomParticipantState.onScheduleAttendeesUpdated"

    private val PARTICIPANT_API_SET: Set<String> = setOf(
        TRANSFER_OWNER,
        SET_ADMIN,
        REVOKE_ADMIN,
        KICK_USER,
        UPDATE_PARTICIPANT_NAME_CARD,
        UPDATE_PARTICIPANT_META_DATA,
        CLOSE_PARTICIPANT_DEVICE,
        DISABLE_USER_MESSAGE,
        DISABLE_ALL_DEVICES,
        DISABLE_ALL_MESSAGES,
        MUTE_MICROPHONE,
        UNMUTE_MICROPHONE,
        REQUEST_TO_OPEN_DEVICE,
        CANCEL_OPEN_DEVICE_REQUEST,
        APPROVE_OPEN_DEVICE_REQUEST,
        REJECT_OPEN_DEVICE_REQUEST,
        INVITE_TO_OPEN_DEVICE,
        CANCEL_OPEN_DEVICE_INVITATION,
        ACCEPT_OPEN_DEVICE_INVITATION,
        DECLINE_OPEN_DEVICE_INVITATION,
    )

    /* ===== 主动调用：invoke ===== */

    /**
     * 主线程串行化：所有 SDK 调用、observer 增删、事件分发统一在主线程，
     * 避免业务线程 ↔ SDK 事件线程之间的 AB-BA 死锁（曾导致登录后白屏）。
     */
    private val mainHandler: Handler by lazy { Handler(Looper.getMainLooper()) }

    /** 当前已在主线程则直接同步执行，避免不必要的 hop。 */
    private inline fun runOnMain(crossinline block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            mainHandler.post { block() }
        }
    }

    @JvmStatic
    fun invoke(api: String, params: String, callback: ResultCallback) {
        runOnMain {
            try {
                if (QUERY_API_SET.contains(api)) {
                    // fire-and-forget：触发底层拉取，结果走 observer push 回来。
                    TUIRoomEngine.sharedInstance().query(api, params)
                    callback.onResult(0, "", "")
                    return@runOnMain
                }
                if (CONFERENCE_API_SET.contains(api)) {
                    val json = Codec.parseObject(params)
                    dispatchConferenceApi(api, json, callback)
                    return@runOnMain
                }
                if (PARTICIPANT_API_SET.contains(api)) {
                    val json = Codec.parseObject(params)
                    dispatchParticipantApi(api, json, callback)
                    return@runOnMain
                }
                TUIRoomEngine.sharedInstance().call(api, params, object : TUIRoomDefine.JsonAPIResponseCallback {
                    override fun onResponse(code: Int, message: String?, data: String?) {
                        callback.onResult(code, message ?: "", data ?: "")
                    }
                })
            } catch (e: Exception) {
                callback.onResult(-1, "exception: ${e.message}", "")
            }
        }
    }

    /* ===== 被动事件：addObserver / removeObserver ===== */

    private val observers: MutableList<Observer> = mutableListOf()

    @Volatile
    private var roomObserver: TUIRoomObserver? = null

    @Volatile
    private var cachedListManager: TUIConferenceListManager? = null

    @Volatile
    private var cachedInvitationManager: TUIConferenceInvitationManager? = null

    @Volatile
    private var registeredListObserver: TUIConferenceListManager.Observer? = null

    @Volatile
    private var registeredInvitationObserver: TUIConferenceInvitationManager.Observer? = null

    @JvmStatic
    fun addObserver(observer: Observer) {
        runOnMain {
            if (observers.contains(observer)) return@runOnMain
            observers.add(observer)
            ensureNativeObserversInstalled()
        }
    }

    @JvmStatic
    fun removeObserver(observer: Observer) {
        runOnMain {
            observers.remove(observer)
            // native observer 一旦安装就保持注册，避免反复装卸引发 SDK 线程竞态。
        }
    }

    private fun ensureNativeObserversInstalled() {
        if (roomObserver == null) {
            val o = RoomObserverImpl()
            roomObserver = o
            TUIRoomEngine.sharedInstance().addObserver(o)
        }
        if (registeredListObserver == null) {
            val o = ConferenceListObserverImpl()
            registeredListObserver = o
            listManager().addObserver(o)
        }
        if (registeredInvitationObserver == null) {
            val o = ConferenceInvitationObserverImpl()
            registeredInvitationObserver = o
            invitationManager().addObserver(o)
        }
    }

    private fun dispatchEvent(eventName: String, jsonData: String) {
        // 切到主线程派发：与 invoke / addObserver / removeObserver 串行，杜绝 AB-BA 死锁。
        runOnMain {
            // 浅拷贝快照，避免 onEvent 中重入修改 observers 导致迭代越界。
            val snapshot = observers.toList()
            if (snapshot.isEmpty()) return@runOnMain
            for (o in snapshot) {
                try {
                    o.onEvent(eventName, jsonData)
                } catch (e: Exception) {
                }
            }
        }
    }

    private fun emit(key: String, payload: JsonObject) {
        try {
            dispatchEvent(key, Codec.stringify(payload))
        } catch (e: Exception) {
        }
    }

    private class RoomObserverImpl : TUIRoomObserver() {
        override fun on(key: String, jsonData: String?) {
            dispatchEvent(key, jsonData ?: "")
        }

        /** 被踢出房间事件：SDK 通过独立方法回调，桥接到 ts `onKickedFromRoom`。 */
        override fun onKickedOutOfRoom(
            roomId: String?,
            reason: TUIRoomDefine.KickedOutOfRoomReason?,
            message: String?
        ) {
            val payload = JsonObject().apply {
                addProperty("roomID", roomId ?: "")
                addProperty("reason", Codec.kickedOutOfRoomReasonToTs(reason))
                addProperty("message", message ?: "")
            }
            emit(EVT_ON_KICKED_FROM_ROOM, payload)
        }

        /**
         * 设备申请/邀请收到事件：
         *   APPLY_TO_ADMIN_TO_OPEN_LOCAL_*  → 管理员收到成员申请（device application）
         *   TO_OPEN_REMOTE_*                → 成员收到管理员邀请（device invitation）
         *   TO_CLOSE_REMOTE_*               → 成员被关闭设备
         * 除 emit 外，缓存 request 以便 approve/reject/accept/decline 按 (device, userID) 取回 requestId。
         */
        override fun onRequestReceived(request: TUIRoomDefine.Request?) {
            if (request == null) return
            val fromUserId = request.fromUser?.userId ?: ""
            when (request.requestAction) {
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_CAMERA -> {
                    deviceRequestHandler.addReceivedDeviceApplication(DeviceKind.CAMERA, fromUserId, request)
                    emit(EVT_ON_DEVICE_REQUEST_RECEIVED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_MICROPHONE -> {
                    deviceRequestHandler.addReceivedDeviceApplication(DeviceKind.MICROPHONE, fromUserId, request)
                    emit(EVT_ON_DEVICE_REQUEST_RECEIVED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_CAMERA -> {
                    deviceRequestHandler.addReceivedDeviceInvitation(fromUserId, DeviceKind.CAMERA, request)
                    emit(EVT_ON_DEVICE_INVITATION_RECEIVED, JsonObject().apply {
                        add("invitation", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_MICROPHONE -> {
                    deviceRequestHandler.addReceivedDeviceInvitation(fromUserId, DeviceKind.MICROPHONE, request)
                    emit(EVT_ON_DEVICE_INVITATION_RECEIVED, JsonObject().apply {
                        add("invitation", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                // 管理员强制关闭本地设备：仅 emit 不缓存 request；operator 为发起者。
                TUIRoomDefine.RequestAction.REQUEST_TO_CLOSE_REMOTE_MICROPHONE -> {
                    emit(EVT_ON_PARTICIPANT_DEVICE_CLOSED, JsonObject().apply {
                        addProperty("device", DeviceKind.MICROPHONE.value)
                        add("operator", Codec.userInfoToJson(request.fromUser))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_CLOSE_REMOTE_CAMERA -> {
                    emit(EVT_ON_PARTICIPANT_DEVICE_CLOSED, JsonObject().apply {
                        addProperty("device", DeviceKind.CAMERA.value)
                        add("operator", Codec.userInfoToJson(request.fromUser))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_CLOSE_REMOTE_SCREEN_SHARE -> {
                    emit(EVT_ON_PARTICIPANT_DEVICE_CLOSED, JsonObject().apply {
                        addProperty("device", DeviceKind.SCREEN_SHARE.value)
                        add("operator", Codec.userInfoToJson(request.fromUser))
                    })
                }
                else -> Unit
            }
        }

        override fun onRequestCancelled(request: TUIRoomDefine.Request?, operateUser: TUIRoomDefine.UserInfo?) {
            if (request == null) return
            val fromUserId = request.fromUser?.userId ?: ""
            when (request.requestAction) {
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_CAMERA -> {
                    deviceRequestHandler.removeReceivedDeviceApplication(DeviceKind.CAMERA, fromUserId)
                    emit(EVT_ON_DEVICE_REQUEST_CANCELLED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_MICROPHONE -> {
                    deviceRequestHandler.removeReceivedDeviceApplication(DeviceKind.MICROPHONE, fromUserId)
                    emit(EVT_ON_DEVICE_REQUEST_CANCELLED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_CAMERA -> {
                    deviceRequestHandler.removeReceivedDeviceInvitation(fromUserId, DeviceKind.CAMERA)
                    emit(EVT_ON_DEVICE_INVITATION_CANCELLED, JsonObject().apply {
                        add("invitation", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_MICROPHONE -> {
                    deviceRequestHandler.removeReceivedDeviceInvitation(fromUserId, DeviceKind.MICROPHONE)
                    emit(EVT_ON_DEVICE_INVITATION_CANCELLED, JsonObject().apply {
                        add("invitation", Codec.requestToDeviceRequestInfo(request))
                    })
                }
                else -> Unit
            }
        }

        override fun onRequestProcessed(request: TUIRoomDefine.Request?, operateUser: TUIRoomDefine.UserInfo?) {
            if (request == null) return
            val fromUserId = request.fromUser?.userId ?: ""
            when (request.requestAction) {
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_CAMERA -> {
                    deviceRequestHandler.removeReceivedDeviceApplication(DeviceKind.CAMERA, fromUserId)
                    emit(EVT_ON_DEVICE_REQUEST_PROCESSED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                        add("operator", Codec.userInfoToJson(operateUser))
                    })
                }
                TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_MICROPHONE -> {
                    deviceRequestHandler.removeReceivedDeviceApplication(DeviceKind.MICROPHONE, fromUserId)
                    emit(EVT_ON_DEVICE_REQUEST_PROCESSED, JsonObject().apply {
                        add("request", Codec.requestToDeviceRequestInfo(request))
                        add("operator", Codec.userInfoToJson(operateUser))
                    })
                }
                else -> Unit
            }
        }

        override fun onUserVoiceVolumeChanged(volumeMap: MutableMap<String, Int>?) {
            val map = JsonObject()
            volumeMap?.forEach { (uid, vol) -> map.addProperty(uid, vol) }
            emit(EVT_ON_USER_VOICE_VOLUME_CHANGED, JsonObject().apply {
                add("volumeMap", map)
            })
        }

        override fun onUserNetworkQualityChanged(networkMap: MutableMap<String, TUICommonDefine.NetworkInfo>?) {
            val map = JsonObject()
            networkMap?.forEach { (uid, info) ->
                map.add(uid, Codec.networkInfoToJson(info))
            }
            emit(EVT_ON_USER_NETWORK_QUALITY_CHANGED, JsonObject().apply {
                add("networkMap", map)
            })
        }
    }

    /* ===== Conference manager 懒加载 ===== */

    private fun listManager(): TUIConferenceListManager {
        val cached = cachedListManager
        if (cached != null) return cached
        val mgr = TUIRoomEngine.sharedInstance()
            .getExtension(TUICommonDefine.ExtensionType.CONFERENCE_LIST_MANAGER) as TUIConferenceListManager
        cachedListManager = mgr
        return mgr
    }

    private fun invitationManager(): TUIConferenceInvitationManager {
        val cached = cachedInvitationManager
        if (cached != null) return cached
        val mgr = TUIRoomEngine.sharedInstance()
            .getExtension(TUICommonDefine.ExtensionType.CONFERENCE_INVITATION_MANAGER) as TUIConferenceInvitationManager
        cachedInvitationManager = mgr
        return mgr
    }

    /* ===== Conference API 分发 ===== */

    private fun dispatchConferenceApi(api: String, json: JsonObject?, cb: ResultCallback) {
        try {
            when (api) {
                GET_SCHEDULED_ROOM_LIST -> handleGetScheduledRoomList(json, cb)
                GET_SCHEDULED_ATTENDEES -> handleGetScheduledAttendees(json, cb)
                SCHEDULE_ROOM -> handleScheduleRoom(json, cb)
                UPDATE_SCHEDULED_ROOM -> handleUpdateScheduledRoom(json, cb)
                ADD_SCHEDULED_ATTENDEES -> handleAddScheduledAttendees(json, cb)
                REMOVE_SCHEDULED_ATTENDEES -> handleRemoveScheduledAttendees(json, cb)
                CANCEL_SCHEDULED_ROOM -> handleCancelScheduledRoom(json, cb)
                GET_PENDING_CALLS -> handleGetPendingCalls(json, cb)
                CALL_USER_TO_ROOM -> handleCallUserToRoom(json, cb)
                CANCEL_CALL -> handleCancelCall(json, cb)
                ACCEPT_CALL -> handleAcceptCall(json, cb)
                REJECT_CALL -> handleRejectCall(json, cb)
                else -> cb.onResult(-1, "unsupported conference api: $api", "")
            }
        } catch (e: Exception) {
            cb.onResult(-1, "exception: ${e.message}", "")
        }
    }

    private fun handleGetScheduledRoomList(json: JsonObject?, cb: ResultCallback) {
        val cursor = Codec.getString(json, "cursor")
        val statusList = listOf(
            TUIConferenceListManager.ConferenceStatus.NOT_STARTED,
            TUIConferenceListManager.ConferenceStatus.RUNNING
        )
        listManager().fetchScheduledConferenceList(
            statusList, cursor, FETCH_LIST_COUNT,
            object : TUIConferenceListManager.FetchScheduledConferenceListCallback {
                override fun onSuccess(result: TUIConferenceListManager.ScheduledConferenceListResult) {
                    val data = JsonObject().apply {
                        add("scheduledRoomList", Codec.conferenceInfoListToJson(result.conferenceInfoList))
                        addProperty("cursor", result.cursor ?: "")
                    }
                    cb.onResult(0, "", Codec.stringify(data))
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    private fun handleGetScheduledAttendees(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val cursor = Codec.getString(json, "cursor")
        listManager().fetchAttendeeList(
            roomID, cursor, FETCH_LIST_COUNT,
            object : TUIConferenceListManager.FetchScheduledAttendeesCallback {
                override fun onSuccess(result: TUIConferenceListManager.ScheduledAttendeesResult) {
                    val data = JsonObject().apply {
                        add("attendees", Codec.attendeeListToJson(result.scheduleAttendees))
                        addProperty("cursor", result.cursor ?: "")
                        addProperty("totalAttendeesCount", result.totalAttendeeCount)
                    }
                    cb.onResult(0, "", Codec.stringify(data))
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    private fun handleScheduleRoom(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val opts = Codec.getJsonObject(json, "options")
        listManager().scheduleConference(
            Codec.buildConferenceInfo(roomID, opts),
            actionCallback(cb))
    }

    private fun handleUpdateScheduledRoom(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val opts = Codec.getJsonObject(json, "options")
        listManager().updateConferenceInfo(
            Codec.buildConferenceInfo(roomID, opts),
            Codec.buildModifyFlagList(opts),
            actionCallback(cb))
    }

    private fun handleAddScheduledAttendees(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val userIDList = Codec.getStringList(json, "userIDList")
        listManager().addAttendeesByAdmin(roomID, userIDList, actionCallback(cb))
    }

    private fun handleRemoveScheduledAttendees(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val userIDList = Codec.getStringList(json, "userIDList")
        listManager().removeAttendeesByAdmin(roomID, userIDList, actionCallback(cb))
    }

    private fun handleCancelScheduledRoom(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        listManager().cancelConference(roomID, actionCallback(cb))
    }

    private fun handleGetPendingCalls(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val cursor = Codec.getString(json, "cursor")
        invitationManager().getInvitationList(
            roomID, cursor, FETCH_LIST_COUNT,
            object : TUIConferenceInvitationManager.GetInvitationListCallback {
                override fun onSuccess(result: TUIConferenceInvitationManager.InvitationListResult) {
                    val data = JsonObject().apply {
                        add("calls", Codec.invitationListToJson(result.invitationList))
                        addProperty("cursor", result.cursor ?: "")
                    }
                    cb.onResult(0, "", Codec.stringify(data))
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    private fun handleCallUserToRoom(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val userIDList = Codec.getStringList(json, "userIDList")
        val timeout = Codec.getInt(json, "timeout", 30)
        val extensionInfo = Codec.getString(json, "extensionInfo")
        invitationManager().inviteUsers(
            roomID, userIDList, timeout, extensionInfo,
            object : TUIConferenceInvitationManager.InviteUsersCallback {
                override fun onSuccess(resultMap: Map<String, TUIConferenceInvitationManager.InvitationCode>) {
                    val results = JsonObject()
                    for ((userId, code) in resultMap) {
                        results.addProperty(userId, Codec.invitationCodeToTs(code))
                    }
                    val data = JsonObject().apply { add("results", results) }
                    cb.onResult(0, "", Codec.stringify(data))
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    private fun handleCancelCall(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val userIDList = Codec.getStringList(json, "userIDList")
        invitationManager().cancelInvitation(roomID, userIDList, actionCallback(cb))
    }

    private fun handleAcceptCall(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        invitationManager().accept(roomID, actionCallback(cb))
    }

    private fun handleRejectCall(json: JsonObject?, cb: ResultCallback) {
        val roomID = Codec.getString(json, "roomID")
        val ext = Codec.getString(json, "extensionInfo")
        invitationManager().reject(
            roomID, Codec.rejectedReasonFromExtension(ext),
            actionCallback(cb))
    }

    private fun actionCallback(cb: ResultCallback): TUIRoomDefine.ActionCallback {
        return object : TUIRoomDefine.ActionCallback {
            override fun onSuccess() {
                cb.onResult(0, "", "")
            }

            override fun onError(error: TUICommonDefine.Error, message: String) {
                cb.onResult(error.value, message, "")
            }
        }
    }

    /*
     * ===== Participant API 分发 =====
     * deviceRequestHandler 缓存 sent/received 的 application/invitation Request；
     * DeviceKind 数值与 ts `DeviceType` 一致：0=MICROPHONE, 1=CAMERA, 2=SCREEN_SHARE。
     */

    private val deviceRequestHandler = DeviceRequestHandler()

    /** ts 侧 RoomParticipantStatus 数值：1=Scheduled, 2=InCalling, 3=CallTimeout, 4=CallRejected, 5=InRoom。 */
    private const val PARTICIPANT_STATUS_SCHEDULED = 1
    private const val PARTICIPANT_STATUS_IN_CALLING = 2
    private const val PARTICIPANT_STATUS_CALL_TIMEOUT = 3
    private const val PARTICIPANT_STATUS_CALL_REJECTED = 4
    private const val PARTICIPANT_STATUS_IN_ROOM = 5

    /** ts 侧 RoomCallStatus 数值（对齐 types/room.ts）：0=None, 1=Calling, 2=Timeout, 3=Rejected。 */
    private const val ROOM_CALL_STATUS_NONE = 0
    private const val ROOM_CALL_STATUS_CALLING = 1
    private const val ROOM_CALL_STATUS_TIMEOUT = 2
    private const val ROOM_CALL_STATUS_REJECTED = 3

    private fun dispatchParticipantApi(api: String, json: JsonObject?, cb: ResultCallback) {
        try {
            val engine = TUIRoomEngine.sharedInstance()
            when (api) {
                TRANSFER_OWNER -> {
                    val userID = Codec.getString(json, "userID")
                    engine.changeUserRole(userID, TUIRoomDefine.Role.ROOM_OWNER, actionCallback(cb))
                }
                SET_ADMIN -> {
                    val userID = Codec.getString(json, "userID")
                    engine.changeUserRole(userID, TUIRoomDefine.Role.MANAGER, actionCallback(cb))
                }
                REVOKE_ADMIN -> {
                    val userID = Codec.getString(json, "userID")
                    engine.changeUserRole(userID, TUIRoomDefine.Role.GENERAL_USER, actionCallback(cb))
                }
                KICK_USER -> {
                    val userID = Codec.getString(json, "userID")
                    engine.kickRemoteUserOutOfRoom(userID, actionCallback(cb))
                }
                UPDATE_PARTICIPANT_NAME_CARD -> {
                    val userID = Codec.getString(json, "userID")
                    val nameCard = Codec.getString(json, "nameCard")
                    engine.changeUserNameCard(userID, nameCard, actionCallback(cb))
                }
                UPDATE_PARTICIPANT_META_DATA -> {
                    val userID = Codec.getString(json, "userID")
                    val metaData = Codec.getStringMap(json, "metaData")
                    val bytesMap = HashMap<String, ByteArray>()
                    metaData.forEach { (k, v) -> bytesMap[k] = v.toByteArray(Charsets.UTF_8) }
                    engine.setCustomInfoForUser(userID, bytesMap, actionCallback(cb))
                }
                CLOSE_PARTICIPANT_DEVICE -> {
                    val userID = Codec.getString(json, "userID")
                    val device = DeviceKind.parse(Codec.getInt(json, "device"))
                    engine.closeRemoteDeviceByAdmin(userID, device.toMediaDevice(), actionCallback(cb))
                }
                DISABLE_USER_MESSAGE -> {
                    val userID = Codec.getString(json, "userID")
                    val disable = Codec.getBool(json, "disable")
                    engine.disableSendingMessageByAdmin(userID, disable, actionCallback(cb))
                }
                DISABLE_ALL_DEVICES -> {
                    val device = DeviceKind.parse(Codec.getInt(json, "device"))
                    val disable = Codec.getBool(json, "disable")
                    engine.disableDeviceForAllUserByAdmin(device.toMediaDevice(), disable, actionCallback(cb))
                }
                DISABLE_ALL_MESSAGES -> {
                    val disable = Codec.getBool(json, "disable")
                    engine.disableSendingMessageForAllUser(disable, actionCallback(cb))
                }
                MUTE_MICROPHONE -> {
                    engine.muteLocalAudio()
                    cb.onResult(0, "", "")
                }
                UNMUTE_MICROPHONE -> {
                    engine.unmuteLocalAudio(actionCallback(cb))
                }
                REQUEST_TO_OPEN_DEVICE -> handleRequestToOpenDevice(json, cb)
                CANCEL_OPEN_DEVICE_REQUEST -> handleCancelOpenDeviceRequest(json, cb)
                APPROVE_OPEN_DEVICE_REQUEST -> handleResponseDeviceApplication(json, isAccept = true, cb = cb)
                REJECT_OPEN_DEVICE_REQUEST -> handleResponseDeviceApplication(json, isAccept = false, cb = cb)
                INVITE_TO_OPEN_DEVICE -> handleInviteToOpenDevice(json, cb)
                CANCEL_OPEN_DEVICE_INVITATION -> handleCancelOpenDeviceInvitation(json, cb)
                ACCEPT_OPEN_DEVICE_INVITATION -> handleResponseDeviceInvitation(json, isAccept = true, cb = cb)
                DECLINE_OPEN_DEVICE_INVITATION -> handleResponseDeviceInvitation(json, isAccept = false, cb = cb)
                else -> cb.onResult(-1, "unsupported participant api: $api", "")
            }
        } catch (e: Exception) {
            cb.onResult(-1, "exception: ${e.message}", "")
        }
    }

    /**
     * 申请管理员开启本地设备：onAccepted/onRejected/onTimeout/onCancelled 均视为成功，仅 onError 透传错误码。
     */
    private fun handleRequestToOpenDevice(json: JsonObject?, cb: ResultCallback) {
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val timeout = Codec.getInt(json, "timeout", 0)
        val request = TUIRoomEngine.sharedInstance().applyToAdminToOpenLocalDevice(
            device.toMediaDevice(),
            timeout,
            object : TUIRoomDefine.RequestCallback {
                override fun onAccepted(requestID: String?, userID: String?) {
                    val cached = deviceRequestHandler.getSentDeviceApplication(device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceApplication(device)
                        emit(EVT_ON_DEVICE_REQUEST_APPROVED, JsonObject().apply {
                            add("request", Codec.requestToDeviceRequestInfo(cached))
                            add("operator", Codec.userInfoToJson(cached.toUser))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onRejected(requestID: String?, userID: String?, message: String?) {
                    val cached = deviceRequestHandler.getSentDeviceApplication(device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceApplication(device)
                        emit(EVT_ON_DEVICE_REQUEST_REJECTED, JsonObject().apply {
                            add("request", Codec.requestToDeviceRequestInfo(cached))
                            add("operator", Codec.userInfoToJson(cached.toUser))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onCancelled(requestID: String?, userID: String?) {
                    deviceRequestHandler.removeSentDeviceApplication(device)
                    cb.onResult(0, "", "")
                }

                override fun onTimeout(requestID: String?, userID: String?) {
                    val cached = deviceRequestHandler.getSentDeviceApplication(device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceApplication(device)
                        emit(EVT_ON_DEVICE_REQUEST_TIMEOUT, JsonObject().apply {
                            add("request", Codec.requestToDeviceRequestInfo(cached))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onError(
                    requestID: String?,
                    userID: String?,
                    error: TUICommonDefine.Error,
                    message: String?
                ) {
                    deviceRequestHandler.removeSentDeviceApplication(device)
                    cb.onResult(error.value, message ?: "", "")
                }
            })
        if (request != null) {
            deviceRequestHandler.addSentDeviceApplication(device, request)
        }
    }

    private fun handleCancelOpenDeviceRequest(json: JsonObject?, cb: ResultCallback) {
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val request = deviceRequestHandler.getSentDeviceApplication(device)
        if (request == null) {
            cb.onResult(TUICommonDefine.Error.FAILED.value, "No device application is requesting", "")
            return
        }
        TUIRoomEngine.sharedInstance().cancelRequest(request.requestId, object : TUIRoomDefine.ActionCallback {
            override fun onSuccess() {
                deviceRequestHandler.removeSentDeviceApplication(device)
                cb.onResult(0, "", "")
            }

            override fun onError(error: TUICommonDefine.Error, message: String) {
                cb.onResult(error.value, message, "")
            }
        })
    }

    private fun handleResponseDeviceApplication(json: JsonObject?, isAccept: Boolean, cb: ResultCallback) {
        val userID = Codec.getString(json, "userID")
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val request = deviceRequestHandler.getReceivedDeviceApplication(userID, device)
        if (request == null) {
            cb.onResult(TUICommonDefine.Error.FAILED.value, "Not receiving requests", "")
            return
        }
        TUIRoomEngine.sharedInstance().responseRemoteRequest(
            request.requestId, isAccept, object : TUIRoomDefine.ActionCallback {
                override fun onSuccess() {
                    deviceRequestHandler.removeReceivedDeviceApplication(device, userID)
                    cb.onResult(0, "", "")
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    /** 管理员邀请远端用户开启设备。 */
    private fun handleInviteToOpenDevice(json: JsonObject?, cb: ResultCallback) {
        val userID = Codec.getString(json, "userID")
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val timeout = Codec.getInt(json, "timeout", 0)
        val request = TUIRoomEngine.sharedInstance().openRemoteDeviceByAdmin(
            userID,
            device.toMediaDevice(),
            timeout,
            object : TUIRoomDefine.RequestCallback {
                override fun onAccepted(requestID: String?, peerUserID: String?) {
                    val cached = deviceRequestHandler.getSentDeviceInvitation(userID, device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                        emit(EVT_ON_DEVICE_INVITATION_ACCEPTED, JsonObject().apply {
                            add("invitation", Codec.requestToDeviceRequestInfo(cached))
                            add("operator", Codec.userInfoToJson(cached.toUser))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onRejected(requestID: String?, peerUserID: String?, message: String?) {
                    val cached = deviceRequestHandler.getSentDeviceInvitation(userID, device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                        emit(EVT_ON_DEVICE_INVITATION_DECLINED, JsonObject().apply {
                            add("invitation", Codec.requestToDeviceRequestInfo(cached))
                            add("operator", Codec.userInfoToJson(cached.toUser))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onCancelled(requestID: String?, peerUserID: String?) {
                    deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                    cb.onResult(0, "", "")
                }

                override fun onTimeout(requestID: String?, peerUserID: String?) {
                    val cached = deviceRequestHandler.getSentDeviceInvitation(userID, device)
                    if (cached != null) {
                        deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                        emit(EVT_ON_DEVICE_INVITATION_TIMEOUT, JsonObject().apply {
                            add("invitation", Codec.requestToDeviceRequestInfo(cached))
                        })
                    }
                    cb.onResult(0, "", "")
                }

                override fun onError(
                    requestID: String?,
                    peerUserID: String?,
                    error: TUICommonDefine.Error,
                    message: String?
                ) {
                    deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                    cb.onResult(error.value, message ?: "", "")
                }
            })
        if (request != null) {
            deviceRequestHandler.addSentDeviceInvitation(userID, device, request)
        }
    }

    private fun handleCancelOpenDeviceInvitation(json: JsonObject?, cb: ResultCallback) {
        val userID = Codec.getString(json, "userID")
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val request = deviceRequestHandler.getSentDeviceInvitation(userID, device)
        if (request == null) {
            cb.onResult(TUICommonDefine.Error.FAILED.value, "No invitation is sent", "")
            return
        }
        TUIRoomEngine.sharedInstance().cancelRequest(request.requestId, object : TUIRoomDefine.ActionCallback {
            override fun onSuccess() {
                deviceRequestHandler.removeSentDeviceInvitation(userID, device)
                cb.onResult(0, "", "")
            }

            override fun onError(error: TUICommonDefine.Error, message: String) {
                cb.onResult(error.value, message, "")
            }
        })
    }

    private fun handleResponseDeviceInvitation(json: JsonObject?, isAccept: Boolean, cb: ResultCallback) {
        val userID = Codec.getString(json, "userID")
        val device = DeviceKind.parse(Codec.getInt(json, "device"))
        val request = deviceRequestHandler.getReceivedDeviceInvitation(userID, device)
        if (request == null) {
            cb.onResult(TUICommonDefine.Error.FAILED.value, "Not receiving invitations", "")
            return
        }
        TUIRoomEngine.sharedInstance().responseRemoteRequest(
            request.requestId, isAccept, object : TUIRoomDefine.ActionCallback {
                override fun onSuccess() {
                    deviceRequestHandler.removeReceivedDeviceInvitation(userID, device)
                    cb.onResult(0, "", "")
                }

                override fun onError(error: TUICommonDefine.Error, message: String) {
                    cb.onResult(error.value, message, "")
                }
            })
    }

    /* ===== DeviceKind + DeviceRequestHandler（桥层等价物） ===== */

    /** 数值与 ts `DeviceType` 严格一致：0=MICROPHONE, 1=CAMERA, 2=SCREEN_SHARE。 */
    private enum class DeviceKind(val value: Int) {
        MICROPHONE(0),
        CAMERA(1),
        SCREEN_SHARE(2);

        fun toMediaDevice(): TUIRoomDefine.MediaDevice = when (this) {
            MICROPHONE -> TUIRoomDefine.MediaDevice.MICROPHONE
            CAMERA -> TUIRoomDefine.MediaDevice.CAMERA
            SCREEN_SHARE -> TUIRoomDefine.MediaDevice.SCREEN_SHARING
        }

        companion object {
            @JvmStatic
            fun parse(value: Int): DeviceKind = when (value) {
                0 -> MICROPHONE
                1 -> CAMERA
                2 -> SCREEN_SHARE
                else -> MICROPHONE
            }
        }
    }

    /**
     * 桥层管理 SDK Request 对象生命周期：
     *   sentApplications:    (device) → Request           本端发起申请
     *   sentInvitations:     (userID, device) → Request   管理员邀请
     *   receivedApplications:(userID, device) → Request
     *   receivedInvitations: (userID, device) → Request
     * pending* 列表的快照维护交给 ts 侧。
     */
    private class DeviceRequestHandler {
        private val sentApplications: MutableMap<DeviceKind, TUIRoomDefine.Request> = mutableMapOf()
        private val sentInvitations: MutableMap<Pair<String, DeviceKind>, TUIRoomDefine.Request> = mutableMapOf()
        private val receivedApplications: MutableMap<Pair<String, DeviceKind>, TUIRoomDefine.Request> = mutableMapOf()
        private val receivedInvitations: MutableMap<Pair<String, DeviceKind>, TUIRoomDefine.Request> = mutableMapOf()

        @Synchronized
        fun addSentDeviceApplication(device: DeviceKind, request: TUIRoomDefine.Request) {
            sentApplications[device] = request
        }

        @Synchronized
        fun removeSentDeviceApplication(device: DeviceKind) {
            sentApplications.remove(device)
        }

        @Synchronized
        fun getSentDeviceApplication(device: DeviceKind): TUIRoomDefine.Request? = sentApplications[device]

        @Synchronized
        fun addSentDeviceInvitation(userID: String, device: DeviceKind, request: TUIRoomDefine.Request) {
            sentInvitations[userID to device] = request
        }

        @Synchronized
        fun removeSentDeviceInvitation(userID: String, device: DeviceKind) {
            sentInvitations.remove(userID to device)
        }

        @Synchronized
        fun getSentDeviceInvitation(userID: String, device: DeviceKind): TUIRoomDefine.Request? =
            sentInvitations[userID to device]

        @Synchronized
        fun addReceivedDeviceApplication(device: DeviceKind, userID: String, request: TUIRoomDefine.Request) {
            receivedApplications[userID to device] = request
        }

        @Synchronized
        fun removeReceivedDeviceApplication(device: DeviceKind, userID: String) {
            receivedApplications.remove(userID to device)
        }

        @Synchronized
        fun getReceivedDeviceApplication(userID: String, device: DeviceKind): TUIRoomDefine.Request? =
            receivedApplications[userID to device]

        @Synchronized
        fun addReceivedDeviceInvitation(userID: String, device: DeviceKind, request: TUIRoomDefine.Request) {
            receivedInvitations[userID to device] = request
        }

        @Synchronized
        fun removeReceivedDeviceInvitation(userID: String, device: DeviceKind) {
            receivedInvitations.remove(userID to device)
        }

        @Synchronized
        fun getReceivedDeviceInvitation(userID: String, device: DeviceKind): TUIRoomDefine.Request? =
            receivedInvitations[userID to device]
    }

    /* ===== Conference observer：事件直接 emit ===== */

    private class ConferenceListObserverImpl : TUIConferenceListManager.Observer() {
        override fun onConferenceScheduled(conferenceInfo: TUIConferenceListManager.ConferenceInfo) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
            }
            emit(EVT_ON_ADDED_TO_SCHEDULED_ROOM, payload)
        }

        override fun onConferenceWillStart(conferenceInfo: TUIConferenceListManager.ConferenceInfo) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
            }
            emit(EVT_ON_SCHEDULED_ROOM_STARTING_SOON, payload)
        }

        override fun onConferenceDidCancelled(
            conferenceInfo: TUIConferenceListManager.ConferenceInfo,
            reason: TUIConferenceListManager.ConferenceCancelReason,
            operateUser: TUIRoomDefine.UserInfo
        ) {
            val eventKey = if (reason == TUIConferenceListManager.ConferenceCancelReason.CANCELLED_BY_ADMIN) {
                EVT_ON_SCHEDULED_ROOM_CANCELLED
            } else {
                EVT_ON_REMOVED_FROM_SCHEDULED_ROOM
            }
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
                add("operator", Codec.userInfoToJson(operateUser))
            }
            emit(eventKey, payload)
        }

        override fun onConferenceInfoChanged(
            conferenceInfo: TUIConferenceListManager.ConferenceInfo,
            modifyFlagList: List<TUIConferenceListManager.ConferenceModifyFlag>
        ) {
            val flagArray = JsonArray()
            modifyFlagList.forEach { flagArray.add(Codec.conferenceModifyFlagToTs(it)) }
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
                add("modifyFlagList", flagArray)
            }
            emit(EVT_ON_CONFERENCE_INFO_CHANGED, payload)
        }

        override fun onScheduleAttendeesUpdated(
            conferenceInfo: TUIConferenceListManager.ConferenceInfo,
            leftUsers: List<TUIRoomDefine.UserInfo>,
            joinedUsers: List<TUIRoomDefine.UserInfo>
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
                add("leftUsers", Codec.attendeeListToJson(leftUsers))
                add("joinedUsers", Codec.attendeeListToJson(joinedUsers))
            }
            emit(EVT_ON_SCHEDULE_ATTENDEES_UPDATED, payload)

            // fan-out 到 ts RoomParticipantState，joinedUsers 转 RoomParticipant，status = Scheduled(1)。
            val participantPayload = JsonObject().apply {
                add("leftUsers", Codec.attendeeListToJson(leftUsers))
                add("joinedUsers", Codec.participantListFromUserInfoToJson(joinedUsers, PARTICIPANT_STATUS_SCHEDULED))
            }
            emit(EVT_ON_PARTICIPANT_SCHEDULE_ATTENDEES_UPDATED, participantPayload)
        }

        override fun onConferenceStatusUpdated(
            conferenceInfo: TUIConferenceListManager.ConferenceInfo,
            status: TUIConferenceListManager.ConferenceStatus
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.conferenceInfoToJson(conferenceInfo))
                addProperty("status", Codec.conferenceStatusToTs(status))
            }
            emit(EVT_ON_CONFERENCE_STATUS_UPDATED, payload)
        }
    }

    private class ConferenceInvitationObserverImpl : TUIConferenceInvitationManager.Observer() {
        override fun onReceiveInvitation(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation,
            extensionInfo: String
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
                addProperty("extensionInfo", extensionInfo ?: "")
            }
            emit(EVT_ON_CALL_RECEIVED, payload)
        }

        override fun onInvitationCancelled(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
            }
            emit(EVT_ON_CALL_CANCELLED, payload)
        }

        override fun onInvitationTimeout(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
            }
            emit(EVT_ON_CALL_TIMEOUT, payload)
        }

        override fun onInvitationAccepted(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
            }
            emit(EVT_ON_CALL_ACCEPTED, payload)
        }

        override fun onInvitationRejected(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation,
            reason: TUIConferenceInvitationManager.RejectedReason
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
                addProperty("reason", Codec.rejectedReasonToTs(reason))
            }
            emit(EVT_ON_CALL_REJECTED, payload)
        }

        override fun onInvitationRevokedByAdmin(
            roomInfo: TUIRoomDefine.RoomInfo,
            invitation: TUIConferenceInvitationManager.Invitation,
            admin: TUIRoomDefine.UserInfo
        ) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                add("call", Codec.invitationToJson(invitation))
                add("operator", Codec.userInfoToJson(admin))
            }
            emit(EVT_ON_CALL_REVOKED_BY_ADMIN, payload)
        }

        override fun onInvitationHandledByOtherDevice(roomInfo: TUIRoomDefine.RoomInfo, accepted: Boolean) {
            val payload = JsonObject().apply {
                add("roomInfo", Codec.roomInfoToJson(roomInfo))
                addProperty("isAccepted", accepted)
            }
            emit(EVT_ON_CALL_HANDLED_BY_OTHER_DEVICE, payload)
        }

        /* ---- 透传到 ts RoomParticipantState（pending invitation 侧） ---- */
        override fun onInvitationAdded(roomID: String, invitation: TUIConferenceInvitationManager.Invitation) {
            val payload = JsonObject().apply {
                addProperty("roomID", roomID)
                add(
                    "participant",
                    Codec.participantFromUserInfoToJson(
                        invitation.invitee,
                        Codec.invitationStatusToParticipantStatus(invitation.status)
                    )
                )
            }
            emit(EVT_ON_PARTICIPANT_INVITATION_ADDED, payload)
        }

        override fun onInvitationRemoved(roomID: String, invitation: TUIConferenceInvitationManager.Invitation) {
            val payload = JsonObject().apply {
                addProperty("roomID", roomID)
                addProperty("userID", invitation.invitee?.userId ?: "")
            }
            emit(EVT_ON_PARTICIPANT_INVITATION_REMOVED, payload)
        }

        override fun onInvitationStatusChanged(
            roomID: String,
            invitation: TUIConferenceInvitationManager.Invitation
        ) {
            val payload = JsonObject().apply {
                addProperty("roomID", roomID)
                add(
                    "participant",
                    Codec.participantFromUserInfoToJson(
                        invitation.invitee,
                        Codec.invitationStatusToParticipantStatus(invitation.status)
                    )
                )
            }
            emit(EVT_ON_PARTICIPANT_INVITATION_STATUS_CHANGED, payload)
        }
    }

    /* ===== JSON 编解码 / 枚举映射（字段对齐 ts `state/RoomState.ts`） ===== */

    private object Codec {

        private val gson = Gson()

        fun stringify(json: JsonObject): String = gson.toJson(json)

        /* ---------------------- 入参解析工具 ---------------------- */

        fun parseObject(params: String?): JsonObject? {
            if (params.isNullOrEmpty()) return null
            return try {
                val ele = JsonParser.parseString(params)
                if (ele.isJsonObject) ele.asJsonObject else null
            } catch (e: Exception) {
                null
            }
        }

        fun getString(json: JsonObject?, key: String, def: String = ""): String {
            if (json == null || !json.has(key) || json.get(key).isJsonNull) return def
            return try {
                json.get(key).asString
            } catch (e: Exception) {
                def
            }
        }

        fun getLong(json: JsonObject?, key: String, def: Long = 0L): Long {
            if (json == null || !json.has(key) || json.get(key).isJsonNull) return def
            return try {
                json.get(key).asLong
            } catch (e: Exception) {
                def
            }
        }

        fun getInt(json: JsonObject?, key: String, def: Int = 0): Int {
            if (json == null || !json.has(key) || json.get(key).isJsonNull) return def
            return try {
                json.get(key).asInt
            } catch (e: Exception) {
                def
            }
        }

        fun getBool(json: JsonObject?, key: String, def: Boolean = false): Boolean {
            if (json == null || !json.has(key) || json.get(key).isJsonNull) return def
            return try {
                json.get(key).asBoolean
            } catch (e: Exception) {
                def
            }
        }

        fun getStringList(json: JsonObject?, key: String): List<String> {
            if (json == null || !json.has(key) || !json.get(key).isJsonArray) return emptyList()
            val arr = json.getAsJsonArray(key)
            val list = ArrayList<String>(arr.size())
            for (i in 0 until arr.size()) {
                val ele = arr.get(i)
                if (!ele.isJsonNull) {
                    try {
                        list.add(ele.asString)
                    } catch (_: Exception) {
                    }
                }
            }
            return list
        }

        /** Record<string,string> 入参解析；非 string 值跳过。 */
        fun getStringMap(json: JsonObject?, key: String): Map<String, String> {
            if (json == null || !json.has(key)) return emptyMap()
            val ele = json.get(key)
            if (!ele.isJsonObject) return emptyMap()
            val obj = ele.asJsonObject
            val map = LinkedHashMap<String, String>()
            for ((k, v) in obj.entrySet()) {
                if (v == null || v.isJsonNull) continue
                try {
                    map[k] = v.asString
                } catch (_: Exception) {
                }
            }
            return map
        }

        fun getJsonObject(json: JsonObject?, key: String): JsonObject? {
            if (json == null || !json.has(key)) return null
            val ele = json.get(key)
            return if (ele.isJsonObject) ele.asJsonObject else null
        }

        /* ---------------------- SDK 对象 -> JSON ---------------------- */

        fun userInfoToJson(user: TUIRoomDefine.UserInfo?): JsonObject {
            val obj = JsonObject()
            if (user == null) {
                obj.addProperty("userID", "")
                obj.addProperty("userName", "")
                obj.addProperty("avatarURL", "")
                return obj
            }
            obj.addProperty("userID", user.userId ?: "")
            obj.addProperty("userName", user.userName ?: "")
            obj.addProperty("avatarURL", user.avatarUrl ?: "")
            return obj
        }

        /** SDK UserInfo + status → ts RoomParticipant JSON（字段对齐 types/roomParticipant.ts）。 */
        fun participantFromUserInfoToJson(user: TUIRoomDefine.UserInfo?, roomStatus: Int): JsonObject {
            val obj = JsonObject()
            if (user == null) {
                obj.addProperty("userID", "")
                obj.addProperty("userName", "")
                obj.addProperty("avatarURL", "")
                obj.addProperty("nameCard", "")
                obj.addProperty("role", 2)             // GeneralUser
                obj.addProperty("roomStatus", roomStatus)
                obj.addProperty("microphoneStatus", 0) // OFF
                obj.addProperty("cameraStatus", 0)
                obj.addProperty("screenShareStatus", 0)
                obj.addProperty("isMessageDisabled", false)
                obj.add("metaData", JsonObject())
                return obj
            }
            obj.addProperty("userID", user.userId ?: "")
            obj.addProperty("userName", user.userName ?: "")
            obj.addProperty("avatarURL", user.avatarUrl ?: "")
            obj.addProperty("nameCard", user.nameCard ?: "")
            obj.addProperty("role", roleToTs(user.userRole))
            obj.addProperty("roomStatus", roomStatus)
            obj.addProperty("microphoneStatus", if (user.hasAudioStream) 1 else 0)
            obj.addProperty("cameraStatus", if (user.hasVideoStream) 1 else 0)
            obj.addProperty("screenShareStatus", if (user.hasScreenStream) 1 else 0)
            obj.addProperty("isMessageDisabled", user.isMessageDisabled)
            val meta = JsonObject()
            user.roomCustomInfo?.forEach { (k, v) ->
                try {
                    meta.addProperty(k, String(v, Charsets.UTF_8))
                } catch (_: Exception) {
                }
            }
            obj.add("metaData", meta)
            return obj
        }

        /** SDK UserInfo 列表 + status → ts RoomParticipant 数组。 */
        fun participantListFromUserInfoToJson(users: List<TUIRoomDefine.UserInfo>?, roomStatus: Int): JsonArray {
            val arr = JsonArray()
            if (users == null) return arr
            for (u in users) arr.add(participantFromUserInfoToJson(u, roomStatus))
            return arr
        }

        /** SDK Role → ts RoomParticipantRole：Owner=0 / Admin=1 / GeneralUser=2。 */
        private fun roleToTs(role: TUIRoomDefine.Role?): Int = when (role) {
            TUIRoomDefine.Role.ROOM_OWNER -> 0
            TUIRoomDefine.Role.MANAGER -> 1
            TUIRoomDefine.Role.GENERAL_USER -> 2
            else -> 2
        }

        /**
         * SDK InvitationStatus → ts RoomParticipantStatus：
         * PENDING→InCalling(2) / TIMEOUT→CallTimeout(3) / REJECTED→CallRejected(4) / 其它→InRoom(5)。
         */
        fun invitationStatusToParticipantStatus(
            status: TUIConferenceInvitationManager.InvitationStatus?
        ): Int = when (status) {
            TUIConferenceInvitationManager.InvitationStatus.PENDING -> PARTICIPANT_STATUS_IN_CALLING
            TUIConferenceInvitationManager.InvitationStatus.TIMEOUT -> PARTICIPANT_STATUS_CALL_TIMEOUT
            TUIConferenceInvitationManager.InvitationStatus.REJECTED -> PARTICIPANT_STATUS_CALL_REJECTED
            else -> PARTICIPANT_STATUS_IN_ROOM
        }

        fun roomInfoToJson(roomInfo: TUIRoomDefine.RoomInfo?): JsonObject {
            val obj = JsonObject()
            if (roomInfo == null) {
                obj.addProperty("roomID", "")
                return obj
            }
            val owner = JsonObject().apply {
                addProperty("userID", roomInfo.ownerId ?: "")
                addProperty("userName", roomInfo.ownerName ?: "")
                addProperty("avatarURL", roomInfo.ownerAvatarUrl ?: "")
            }
            obj.addProperty("roomID", roomInfo.roomId ?: "")
            obj.addProperty("roomName", roomInfo.name ?: "")
            obj.addProperty("roomType", roomInfo.roomType?.value ?: 1)
            obj.add("roomOwner", owner)
            obj.addProperty("password", roomInfo.password ?: "")
            obj.addProperty("participantCount", roomInfo.memberCount)
            obj.addProperty("createTime", roomInfo.createTime)
            obj.addProperty("isAllMicrophoneDisabled", roomInfo.isMicrophoneDisableForAllUser)
            obj.addProperty("isAllCameraDisabled", roomInfo.isCameraDisableForAllUser)
            obj.addProperty("isAllScreenShareDisabled", roomInfo.isScreenShareDisableForAllUser)
            obj.addProperty("isAllMessageDisabled", roomInfo.isMessageDisableForAllUser)
            return obj
        }

        fun conferenceInfoToJson(info: TUIConferenceListManager.ConferenceInfo?): JsonObject {
            if (info == null) {
                return JsonObject().apply { addProperty("roomID", "") }
            }
            val basic = roomInfoToJson(info.basicRoomInfo)
            basic.addProperty("scheduledStartTime", (info.scheduleStartTime / 1000).toInt())
            basic.addProperty("scheduledEndTime", (info.scheduleEndTime / 1000).toInt())
            basic.addProperty("startReminderInSeconds", info.reminderSecondsBeforeStart)
            basic.addProperty("roomStatus", conferenceStatusToTs(info.status))
            return basic
        }

        fun conferenceStatusToTs(status: TUIConferenceListManager.ConferenceStatus?): Int {
            return if (status == TUIConferenceListManager.ConferenceStatus.RUNNING) {
                TUIConferenceListManager.ConferenceStatus.RUNNING.ordinal
            } else {
                TUIConferenceListManager.ConferenceStatus.NOT_STARTED.ordinal
            }
        }

        fun attendeeListToJson(users: List<TUIRoomDefine.UserInfo>?): JsonArray {
            val arr = JsonArray()
            if (users == null) return arr
            for (u in users) arr.add(userInfoToJson(u))
            return arr
        }

        fun conferenceInfoListToJson(list: List<TUIConferenceListManager.ConferenceInfo>?): JsonArray {
            val arr = JsonArray()
            if (list == null) return arr
            for (info in list) arr.add(conferenceInfoToJson(info))
            return arr
        }

        fun invitationToJson(inv: TUIConferenceInvitationManager.Invitation?): JsonObject {
            val obj = JsonObject()
            if (inv == null) return obj
            obj.add("caller", userInfoToJson(inv.inviter))
            obj.add("callee", userInfoToJson(inv.invitee))
            obj.addProperty("status", invitationStatusToRoomCallStatus(inv.status))
            return obj
        }

        fun invitationStatusToRoomCallStatus(
            status: TUIConferenceInvitationManager.InvitationStatus?
        ): Int {
            return when (status) {
                TUIConferenceInvitationManager.InvitationStatus.PENDING -> ROOM_CALL_STATUS_CALLING
                TUIConferenceInvitationManager.InvitationStatus.TIMEOUT -> ROOM_CALL_STATUS_TIMEOUT
                TUIConferenceInvitationManager.InvitationStatus.REJECTED -> ROOM_CALL_STATUS_REJECTED
                else -> ROOM_CALL_STATUS_NONE
            }
        }

        fun invitationListToJson(list: List<TUIConferenceInvitationManager.Invitation>?): JsonArray {
            val arr = JsonArray()
            if (list == null) return arr
            for (inv in list) arr.add(invitationToJson(inv))
            return arr
        }

        /* ---------------------- options JSON -> SDK 对象 ---------------------- */

        fun buildConferenceInfo(roomID: String, opts: JsonObject?): TUIConferenceListManager.ConferenceInfo {
            val info = TUIConferenceListManager.ConferenceInfo()
            val basic = TUIRoomDefine.RoomInfo()
            basic.roomId = roomID
            basic.name = getString(opts, "roomName")
            basic.password = getString(opts, "password")
            basic.isMicrophoneDisableForAllUser = getBool(opts, "isAllMicrophoneDisabled", false)
            basic.isCameraDisableForAllUser = getBool(opts, "isAllCameraDisabled", false)
            basic.isScreenShareDisableForAllUser = getBool(opts, "isAllScreenShareDisabled", false)
            basic.isMessageDisableForAllUser = getBool(opts, "isAllMessageDisabled", false)
            info.basicRoomInfo = basic

            info.scheduleStartTime = getInt(opts, "scheduleStartTime", 0) * 1000L
            info.scheduleEndTime = getInt(opts, "scheduleEndTime", 0) * 1000L
            info.reminderSecondsBeforeStart = getInt(opts, "reminderSecondsBeforeStart", 0)

            // SDK scheduleAttendees 是 List<String>（userId 列表），与 ScheduledAttendeesResult 中的 List<UserInfo> 不同。
            info.scheduleAttendees = ArrayList(getStringList(opts, "scheduleAttendees"))
            return info
        }

        /** 按 options 中实际存在的字段推断 modifyFlag。 */
        fun buildModifyFlagList(opts: JsonObject?): List<TUIConferenceListManager.ConferenceModifyFlag> {
            if (opts == null) return emptyList()
            val flags = ArrayList<TUIConferenceListManager.ConferenceModifyFlag>()
            fun has(key: String): Boolean = opts.has(key) && !opts.get(key).isJsonNull
            if (has("roomName")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.ROOM_NAME)
            }
            if (has("scheduleStartTime")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.SCHEDULE_START_TIME)
            }
            if (has("scheduleEndTime")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.SCHEDULE_END_TIME)
            }
            if (has("password")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.PASSWORD)
            }
            if (has("reminderSecondsBeforeStart")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.REMINDER_SECONDS_BEFORE_START)
            }
            if (has("isAllMessageDisabled")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.DISABLE_MESSAGE)
            }
            if (has("isAllCameraDisabled")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.DISABLE_CAMERA)
            }
            if (has("isAllMicrophoneDisabled")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.DISABLE_MICROPHONE)
            }
            if (has("isAllScreenShareDisabled")) {
                flags.add(TUIConferenceListManager.ConferenceModifyFlag.DISABLE_SCREEN_SHARING)
            }
            return flags
        }

        /* ---------------------- 枚举映射 ---------------------- */
        fun conferenceModifyFlagToTs(flag: TUIConferenceListManager.ConferenceModifyFlag): String {
            return when (flag) {
                TUIConferenceListManager.ConferenceModifyFlag.ROOM_NAME -> "roomName"
                TUIConferenceListManager.ConferenceModifyFlag.SCHEDULE_START_TIME -> "scheduleStartTime"
                TUIConferenceListManager.ConferenceModifyFlag.SCHEDULE_END_TIME -> "scheduleEndTime"
                TUIConferenceListManager.ConferenceModifyFlag.PASSWORD -> "password"
                TUIConferenceListManager.ConferenceModifyFlag.REMINDER_SECONDS_BEFORE_START -> "reminderSecondsBeforeStart"
                TUIConferenceListManager.ConferenceModifyFlag.DISABLE_MESSAGE -> "isAllMessageDisabled"
                TUIConferenceListManager.ConferenceModifyFlag.DISABLE_CAMERA -> "isAllCameraDisabled"
                TUIConferenceListManager.ConferenceModifyFlag.DISABLE_MICROPHONE -> "isAllMicrophoneDisabled"
                TUIConferenceListManager.ConferenceModifyFlag.DISABLE_SCREEN_SHARING -> "isAllScreenShareDisabled"
                else -> ""
            }
        }

        /**
         * 拒绝原因：ts 侧通过 extensionInfo 中是否含 "inOtherRoom" 区分
         *   IN_OTHER_CONFERENCE(1) / REJECT_TO_ENTER(0)。
         */
        fun rejectedReasonFromExtension(ext: String?): TUIConferenceInvitationManager.RejectedReason {
            return if (ext != null && ext.contains("inOtherRoom")) {
                TUIConferenceInvitationManager.RejectedReason.IN_OTHER_CONFERENCE
            } else {
                TUIConferenceInvitationManager.RejectedReason.REJECT_TO_ENTER
            }
        }

        /** SDK getValue() 与 ts CallRejectionReason 数值一致（0/1）。 */
        fun rejectedReasonToTs(reason: TUIConferenceInvitationManager.RejectedReason?): Int {
            return reason?.getValue() ?: 0
        }

        /**
         * SDK InvitationCode 与 ts RoomCallResult 数值一致（0/1/2），直接透传 getValue()：
         *   SUCCESS(0) / ALREADY_IN_INVITATION_LIST(1) / ALREADY_IN_CONFERENCE(2)。
         */
        fun invitationCodeToTs(code: TUIConferenceInvitationManager.InvitationCode?): Int {
            return code?.getValue() ?: 0
        }

        /* ---------------- Participant 相关 SDK -> JSON ---------------- */

        /** SDK Request → ts `DeviceRequestInfo`；device 由 requestAction 推断（0/1/2）。 */
        fun requestToDeviceRequestInfo(request: TUIRoomDefine.Request?): JsonObject {
            val obj = JsonObject()
            if (request == null) {
                obj.addProperty("senderUserID", "")
                obj.addProperty("senderUserName", "")
                obj.addProperty("senderNameCard", "")
                obj.addProperty("senderAvatarURL", "")
                obj.addProperty("device", 0)
                obj.addProperty("content", "")
                obj.addProperty("timestamp", 0L)
                return obj
            }
            val from = request.fromUser
            obj.addProperty("senderUserID", from?.userId ?: "")
            obj.addProperty("senderUserName", from?.userName ?: "")
            obj.addProperty("senderNameCard", from?.nameCard ?: "")
            obj.addProperty("senderAvatarURL", from?.avatarUrl ?: "")
            obj.addProperty("device", deviceKindFromRequestAction(request.requestAction))
            obj.addProperty("content", request.content ?: "")
            obj.addProperty("timestamp", request.timestamp)
            return obj
        }

        private fun deviceKindFromRequestAction(action: TUIRoomDefine.RequestAction?): Int = when (action) {
            TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_CAMERA,
            TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_CAMERA -> 1
            TUIRoomDefine.RequestAction.REQUEST_TO_OPEN_REMOTE_MICROPHONE,
            TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_MICROPHONE -> 0
            TUIRoomDefine.RequestAction.REQUEST_APPLY_TO_ADMIN_TO_OPEN_LOCAL_SCREEN_SHARE -> 2
            else -> 0
        }

        /** SDK NetworkInfo → ts NetworkInfo（userID / quality / upLoss / downLoss / delay）。 */
        fun networkInfoToJson(info: TUICommonDefine.NetworkInfo?): JsonObject {
            val obj = JsonObject()
            if (info == null) {
                obj.addProperty("userID", "")
                obj.addProperty("quality", 0)
                obj.addProperty("upLoss", 0)
                obj.addProperty("downLoss", 0)
                obj.addProperty("delay", 0)
                return obj
            }
            obj.addProperty("userID", info.userId ?: "")
            obj.addProperty("quality", info.quality?.value ?: 0)
            obj.addProperty("upLoss", info.upLoss)
            obj.addProperty("downLoss", info.downLoss)
            obj.addProperty("delay", info.delay)
            return obj
        }

        /** SDK KickedOutOfRoomReason → ts 数值（0~5），数值见各 case。 */
        fun kickedOutOfRoomReasonToTs(reason: TUIRoomDefine.KickedOutOfRoomReason?): Int = when (reason) {
            TUIRoomDefine.KickedOutOfRoomReason.BY_ADMIN -> 0
            TUIRoomDefine.KickedOutOfRoomReason.BY_LOGGED_ON_OTHER_DEVICE -> 1
            TUIRoomDefine.KickedOutOfRoomReason.BY_SERVER -> 2
            TUIRoomDefine.KickedOutOfRoomReason.NETWORK_DISCONNECTED -> 3
            TUIRoomDefine.KickedOutOfRoomReason.JOIN_ROOM_STATUS_INVALID_DURING_OFFLINE -> 4
            TUIRoomDefine.KickedOutOfRoomReason.COUNT_OF_JOINED_ROOMS_EXCEED_LIMIT -> 5
            else -> 0
        }
    }
}
