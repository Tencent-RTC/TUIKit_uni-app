import DCloudUTSFoundation
import RTCRoomEngine

class CallEngineManager: NSObject {

    private static let TAG = "UTS-CallEngineManager: "

    public static let shared = CallEngineManager()

    /// 初始化 TUICallEngine
    /// - Parameters:
    ///   - sdkAppID: 腾讯云 SDKAppID
    ///   - userID: 用户 ID
    ///   - userSig: 用户签名
    public func initEngine(_ sdkAppID: Int32, userID: String, userSig: String) {
        TUICallEngine.createInstance().`init`(sdkAppID, userId: userID, userSig: userSig) {
            console.log(CallEngineManager.TAG, "TUICallEngine init success")
        } fail: { code, message in
            console.error(
                CallEngineManager.TAG,
                "TUICallEngine init failed, code: \(code), message: \(message ?? "")")
        }
    }
}
