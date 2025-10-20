import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class LiveSummaryStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LiveSummaryStoreObserver()

    public func liveSummaryStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        // TODO: iOS 底层 State不是 public ，访问不到，待修改
        // LiveSummaryStore.create(liveID: liveID)
        //     .state.subscribe(StatePublisherSelector(keyPath: \LiveSummaryState.summaryData))
        //     .receive(on: DispatchQueue.main)
        //     .sink(receiveValue: { [weak self] data in
        //         guard let self = self else { return }
        //         guard let data = data else { return }
        //         if let json = JsonUtil.toJson(data) {
        //             callback("summaryData", json)
        //         }
        //     }).store(in: &cancellables)
    }
}
