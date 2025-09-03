package uts.sdk.modules.uiComponent.kotlin.observer

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine
import com.tencent.cloud.uikit.state.DeviceStatus
import com.tencent.cloud.uikit.state.SeatUserInfo

object TypeConvert {

    // TUIRoomDefine.UserInfo
    fun convertUserInfoToMap(userInfo: TUIRoomDefine.UserInfo?): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        map["userId"] = userInfo?.userId
        map["userName"] = userInfo?.userName
        map["nameCard"] = userInfo?.nameCard
        map["avatarUrl"] = userInfo?.avatarUrl
        map["userRole"] = convertUserRole(userInfo?.userRole)
        map["hasAudioStream"] = userInfo?.hasAudioStream
        map["hasVideoStream"] = userInfo?.hasVideoStream
        map["hasScreenStream"] = userInfo?.hasScreenStream
        map["isMessageDisabled"] = userInfo?.isMessageDisabled
        map["roomCustomInfo"] = userInfo?.roomCustomInfo
        return map
    }

    fun convertUserRole(role: TUIRoomDefine.Role?): String {
        return when (role) {
            TUIRoomDefine.Role.ROOM_OWNER -> "ROOM_OWNER"
            TUIRoomDefine.Role.MANAGER -> "MANAGER"
            TUIRoomDefine.Role.GENERAL_USER -> "GENERAL_USER"
            else -> ""
        }
    }

    // SeatUserInfo
    fun convertSeatUserInfoToMap(userInfo: SeatUserInfo?): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        map["userId"] = userInfo?.userId
        map["roomId"] = userInfo?.roomId
        map["userName"] = userInfo?.userName
        map["avatarUrl"] = userInfo?.avatarUrl
        map["microphoneStatus"] = convertDeviceStatus(userInfo?.microphoneStatus)
        map["cameraStatus"] = convertDeviceStatus(userInfo?.cameraStatus)
        map["onSeatTimestamp"] = userInfo?.onSeatTimestamp
        return map
    }

    private fun convertDeviceStatus(status: DeviceStatus?): String {
        return when (status) {
            DeviceStatus.ON -> "ON"
            DeviceStatus.OFF_ADMIN_INVITING -> "ADMIN_INVITING"
            DeviceStatus.OFF_USER_APPLYING -> "USER_APPLYING"
            else -> "OFF"
        }
    }
}