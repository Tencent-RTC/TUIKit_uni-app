package uts.sdk.modules.uiComponent.kotlin

import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewOutlineProvider
import androidx.constraintlayout.widget.ConstraintLayout
import com.tencent.cloud.uikit.state.common.Logger
import com.tencent.cloud.uikit.state.view.V2LiveRenderView
import io.dcloud.uts.console

private const val TAG = "UTS-V2LiveRenderView: "

class LiveRenderView(context: Context, attrs: AttributeSet? = null) : ConstraintLayout(context, attrs) {

    private var cornerRadius: Float = 48f // 圆角半径

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

    public fun updateRenderView(liveId: Any) {
        console.warn("StreamView, updateRenderView liveId: ", liveId)
        Logger.i(TAG + "updateRenderView: liveId: $liveId")
        if (liveId == null) {
            console.error("StreamView, updateRenderView liveId is empty")
            Logger.e(TAG + "updateRenderView: liveId is empty")
            return
        }
        if (liveId !is String) {
            console.error("StreamView, updateRenderView liveId is not String")
            Logger.e(TAG + "updateRenderView: liveId is not String")
            return
        }
        removeAllViews()
        val renderView = V2LiveRenderView(context, liveId)
        val lp = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(renderView, lp)
    }
}