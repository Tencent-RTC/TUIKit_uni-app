import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class GiftStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    private var giftEventCancellables = Set<AnyCancellable>()
    public static let shared = GiftStoreObserver()

    public func giftStoreChanged(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        cancellables.removeAll()
        GiftStore.create(liveID: liveID)
            .state.subscribe(StatePublisherSelector(keyPath: \GiftState.usableGifts))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] usableGifts in
                guard let self = self else { return }
                let dict = usableGifts.map { self.convertGiftCategoryToDic(giftCategory: $0) }
                if let jsonList = JsonUtil.toJson(dict) {
                    callback("usableGifts", jsonList)
                }
            }).store(in: &cancellables)
    }

    private func convertGiftCategoryToDic(giftCategory: GiftCategory) -> [String: Any] {
        var gifts: [[String: Any]] = []
        for info in giftCategory.giftList {
            gifts.append(convertGiftToDic(gift: info))
        }
        return [
            "categoryID": giftCategory.categoryID,
            "name": giftCategory.name,
            "desc": giftCategory.desc,
            "extensionInfo": giftCategory.extensionInfo,
            "giftList": gifts,
        ]
    }
    private func convertGiftToDic(gift: Gift) -> [String: Any] {
        return [
            "giftID": gift.giftID,
            "name": gift.name,
            "desc": gift.desc,
            "iconURL": gift.iconURL,
            "resourceURL": gift.resourceURL,
            "level": gift.level,
            "coins": gift.coins,
            "extensionInfo": gift.extensionInfo,
        ]
    }

    public func setupGiftEvent(
        _ liveID: String, _ callback: @escaping (_ name: String, _ data: String) -> Void
    ) {
        giftEventCancellables.removeAll()
        GiftStore.create(liveID: liveID).giftEventPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                guard let self = self else { return }
                switch event {
                case .onReceiveGift(let liveID, let gift, let count, let sender):
                    var dict: [String: Any] = [:]
                    dict["liveID"] = liveID
                    dict["gift"] = self.convertGiftToDic(gift: gift)
                    dict["count"] = count
                    dict["sender"] = TypeConvert.convertLiveUserInfoToDic(liveUserInfo: sender)
                    if let json = JsonUtil.toJson(dict) {
                        callback("onReceiveGift", json)
                    }
                }
            }.store(in: &giftEventCancellables)
    }
}
