package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.CoHostStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object CoHostStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun coHostStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                CoHostStore.create(liveID).coHostState.coHostStatus.collect { coHostStatus ->
                    callback("coHostStatus", gson.toJson(coHostStatus))
                }
            }
            launch {
                CoHostStore.create(liveID).coHostState.connected.collect { connected ->
                    callback("connected", gson.toJson(connected))
                }
            }
            // TODO: 底层未实现，暂时隐藏
            // launch {
            //     CoHostStore.create(liveID).coHostState.candidates.collect { candidates ->
            //         callback("candidates", gson.toJson(candidates))
            //     }
            // }
            launch {
                CoHostStore.create(liveID).coHostState.invitees.collect { invitees ->
                    callback("invitees", gson.toJson(invitees))
                }
            }
            launch {
                CoHostStore.create(liveID).coHostState.applicant.collect { applicant ->
                    callback("applicant", gson.toJson(applicant))
                }
            }
        }
    }
}