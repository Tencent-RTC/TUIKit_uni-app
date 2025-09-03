import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LiveSeatStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LiveSeatStoreObserver()

    public func liveSeatStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getLiveSeatStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LiveSeatState.seatList))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] seatList in
                guard let self = self else { return }
                var list: [[String: Any]] = []
                for seatInfo in seatList {
                    list.append(self.convertSeatInfoToDic(seatInfo: seatInfo))
                }
                if let jsonList = JsonUtil.toJson(list) {
                    callback("seatList", jsonList)
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getLiveSeatStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2LiveSeatState.canvas))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] canvas in
                guard let self = self else { return }
                let dict = self.convertCanvasToDic(canvas: canvas)
                if let json = JsonUtil.toJson(dict) {
                    callback("canvas", json)
                }
            })
            .store(in: &cancellables)
    }

    private func convertSeatInfoToDic(seatInfo: SeatInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "index": seatInfo.index,
            "isLocked": seatInfo.isLocked,
            "userInfo": seatInfo.userInfo.flatMap { TypeConvert.convertSeatUserInfoToDic(userInfo: $0) } ?? NSNull(),
            "region": seatInfo.region.flatMap { convertRegionInfoToDic(region: $0) } ?? NSNull(),
        ]
        return dict
    }

    private func convertRegionInfoToDic(region: RegionInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "x": region.x,
            "y": region.y,
            "w": region.w,
            "h": region.h,
            "zorder": region.zorder,
        ]
        return dict
    }

    private func convertCanvasToDic(canvas: LiveCanvas) -> [String: Any] {
        var dict: [String: Any] = [
            "w": canvas.w,
            "h": canvas.h,
            "background": canvas.background,
        ]
        return dict
    }
}
