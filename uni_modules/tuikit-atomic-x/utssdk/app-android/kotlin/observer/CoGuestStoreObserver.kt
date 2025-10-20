package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.CoGuestStore
import io.trtc.tuikit.atomicxcore.api.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.Role
import io.trtc.tuikit.atomicxcore.api.SeatUserInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object CoGuestStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun coGuestStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                CoGuestStore.create(liveID).coGuestState.connected.collect { connected ->
                    val list = connected.map { convertSeatInfoToMap(it) }
                    callback("connected", gson.toJson(list)) // SeatUserInfo
                }
            }
            launch {
                CoGuestStore.create(liveID).coGuestState.invitees.collect { invitees ->
                    callback("invitees", gson.toJson(invitees)) // LiveUserInfo
                }
            }
            launch {
                CoGuestStore.create(liveID).coGuestState.applicants.collect { applicants ->
                    callback("applicants", gson.toJson(applicants)) // LiveUserInfo
                }
            }
            launch {
                CoGuestStore.create(liveID).coGuestState.candidates.collect { candidates ->
                    callback("candidates", gson.toJson(candidates)) // LiveUserInfo
                }
            }
        }
    }

    private fun convertSeatInfoToMap(info: SeatUserInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["userID"] = info.userID
        map["userName"] = info.userName
        map["avatarURL"] = info.avatarURL
        map["role"] = info.role
        map["liveID"] = info.liveID
        map["microphoneStatus"] = convertDeviceStatus(info.microphoneStatus)
        map["allowOpenMicrophone"] = info.allowOpenMicrophone
        map["cameraStatus"] = convertDeviceStatus(info.cameraStatus)
        map["allowOpenCamera"] = info.allowOpenCamera
        return map
    }

    private fun convertDeviceStatus(status: DeviceStatus?): String {
        if (status == DeviceStatus.ON) {
            return "ON"
        }
        return "OFF"
    }

    private fun convertUserRole(role: Role?): String {
        return when (role) {
            Role.OWNER -> "OWNER"
            Role.ADMIN -> "ADMIN"
            else -> "GENERAL_USER"
        }
    }
}
