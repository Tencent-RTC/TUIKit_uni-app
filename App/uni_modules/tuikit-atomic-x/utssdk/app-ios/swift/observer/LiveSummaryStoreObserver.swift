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

    LiveSummaryStore.create(liveID: liveID)
      .state.subscribe(StatePublisherSelector(keyPath: \LiveSummaryState.summaryData))
      .receive(on: DispatchQueue.main)
      .sink(receiveValue: { data in
        let dict = TypeConvert.convertLiveSummaryDataToDic(summaryData: data)
        if let json = JsonUtil.toJson(dict) {
          callback("summaryData", json)
        }
      }).store(in: &cancellables)
  }
}
