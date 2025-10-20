package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.LiveAudienceStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LiveAudienceStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveAudienceStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                LiveAudienceStore.create(liveID).liveAudienceState.audienceList.collect { audienceList ->
                    callback("audienceList", gson.toJson(audienceList))
                }
            }

            launch {
                LiveAudienceStore.create(liveID).liveAudienceState.audienceCount.collect { audienceCount ->
                    callback("audienceCount", gson.toJson(audienceCount))
                }
            }

        }
    }
} 