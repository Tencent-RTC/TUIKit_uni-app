import Foundation
import UIKit
import Photos
import PhotosUI

@objc public class SystemImagePicker: NSObject {
    public static let shared = SystemImagePicker()
    
    private var successCallback: ((String) -> Void)?
    private var cancelCallback: (() -> Void)?
    
    public func pickSingleImage(
        onSuccess: @escaping (String) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.successCallback = onSuccess
        self.cancelCallback = onCancel
        
        DispatchQueue.main.async {
            guard let topVC = self.getTopViewController() else {
                onCancel()
                self.successCallback = nil
                self.cancelCallback = nil
                return
            }
            
            if #available(iOS 14, *) {
                self.pickFromPHPicker(presenter: topVC)
            } else {
                self.pickFromUIImagePicker(presenter: topVC)
            }
        }
    }
    
    private func getTopViewController() -> UIViewController? {
        var keyWindow: UIWindow?
        if #available(iOS 13.0, *) {
            keyWindow = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first(where: { $0.isKeyWindow })
        } else {
            keyWindow = UIApplication.shared.keyWindow
        }
        
        var topVC = keyWindow?.rootViewController
        while let presented = topVC?.presentedViewController {
            topVC = presented
        }
        return topVC
    }
    
    private func saveImageToTempFile(_ image: UIImage) -> String? {
        let fileName = UUID().uuidString + ".png"
        let tempDir = NSTemporaryDirectory()
        let filePath = (tempDir as NSString).appendingPathComponent(fileName)
        guard let data = image.pngData() else { return nil }
        do {
            try data.write(to: URL(fileURLWithPath: filePath))
            return filePath
        } catch {
            return nil
        }
    }
    
    private func handleResult(image: UIImage?) {
        guard let image = image else {
            cancelCallback?()
            successCallback = nil
            cancelCallback = nil
            return
        }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let path = self?.saveImageToTempFile(image)
            DispatchQueue.main.async {
                if let path = path {
                    self?.successCallback?(path)
                } else {
                    self?.cancelCallback?()
                }
                self?.successCallback = nil
                self?.cancelCallback = nil
            }
        }
    }
}

// MARK: - PHPickerViewController (iOS 14+)
@available(iOS 14, *)
extension SystemImagePicker: PHPickerViewControllerDelegate {
    fileprivate func pickFromPHPicker(presenter: UIViewController) {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        config.preferredAssetRepresentationMode = .current
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        picker.modalPresentationStyle = .fullScreen
        presenter.present(picker, animated: true)
    }
    
    public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        guard let first = results.first,
              first.itemProvider.canLoadObject(ofClass: UIImage.self) else {
            picker.dismiss(animated: true) {
                self.handleResult(image: nil)
            }
            return
        }
        
        first.itemProvider.loadObject(ofClass: UIImage.self) { [weak self] object, _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                picker.dismiss(animated: false) {
                    self.handleResult(image: object as? UIImage)
                }
            }
        }
    }
}

// MARK: - UIImagePickerController (iOS 13 and below)
extension SystemImagePicker: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    fileprivate func pickFromUIImagePicker(presenter: UIViewController) {
        let picker = UIImagePickerController()
        picker.sourceType = .photoLibrary
        picker.mediaTypes = ["public.image"]
        picker.delegate = self
        picker.modalPresentationStyle = .fullScreen
        presenter.present(picker, animated: true)
    }
    
    public func imagePickerController(_ picker: UIImagePickerController,
                               didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        let resultImage = info[.originalImage] as? UIImage
        picker.dismiss(animated: false) {
            self.handleResult(image: resultImage)
        }
    }
    
    public func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true) {
            self.handleResult(image: nil)
        }
    }
}
