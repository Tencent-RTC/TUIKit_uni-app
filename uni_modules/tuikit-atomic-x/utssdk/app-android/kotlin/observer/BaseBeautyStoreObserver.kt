package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.BaseBeautyStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object BaseBeautyStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun beautyStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                BaseBeautyStore.shared().baseBeautyState.smoothLevel.collect { level ->
                    callback("smoothLevel", gson.toJson(level))
                }
            }
            launch {
                BaseBeautyStore.shared().baseBeautyState.whitenessLevel.collect { level ->
                    callback("whitenessLevel", gson.toJson(level))
                }
            }
            launch {
                BaseBeautyStore.shared().baseBeautyState.ruddyLevel.collect { level ->
                    callback("ruddyLevel", gson.toJson(level))
                }
            }
        }
    }
} 