package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
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
                V2RTCRoomEngine.getInstance().getAudioEffectStore().audioEffectState.isEarMonitorOpened
                    .collect { enable ->
                        callback("isEarMonitorOpened", gson.toJson(enable))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance().getAudioEffectStore().audioEffectState.earMonitorVolume
                    .collect { volume ->
                        callback("earMonitorVolume", gson.toJson(volume))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance().getAudioEffectStore().audioEffectState.microphoneVolume
                    .collect { volume ->
                        callback("microphoneVolume", gson.toJson(volume))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance().getAudioEffectStore().audioEffectState.changerType
                    .collect { type ->
                        callback("changerType", gson.toJson(type.value))
                    }
            }
            launch {
                V2RTCRoomEngine.getInstance().getAudioEffectStore().audioEffectState.reverbType
                    .collect { type ->
                        callback("reverbType", gson.toJson(type.value))
                    }
            }
        }
    }
} 