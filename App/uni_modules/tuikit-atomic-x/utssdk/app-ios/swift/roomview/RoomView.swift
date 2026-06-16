import UIKit
import SnapKit
import Combine
import AtomicXCore

// MARK: - RoomView Component
public class RoomView: UIView, BaseView {
    // MARK: - BaseView Properties
    public weak var routerContext: RouterContext?
    private let roomID: String
    private let roomType: RoomType
    
    // MARK: - UI Components
    private lazy var standardRoomView: StandardRoomView = {
        StandardRoomView(roomID: roomID)
    }()
    
    private lazy var webinarRoomView: WebinarRoomView = {
        WebinarRoomView(roomID: roomID)
    }()
    
    // MARK: - Initialization
    public init(roomID: String, roomType: RoomType) {
        self.roomID = roomID
        self.roomType = roomType
        super.init(frame: .zero)
        setupViews()
        setupConstraints()
        setupStyles()
        setupBindings()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    deinit {
        debugPrint("\(type(of: self)) deinit")
    }
    
    // MARK: - BaseView Implementation
    public func setupViews() {
        if roomType == .standard {
            addSubview(standardRoomView)
        } else {
            addSubview(webinarRoomView)
        }
    }
    
    public func setupConstraints() {
        if roomType == .standard {
            standardRoomView.snp.makeConstraints { make in
                make.edges.equalToSuperview()
            }
        } else {
            webinarRoomView.snp.makeConstraints { make in
                make.edges.equalToSuperview()
            }
        }
    }
    
    public func setupStyles() {
        backgroundColor = .clear
    }
    
    public func setupBindings() {
        if roomType == .webinar {
            webinarRoomView.delegate = self
        }
    }

    // MARK: - Icon Customization
    /// Apply host-supplied icon overrides for the entire room view subtree.
    ///
    /// Each `RoomViewIcons` slot is optional; leave a slot as `nil` to keep the
    /// built-in module asset for that visual. Forwarded to whichever child view
    /// is active for the current `roomType`. Safe to call at any time, including
    /// before/after the view is attached to the window.
    public func setIcons(_ icons: RoomViewIcons) {
        if roomType == .standard {
            standardRoomView.setIcons(icons)
        } else {
            webinarRoomView.setIcons(icons)
        }
    }
}

extension RoomView: WebinarRoomViewDelegate {
    func onRoomViewLayoutChanged(isLandscape: Bool, canvas: WebinarCanvas) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if isLandscape {
                webinarRoomView.snp.remakeConstraints { make in
                    make.top.equalToSuperview().offset(30)
                    make.left.right.equalToSuperview()
                    make.height.equalTo(self.snp.width).multipliedBy(CGFloat(canvas.h) / CGFloat(canvas.w))
                }
            } else {
                webinarRoomView.snp.remakeConstraints { make in
                    make.edges.equalToSuperview()
                }
            }
        }
    }
}
