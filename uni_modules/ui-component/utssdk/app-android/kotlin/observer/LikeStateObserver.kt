package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object LikeStateObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun likeStateChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getLikeStore(liveId).likeState.totalLikeCount.collect { count ->
                    callback("totalLikeCount", gson.toJson(count))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getLikeStore(liveId).likeState.latestSender.collect { latestSender ->
                    callback("latestSender", gson.toJson(TypeConvert.convertUserInfoToMap(latestSender)))
                }
            }
        }
    }
} 