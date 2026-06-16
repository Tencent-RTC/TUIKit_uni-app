//
//  RoomParticipantExtension.swift
//
//  Provides RoomParticipant.name / DeviceRequestInfo.name / RoomUser.name and
//  a bounds-safe `Collection[safe:]` subscript, used internally by RoomView.
//

import Foundation
import AtomicXCore

public extension RoomParticipant {
    var name: String {
        if !nameCard.isEmpty { return nameCard }
        if !userName.isEmpty { return userName }
        return userID
    }
}

public extension DeviceRequestInfo {
    var name: String {
        if !senderNameCard.isEmpty { return senderNameCard }
        if !senderUserName.isEmpty { return senderUserName }
        return senderUserID
    }
}

public extension RoomUser {
    var name: String {
        if !userName.isEmpty { return userName }
        return userID
    }
}

public extension Collection {
    subscript (safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
