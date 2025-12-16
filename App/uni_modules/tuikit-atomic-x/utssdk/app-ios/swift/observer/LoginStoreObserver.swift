import AtomicXCore
import Combine
import DCloudUTSFoundation
import RTCRoomEngine

public class LoginStoreObserver {
    private var cancellables = Set<AnyCancellable>()
    public static let shared = LoginStoreObserver()

    public func loginStoreChanged(_ callback: @escaping (_ name: String, _ data: String) -> Void) {
        cancellables.removeAll()

        LoginStore.shared
            .state.subscribe(StatePublisherSelector(keyPath: \LoginState.loginUserInfo))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { [weak self] userInfo in
                guard let self = self else { return }
                guard let userInfo = userInfo else { return }
                if let jsonString = JsonUtil.toJson(
                    self.converUserProfileToDic(userProfile: userInfo))
                {
                    callback("loginUserInfo", jsonString)
                }
            }).store(in: &cancellables)

        LoginStore.shared.state.subscribe(StatePublisherSelector(keyPath: \LoginState.loginStatus))
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { value in
                var loginStatus = "UNLOGIN"
                if value == .logined {
                    loginStatus = "LOGINED"
                }
                if let json = JsonUtil.toJson(loginStatus) {
                    callback("loginStatus", json)
                }
            }).store(in: &cancellables)
    }

    private func converUserProfileToDic(userProfile: UserProfile) -> [String: Any] {
        return [
            "userID": userProfile.userID,
            "nickname": userProfile.nickname,
            "avatarURL": userProfile.avatarURL,
            "selfSignature": userProfile.selfSignature,
            "gender": convertGender(gender: userProfile.gender),
            "role": userProfile.role,
            "level": userProfile.level,
            "allowType": convertAllowType(type: userProfile.allowType),
            // "customInfo": userProfile.customInfo, //TODO:暂不支持
        ]
    }
    private func convertGender(gender: Gender?) -> String {
        var genderStr = "UNKNOWN"
        if( gender == .male) {
            genderStr = "MALE"
        } else if( gender == .female) {
            genderStr = "FEMALE"
        }
        return genderStr
    }
    private func convertAllowType(type: AllowType?) -> String {
        var allowType = "ALLOW_ANY"
        if(type == .needConfirm) {
            allowType = "NEED_CONFIRM"
        } else if(type == .denyAny) {
            allowType = "DENY_ANY"
        }
        return allowType
    }
}
