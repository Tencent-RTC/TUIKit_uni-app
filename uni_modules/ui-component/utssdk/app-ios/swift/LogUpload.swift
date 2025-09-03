//
//  LogUpload.swift
//  unimoduleUniUIComponent
//
//  Created by reneechai on 2025/8/20.
//
import UIKit
import Foundation
import DCloudUTSFoundation

public class FileModel {
    var fileName: String
    var filePath: String
    
    init(fileName: String, filePath: String) {
        self.fileName = fileName
        self.filePath = filePath
    }
}

public class LogUpload {
    public static let shared = LogUpload()
    private var fileModelArray: [FileModel] = []
    
    public func shareLog(_ row: Int){
        if row < self.fileModelArray.count {
            let fileModel = self.fileModelArray[row]
            let logPath = fileModel.filePath
            let shareObj = URL(fileURLWithPath: logPath)
            /// file:///var/mobile/Containers/Data/Application/3173F3A2-91A4-44B3-AC13-DBBD02C2DDBE/Documents/log/LiteAV_C_20250820-19243.clog
            // print("LogUpload: shareObj: \(shareObj)")
            console.log("LogUpload, shareObj:", shareObj)
            
            let activityView = UIActivityViewController(activityItems: [shareObj], applicationActivities: nil)
            guard let curVC = getCurrentWindowViewController() else { return }
            curVC.present(activityView, animated: true) {}
        }
    }
    
    public func fetchLogfileList() -> [FileModel] {
        var fileArray: [FileModel] = []
        guard let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first
        else { return []}
        
        let logPath = (documentsPath as NSString).appendingPathComponent("log")
        guard let libraryPath = NSSearchPathForDirectoriesInDomains(.libraryDirectory, .userDomainMask, true).first
        else { return []}
        
        let cachePath = (libraryPath as NSString).appendingPathComponent("Caches/com_tencent_imsdk_log")
        let liteAVSDKClogFiles = getFilesFromDirectory(atPath: logPath, withExtension: ".clog")
        fileArray += liteAVSDKClogFiles
        let liteAVSDKXlogFiles = getFilesFromDirectory(atPath: logPath, withExtension: ".xlog")
        fileArray += liteAVSDKXlogFiles
        let imXlogFiles = getFilesFromDirectory(atPath: cachePath, withExtension: ".xlog")
        fileArray += imXlogFiles
        
        fileModelArray = fileArray
        console.log("LogUpload, fileModelArray count:", fileModelArray.count)
        // 打印详细日志
//        printLogFile()
        return fileModelArray
    }
    
    private func printLogFile(){
        if fileModelArray.isEmpty {
           print("LogUpload: fileModelArray 为空，未找到任何日志文件")
        } else {
           print("LogUpload: fileModelArray 共 \(fileModelArray.count) 个日志文件：")
            fileModelArray.enumerated().forEach { index, file in
               print("LogUpload: ：\(file.fileName)")
           }
        }
    }
    
    /// 解析日志文件夹
    private func getFilesFromDirectory(atPath path: String, withExtension fileExtension: String) -> [FileModel] {
        let fileManager = FileManager.default
        var files: [FileModel] = []

        do {
            let contents = try fileManager.contentsOfDirectory(atPath: path)
            for fileName in contents {
               if fileName.hasSuffix(fileExtension) {
                   let filePath = (path as NSString).appendingPathComponent(fileName)
                   let file = FileModel(fileName: fileName, filePath: filePath)
                   files.append(file)
               }
            }
        } catch {
           print("Error: \(error.localizedDescription)")
        }

        return files
    }
    
    /// 获取 iOS 分享面板
    private func getCurrentWindowViewController() -> UIViewController? {
        var keyWindow: UIWindow?
        for window in UIApplication.shared.windows {
            if window.isMember(of: UIWindow.self), window.isKeyWindow {
                keyWindow = window
                break
            }
        }
        guard let rootController = keyWindow?.rootViewController else {
            return nil
        }
        func findCurrentController(from vc: UIViewController?) -> UIViewController? {
            if let nav = vc as? UINavigationController {
                return findCurrentController(from: nav.topViewController)
            } else if let tabBar = vc as? UITabBarController {
                return findCurrentController(from: tabBar.selectedViewController)
            } else if let presented = vc?.presentedViewController {
                return findCurrentController(from: presented)
            }
            return vc
        }
        let viewController = findCurrentController(from: rootController)
        return viewController
    }
}
