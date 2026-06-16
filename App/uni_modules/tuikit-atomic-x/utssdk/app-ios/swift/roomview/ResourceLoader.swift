//
//  ResourceLoader.swift
//
//  Entry point for loading internal icon resources. The utssdk does not bundle
//  an xcassets resource bundle, so we fall back to `Bundle.main`; `loadImage`
//  only succeeds when the host app provides a resource with the same name.
//
//  The Vue side passes host icons through `<room-core-view :icons="...">` as a
//  fallback. Slots that are not supplied will be empty but will not crash.
//

import Foundation
import UIKit

@objc public class ResourceLoader: NSObject {

    @objc public static let bundle: Bundle = Bundle.main

    @objc public static func loadImage(_ name: String) -> UIImage? {
        return UIImage(named: name, in: bundle, compatibleWith: nil)
    }

    @objc public static func loadAssetImage(_ name: String) -> UIImage? {
        if let image = UIImage(named: name, in: bundle, compatibleWith: nil) {
            return image
        }
        return UIImage(named: name)
    }
}
