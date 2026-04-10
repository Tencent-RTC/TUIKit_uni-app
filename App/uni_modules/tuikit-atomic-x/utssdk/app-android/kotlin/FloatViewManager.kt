package uts.sdk.modules.atomicx.kotlin

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.view.ViewGroup.LayoutParams
import com.google.gson.Gson
import com.tencent.qcloud.tuicore.permission.PermissionRequester
import com.trtc.tuikit.common.ui.floatwindow.FloatWindowManager
import com.trtc.tuikit.common.ui.floatwindow.FloatWindowObserver
import io.dcloud.uts.console
import io.trtc.tuikit.atomicxcore.api.device.NetworkQuality
import io.trtc.tuikit.atomicxcore.api.view.CallCoreView
import io.trtc.tuikit.atomicxcore.api.view.CallLayoutTemplate
import io.trtc.tuikit.atomicxcore.api.view.VolumeLevel
import org.json.JSONObject

object FloatViewManager {
  private const val TAG = "UTS-FloatViewManager: "

  private var floatClickCallback: (() -> Unit)? = null
  private val clickObserver =
    object : FloatWindowObserver() {
      override fun onFloatWindowClick() {
        Logger.i(TAG + "onFloatWindowClick")
        floatClickCallback?.invoke()
      }
    }

  fun addFloatViewListener(callback: () -> Unit) {
    floatClickCallback = callback
    FloatWindowManager.sharedInstance().addObserver(clickObserver)
  }

  fun removeFloatViewListener() {
    FloatWindowManager.sharedInstance().removeObserver(clickObserver)
    floatClickCallback = null
  }

  fun startFloatView(
    context: Context,
    options: String,
    callback: (Int, String) -> Unit,
  ) {
    // 检查是否已经有悬浮窗显示
    if (FloatWindowManager.sharedInstance().isShowing) {
      Logger.w(TAG + "There is already a floatWindow on display, do not open it again.")
      return
    }

    // 检查悬浮窗权限
    if (PermissionRequester.newInstance(PermissionRequester.FLOAT_PERMISSION).has()) {
      console.log(TAG, "Float window started, options: ", options)
      Logger.i(TAG + "Float window started, options: $options")
      val callCoreView = CallCoreView(context)
      callCoreView.setLayoutTemplate(CallLayoutTemplate.Pip)
      applyOptions(callCoreView, options)

      val floatWidth = dip2px(context, 120f)
      val floatHeight = dip2px(context, 180f)

      val lp = LayoutParams(floatWidth, floatHeight)
      callCoreView.layoutParams = lp
      // 显示悬浮窗
      FloatWindowManager.sharedInstance().show(callCoreView)
      callback(0, "show FloatWindow success")
    } else {
      callback(-1, "Float window permission not granted, requesting permission")
      // 请求悬浮窗权限
      PermissionRequester.newInstance(PermissionRequester.FLOAT_PERMISSION).request()
      Logger.w(TAG + "Float window permission not granted, requesting permission")
    }
  }

  fun stopFloatView(context: Context) {
    FloatWindowManager.sharedInstance().dismiss()
    Logger.i(TAG + "Call float window stopped")
    if (!isAppInForeground(context)) {
      bringUniAppToForeground(context)
    }
  }

  private fun applyOptions(
    callCoreView: CallCoreView,
    options: String,
  ) {
    if (options.isBlank()) return
    val gson = Gson()
    try {
      val json = JSONObject(options)

      // waitingAnimation
      if (json.has("waitingAnimation")) {
        val path = json.getString("waitingAnimation")
        if (path.isNotEmpty()) {
          callCoreView.setWaitingAnimation(path)
        }
      }

      // avatars: Map<String, String>
      if (json.has("avatars")) {
        val mapData =
          gson.fromJson<MutableMap<String, String?>>(
            json.getString("avatars"),
            MutableMap::class.java,
          )
        val avatarMap = mutableMapOf<String, String>()
        mapData?.forEach { (key, value) -> if (value != null) avatarMap[key] = value }
        if (avatarMap.isNotEmpty()) callCoreView.setParticipantAvatars(avatarMap)
      }

      // volumeLevelIcon: Map<VolumeLevel, String>
      if (json.has("volumeLevelIcon")) {
        val mapData =
          gson.fromJson<MutableMap<String, String?>>(
            json.getString("volumeLevelIcon"),
            MutableMap::class.java,
          )
        val volumeIconMap = mutableMapOf<VolumeLevel, String>()
        mapData?.forEach { (key, value) ->
          if (value != null) {
            val level =
              when (key) {
                "Mute" -> VolumeLevel.Mute
                "Low" -> VolumeLevel.Low
                "Medium" -> VolumeLevel.Medium
                "High" -> VolumeLevel.High
                "Peak" -> VolumeLevel.Peak
                else -> null
              }
            if (level != null) volumeIconMap[level] = value
          }
        }
        if (volumeIconMap.isNotEmpty()) callCoreView.setVolumeLevelIcons(volumeIconMap)
      }

      // networkQualityIcon: Map<NetworkQuality, String>
      if (json.has("networkQualityIcon")) {
        val mapData =
          gson.fromJson<MutableMap<String, String?>>(
            json.getString("networkQualityIcon"),
            MutableMap::class.java,
          )
        val networkIconMap = mutableMapOf<NetworkQuality, String>()
        mapData?.forEach { (key, value) ->
          if (value != null) {
            val quality =
              when (key) {
                "UNKNOWN" -> NetworkQuality.UNKNOWN
                "EXCELLENT" -> NetworkQuality.EXCELLENT
                "GOOD" -> NetworkQuality.GOOD
                "POOR" -> NetworkQuality.POOR
                "BAD" -> NetworkQuality.BAD
                "VERY_BAD" -> NetworkQuality.VERY_BAD
                "DOWN" -> NetworkQuality.DOWN
                else -> null
              }
            if (quality != null) networkIconMap[quality] = value
          }
        }
        if (networkIconMap.isNotEmpty()) callCoreView.setNetworkQualityIcons(networkIconMap)
      }
    } catch (e: Exception) {
      Logger.w(TAG + "applyOptions failed: ${e.message}")
    }
  }

  private fun isAppInForeground(context: Context): Boolean {
    val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val runningAppProcessInfos = activityManager?.runningAppProcesses ?: return false
    val packageName = context.packageName
    for (appProcessInfo in runningAppProcessInfos) {
      if (appProcessInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND &&
        appProcessInfo.processName == packageName
      ) {
        return true
      }
    }
    return false
  }

  private fun bringUniAppToForeground(context: Context) {
    try {
      val activity = io.dcloud.uts.UTSAndroid.getUniActivity()
      if (activity != null) {
        val intent = Intent(context, activity.javaClass)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        context.startActivity(intent)
      } else {
        // 降级：通过包名+类名启动
        val intent =
          Intent().apply {
            setClassName(context.packageName, "io.dcloud.PandoraEntry")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
          }
        context.startActivity(intent)
      }
      Logger.i(TAG + "Wake up UNI app to foreground")
    } catch (e: Exception) {
      Logger.e(TAG + "Failed to wake up UNI app: ${e.message}")
    }
  }

  private fun dip2px(
    context: Context,
    dpValue: Float,
  ): Int {
    val scale = context.resources?.displayMetrics?.density ?: 1.0f
    return (dpValue * scale + 0.5f).toInt()
  }
}
