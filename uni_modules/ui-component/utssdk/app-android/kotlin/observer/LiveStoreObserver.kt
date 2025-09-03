package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine.SeatMode
import com.tencent.cloud.uikit.state.LiveInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LiveStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getLiveStore().liveState.liveList.collect { liveList ->
                    val list = liveList?.map { convertLiveInfoToMap(it) }
                    callback("liveList", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getLiveStore().liveState.liveListCursor.collect { cursor ->
                    callback("liveListCursor", gson.toJson(cursor))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getLiveStore().liveState.currentLive.collect { liveInfo ->
                    val info = convertLiveInfoToMap(liveInfo)
                    callback("currentLive", gson.toJson(info))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getLiveStore().liveState.localLiveStatus.collect { status ->
                    callback("localLiveStatus", gson.toJson(status.value))
                }
            }
        }
    }

    private fun convertLiveInfoToMap(liveInfo: LiveInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["liveId"] = liveInfo.liveId
        map["liveName"] = liveInfo.liveName
        map["liveDescription"] = liveInfo.liveDescription
        map["categoryList"] = liveInfo.categoryList
        map["coverUrl"] = liveInfo.coverUrl
        map["backgroundUrl"] = liveInfo.backgroundUrl
        map["liveOwner"] = liveInfo.liveOwner
        map["currentViewerCount"] = liveInfo.currentViewerCount
        map["totalViewerCount"] = liveInfo.totalViewerCount
        map["createTime"] = liveInfo.createTime
        map["isMessageDisable"] = liveInfo.isMessageDisable
        map["isGiftEnabled"] = liveInfo.isGiftEnabled
        map["isPublicVisible"] = liveInfo.isPublicVisible
        map["keepOwnerOnSeat"] = liveInfo.keepOwnerOnSeat
        map["isSeatEnabled"] = liveInfo.isSeatEnabled
        map["seatMode"] = convertSeatMode(liveInfo.seatMode)
        map["maxSeatCount"] = liveInfo.maxSeatCount
        map["layoutTemplate"] = liveInfo.layoutTemplate
        map["customInfo"] = liveInfo.customInfo
        return map
    }

    private fun convertSeatMode(mode: SeatMode): String {
        return when (mode) {
            SeatMode.FREE_TO_TAKE -> "FREE_TO_TAKE"
            SeatMode.APPLY_TO_TAKE -> "APPLY_TO_TAKE"
            else -> ""
        }
    }
} 