import Foundation

public class JsonUtil {
    public static func toJson(_ object: Any) -> String? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: object, options: []),
            let jsonString = String(data: jsonData, encoding: .utf8) else {
          return nil
        }
        return jsonString
    }
}