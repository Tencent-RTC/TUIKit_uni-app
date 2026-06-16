//
//  RoomThemeManager.swift
//
//  Theme manager: provides global Light/Dark color and style adaptation.
//
//  `dynamicColor(lightHex:darkHex:)` internally relies on the
//  `UIColor(hex:alpha:)` initializer defined later in this file to parse
//  hexadecimal color values.
//

import UIKit

/// Theme manager.
/// - Provides global Light/Dark color and style adaptation.
public class RoomThemeManager {

    public static let shared = RoomThemeManager()
    private init() {}

    public var isDarkMode: Bool {
        if #available(iOS 13.0, *) {
            return UITraitCollection.current.userInterfaceStyle == .dark
        }
        return false
    }

    public var currentTheme: UIUserInterfaceStyle {
        if #available(iOS 13.0, *) {
            return UITraitCollection.current.userInterfaceStyle
        }
        return .light
    }

    public static func dynamicColor(light: UIColor, dark: UIColor) -> UIColor {
        if #available(iOS 13.0, *) {
            return UIColor { traitCollection in
                return traitCollection.userInterfaceStyle == .dark ? dark : light
            }
        }
        return light
    }

    public static func dynamicColor(lightHex: String, darkHex: String) -> UIColor {
        return dynamicColor(
            // Note: the original project used `UIColor(lightHex)` (an
            // AtomicX extension). utssdk does not depend on AtomicX, so we use
            // the `UIColor(hex:)` initializer defined below in this file.
            light: UIColor(hex: lightHex),
            dark: UIColor(hex: darkHex)
        )
    }

    public protocol ThemeObserver: AnyObject {
        func themeDidChange(isDarkMode: Bool)
    }

    private var observers: NSHashTable<AnyObject> = NSHashTable.weakObjects()

    public func addObserver(_ observer: ThemeObserver) {
        observers.add(observer)
    }

    public func removeObserver(_ observer: ThemeObserver) {
        observers.remove(observer)
    }

    internal func notifyThemeChange() {
        let isDark = isDarkMode
        observers.allObjects.forEach { observer in
            (observer as? ThemeObserver)?.themeDidChange(isDarkMode: isDark)
        }
    }
}

// MARK: - UIColor Extension

extension UIColor {

    /// Create a color from a hexadecimal string.
    convenience init(hex: String, alpha: CGFloat = 1.0) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let red = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let green = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let blue = CGFloat(rgb & 0x0000FF) / 255.0

        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }

    var hexString: String {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0

        getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        let rgb: Int = Int(red * 255) << 16 | Int(green * 255) << 8 | Int(blue * 255)
        return String(format: "#%06X", rgb)
    }
}

// MARK: - RoomColors
public struct RoomColors {

    public static let g2 = RoomThemeManager.dynamicColor(lightHex: "#22262E", darkHex: "#22262E")
    public static let g3 = RoomThemeManager.dynamicColor(lightHex: "#4F586B", darkHex: "#4F586B")
    public static let g5 = RoomThemeManager.dynamicColor(lightHex: "#99A2B2", darkHex: "#99A2B2")
    public static let g6 = RoomThemeManager.dynamicColor(lightHex: "#B2BBD1", darkHex: "#B2BBD1")
    public static let g7 = RoomThemeManager.dynamicColor(lightHex: "#E7ECF6", darkHex: "#E7ECF6")
    public static let g8 = RoomThemeManager.dynamicColor(lightHex: "#F2F5FC", darkHex: "#F2F5FC")
    public static let b2d = RoomThemeManager.dynamicColor(lightHex: "#1AFFC9", darkHex: "#1AFFC9")
    public static let b1d = RoomThemeManager.dynamicColor(lightHex: "#4791FF", darkHex: "#4791FF")
    public static let adminTagColor = RoomThemeManager.dynamicColor(lightHex: "#F06C4B", darkHex: "#F06C4B")
    public static let copyButtonBackground = RoomThemeManager.dynamicColor(lightHex: "#6B758A", darkHex: "#6B758A")

    public static let b1 = RoomThemeManager.dynamicColor(lightHex: "#1C66E5", darkHex: "#1C66E5")
    public static let brandBlue = RoomThemeManager.dynamicColor(lightHex: "#006EFF", darkHex: "#006EFF")
    public static let endTitleColor = RoomThemeManager.dynamicColor(lightHex: "#ED414D", darkHex: "#ED414D")
    public static let actionSheetTitleColor = RoomThemeManager.dynamicColor(lightHex: "#7C85A6", darkHex: "#7C85A6")
    public static let defaultActionButtonTitleColor = RoomThemeManager.dynamicColor(lightHex: "#006CFF", darkHex: "#006CFF")
    public static let destructiveActionButtonTitleColor = RoomThemeManager.dynamicColor(lightHex: "#E5395C", darkHex: "#E5395C")
    public static let selectedSegmentTintColor = RoomThemeManager.dynamicColor(lightHex: "#98A0B4", darkHex: "#98A0B4")
    public static let segmentTitleColor = RoomThemeManager.dynamicColor(lightHex: "#D5E0F2", darkHex: "#D5E0F2")
    public static let avatarBackgroundColor = RoomThemeManager.dynamicColor(lightHex: "#181A1E", darkHex: "#181A1E")
    public static let aiRecordBorderColor = RoomThemeManager.dynamicColor(lightHex: "#4E5461", darkHex: "#4E5461")

    public static let secondaryLabel = RoomThemeManager.dynamicColor(lightHex: "#8F8F94", darkHex: "#8F8F94")
    public static let separator = RoomThemeManager.dynamicColor(lightHex: "#EBEBEE", darkHex: "#EBEBEE")
    public static let tintBlue = RoomThemeManager.dynamicColor(lightHex: "#007AFF", darkHex: "#007AFF")

    public static let settingBackground = RoomThemeManager.dynamicColor(lightHex: "#F5F5FA", darkHex: "#F5F5FA")
    public static let themeBackground = RoomThemeManager.dynamicColor(lightHex: "#F8F9FB", darkHex: "#F8F9FB")
    public static let cardBackground = RoomThemeManager.dynamicColor(lightHex: "#FFFFFF", darkHex: "#FFFFFF")
    public static let inRoomBackground = RoomThemeManager.dynamicColor(lightHex: "#0F1014", darkHex: "#0F1014")
    public static let stopScreenShareBackground = RoomThemeManager.dynamicColor(lightHex: "#CC3D47", darkHex: "#CC3D47")
}

// MARK: - RoomFonts
public struct RoomFonts {
    public static func pingFangSCFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
        return UIFont.systemFont(ofSize: size, weight: weight)
    }
}

// MARK: - RoomSpacing
public struct RoomSpacing {
    public static let extraSmall: CGFloat = 4
    public static let small: CGFloat = 8
    public static let medium: CGFloat = 12
    public static let standard: CGFloat = 16
    public static let large: CGFloat = 20
    public static let extraLarge: CGFloat = 24
    public static let huge: CGFloat = 32
}

// MARK: - RoomCornerRadius
public struct RoomCornerRadius {
    public static let small: CGFloat = 4
    public static let medium: CGFloat = 8
    public static let standard: CGFloat = 12
    public static let large: CGFloat = 16
    public static let extraLarge: CGFloat = 20
    public static func circle(size: CGFloat) -> CGFloat {
        return size / 2
    }
}
