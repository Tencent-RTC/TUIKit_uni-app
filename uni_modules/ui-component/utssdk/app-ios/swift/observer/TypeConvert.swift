import RTCRoomEngine_Plus

struct TypeConvert {

    //TUIRoomDefine.TUIUserInfo
    static func convertTUIUserInfoToDic(userInfo: TUIUserInfo) -> [String: Any] {
        return [
            "userId": userInfo.userId,
            "userName": userInfo.userName,
            "avatarUrl": userInfo.avatarUrl,
            "userRole": convertUserRole(userInfo.userRole),
            "hasAudioStream": userInfo.hasAudioStream,
            "hasVideoStream": userInfo.hasVideoStream,
            "hasScreenStream": userInfo.hasScreenStream,
            "isMessageDisabled": userInfo.isMessageDisabled,
            "roomCustomInfo": userInfo.roomCustomInfo,
        ]
    }

    static func convertUserRole(_ role: TUIRole?) -> String {
        switch role {
            case .roomOwner:
                return "ROOM_OWNER"
            case .administrator:
                return "MANAGER"
            case .generalUser:
                return "GENERAL_USER"
            default:
                return ""
        }
    }

    static func convertSeatUserInfoToDic(userInfo: SeatUserInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "userId": userInfo.userId,
            "roomId": userInfo.roomId,
            "userName": userInfo.userName,
            "avatarUrl": userInfo.avatarUrl,
            "microphoneStatus": TypeConvert.convertDeviceStatus(userInfo.microphoneStatus),
            "cameraStatus": TypeConvert.convertDeviceStatus(userInfo.cameraStatus),
            "onSeatTimestamp": userInfo.onSeatTimestamp,
        ]
        return dict
    }

    static func convertDeviceStatus(_ status: DeviceStatus) -> String {
        switch status {
            case .on:
                return "ON"
            case .AdminInviting:
                return "ADMIN_INVITING"
            case .UserApplying:
                return "USER_APPLYING"
            default:
                return "OFF"
        }
    }
}