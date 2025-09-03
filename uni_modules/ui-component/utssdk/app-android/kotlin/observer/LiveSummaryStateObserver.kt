package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LiveSummaryStateObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveSummaryStateChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getLiveSummaryStore(liveId).liveSummaryState.summaryData
                    .collect { data ->
                        callback("summaryData", gson.toJson(data))
                    }
            }
        }
    }
} 