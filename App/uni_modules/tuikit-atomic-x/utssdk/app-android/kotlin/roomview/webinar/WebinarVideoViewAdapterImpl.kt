package uts.sdk.modules.atomicx.kotlin.roomview.webinar

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.view.View.GONE
import android.view.View.VISIBLE
import android.widget.ImageView
import android.widget.FrameLayout
import androidx.constraintlayout.utils.widget.ImageFilterView
import uts.sdk.modules.atomicx.kotlin.roomview.RoomImageLoader
import uts.sdk.modules.atomicx.kotlin.roomview.RoomViewLogger
import uts.sdk.modules.atomicx.kotlin.roomview.RoomViewIcons
import uts.sdk.modules.atomicx.kotlin.roomview.dpToPx
import io.trtc.tuikit.atomicxcore.api.device.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant
import java.lang.ref.WeakReference

class WebinarVideoViewAdapterImpl(context: Context) : WebinarRoomView.VideoViewAdapter {
    private val logger = RoomViewLogger.getLogger("WebinarVideoViewAdapterImpl")

    private val weakContext = WeakReference(context)

    /**
     * Drawable resources injected from outside. The webinar widget view only needs
     * `defaultAvatar` so we read that single field. Left as 0 means "no avatar drawable",
     * in which case `setImageResource` is skipped entirely.
     */
    private var icons: RoomViewIcons = RoomViewIcons()

    /**
     * Inject (or replace) drawable resources used when building widget views.
     * Only affects widget views created *after* this call -- pre-existing widget
     * views (already returned via [createWidgetView]) are not retroactively updated,
     * which is acceptable because [WebinarRoomView] recreates widget views on seat
     * list changes anyway.
     */
    fun setIcons(icons: RoomViewIcons) {
        this.icons = icons
    }

    override fun createWidgetView(participant: RoomParticipant): View? {
        val context = weakContext.get() ?: return null

        // Webinar widget view structure:
        //   - root: FrameLayout, match_parent, background #181A1E (video_view_bg)
        //   - child: ImageFilterView 64x64dp, centered, circular (round=32dp),
        //            default avatar drawable.
        // Building the view in code avoids depending on host-side `R.layout` / `R.id`,
        // so the whole roomview package stays self-contained.
        val widgetView = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#181A1E"))
        }

        val avatarSizePx = context.dpToPx(64)
        val avatarPlaceholder = ImageFilterView(context).apply {
            id = View.generateViewId()
            scaleType = ImageView.ScaleType.CENTER_CROP
            round = context.dpToPx(32).toFloat()
            // Drawable? takes precedence; fall back to @DrawableRes Int.
            when {
                icons.defaultAvatarDrawable != null -> setImageDrawable(icons.defaultAvatarDrawable)
                icons.defaultAvatar != 0 -> setImageResource(icons.defaultAvatar)
            }
            layoutParams = FrameLayout.LayoutParams(avatarSizePx, avatarSizePx).apply {
                gravity = Gravity.CENTER
            }
        }
        widgetView.addView(avatarPlaceholder)
        widgetView.tag = avatarPlaceholder // remember placeholder for later updates

        logger.info("createWidgetView:userID:${participant.userID}, cameraStatus:${participant.cameraStatus}")
        if (participant.cameraStatus == DeviceStatus.OFF) {
            loadAvatar(context, avatarPlaceholder, participant)
            widgetView.visibility = VISIBLE
        } else {
            widgetView.visibility = GONE
        }
        return widgetView
    }

    private fun loadAvatar(
        context: Context,
        avatarPlaceholder: ImageFilterView,
        participant: RoomParticipant
    ) {
        val defaultDrawable = icons.defaultAvatarDrawable
        val defaultAvatar = icons.defaultAvatar
        if (participant.avatarURL.isEmpty()) {
            when {
                defaultDrawable != null -> avatarPlaceholder.setImageDrawable(defaultDrawable)
                defaultAvatar != 0 -> avatarPlaceholder.setImageResource(defaultAvatar)
            }
        } else {
            // RoomImageLoader currently accepts only @DrawableRes Int as placeholder.
            // Pre-apply Drawable? as placeholder so something is visible while Glide loads.
            if (defaultDrawable != null) {
                avatarPlaceholder.setImageDrawable(defaultDrawable)
            }
            RoomImageLoader.load(
                context,
                avatarPlaceholder,
                participant.avatarURL,
                defaultAvatar
            )
        }
    }
}
