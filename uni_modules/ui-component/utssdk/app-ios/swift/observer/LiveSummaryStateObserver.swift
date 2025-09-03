import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LiveSummaryStateObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LiveSummaryStateObserver()

    public func liveSummaryStateChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getLiveSummaryStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LiveSummaryState.summaryData))
            // .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink (receiveValue: { [weak self] summaryData in
                guard let self = self else { return }
                let dict = convertLiveSummaryDataToDic(summaryData: summaryData)
                if let json = JsonUtil.toJson(dict) {
                    callback("summaryData", json)
                }
            })
            .store(in: &cancellables)
    }

    private func convertLiveSummaryDataToDic(summaryData: LiveSummaryData?) -> [String: UInt] {
        let dict: [String: UInt] = [
            "totalDuration": summaryData?.totalDuration ?? 0,
            "totalViewers": summaryData?.totalViewers ?? 0,
            "totalGiftsSent": summaryData?.totalGiftsSent ?? 0 ,
            "totalGiftUniqueSenders": summaryData?.totalGiftUniqueSenders ?? 0,
            "totalGiftCoins": summaryData?.totalGiftCoins ?? 0,
            "totalLikesReceived": summaryData?.totalLikesReceived ?? 0,
            "totalMessageSent": summaryData?.totalMessageSent ?? 0,
        ]
        return dict
    }
} 