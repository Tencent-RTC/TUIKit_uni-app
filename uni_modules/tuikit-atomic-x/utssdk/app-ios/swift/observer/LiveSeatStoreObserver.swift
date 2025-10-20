import AtomicXCore
import Combine
import DCloudUTSFoundation
import Foundation
import RTCRoomEngine

public class LiveSeatStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var liveSeatEventCancellables = Set<AnyCancellable>()
    public static let shared = LiveSeatStoreObserver()

    public func liveSeatStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()

        LiveSeatStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LiveSeatState.seatList))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] seatList in
                guard let self = self else { return }
                let dictArray = seatList.map { self.convertSeatInfoToDic(seatInfo: $0) }
                if let jsonList = JsonUtil.toJson(dictArray) {
                    callback("seatList", jsonList)
                }
            }).store(in: &cancellables)

        LiveSeatStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LiveSeatState.canvas))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] canvas in
                guard let self = self else { return }
                let dict = self.convertCanvasToDic(canvas: canvas)
                if let json = JsonUtil.toJson(dict) {
                    callback("canvas", json)
                }
            }).store(in: &cancellables)

        LiveSeatStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \LiveSeatState.speakingUsers))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { speakingUsers in
                if let jsonUsers = JsonUtil.toJson(speakingUsers) {
                    callback("speakingUsers", jsonUsers)
                }
            }).store(in: &cancellables)
    }

    private func convertSeatInfoToDic(seatInfo: SeatInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "index": seatInfo.index,
            "isLocked": seatInfo.isLocked,
            "userInfo": TypeConvert.convertSeatUserInfoToDic(seatUserInfo: seatInfo.userInfo),
            "region": convertRegionInfoToDic(region: seatInfo.region),
        ]
        return dict
    }

    private func convertRegionInfoToDic(region: RegionInfo) -> [String: Any] {
        return [
            "x": region.x,
            "y": region.y,
            "w": region.w,
            "h": region.h,
            "zorder": region.zorder,
        ]
    }

    private func convertCanvasToDic(canvas: LiveCanvas) -> [String: Any] {
        return [
            "templateID": canvas.templateID,
            "w": canvas.w,
            "h": canvas.h,
        ]
    }

    public func setupLiveSeatEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        liveSeatEventCancellables.removeAll()
        LiveSeatStore.create(liveID: liveID).liveSeatEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onLocalCameraOpenedByAdmin(let policy):
                    callback("onLocalCameraOpenedByAdmin", convertDeviceControlPolicy(policy))
                case .onLocalCameraClosedByAdmin:
                    callback("onLocalCameraClosedByAdmin", "")
                case .onLocalMicrophoneOpenedByAdmin(let policy):
                    callback("onLocalMicrophoneOpenedByAdmin", convertDeviceControlPolicy(policy))
                case .onLocalMicrophoneClosedByAdmin:
                    callback("onLocalMicrophoneClosedByAdmin", "")
                }
            }.store(in: &liveSeatEventCancellables)
    }

    private func convertDeviceControlPolicy(_ reason: DeviceControlPolicy) -> String {
        if reason == DeviceControlPolicy.unlockOnly {
            return "UNLOCK_ONLY"
        }
        return "FORCE_OPEN"
    }
}
