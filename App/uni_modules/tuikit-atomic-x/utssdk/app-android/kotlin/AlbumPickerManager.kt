package uts.sdk.modules.atomicx.kotlin

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.findViewTreeSavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.google.gson.Gson
import io.dcloud.uts.console
import io.trtc.tuikit.atomicx.albumpicker.AlbumMedia
import io.trtc.tuikit.atomicx.albumpicker.AlbumMediaType
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerConfig
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerCompressQuality
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerLanguage
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerListener
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerMediaFilter
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerStyle
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerTheme
import io.trtc.tuikit.atomicx.albumpicker.AlbumPickerView

private const val TAG = "UTS-AlbumPickerManager: "

/**
 * Session-specific callbacks storage
 */
private data class SessionCallbacks(
    val onPickConfirm: (String) -> Unit,
    val onMediaProcessing: (String) -> Unit,
    val onMediaProcessed: () -> Unit,
    val onCancel: () -> Unit
)

class AlbumPickerManager private constructor() {

    companion object {
        val shared = AlbumPickerManager()
        private const val OVERLAY_TAG = "AlbumPickerOverlay"
        private const val ANIM_DURATION = 300L
    }

    private var overlayContainer: FrameLayout? = null
    private var pickerView: AlbumPickerView? = null
    private var hostActivity: Activity? = null
    private val gson = Gson()

    /**
     * CRITICAL FIX: Per-session callbacks instead of single instance
     * Maps: sessionId -> SessionCallbacks
     * This prevents callback overwrites when multiple pickers are open simultaneously
     */
    private val sessionCallbacks = mutableMapOf<String, SessionCallbacks>()
    private var currentSessionId: String? = null

    private val mainHandler = Handler(Looper.getMainLooper())

    /**
     * Show album picker with session isolation
     * @param sessionId - Unique identifier for this picker session
     */
    fun show(
        configJSON: String,
        themeJSON: String,
        sessionId: String,
        activity: Activity,
        onPickConfirm: (String) -> Unit,
        onMediaProcessing: (String) -> Unit,
        onMediaProcessed: () -> Unit,
        onCancel: () -> Unit
    ) {
        console.log("$TAG show called with sessionId: $sessionId")
        Log.i(TAG, "show called with sessionId: $sessionId")

        // Store callbacks with session ID
        this.sessionCallbacks[sessionId] = SessionCallbacks(
            onPickConfirm,
            onMediaProcessing,
            onMediaProcessed,
            onCancel
        )
        this.currentSessionId = sessionId
        this.hostActivity = activity

        // All UI operations must run on the main thread
        mainHandler.post {
            // Remove existing overlay if any
            removeOverlay()

            val decorView = activity.window.decorView as? ViewGroup ?: run {
                console.error("$TAG decorView is null")
                return@post
            }

            // Create a fullscreen overlay container that intercepts BACK key
            // PandoraEntryActivity doesn't forward onBackPressed to OnBackPressedDispatcher,
            // so we intercept the key event here and dispatch it manually.
            val container = object : FrameLayout(activity) {
                override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                    if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                        Log.i(TAG, "BACK key intercepted, forwarding to OnBackPressedDispatcher")
                        (activity as? ComponentActivity)?.onBackPressedDispatcher?.onBackPressed()
                        return true
                    }
                    return super.dispatchKeyEvent(event)
                }
            }
            container.isFocusableInTouchMode = true
            container.requestFocus()
            container.tag = OVERLAY_TAG
            container.setBackgroundColor(Color.BLACK)
            container.layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )

            // Propagate lifecycle from Activity's content view so that
            // findViewTreeLifecycleOwner() works inside AlbumPickerView
            val contentView = decorView.findViewById<View>(android.R.id.content)
            val lifecycleOwner = contentView?.findViewTreeLifecycleOwner()
            val savedStateOwner = contentView?.findViewTreeSavedStateRegistryOwner()
            if (lifecycleOwner != null) {
                container.setViewTreeLifecycleOwner(lifecycleOwner)
            }
            if (savedStateOwner != null) {
                container.setViewTreeSavedStateRegistryOwner(savedStateOwner)
            }

            // Create and configure the picker view
            val config = parseConfig(configJSON)
            val theme = parseTheme(themeJSON)

            val picker = AlbumPickerView(activity)

            val listener = object : AlbumPickerListener {
                override fun onPickConfirm(pickedAlbumMedias: List<AlbumMedia>, textMessage: String?) {
                    console.log("$TAG onPickConfirm, count: ${pickedAlbumMedias.size}")

                    val callbacks = sessionCallbacks[sessionId]
                    if (callbacks == null) {
                        console.error("$TAG onPickConfirm: sessionId not found")
                        return
                    }

                    mainHandler.post {
                        animateRemoveOverlay(null)
                    }

                    val serialized = pickedAlbumMedias.map { serializeAlbumMedia(it) }
                    val payload = mapOf(
                        "pickedAlbumMedias" to serialized,
                        "textMessage" to (textMessage ?: "")
                    )
                    val jsonStr = gson.toJson(payload)

                    callbacks.onPickConfirm(jsonStr)
                }

                override fun onMediaProcessing(albumMedia: AlbumMedia, progress: Float, error: Boolean) {
                    
                    val callbacks = sessionCallbacks[sessionId]
                    if (callbacks == null) {
                        console.error("$TAG onMediaProcessing: sessionId not found")
                        return
                    }
                    
                    val payload = mapOf(
                        "albumMedia" to serializeAlbumMedia(albumMedia),
                        "progress" to progress.toDouble(),
                        "error" to error
                    )
                    callbacks.onMediaProcessing(gson.toJson(payload))
                }

                override fun onMediaProcessed() {
                    console.log("$TAG onMediaProcessed")
                    
                    val callbacks = sessionCallbacks[sessionId]
                    if (callbacks == null) {
                        console.error("$TAG onMediaProcessed: sessionId not found")
                        return
                    }
                    
                    callbacks.onMediaProcessed()
                    cleanup(sessionId)
                }

                override fun onCancel() {
                    console.log("$TAG onCancel")

                    val callbacks = sessionCallbacks[sessionId]
                    if (callbacks == null) {
                        console.error("$TAG onCancel: sessionId not found")
                        return
                    }

                    mainHandler.post {
                        animateRemoveOverlay {
                            callbacks.onCancel()
                            cleanup(sessionId)
                        }
                    }
                }
            }

            picker.initialize(config, theme, listener)

            val pickerLayoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            container.addView(picker, pickerLayoutParams)

            // Add overlay to decorView on top of everything
            decorView.addView(container)

            // Slide-up entrance animation
            container.post {
                container.translationY = container.height.toFloat()
                container.animate()
                    .translationY(0f)
                    .setDuration(ANIM_DURATION)
                    .setInterpolator(DecelerateInterpolator())
                    .start()
            }

            this.overlayContainer = container
            this.pickerView = picker

            console.log("$TAG show: overlay added to decorView, sessionId: $sessionId")
            Log.i(TAG, "show: overlay added to decorView, sessionId: $sessionId")
        }
    }

    fun isShowing(): Boolean = overlayContainer != null

    fun handleBackPressed() {
        val activity = hostActivity ?: return
        (activity as? ComponentActivity)?.onBackPressedDispatcher?.onBackPressed()
    }

    private fun removeOverlay() {
        try {
            val container = overlayContainer ?: return
            (container.parent as? ViewGroup)?.removeView(container)
        } catch (e: Exception) {
            Log.e(TAG, "removeOverlay error", e)
        }
        overlayContainer = null
        pickerView = null
    }

    /**
     * Animate the overlay sliding down, then remove it and run onDone.
     * If no overlay exists, onDone runs immediately.
     */
    private fun animateRemoveOverlay(onDone: (() -> Unit)? = null) {
        val container = overlayContainer
        if (container == null) {
            onDone?.invoke()
            return
        }
        container.animate()
            .translationY(container.height.toFloat())
            .setDuration(ANIM_DURATION)
            .setInterpolator(DecelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    removeOverlay()
                    onDone?.invoke()
                }
            })
            .start()
    }

    /**
     * Clean up a specific session
     */
    private fun cleanup(sessionId: String) {
        sessionCallbacks.remove(sessionId)
        if (currentSessionId == sessionId) {
            removeOverlay()
            currentSessionId = null
        }
        console.log("$TAG cleanup done for sessionId: $sessionId")
        Log.i(TAG, "cleanup done for sessionId: $sessionId")
    }

    // region JSON Parsing

    private fun parseConfig(jsonStr: String): AlbumPickerConfig {
        val config = AlbumPickerConfig()
        try {
            val map = gson.fromJson<MutableMap<String, Any?>>(jsonStr, MutableMap::class.java) ?: return config

            (map["pickMode"] as? Number)?.toInt()?.let { pickMode ->
                config.mediaFilter = when (pickMode) {
                    0 -> AlbumPickerMediaFilter.IMAGE_ONLY
                    1 -> AlbumPickerMediaFilter.VIDEO_ONLY
                    2 -> AlbumPickerMediaFilter.ALL
                    else -> AlbumPickerMediaFilter.ALL
                }
            }

            (map["maxCount"] as? Number)?.toInt()?.let {
                config.maxSelectionCount = it
            }

            (map["gridCount"] as? Number)?.toInt()?.let {
                config.itemsPerRow = it
            }

            (map["showsCameraItem"] as? Boolean)?.let {
                config.showsCameraItem = it
            }

            (map["style"] as? Number)?.toInt()?.let { style ->
                config.style = when (style) {
                    0 -> AlbumPickerStyle.LIKE_WECHAT
                    1 -> AlbumPickerStyle.LIKE_WHATSAPP
                    else -> AlbumPickerStyle.LIKE_WECHAT
                }
            }

            (map["language"] as? Number)?.toInt()?.let { lang ->
                config.language = when (lang) {
                    0 -> AlbumPickerLanguage.SYSTEM
                    1 -> AlbumPickerLanguage.EN
                    2 -> AlbumPickerLanguage.ZH_HANS
                    3 -> AlbumPickerLanguage.ZH_HANT
                    4 -> AlbumPickerLanguage.AR
                    else -> AlbumPickerLanguage.SYSTEM
                }
            }

            (map["compressQuality"] as? Number)?.toInt()?.let { quality ->
                config.compressQuality = when (quality) {
                    0 -> AlbumPickerCompressQuality.STANDARD
                    1 -> AlbumPickerCompressQuality.HIGH
                    else -> AlbumPickerCompressQuality.STANDARD
                }
            }

            (map["maxVideoDurationInSeconds"] as? Number)?.toInt()?.let {
                config.maxVideoDurationInSeconds = it
            }

            (map["maxOutputFileSizeInMB"] as? Number)?.toInt()?.let {
                config.maxOutputFileSizeInMB = it
            }
        } catch (e: Exception) {
            console.error("$TAG parseConfig failed: ${e.message}")
            Log.e(TAG, "parseConfig failed", e)
        }
        return config
    }

    private fun parseTheme(jsonStr: String): AlbumPickerTheme {
        val theme = AlbumPickerTheme()
        try {
            val map = gson.fromJson<MutableMap<String, Any?>>(jsonStr, MutableMap::class.java) ?: return theme

            theme.currentPrimaryColor = parseColor(map["primaryColor"])
            theme.backgroundColor = parseColor(map["backgroundColor"])
            theme.backgroundColorSecondary = parseColor(map["backgroundColorSecondary"])
            theme.textColor = parseColor(map["textColor"])
            theme.textColorSecondary = parseColor(map["textColorSecondary"])

            (map["bigFontSize"] as? Number)?.toFloat()?.let { theme.bigFontSize = it }
            (map["normalFontSize"] as? Number)?.toFloat()?.let { theme.normalFontSize = it }
            (map["smallFontSize"] as? Number)?.toFloat()?.let { theme.smallFontSize = it }
            (map["bigRadius"] as? Number)?.toInt()?.let { theme.bigRadius = it }
            (map["normalRadius"] as? Number)?.toInt()?.let { theme.normalRadius = it }
            (map["smallRadius"] as? Number)?.toInt()?.let { theme.smallRadius = it }
        } catch (e: Exception) {
            console.error("$TAG parseTheme failed: ${e.message}")
            Log.e(TAG, "parseTheme failed", e)
        }
        return theme
    }

    private fun parseColor(value: Any?): Int? {
        val hexStr = value as? String ?: return null
        val hex = hexStr.replace("0x", "").replace("0X", "").replace("#", "")
        if (hex.length != 8) return null
        return try {
            java.lang.Long.parseLong(hex, 16).toInt()
        } catch (e: Exception) {
            null
        }
    }

    private fun serializeAlbumMedia(media: AlbumMedia): Map<String, Any?> {
        return mapOf(
            "id" to media.id.toLong(),
            "mediaType" to if (media.mediaType == AlbumMediaType.VIDEO) 1 else 0,
            "mediaPath" to (media.mediaPath ?: ""),
            "fileExtension" to "",
            "fileSize" to 0,
            "videoThumbnailPath" to media.videoThumbnailPath,
            "duration" to media.duration,
        )
    }

    // endregion
}
