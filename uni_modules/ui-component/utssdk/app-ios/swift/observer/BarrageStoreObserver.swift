import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class BarrageStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = BarrageStoreObserver()
    
    public func barrageStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getBarrageStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2BarrageState.messageList))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] messageList in
                guard let self = self else { return }
                var list = []
                for messageInfo in messageList {
                    if (messageInfo != nil) {
                        list.append(convertMessageInfoToDic(messageInfo: messageInfo))
                    }
                }
                if let jsonList = JsonUtil.toJson(list) {
                    callback("messageList", jsonList)
                }
            })
            .store(in: &cancellables)
    }

    private func convertMessageInfoToDic(messageInfo: MessageInfo) -> [String: Any] {
        var dict: [String: Any] = [
            "roomId": messageInfo.roomId,
            "sender": TypeConvert.convertTUIUserInfoToDic(userInfo: messageInfo.sender),
            "sequence": messageInfo.sequence,
            "timestampInSecond": messageInfo.timestampInSecond,
            "messageType": convertMessageType(messageInfo.messageType),
            "textContent": messageInfo.textContent,
            "extensionInfo": messageInfo.extensionInfo,
            "businessId": messageInfo.businessId,
            "data": messageInfo.data
        ]
        return dict
    }

    private func convertMessageType(_ type: MessageType) -> String {
        if (type == MessageType.custom) {
            return "CUSTOM" 
        }
        return "TEXT"
    }

    
} 