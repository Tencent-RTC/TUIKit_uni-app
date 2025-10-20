package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.AudioEffectStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object AudioEffectStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null
    fun audioEffectStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                AudioEffectStore.shared().audioEffectState.isEarMonitorOpened
                    .collect { enable ->
                        callback("isEarMonitorOpened", gson.toJson(enable))
                    }
            }
            launch {
                AudioEffectStore.shared().audioEffectState.earMonitorVolume
                    .collect { volume ->
                        callback("earMonitorVolume", gson.toJson(volume))
                    }
            }
            launch {
                AudioEffectStore.shared().audioEffectState.audioChangerType
                    .collect { type ->
                        callback("audioChangerType", gson.toJson(type.value))
                    }
            }
            launch {
                AudioEffectStore.shared().audioEffectState.audioReverbType
                    .collect { type ->
                        callback("audioReverbType", gson.toJson(type.value))
                    }
            }
        }
    }
} 