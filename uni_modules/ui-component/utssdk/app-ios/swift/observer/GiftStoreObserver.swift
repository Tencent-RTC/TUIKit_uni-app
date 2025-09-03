import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class GiftStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = GiftStoreObserver()

    public func giftStoreChanged(_ liveId: String, _ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        V2RTCRoomEngine.shared.getGiftStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2GiftState.giftInfoList))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self]  giftInfoList in
                guard let self = self else { return }
                var list: [[String: Any]] = []
                for info in giftInfoList {
                    list.append(convertTUIGiftInfoToDic(giftInfo: info))
                }
                if let jsonList = JsonUtil.toJson(list) {
                    callback("giftInfoList", jsonList)
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getGiftStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2GiftState.latestGift))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] gift in
                guard let self = self else { return }
                guard let gift = gift else { return }
                var dict = convertGiftMessageToDic(giftMessage: gift)
                if let json = JsonUtil.toJson(dict) {
                    callback("latestGift", json)
                }
            })
            .store(in: &cancellables)

        V2RTCRoomEngine.shared.getGiftStore(liveId: liveId)
            .state.subscribe(StateSelector(keyPath: \V2GiftState.giftStatics))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] statics in
                guard let self = self else { return }
                let dict = convertGiftStaticsToDic(statics: statics)
                if let json = JsonUtil.toJson(dict) {
                    callback("giftStatics", json)
                }
            })
            .store(in: &cancellables)
    }

    private func convertTUIGiftInfoToDic(giftInfo: TUIGiftInfo) -> [String: Any] {
        return [
            "giftId": giftInfo.giftId,
            "name": giftInfo.name,
            "desc": giftInfo.desc,
            "iconUrl": giftInfo.iconUrl,
            "resourceUrl": giftInfo.resourceUrl,
            "level": giftInfo.level,
            "coins": giftInfo.coins,
            "extensionInfo": giftInfo.extensionInfo,
        ]
    }

    private func convertGiftMessageToDic(giftMessage: GiftMessage) -> [String: Any] {
        return [
            "roomId": giftMessage.roomId,
            "giftCount": giftMessage.giftCount,
            "sender": TypeConvert.convertTUIUserInfoToDic(userInfo: giftMessage.sender),
            "giftInfo": convertTUIGiftInfoToDic(giftInfo: giftMessage.giftInfo)
        ]
    }

    private func convertGiftStaticsToDic(statics: GiftStaticsInfo) -> [String: UInt] {
        return [
            "totalGiftsReceived": statics.totalGiftsReceived,
            "totalGiftCoins": statics.totalGiftCoins,
            "totalUniqueGiftSenders": statics.totalUniqueGiftSenders
        ]
    }
} 