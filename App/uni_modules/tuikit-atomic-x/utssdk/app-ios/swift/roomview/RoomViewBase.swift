//
//  RoomViewBase.swift
//
//  Base protocols (BaseView + RouterContext) consumed by RoomView /
//  StandardRoomView / WebinarRoomView.
//

import UIKit

// MARK: - BaseView
/// Base view protocol for custom views
/// All custom views must conform to this protocol
public protocol BaseView: AnyObject {
    /// Router context for triggering navigation (weak reference to avoid retain cycles)
    var routerContext: RouterContext? { get set }

    /// Setup subviews hierarchy
    func setupViews()

    /// Setup layout constraints
    func setupConstraints()

    /// Setup view styles and appearance
    func setupStyles()

    /// Setup data bindings and event handlers
    func setupBindings()
}

// MARK: - Default Implementation
extension BaseView {
    func setupViews() {}
    func setupConstraints() {}
    func setupStyles() {}
    func setupBindings() {}
}

// MARK: - RouterContext
/// Router context protocol for navigation and presentation
/// All custom UIViewControllers must conform to this protocol
public protocol RouterContext: AnyObject {
    /// Current navigation controller
    var navigationController: UINavigationController? { get }

    /// Push a new view controller onto the navigation stack
    func push(_ viewController: UIViewController, animated: Bool)

    /// Pop the current view controller from the navigation stack
    @discardableResult
    func pop(animated: Bool) -> UIViewController?

    /// Pop to the root view controller
    @discardableResult
    func popToRoot(animated: Bool) -> [UIViewController]?

    /// Present a view controller modally
    func present(_ viewController: UIViewController, animated: Bool, completion: (() -> Void)?)

    /// Dismiss the presented view controller
    func dismiss(animated: Bool, completion: (() -> Void)?)
}

// MARK: - Default Implementation for UIViewController
extension RouterContext where Self: UIViewController {
    public func push(_ viewController: UIViewController, animated: Bool = true) {
        navigationController?.pushViewController(viewController, animated: animated)
    }

    @discardableResult
    public func pop(animated: Bool = true) -> UIViewController? {
        return navigationController?.popViewController(animated: animated)
    }

    @discardableResult
    public func popToRoot(animated: Bool = true) -> [UIViewController]? {
        return navigationController?.popToRootViewController(animated: animated)
    }

    public func present(_ viewController: UIViewController, animated: Bool = true, completion: (() -> Void)? = nil) {
        present(viewController, animated: animated, completion: completion)
    }

    public func dismiss(animated: Bool = true, completion: (() -> Void)? = nil) {
        dismiss(animated: animated, completion: completion)
    }
}
