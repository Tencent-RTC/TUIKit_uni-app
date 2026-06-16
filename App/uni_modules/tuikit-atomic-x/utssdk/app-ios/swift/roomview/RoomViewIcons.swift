//
//  RoomViewIcons.swift
//
//  Shared container of icon resources used by RoomView, cells, and widgets.
//

import UIKit

/// Container of icon resources consumed by `StandardRoomView` / `WebinarRoomView`
/// and their cell / widget descendants.
public struct RoomViewIcons {
    public var defaultAvatar: UIImage?
    public var microphoneOn: UIImage?
    public var microphoneOff: UIImage?
    public var roleOwner: UIImage?
    public var roleManager: UIImage?
    public var arrowLeft: UIImage?
    public var arrowRight: UIImage?

    public init(
        defaultAvatar: UIImage? = nil,
        microphoneOn: UIImage? = nil,
        microphoneOff: UIImage? = nil,
        roleOwner: UIImage? = nil,
        roleManager: UIImage? = nil,
        arrowLeft: UIImage? = nil,
        arrowRight: UIImage? = nil
    ) {
        self.defaultAvatar = defaultAvatar
        self.microphoneOn = microphoneOn
        self.microphoneOff = microphoneOff
        self.roleOwner = roleOwner
        self.roleManager = roleManager
        self.arrowLeft = arrowLeft
        self.arrowRight = arrowRight
    }
}
