package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine
import com.tencent.cloud.uikit.state.DeviceError
import com.tencent.cloud.uikit.state.DeviceStatus
import com.tencent.cloud.uikit.state.DeviceStatusReason
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
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
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.microphoneStatus.collect { status ->
                    val micStatus = if (status != null) status else DeviceStatus.OFF
                    callback("microphoneStatus", gson.toJson(micStatus.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.microphoneStatusReason.collect { micReason ->
                    val reason = if (micReason != null) micReason else DeviceStatusReason.CHANGED_BY_SELF
                    callback("microphoneStatusReason", gson.toJson(reason.value))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.microphoneLastError.collect { deviceError ->
                    val error = if (deviceError != null) deviceError else DeviceError.NO_ERROR
                    callback("microphoneLastError", gson.toJson(error.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.currentAudioRoute.collect { audioRoute ->
                    callback("currentAudioRoute", gson.toJson(audioRoute.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.captureVolume.collect { volume ->
                    callback("captureVolume", gson.toJson(volume))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.cameraStatus.collect { cameraStatus ->
                    callback("cameraStatus", gson.toJson(cameraStatus.value))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.cameraStatusReason.collect { reason ->
                    callback("cameraStatusReason", gson.toJson(reason.value))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.cameraLastError.collect { deviceError ->
                    val error = if (deviceError != null) deviceError else DeviceError.NO_ERROR
                    callback("cameraLastError", gson.toJson(error.value))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.isFrontCamera.collect { isFrontCamera ->
                    callback("isFrontCamera", gson.toJson(isFrontCamera))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.isLocalMirror.collect { isLocalMirror ->
                    callback("isLocalMirror", gson.toJson(isLocalMirror))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.localVideoQuality.collect { quality ->
                    callback("localVideoQuality", gson.toJson(convertVideoQuality(quality)))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.screenStatus.collect { screenStatus ->
                    callback("screenStatus", gson.toJson(screenStatus.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.screenStatus.collect { screenStatusReason ->
                    callback("screenStatusReason", gson.toJson(screenStatusReason.value))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getDeviceStore().deviceState.networkInfo.collect { networkInfo ->
                    callback("networkInfo", gson.toJson(convertNetworkInfo(networkInfo)))
                }
            }
        }
    }

    private fun convertNetworkInfo(info: TUICommonDefine.NetworkInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["userId"] = info.userId ?: ""
        map["quality"] = convertNetworkQuality(info.quality)
        map["upLoss"] = info.upLoss
        map["downLoss"] = info.downLoss
        map["delay"] = info.delay
        return map
    }

    private fun convertNetworkQuality(quality: TUICommonDefine.NetworkQuality?): String {
        if (quality == null) return "UNKNOWN"
        return when (quality) {
            TUICommonDefine.NetworkQuality.VERY_BAD -> "VBAD"
            TUICommonDefine.NetworkQuality.BAD -> "BAD"
            TUICommonDefine.NetworkQuality.DOWN -> "DOWN"
            TUICommonDefine.NetworkQuality.POOR -> "POOR"
            TUICommonDefine.NetworkQuality.GOOD -> "GOOD"
            TUICommonDefine.NetworkQuality.EXCELLENT -> "EXCELLENT"
            else ->
                "UNKNOWN"
        }
    }

    private fun convertVideoQuality(quality: TUIRoomDefine.VideoQuality): String {
        return when (quality) {
            TUIRoomDefine.VideoQuality.Q_540P -> "540P"
            TUIRoomDefine.VideoQuality.Q_720P -> "720P"
            TUIRoomDefine.VideoQuality.Q_1080P -> "1080P"
            else -> "360P"
        }
    }
}