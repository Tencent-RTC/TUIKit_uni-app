package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import androidx.constraintlayout.widget.ConstraintLayout
import com.google.gson.Gson
import io.dcloud.uts.console
import io.trtc.tuikit.atomicxcore.api.device.NetworkQuality
import io.trtc.tuikit.atomicxcore.api.view.CallCoreView
import io.trtc.tuikit.atomicxcore.api.view.CallLayoutTemplate
import io.trtc.tuikit.atomicxcore.api.view.VolumeLevel

private const val TAG = "UTS-CallRenderView: "

class CallRenderView(
  context: Context,
  attrs: AttributeSet? = null,
) : ConstraintLayout(context, attrs) {
  private var nativeCallCoreView: CallCoreView? = null

  private var cachedLayoutTemplate: CallLayoutTemplate = CallLayoutTemplate.Grid
  private var cachedWaitingAnimation: String = ""
  private var cachedVolumeLevelIcons: Map<VolumeLevel, String> = mapOf()
  private var cachedNetworkQualityIcons: Map<NetworkQuality, String> = mapOf()
  private var cachedParticipantAvatars: Map<String, String> = mapOf()
  private var isNativeViewInitialized = false

  private val gson = Gson()

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    Log.w(TAG, "onAttachedToWindow")
    console.log("$TAG onAttachedToWindow")

    initializeView()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    Log.w(TAG, "onDetachedFromWindow")
    console.log("$TAG onDetachedFromWindow")

    nativeCallCoreView = null
    isNativeViewInitialized = false
  }

  fun setLayoutTemplate(layoutTemplate: Any?) {
    console.warn("$TAG setLayoutTemplate:", layoutTemplate)
    Logger.i(TAG + "setLayoutTemplate: $layoutTemplate")

    if (layoutTemplate !is String) {
      return
    }

    cachedLayoutTemplate =
      when (layoutTemplate) {
        "Float" -> CallLayoutTemplate.Float
        "Grid" -> CallLayoutTemplate.Grid
        "Pip" -> CallLayoutTemplate.Pip
        else -> CallLayoutTemplate.Grid
      }

    nativeCallCoreView?.setLayoutTemplate(cachedLayoutTemplate)
  }

  fun setWaitingAnimation(animationPath: Any?) {
    console.warn("$TAG setWaitingAnimation:", animationPath)
    Logger.i(TAG + "setWaitingAnimation: $animationPath")

    if (animationPath !is String) {
      return
    }
    cachedWaitingAnimation = animationPath
    nativeCallCoreView?.setWaitingAnimation(cachedWaitingAnimation)
  }

  fun setVolumeLevelIcons(icons: Any?) {
    console.warn("$TAG setVolumeLevelIcons:", icons)
    Logger.i(TAG + "setVolumeLevelIcons: $icons")

    if (icons !is String) {
      return
    }

    try {
      val mapData = gson.fromJson<MutableMap<String, String?>>(icons.toString(), MutableMap::class.java)
      if (mapData == null) {
        console.error("$TAG Failed to convert icons to Map")
        Logger.e(TAG + "Failed to convert icons to Map")
        return
      }

      val volumeIconMap = mutableMapOf<VolumeLevel, String>()
      mapData.forEach { (key, value) ->
        if (value is String) {
          val volumeLevel =
            when (key) {
              "Mute" -> VolumeLevel.Mute
              "Low" -> VolumeLevel.Low
              "Medium" -> VolumeLevel.Medium
              "High" -> VolumeLevel.High
              "Peak" -> VolumeLevel.Peak
              else -> null
            }
          if (volumeLevel != null) {
            volumeIconMap[volumeLevel] = value
          }
        }
      }

      cachedVolumeLevelIcons = volumeIconMap
      nativeCallCoreView?.setVolumeLevelIcons(cachedVolumeLevelIcons)
    } catch (e: Exception) {
      console.error("$TAG setVolumeLevelIcons failed:", e.message)
      Logger.e(TAG + "setVolumeLevelIcons failed: ${e.message}")
    }
  }

  fun setNetworkQualityIcons(icons: Any?) {
    console.warn("$TAG setNetworkQualityIcons:", icons)
    Logger.i(TAG + "setNetworkQualityIcons: $icons")

    if (icons !is String) {
      return
    }

    try {
      val mapData = gson.fromJson<MutableMap<String, String?>>(icons.toString(), MutableMap::class.java)
      if (mapData == null) {
        console.error("$TAG Failed to convert icons to Map")
        Logger.e(TAG + "Failed to convert icons to Map")
        return
      }

      val networkIconMap = mutableMapOf<NetworkQuality, String>()
      mapData.forEach { (key, value) ->
        if (value is String) {
          val networkQuality =
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
          if (networkQuality != null) {
            networkIconMap[networkQuality] = value
          }
        }
      }

      cachedNetworkQualityIcons = networkIconMap
      nativeCallCoreView?.setNetworkQualityIcons(cachedNetworkQualityIcons)
    } catch (e: Exception) {
      console.error("$TAG setNetworkQualityIcons failed:", e.message)
      Logger.e(TAG + "setNetworkQualityIcons failed: ${e.message}")
    }
  }

  fun setParticipantAvatars(avatars: Any) {
    console.warn("$TAG setParticipantAvatars: ", avatars)
    Logger.i(TAG + "setParticipantAvatars: $avatars")

    if (avatars !is String) {
      return
    }

    try {
      val mapData = gson.fromJson<MutableMap<String, String?>>(avatars.toString(), MutableMap::class.java)
      if (mapData == null) {
        console.error("$TAG Failed to convert avatars to Map")
        Logger.e(TAG + "Failed to convert avatars to Map")
        return
      }

      val avatarMap = mutableMapOf<String, String>()

      mapData.forEach { (key, value) ->
        if (value is String) {
          avatarMap[key] = value
        }
      }

      console.log("$TAG avatar:$avatarMap")
      Logger.i(TAG + "avatar: $avatarMap")

      cachedParticipantAvatars = avatarMap
      nativeCallCoreView?.setParticipantAvatars(cachedParticipantAvatars)
    } catch (e: Exception) {
      console.error("$TAG setParticipantAvatars failed:", e.message)
      Logger.e(TAG + "setParticipantAvatars failed: ${e.message}")
      e.printStackTrace()
    }
  }

  private fun initializeView() {
    if (isNativeViewInitialized) {
      console.warn("$TAG initializeView: already initialized")
      Logger.w(TAG + "initializeView: already initialized")
      return
    }
    console.warn("$TAG initializeView")
    Logger.i(TAG + "initializeView")
    removeAllViews()

    val nativeView = CallCoreView(context, null, 0)
    nativeView.setLayoutTemplate(cachedLayoutTemplate)
    if (cachedWaitingAnimation.isNotEmpty()) {
      nativeView.setWaitingAnimation(cachedWaitingAnimation)
    }

    if (cachedVolumeLevelIcons.isNotEmpty()) {
      nativeView.setVolumeLevelIcons(cachedVolumeLevelIcons)
    }

    if (cachedNetworkQualityIcons.isNotEmpty()) {
      nativeView.setNetworkQualityIcons(cachedNetworkQualityIcons)
    }

    if (cachedParticipantAvatars.isNotEmpty()) {
      nativeView.setParticipantAvatars(cachedParticipantAvatars)
    }

    val layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(nativeView, layoutParams)
    nativeCallCoreView = nativeView
    isNativeViewInitialized = true
  }
}
