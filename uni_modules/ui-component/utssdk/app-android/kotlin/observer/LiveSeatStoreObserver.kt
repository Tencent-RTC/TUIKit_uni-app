package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.SeatInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object LiveSeatStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveSeatStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getLiveSeatStore(liveId).liveSeatState.seatList.collect { seatList ->
                    val list = seatList?.map { convertSeatInfoToMap(it) }
                    callback("seatList", gson.toJson(list))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getLiveSeatStore(liveId).liveSeatState.canvas.collect { canvas ->
                    callback("canvas", gson.toJson(canvas))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getLiveSeatStore(liveId).liveSeatState.speakingUsers
                    .collect { speakingUsers ->
                        callback("speakingUsers", gson.toJson(speakingUsers))
                    }
            }
        }
    }

    private fun convertSeatInfoToMap(seatInfo: SeatInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["index"] = seatInfo.index
        map["isLocked"] = seatInfo.isLocked
        map["userInfo"] = TypeConvert.convertSeatUserInfoToMap(seatInfo.userInfo)
        map["region"] = seatInfo.region
        return map
    }
} 