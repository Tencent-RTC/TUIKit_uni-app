import AtomicXCore
import Foundation

public class JsonUtil {
    public static func toJson(_ object: Any) -> String? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: object, options: .fragmentsAllowed),
            let jsonString = String(data: jsonData, encoding: .utf8)
        else {
            return nil
        }
        return jsonString
    }

    public static func toCompletionClosure(
        success: (() -> Void)?,
        failure: ((_ code: Int, _ message: String) -> Void)?
    ) -> CompletionClosure {
        return { result in
            switch result {
            case .success:
                success?()
            case .failure(let errorInfo):
                failure?(errorInfo.code, errorInfo.message)
            }
        }
    }

    public static func toLiveInfoCompletionClosure(
        success: ((_ liveInfo: String) -> Void)?,
        failure: ((_ code: Int, _ message: String) -> Void)?
    ) -> LiveInfoCompletionClosure {
        return { result in
            switch result {
            case .success(let liveInfo):
                let dict = TypeConvert.convertLiveInfoToDic(liveInfo: liveInfo)
                if let json = JsonUtil.toJson(dict) {
                    success?(json)
                } else {
                    success?("")
                }
            case .failure(let errorInfo):
                failure?(errorInfo.code, errorInfo.message)
            }
        }
    }

    public static func toStopLiveCompletionClosure(
        success: ((_ tuiLiveStatisticsData: String) -> Void)?,
        failure: ((_ code: Int, _ message: String) -> Void)?
    ) -> StopLiveCompletionClosure {
        return { result in
            switch result {
            case .success(let statisticsData):
                var dict: [String: Any] = [
                    "totalViewers": statisticsData.totalViewers,
                    "totalGiftsSent": statisticsData.totalGiftsSent,
                    "totalGiftCoins": statisticsData.totalGiftCoins,
                    "totalUniqueGiftSenders": statisticsData.totalUniqueGiftSenders,
                    "totalLikesReceived": statisticsData.totalLikesReceived,
                    // "totalMessageCount": statisticsData.totalMessageCount,
                    // "liveDuration": statisticsData.liveDuration,
                ]
                if let json = JsonUtil.toJson(dict) {
                    success?(json)
                } else {
                    success?("")
                }
            case .failure(let errorInfo):
                failure?(errorInfo.code, errorInfo.message)
            }
        }
    }

    public static func toMetaDataCompletionClosure(
        success: ((_ metaData: String) -> Void)?,
        failure: ((_ code: Int, _ message: String) -> Void)?
    ) -> MetaDataCompletionClosure {
        return { result in
            switch result {
            case .success(let data):
                success?(JsonUtil.toJson(data) ?? "")
            case .failure(let errorInfo):
                failure?(errorInfo.code, errorInfo.message)
            }
        }
    }

    public static func toBattleRequestClosure(
        success: ((_ battleInfo: String, _ resultMap: String) -> Void)?,
        failure: ((_ code: Int, _ message: String) -> Void)?
    ) -> BattleRequestClosure {
        return { result in
            switch result {
            case .success(let data):
                let (battleInfo, resultMap) = data

                var battleInfoDict: [String: Any] = [
                    "battleID": battleInfo.battleID,
                    "config": [
                        "duration": battleInfo.config.duration,
                        "needResponse": battleInfo.config.needResponse,
                        "extensionInfo": battleInfo.config.extensionInfo,
                    ],
                    "startTime": battleInfo.startTime,
                    "endTime": battleInfo.endTime,
                ]

                let battleInfoJson = JsonUtil.toJson(battleInfoDict) ?? ""
                let resultMapJson = JsonUtil.toJson(resultMap) ?? ""

                success?(battleInfoJson, resultMapJson)
            case .failure(let errorInfo):
                failure?(errorInfo.code, errorInfo.message)
            }
        }
    }
}
