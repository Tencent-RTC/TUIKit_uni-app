package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.live.LiveSummaryStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
object LiveSummaryStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveSummaryStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {            
                LiveSummaryStore.create(liveID).liveSummaryState.summaryData.collect { data ->
                     callback("summaryData", gson.toJson(data))
                 }
            }
        }
    }
} 