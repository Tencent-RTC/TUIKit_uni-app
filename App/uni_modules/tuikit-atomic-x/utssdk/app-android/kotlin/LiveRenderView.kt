package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewOutlineProvider
import androidx.constraintlayout.widget.ConstraintLayout
import io.dcloud.uts.console
import io.trtc.tuikit.atomicxcore.api.view.CoreViewType
import io.trtc.tuikit.atomicxcore.api.view.LiveCoreView

private const val TAG = "UTS-LiveRenderView: "

class LiveRenderView(context: Context, attrs: AttributeSet? = null) : ConstraintLayout(context, attrs) {
    private var cornerRadius: Float = 48f // 圆角半径
    private var nativeViewType = CoreViewType.PLAY_VIEW

    init {
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, cornerRadius)
            }
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        outlineProvider.getOutline(this, Outline())
        invalidateOutline()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        Log.w(TAG, "onAttachedToWindow")
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        Log.w(TAG, "onDetachedFromWindow")
    }

    public fun updateViewType(viewType: Any) {
        if (viewType == null) {
            return
        }
        if (viewType !is String) {
            return
        }
        if (viewType == "PUSH_VIEW") {
            nativeViewType = CoreViewType.PUSH_VIEW
        }
    }

    public fun updateRenderView(liveID: Any) {
        console.warn("StreamView, updateRenderView liveID: ", liveID, nativeViewType)
        Logger.i(TAG + "updateRenderView: liveID:" + liveID + ", viewType: " + nativeViewType)
        if (liveID == null) {
            console.error("StreamView, updateRenderView liveID is invalid")
            Logger.e(TAG + "updateRenderView: liveID is invalid")
            return
        }
        if (liveID !is String) {
            console.error("StreamView, updateRenderView liveID is not String")
            Logger.e(TAG + "updateRenderView: liveID is not String")
            return
        }
        
        if(liveID.isEmpty()) {
            console.error("StreamView, updateRenderView liveID is empty")
            Logger.e(TAG + "updateRenderView: liveID is empty")
            return
        }
        removeAllViews()
        val renderView = LiveCoreView(context, null, 0, nativeViewType)
        renderView.setLiveId(liveID)
        val lp = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(renderView, lp)
    }
}
