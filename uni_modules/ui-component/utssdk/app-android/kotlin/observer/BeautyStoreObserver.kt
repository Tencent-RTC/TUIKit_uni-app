package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object BeautyStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun beautyStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getBaseBeautyStore().baseBeautyState.smoothLevel.collect { level ->
                    callback("smoothLevel", gson.toJson(level))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getBaseBeautyStore().baseBeautyState.whitenessLevel.collect { level ->
                    callback("whitenessLevel", gson.toJson(level))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getBaseBeautyStore().baseBeautyState.ruddyLevel.collect { level ->
                    callback("ruddyLevel", gson.toJson(level))
                }
            }
        }
    }
} 