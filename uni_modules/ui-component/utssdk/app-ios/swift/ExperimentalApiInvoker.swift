import RTCRoomEngine_Plus
import DCloudUTSFoundation

class ExperimentalApiInvoker {
    public static let shared = ExperimentalApiInvoker()
    private let jsonDecoder = JSONDecoder()
    // const data = { "api": "setTestEnvironment", "params": { "enableRoomTestEnv": true } }
    // const data = { "api": "setLocalVideoMuteImage", "params": { "image": "filePath" } }
    public func callExperimentalAPI(_ jsonString: String, callback: @escaping TUIExperimentalAPIResponseBlock) {
        guard let data = jsonString.data(using: .utf8) else {
            callback("Invalid JSON string")
            return
        }
        
        do {
            let requestData = try jsonDecoder.decode(RequestData.self, from: data)
            if requestData.api == "setLocalVideoMuteImage" {
                setLocalVideoMuteImage(data: requestData, callback: callback)
                return
            }
            TUIRoomEngine.sharedInstance().callExperimentalAPI(jsonStr: jsonString, callback: callback)
        } catch {
            callback("JSON parsing error")
        }
    }
    
    private func setLocalVideoMuteImage(data: RequestData, callback: @escaping TUIExperimentalAPIResponseBlock) {
        guard let filePath = data.params?.image, !filePath.isEmpty else {
            callback("setLocalVideoMuteImage: filePath is empty")
            return
        }
        
        do {
            let image = UIImage(contentsOfFile: filePath)
            TUIRoomEngine.sharedInstance().setLocalVideoMuteImage(image: image)
        } catch {
            callback("setLocalVideoMuteImage: unexpected error")
        }
    }
}

struct RequestData: Codable {
    let api: String
    let params: Params?
}

// 不要修改数据,每个数据对应一个关键字
struct Params: Codable {
    let image: String?
}