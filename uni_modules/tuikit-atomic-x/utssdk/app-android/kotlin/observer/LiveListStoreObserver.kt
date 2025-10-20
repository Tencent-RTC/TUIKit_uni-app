package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.LiveListStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LiveListStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                LiveListStore.shared().liveState.liveList.collect { liveList ->
                    callback("liveList", gson.toJson(liveList))
                }
            }
            launch {
                LiveListStore.shared().liveState.liveListCursor.collect { cursor ->
                    callback("liveListCursor", gson.toJson(cursor))
                }
            }

            launch {
                LiveListStore.shared().liveState.currentLive.collect { liveInfo ->
                    callback("currentLive", gson.toJson(liveInfo))
                }
            }
        }
    }
} 
