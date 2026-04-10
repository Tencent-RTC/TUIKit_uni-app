import AudioToolbox
import DCloudUTSFoundation
import UIKit

class VibratorFeature: NSObject {

    private static let TAG = "UTS-VibratorFeature: "
    private static var isVibrating = false
    private static var vibrationTimer: Timer?
    private static let vibrationInterval = 1.0
    private static let vibrationQueue = DispatchQueue(label: "com.vibrator.feature.queue")

    private static let kSystemSoundID_Vibrate: SystemSoundID = 1352

    public static func startVibrating() {
        vibrationQueue.async {
            console.log(TAG, "startVibrating isVibrating: ", isVibrating)

            guard !isVibrating else {
                return
            }

            guard isVibrationSupported() else {
                console.log(TAG, "Device does not support vibration")
                return
            }

            isVibrating = true
            startVibrationTimer()
        }
    }

    public static func stopVibrating() {
        vibrationQueue.async {
            console.log(TAG, "stopVibrating called")
            isVibrating = false
            stopVibrationTimer()
        }
    }

    private static func startVibrationTimer() {
        stopVibrationTimer()

        DispatchQueue.main.async {
            vibrationTimer = Timer.scheduledTimer(
                withTimeInterval: vibrationInterval, repeats: true
            ) { timer in
                guard isVibrating else {
                    timer.invalidate()
                    return
                }
                AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            }

            if let timer = vibrationTimer {
                RunLoop.current.add(timer, forMode: .common)
            }
        }
    }

    private static func stopVibrationTimer() {
        DispatchQueue.main.async {
            vibrationTimer?.invalidate()
            vibrationTimer = nil
        }
    }

    private static func isVibrationSupported() -> Bool {
        let model = UIDevice.current.model
        return model.contains("iPhone")
    }
}
