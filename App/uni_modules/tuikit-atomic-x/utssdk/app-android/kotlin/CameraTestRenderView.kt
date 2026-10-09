package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import io.trtc.tuikit.atomicxcore.api.view.CameraView
import io.trtc.tuikit.atomicxcore.hybridapi.api.CameraTestViewManager

/**
 * Camera test preview view (native).
 *
 * Hosts a [CameraView] used for camera device testing. When attached to window it registers
 * its inner [CameraView] into [CameraTestViewManager] keyed by `viewID`, so the hybrid
 * `startCameraTest` API can resolve the real view from the string identifier passed by JS.
 * On detach it unregisters to avoid leaking a stale view reference.
 *
 * Supports rounded corners via [setCornerRadius] because a native view is NOT clipped by the
 * parent's CSS `overflow:hidden` + `border-radius` in nvue; the corner clipping must be applied
 * on the native view itself.
 */
class CameraTestRenderView(
    context: Context,
    attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {

    private var cachedViewID: String = ""
    private var cameraView: CameraView? = null
    private var isAttached = false
    private var cornerRadiusPx: Float = 0f

    init {
        // Enable outline-based clipping so child camera view is clipped to the rounded bounds.
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
            }
        }
        clipToOutline = true
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isAttached = true
        tryInitializeView()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        isAttached = false
        unregisterView()
        removeAllViews()
        cameraView = null
    }

    fun setViewID(viewID: Any?) {
        if (viewID !is String) return
        if (cachedViewID == viewID) return
        // Unregister the previous identifier before switching to the new one.
        unregisterView()
        cachedViewID = viewID
        tryInitializeView()
    }

    /**
     * Set corner radius (in dp) for the preview view. The value comes from the vue layer,
     * defaults to 0 (no rounding).
     */
    fun setCornerRadius(radius: Any?) {
        val dp: Float = when (radius) {
            is Number -> radius.toFloat()
            is String -> radius.toFloatOrNull() ?: 0f
            else -> 0f
        }
        cornerRadiusPx = TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics
        )
        invalidateOutline()
    }

    private fun tryInitializeView() {
        if (!isAttached) return
        if (cachedViewID.isEmpty()) return

        if (cameraView == null) {
            val view = CameraView(context)
            val layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            addView(view, layoutParams)
            cameraView = view
        }

        cameraView?.let {
            CameraTestViewManager.register(cachedViewID, it)
        }
    }

    private fun unregisterView() {
        if (cachedViewID.isNotEmpty()) {
            CameraTestViewManager.unregister(cachedViewID)
        }
    }
}
