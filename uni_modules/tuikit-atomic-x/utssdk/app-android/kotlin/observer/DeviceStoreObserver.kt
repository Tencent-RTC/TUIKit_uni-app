package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.DeviceStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object DeviceStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun deviceStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                DeviceStore.shared().deviceState.microphoneStatus.collect { status ->
                    callback("microphoneStatus", gson.toJson(status.value))
                }
            }
            launch {
                DeviceStore.shared().deviceState.microphoneLastError.collect { deviceError ->
                    callback("microphoneLastError", gson.toJson(deviceError.value))
                }
            }
            launch {
                DeviceStore.shared().deviceState.captureVolume.collect { volume ->
                    callback("captureVolume", gson.toJson(volume))
                }
            }
            launch {
                DeviceStore.shared().deviceState.currentMicVolume.collect { volume ->
                    callback("currentMicVolume", gson.toJson(volume))
                }
            }
            launch {
                DeviceStore.shared().deviceState.outputVolume.collect { volume ->
                    callback("outputVolume", gson.toJson(volume))
                }
            }

            launch {
                DeviceStore.shared().deviceState.cameraStatus.collect { cameraStatus ->
                    callback("cameraStatus", gson.toJson(cameraStatus.value))
                }
            }
            launch {
                DeviceStore.shared().deviceState.cameraLastError.collect { deviceError ->
                    callback("cameraLastError", gson.toJson(deviceError.value))
                }
            }
            launch {
                DeviceStore.shared().deviceState.isFrontCamera.collect { isFrontCamera ->
                    callback("isFrontCamera", gson.toJson(isFrontCamera))
                }
            }
            launch {
                DeviceStore.shared().deviceState.localMirrorType.collect { localMirrorType ->
                    callback("localMirrorType", gson.toJson(localMirrorType))
                }
            }
            launch {
                DeviceStore.shared().deviceState.localVideoQuality.collect { quality ->
                    callback("localVideoQuality", gson.toJson(quality))
                }
            }

            launch {
                DeviceStore.shared().deviceState.currentAudioRoute.collect { audioRoute ->
                    callback("currentAudioRoute", gson.toJson(audioRoute.value))
                }
            }
            launch {
                DeviceStore.shared().deviceState.screenStatus.collect { screenStatus ->
                    callback("screenStatus", gson.toJson(screenStatus.value))
                }
            }

            launch {
                DeviceStore.shared().deviceState.networkInfo.collect { networkInfo ->
                    callback("networkInfo", gson.toJson(networkInfo))
                }
            }
        }
    }
}