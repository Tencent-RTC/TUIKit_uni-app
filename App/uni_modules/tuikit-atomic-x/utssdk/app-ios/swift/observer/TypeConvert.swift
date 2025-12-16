import AtomicXCore
import RTCRoomEngine

struct TypeConvert {

    static func convertLiveUserInfoToDic(liveUserInfo: LiveUserInfo) -> [String: String] {
        var dict: [String: String] = [
            "userID": liveUserInfo.userID ?? "",
            "userName": liveUserInfo.userName ?? "",
            "avatarURL": liveUserInfo.avatarURL ?? "",
        ]
        return dict
    }

    static func convertUserRole(_ role: Role?) -> String {
        switch role {
        case .admin:
            return "ADMIN"
        case .generalUser:
            return "GENERAL_USER"
        default:
            return "OWNER"
        }
    }

    static func convertSeatUserInfoToDic(seatUserInfo: SeatUserInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "userID": seatUserInfo.userID,
            "userName": seatUserInfo.userName ?? "",
            "avatarURL": seatUserInfo.avatarURL ?? "",
            "role": convertUserRole(seatUserInfo.role),
            "liveID": seatUserInfo.liveID,
            "microphoneStatus": convertDeviceStatus(seatUserInfo.microphoneStatus),
            "allowOpenMicrophone": seatUserInfo.allowOpenMicrophone,
            "cameraStatus": convertDeviceStatus(seatUserInfo.cameraStatus),
            "allowOpenCamera": seatUserInfo.allowOpenCamera,
        ]
        return dict
    }

    static func convertDeviceStatus(_ status: DeviceStatus) -> String {
        switch status {
        case .on:
            return "ON"
        case .off:
            return "OFF"
        }
    }

    static func convertLiveInfoToDic(liveInfo: LiveInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "liveID": liveInfo.liveID,
            "liveName": liveInfo.liveName,
            "notice": liveInfo.notice,
            "isMessageDisable": liveInfo.isMessageDisable,
            "isPublicVisible": liveInfo.isPublicVisible,
            "isSeatEnabled": liveInfo.isSeatEnabled,
            "keepOwnerOnSeat": liveInfo.keepOwnerOnSeat,
            "maxSeatCount": liveInfo.maxSeatCount,
            "seatMode": TypeConvert.convertTakeSeatMode(liveInfo.seatMode),
            "seatLayoutTemplateID": liveInfo.seatLayoutTemplateID,
            "coverURL": liveInfo.coverURL,
            "backgroundURL": liveInfo.backgroundURL,
            "activityStatus": liveInfo.activityStatus,
            "liveOwner": TypeConvert.convertLiveUserInfoToDic(liveUserInfo: liveInfo.liveOwner),
            "createTime" : liveInfo.createTime,
            "categoryList": liveInfo.categoryList,
            "totalViewerCount": liveInfo.totalViewerCount,
            "isGiftEnabled": liveInfo.isGiftEnabled,
            "metaData": liveInfo.metaData,
        ]
        return dict
    }

    static func convertTakeSeatMode(_ mode: TakeSeatMode) -> String {
        switch mode {
            case .free:
                return "FREE"
            case .apply:
                return "APPLY"
        }
    }

    static func convertLiveSummaryDataToDic(summaryData: LiveSummaryData) -> [String: Any] {
        var dict: [String: Any] = [
            "totalDuration": summaryData.totalDuration,
            "totalViewers": summaryData.totalViewers,
            "totalGiftsSent": summaryData.totalGiftsSent,
            "totalGiftUniqueSenders": summaryData.totalGiftUniqueSenders,
            "totalGiftCoins": summaryData.totalGiftCoins,
            "totalLikesReceived": summaryData.totalLikesReceived,
            "totalMessageSent": summaryData.totalMessageSent,
        ]
        return dict
    }
}