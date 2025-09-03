import Combine
import DCloudUTSFoundation
import RTCRoomEngine_Plus

public class LoginStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LoginStoreObserver()

    public func loginStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()
        V2RTCRoomEngine.shared
            .subscribeLoginState(StateSelector(keyPath: \LoginState.loginUserInfo))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] loginUserInfo in
                guard let self = self else { return }
                if let userInfo = loginUserInfo {
                    let dict: [String: Any] = [
                        "userId": userInfo.userId,
                        "userName": userInfo.userName,
                        "avatarUrl": userInfo.avatarUrl,
                    ]
                    if let jsonString =  JsonUtil.toJson(dict) {
                        callback("loginUserInfo", jsonString)
                    }
                } else {
                    callback("loginUserInfo", "")
                }
            })
            .store(in: &cancellables)
		
        V2RTCRoomEngine.shared
            .subscribeLoginState(StateSelector(keyPath: \LoginState.loginStatus))
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] loginStatus in
                callback("loginStatus", String(loginStatus.rawValue))
            })
            .store(in: &cancellables)
    }
}
