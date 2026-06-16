//
//  RoomWidgetView.swift
//
//  Widget view overlaid on top of the room video (nickname, microphone status,
//  role badge, etc.).
//

import UIKit
import SnapKit
import Kingfisher
import AtomicXCore

private let logger = RoomViewLogger.getLogger("RoomWidgetView")

class RoomWidgetView: UIView {

    /// Host-overridable icon overrides; falls back to module assets per-slot when nil.
    private var icons: RoomViewIcons = RoomViewIcons()
    /// Last-bound participant; cached so we can re-apply the avatar placeholder
    /// when `setIcons(_:)` is invoked after `setParticipant(_:)`.
    private var lastParticipant: RoomParticipant?

    private lazy var avatarBackgroundView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = RoomColors.avatarBackgroundColor
        return view
    }()

    private lazy var avatarImageView: UIImageView = {
        let imageView = UIImageView(frame: .zero)
        imageView.layer.cornerRadius = 32
        imageView.layer.masksToBounds = true
        return imageView
    }()

    init() {
        super.init(frame: .zero)
        setupViews()
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupViews() {
        addSubview(avatarBackgroundView)
        avatarBackgroundView.addSubview(avatarImageView)
    }

    private func setupConstraints() {
        avatarBackgroundView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }

        avatarImageView.snp.makeConstraints { make in
            make.center.equalToSuperview()
            make.size.equalTo(CGSize(width: 64, height: 64))
        }
    }

    /// Apply host-supplied icon overrides. If a participant is already bound,
    /// the avatar is re-rendered immediately so the new placeholder is used.
    public func setIcons(_ icons: RoomViewIcons) {
        self.icons = icons
        if let participant = lastParticipant {
            setParticipant(participant: participant)
        }
    }

    public func setParticipant(participant: RoomParticipant) {
        logger.info("setParticipant: \(participant)")
        lastParticipant = participant
        if participant.cameraStatus == .off {
            avatarImageView.kf.setImage(with: URL(string: participant.avatarURL),
                                        placeholder: icons.defaultAvatar ?? ResourceLoader.loadImage("avatar_placeholder"))
            isHidden = false
        } else {
            isHidden = true
        }
    }
}
