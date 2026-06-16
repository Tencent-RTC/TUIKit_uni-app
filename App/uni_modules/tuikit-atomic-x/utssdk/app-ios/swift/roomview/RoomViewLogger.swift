//
//  RoomViewLogger.swift
//
//  Logger utility for the RoomView module.
//
//  Dual channel:
//   - Always writes to NSLog (for local debugging).
//   - Best-effort forward to the TUI SDK log channel
//     (`TUIRoomEngine.callExperimentalAPI("TuikitLog")`) so logs can be
//     collected on the server side. Serialization failures or an uninitialized
//     engine never affect the NSLog path.
//
//  Usage:
//    private let logger = RoomViewLogger.getLogger("MyView")
//    logger.info("hello")
//

import Foundation
import RTCRoomEngine

public class RoomViewLogger {

    private static let MODULE_NAME = "RoomView"

    private static let API = "TuikitLog"
    private static let LOG_KEY_API = "api"
    private static let LOG_KEY_PARAMS = "params"
    private static let LOG_KEY_PARAMS_LEVEL = "level"
    private static let LOG_KEY_PARAMS_MESSAGE = "message"
    private static let LOG_KEY_PARAMS_MODULE = "module"
    private static let LOG_KEY_PARAMS_FILE = "file"
    private static let LOG_KEY_PARAMS_LINE = "line"

    private static let LOG_LEVEL_INFO = 0
    private static let LOG_LEVEL_WARNING = 1
    private static let LOG_LEVEL_ERROR = 2

    private let moduleName: String
    private let fileName: String

    private init(moduleName: String, fileName: String) {
        self.moduleName = moduleName
        self.fileName = fileName
    }

    public static func getLogger(_ file: String) -> RoomViewLogger {
        return RoomViewLogger(moduleName: MODULE_NAME, fileName: file)
    }

    public func info(_ message: @autoclosure () -> String) {
        log(level: RoomViewLogger.LOG_LEVEL_INFO, message: message())
    }

    public func warn(_ message: @autoclosure () -> String) {
        log(level: RoomViewLogger.LOG_LEVEL_WARNING, message: message())
    }

    public func error(_ message: @autoclosure () -> String) {
        log(level: RoomViewLogger.LOG_LEVEL_ERROR, message: message())
    }

    private func log(level: Int, message: String) {
        // 1. Always write to NSLog for local debugging.
        let levelTag: String
        switch level {
        case RoomViewLogger.LOG_LEVEL_WARNING: levelTag = "W"
        case RoomViewLogger.LOG_LEVEL_ERROR:   levelTag = "E"
        default:                               levelTag = "I"
        }
        NSLog("[\(moduleName)][\(levelTag)][\(fileName)] \(message)")

        // 2. Best-effort forward to the TUI SDK log channel; silently swallow
        //    any failure so logging cannot affect the UI.
        let payload: [String: Any] = [
            RoomViewLogger.LOG_KEY_API: RoomViewLogger.API,
            RoomViewLogger.LOG_KEY_PARAMS: [
                RoomViewLogger.LOG_KEY_PARAMS_LEVEL: level,
                RoomViewLogger.LOG_KEY_PARAMS_MESSAGE: message,
                RoomViewLogger.LOG_KEY_PARAMS_MODULE: moduleName,
                RoomViewLogger.LOG_KEY_PARAMS_FILE: fileName,
                RoomViewLogger.LOG_KEY_PARAMS_LINE: 0,
            ]
        ]
        guard
            let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
            let jsonStr = String(data: data, encoding: .utf8)
        else {
            return
        }
        TUIRoomEngine.sharedInstance().callExperimentalAPI(jsonStr: jsonStr) { _ in }
    }
}
