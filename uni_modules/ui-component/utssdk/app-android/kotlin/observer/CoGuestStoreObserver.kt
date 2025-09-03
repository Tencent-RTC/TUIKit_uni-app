package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.CoGuestRequestInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object CoGuestStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun coGuestStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getCoGuestStore(liveId).coGuestState.localStatus.collect { status ->
                    callback("localStatus", gson.toJson(status.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getCoGuestStore(liveId).coGuestState.invitees.collect { invitees ->
                    val list = invitees?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                    callback("invitees", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getCoGuestStore(liveId).coGuestState.applicants.collect { applicants ->
                    val list = applicants?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                    callback("applicants", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.connectedGuests.collect { connectedGuests ->
                        val list = connectedGuests?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                        callback("connectedGuests", gson.toJson(list))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.invitableGuests.collect { invitableGuests ->
                        val list = invitableGuests?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                        callback("invitableGuests", gson.toJson(list))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.latestReceivedRequest.collect { request ->
                        callback("latestReceivedRequest", gson.toJson(convertCoGuestRequestInfoToMap(request)))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.latestCancelledRequest.collect { request ->
                        callback("latestCancelledRequest", gson.toJson(convertCoGuestRequestInfoToMap(request)))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.latestAcceptedRequest.collect { request ->
                        callback("latestAcceptedRequest", gson.toJson(convertCoGuestRequestInfoToMap(request)))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.latestRejectedRequest.collect { request ->
                        callback("latestRejectedRequest", gson.toJson(convertCoGuestRequestInfoToMap(request)))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoGuestStore(liveId).coGuestState.latestTimeoutRequest.collect { request ->
                        callback("latestTimeoutRequest", gson.toJson(convertCoGuestRequestInfoToMap(request)))
                    }
            }

        }
    }

    private fun convertCoGuestRequestInfoToMap(request: CoGuestRequestInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["timestamp"] = request.timestamp
        map["requestId"] = request.requestId
        map["userId"] = request.userId
        map["userName"] = request.userName
        map["nameCard"] = request.nameCard
        map["avatarUrl"] = request.avatarUrl
        return map
    }
}