package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.CoHostRequestInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object CoHostStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun coHostStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getCoHostStore(liveId).coHostState.localStatus.collect { localStatus ->
                    callback("localStatus", gson.toJson(localStatus.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getCoHostStore(liveId).coHostState.invitees.collect { invitees ->
                    val list = invitees?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                    callback("invitees", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getCoHostStore(liveId).coHostState.applicants.collect { applicants ->
                    val list = applicants?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                    callback("applicants", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.connectedHosts.collect { connectedHosts ->
                        val list = connectedHosts?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                        callback("connectedHosts", gson.toJson(list))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.invitableHosts.collect { invitableHosts ->
                        val list = invitableHosts?.map { TypeConvert.convertSeatUserInfoToMap(it) }
                        callback("invitableHosts", gson.toJson(list))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.latestReceivedRequest.collect { request ->
                        callback("latestReceivedRequest", gson.toJson(convertCoHostRequestInfoToMap(request)))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.latestCancelledRequest.collect { request ->
                        callback("latestCancelledRequest", gson.toJson(convertCoHostRequestInfoToMap(request)))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.latestAcceptedRequest.collect { request ->
                        callback("latestAcceptedRequest", gson.toJson(convertCoHostRequestInfoToMap(request)))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.latestRejectedRequest.collect { request ->
                        callback("latestRejectedRequest", gson.toJson(convertCoHostRequestInfoToMap(request)))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance()
                    .getCoHostStore(liveId).coHostState.latestTimeoutRequest.collect { request ->
                        callback("latestTimeoutRequest", gson.toJson(convertCoHostRequestInfoToMap(request)))
                    }
            }
        }
    }

    private fun convertCoHostRequestInfoToMap(request: CoHostRequestInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["inviter"] = TypeConvert.convertSeatUserInfoToMap(request.inviter)
        map["inviteeList"] = request.inviteeList.map { TypeConvert.convertSeatUserInfoToMap(it) }
        map["extensionInfo"] = request.extensionInfo
        return map
    }
}