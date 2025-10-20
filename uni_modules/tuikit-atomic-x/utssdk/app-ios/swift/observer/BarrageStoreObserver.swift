import AtomicXCore
import Combine
import DCloudUTSFoundation
import Foundation
import RTCRoomEngine

public class BarrageStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = BarrageStoreObserver()

    public func barrageStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()
        BarrageStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \BarrageState.messageList))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] messageList in
                guard let self = self else { return }
                let dict = messageList.map { self.convertBarrageToDic(barrage: $0) }
                if let jsonList = JsonUtil.toJson(dict) {
                    callback("messageList", jsonList)
                }
            }).store(in: &cancellables)
        // TODO: 底层未实现，暂时隐藏
        // BarrageStore.create(liveID: liveID)
        //     .state.subscribe(StatePublisherSelector(keyPath: \BarrageState.allowSendMessage))
        //     .receive(on: DispatchQueue.main)
        //     .sink(receiveValue: { message in
        //         callback("allowSendMessage", String(message))
        //     }).store(in: &cancellables)
    }

    private func convertBarrageToDic(barrage: Barrage) -> [String: Any] {
        var dict: [String: Any] = [
            "liveID": barrage.liveID,
            "sender": TypeConvert.convertLiveUserInfoToDic(liveUserInfo: barrage.sender),
            "sequence": barrage.sequence,
            "timestampInSecond": barrage.timestampInSecond,
            "messageType": convertMessageType(barrage.messageType),
            "textContent": barrage.textContent,
            "extensionInfo": barrage.extensionInfo,
            "businessID": barrage.businessID,
            "data": barrage.data,
        ]
        return dict
    }

    private func convertMessageType(_ type: BarrageType) -> String {
        if type == BarrageType.custom {
            return "CUSTOM"
        }
        return "TEXT"
    }
}
