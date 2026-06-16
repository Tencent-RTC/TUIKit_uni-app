package uts.sdk.modules.atomicx.kotlin.roomview

import android.content.Context
import android.util.AttributeSet
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import androidx.constraintlayout.widget.ConstraintLayout
import uts.sdk.modules.atomicx.kotlin.roomview.webinar.WebinarRoomView
import uts.sdk.modules.atomicx.kotlin.roomview.webinar.WebinarVideoViewAdapterImpl
import io.trtc.tuikit.atomicxcore.api.room.RoomType

/**
 * Main room view component displaying video grid.
 * Manages video rendering, layout strategies, and participant interactions in the room.
 *
 * This class is intentionally resource-agnostic: drawable resources used inside the
 * underlying [StandardRoomView] / [WebinarRoomView] are provided by the caller via
 * the `icons` parameter of [init]. This keeps the whole `view.main` package free of
 * references to host-side `R.drawable.*`, so the package can be reused across
 * different resource pipelines (host `R`, plugin assets, etc.).
 */
class RoomView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
    ConstraintLayout(context, attrs, defStyleAttr) {

    /**
     * Bind this view to a room.
     *
     * @param roomID   target room id.
     * @param roomType room layout variant (standard / webinar).
     * @param icons    drawable resources to render inside the room view. Any resource
     *                 left as `0` in [RoomViewIcons] is silently skipped.
     */
    fun init(roomID: String, roomType: RoomType, icons: RoomViewIcons) {
        removeAllViews()
        val rootView = when (roomType) {
            RoomType.WEBINAR -> WebinarRoomView(context).apply {
                setIcons(icons)
                init(roomID)
                val adapter = WebinarVideoViewAdapterImpl(context)
                setVideoViewAdapter(adapter)
            }

            RoomType.STANDARD -> StandardRoomView(context).apply {
                setIcons(icons)
                init(roomID)
            }
        }
        val params = LayoutParams(MATCH_PARENT, MATCH_PARENT).apply {
            startToStart = LayoutParams.PARENT_ID
            endToEnd = LayoutParams.PARENT_ID
            topToTop = LayoutParams.PARENT_ID
        }
        addView(rootView, params)
    }
}
