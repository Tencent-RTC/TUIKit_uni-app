package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.LikeStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LikeStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun likeStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                LikeStore.create(liveID).likeState.totalLikeCount.collect { count ->
                    callback("totalLikeCount", gson.toJson(count))
                }
            }
        }
    }
}
