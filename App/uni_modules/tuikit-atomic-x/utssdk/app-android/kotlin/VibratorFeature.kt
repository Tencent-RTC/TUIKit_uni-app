package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.tencent.qcloud.tuicore.util.TUIBuild
import kotlinx.coroutines.MainScope

class VibratorFeature private constructor(
  context: Context,
) {
  companion object {
    private var instance: VibratorFeature? = null

    fun getInstance(context: Context): VibratorFeature =
      instance ?: synchronized(this) {
        instance ?: VibratorFeature(context).also { instance = it }
      }
  }

  private val scope = MainScope()
  private val context: Context = context.applicationContext
  private val vibrator: Vibrator
  private var isVibrating = false

  init {
    if (TUIBuild.getVersionInt() >= Build.VERSION_CODES.S) {
      val vibratorManager = this.context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      vibrator = vibratorManager.defaultVibrator
    } else {
      vibrator = this.context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }

  fun startVibrating() {
    if (vibrator.hasVibrator()) {
      val pattern = longArrayOf(0, 500, 1500)
      isVibrating = true
      if (TUIBuild.getVersionInt() >= Build.VERSION_CODES.O) {
        val vibrationEffect = VibrationEffect.createWaveform(pattern, 1)
        vibrator.vibrate(vibrationEffect)
      } else {
        vibrator.vibrate(pattern, 1)
      }
    }
  }

  fun stopVibrating() {
    if (isVibrating) {
      vibrator.cancel()
    }
    isVibrating = false
  }
}
