//
//  RoomParticipantSource.swift
//
//  Subscribes to `TUIRoomEngine` and exposes a UI-friendly view of a room's
//  participants and their speaking volumes.
//
//  Lifecycle:
//   - `start(roomID:)` adds the engine observer and pulls the initial full list.
//   - `stop()` removes the observer and clears all internal state, so a single
//     instance can be reused across rebinds (e.g. when a host view is detached
//     and reattached, or the room id changes).
//
//  Threading: events from `TUIRoomEngine` are delivered on the main thread,
//  which is also where the `Listener` callbacks fire. State mutation is
//  therefore single-threaded by construction.
//

import Foundation
import AtomicXCore
import RTCRoomEngine

private let logger = RoomViewLogger.getLogger("RoomParticipantSource")

/// Callbacks for participant-related state changes.
protocol RoomParticipantSourceListener: AnyObject {
    /// Fired whenever the participant list changes, with the screen-share
    /// participant already derived. Either or both may be empty / nil.
    ///
    /// The supplied list is a fresh snapshot (callers don't need to copy it
    /// before retaining it, but mutating it is undefined).
    func roomParticipantSource(_ source: RoomParticipantSource,
                               didUpdateParticipants participants: [RoomParticipant],
                               screenShareParticipant: RoomParticipant?)

    /// Fired on every voice-volume tick from the engine.
    ///
    /// The map is keyed by `userID` and values are the most recent volume
    /// (0..100). Users not present in the map are silent for this tick.
    func roomParticipantSource(_ source: RoomParticipantSource,
                               didUpdateSpeakingVolumes volumes: [String: Int])
}

final class RoomParticipantSource: NSObject {

    // Engine API / event keys.
    private enum Wire {
        static let getParticipantList     = "roomParticipantStore.getParticipantList"
        static let onParticipantListChanged = "roomParticipantState.onParticipantListChanged"
    }

    // Numeric values for participant list change events.
    private enum ListModifyType: Int {
        case none    = 0
        case full    = 1
        case add     = 2
        case remove  = 3
        case replace = 4
    }

    private weak var listener: RoomParticipantSourceListener?
    private let roomEngine: TUIRoomEngine = TUIRoomEngine.sharedInstance()

    /// Insertion-ordered store of participants. Acts as the single source of
    /// truth for the snapshot we hand out via the listener.
    ///
    /// We keep a parallel `[String]` of userIDs to preserve insertion order
    /// (Swift's `Dictionary` is unordered).
    private var participantMap: [String: RoomParticipant] = [:]
    private var participantOrder: [String] = []

    private var roomID: String = ""
    private var isObserving = false

    init(listener: RoomParticipantSourceListener) {
        self.listener = listener
        super.init()
    }

    deinit {
        stop()
    }

    /// Begin observing engine events for `roomID`. Idempotent for the same id.
    func start(roomID: String) {
        guard !roomID.isEmpty else { return }
        if isObserving && self.roomID == roomID { return }
        if isObserving {
            // Re-bind to a different room: tear down first to drop stale state.
            stop()
        }
        self.roomID = roomID
        roomEngine.addObserver(self)
        isObserving = true
        fetchInitialParticipantList()
    }

    /// Stop observing and reset all internal state. Safe to call when not started.
    func stop() {
        guard isObserving else { return }
        roomEngine.removeObserver(self)
        isObserving = false
        roomID = ""
        participantMap.removeAll()
        participantOrder.removeAll()
    }

    private func fetchInitialParticipantList() {
        let param = Self.encodeJSON(["cursor": ""])
        roomEngine.call(api: Wire.getParticipantList, param: param) { [weak self] code, message, data in
            guard let self = self else { return }
            guard code == 0 else {
                logger.error("RoomParticipantSource getParticipantList failed: code=\(code), message=\(message)")
                return
            }
            let list: [RoomParticipant] = Self.decodeList(jsonString: data, key: "participantList")
            self.applyChange(modifyType: .full, list: list)
        }
    }

    /// Single point that mutates `participantMap` in response to a participant
    /// event, then notifies the listener. Also derives the screen-share
    /// participant from the latest snapshot.
    private func applyChange(modifyType: ListModifyType, list: [RoomParticipant]) {
        switch modifyType {
        case .full:
            participantMap.removeAll()
            participantOrder.removeAll()
            for p in list {
                if participantMap[p.userID] == nil {
                    participantOrder.append(p.userID)
                }
                participantMap[p.userID] = p
            }
        case .add, .replace:
            for p in list {
                if participantMap[p.userID] == nil {
                    participantOrder.append(p.userID)
                }
                participantMap[p.userID] = p
            }
        case .remove:
            for p in list {
                if participantMap.removeValue(forKey: p.userID) != nil {
                    participantOrder.removeAll { $0 == p.userID }
                }
            }
        case .none:
            return
        }

        let snapshot: [RoomParticipant] = participantOrder.compactMap { participantMap[$0] }
        let screenShare = snapshot.first(where: { $0.screenShareStatus == .on })
        logger.info("RoomParticipantSource applyChange: modifyType=\(modifyType.rawValue), total=\(snapshot.count), screenShare=\(screenShare?.userID ?? "nil")")

        listener?.roomParticipantSource(self,
                                        didUpdateParticipants: snapshot,
                                        screenShareParticipant: screenShare)
    }

    // MARK: - JSON Helpers

    /// Lightweight JSON encoder for the small `{ "cursor": "" }` style payloads
    /// expected by the engine `call(...)` API.
    private static func encodeJSON(_ dict: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: dict, options: []),
              let str  = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return str
    }

    private static let sharedDecoder: JSONDecoder = JSONDecoder()

    /// Decode `[T]` from `<jsonString>[<key>]` where the value is a JSON array.
    private static func decodeList<T: Decodable>(jsonString: String, key: String) -> [T] {
        guard let data = jsonString.data(using: .utf8),
              let obj  = try? JSONSerialization.jsonObject(with: data, options: []),
              let dict = obj as? [String: Any],
              let raw  = dict[key] else {
            return []
        }
        // [CRASH-FIX] Only array/dict are valid JSON top-level objects. Calling
        // `JSONSerialization.data(withJSONObject:)` on a primitive (String/Int/...)
        // throws an NSException that `try?` cannot catch and the app crashes.
        guard JSONSerialization.isValidJSONObject(raw),
              let listData = try? JSONSerialization.data(withJSONObject: raw, options: []) else {
            return []
        }
        return (try? sharedDecoder.decode([T].self, from: listData)) ?? []
    }

    /// Decode a single primitive value from `<jsonString>[<key>]`. Used here to
    /// extract `roomID` / `listModifyType` from observer payloads.
    private static func decode<T: Decodable>(jsonString: String, key: String) -> T? {
        guard let data = jsonString.data(using: .utf8),
              let obj  = try? JSONSerialization.jsonObject(with: data, options: []),
              let dict = obj as? [String: Any],
              let raw  = dict[key] else {
            return nil
        }
        // [CRASH-FIX] `raw` is most often a primitive (String/Int/Bool/Double)
        // for keys like `roomID` / `listModifyType`. Primitives are NOT valid
        // top-level JSON objects, so `JSONSerialization.data(withJSONObject:)`
        // throws an uncatchable NSException. Handle primitives via direct cast,
        // and only fall back to JSONSerialization for array/dict values.
        if let typed = raw as? T {
            return typed
        }
        // Numeric coercion: when T is Int but raw is NSNumber/Double/etc.
        if T.self == Int.self, let n = raw as? NSNumber {
            return n.intValue as? T
        }
        if T.self == Double.self, let n = raw as? NSNumber {
            return n.doubleValue as? T
        }
        if T.self == Bool.self, let n = raw as? NSNumber {
            return n.boolValue as? T
        }
        if T.self == String.self {
            if let s = raw as? String { return s as? T }
            if let n = raw as? NSNumber { return n.stringValue as? T }
        }
        guard JSONSerialization.isValidJSONObject(raw),
              let valueData = try? JSONSerialization.data(withJSONObject: raw, options: []) else {
            return nil
        }
        return try? sharedDecoder.decode(T.self, from: valueData)
    }
}

// MARK: - TUIRoomObserver

extension RoomParticipantSource: TUIRoomObserver {

    /// Generic key/data event channel exposed by `TUIRoomEngine`.
    func on(key: String, data jsonData: String) {
        // Filter out events not targeted at this room. Payload always carries
        // a `roomID` field for room-scoped events.
        let eventRoomID: String = Self.decode(jsonString: jsonData, key: "roomID") ?? ""
        guard eventRoomID == roomID else { return }

        switch key {
        case Wire.onParticipantListChanged:
            let rawType: Int = Self.decode(jsonString: jsonData, key: "listModifyType") ?? 0
            let modifyType = ListModifyType(rawValue: rawType) ?? .none
            let list: [RoomParticipant] = Self.decodeList(jsonString: jsonData, key: "participantList")
            applyChange(modifyType: modifyType, list: list)
        default:
            break
        }
    }

    func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        let volumes = volumeMap.mapValues { $0.intValue }
        listener?.roomParticipantSource(self, didUpdateSpeakingVolumes: volumes)
    }
}
