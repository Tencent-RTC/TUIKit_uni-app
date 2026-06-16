package uts.sdk.modules.atomicx.kotlin.roomview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.constraintlayout.utils.widget.ImageFilterView
import io.trtc.tuikit.atomicxcore.api.device.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.room.ParticipantRole
import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant

/**
 * Overlay view displaying participant name, role icon, and microphone status on video items.
 *
 * Pure-code implementation (no XML inflation), so this view can be packaged into a closed-source
 * plugin without depending on R.layout resources.
 *
 * Hierarchy (single horizontal LinearLayout child filling this FrameLayout):
 *   [role icon] [mic status icon] [user name]
 */
class RoomVideoNameOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private companion object {
        // #AA22262E -- name overlay background
        private const val COLOR_OVERLAY_BG = 0xAA22262E.toInt()
        private const val OVERLAY_HEIGHT_DP = 24
        private const val OVERLAY_RADIUS_DP = 12
        private const val ROLE_ICON_SIZE_DP = 24
        private const val MIC_ICON_SIZE_DP = 14
        private const val MIC_ICON_MARGIN_START_DP = 8
        private const val NAME_PADDING_HORIZONTAL_DP = 8
        private const val NAME_TEXT_SIZE_SP = 12f
    }

    private val ivUserAvatar: ImageFilterView
    private val tvUserName: TextView
    private val ivMicStatus: ImageView

    /**
     * Drawable resources to render inside this overlay. Injected from the parent
     * [RoomVideoGridAdapter] (which in turn receives them from [StandardRoomView.setIcons]).
     * Any resource left as `0` is silently skipped to avoid `Resources$NotFoundException`.
     */
    private var icons: RoomViewIcons = RoomViewIcons()

    init {
        // Container row: role icon + mic + name
        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(OVERLAY_RADIUS_DP).toFloat()
                setColor(COLOR_OVERLAY_BG)
            }
            layoutParams = LayoutParams(
                LayoutParams.WRAP_CONTENT,
                dpToPx(OVERLAY_HEIGHT_DP)
            )
        }

        // Role icon (owner / admin)
        ivUserAvatar = ImageFilterView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            // 100% rounded -> circular
            roundPercent = 1f
            visibility = VISIBLE
            layoutParams = LinearLayout.LayoutParams(
                dpToPx(ROLE_ICON_SIZE_DP),
                dpToPx(ROLE_ICON_SIZE_DP)
            ).apply {
                gravity = Gravity.CENTER_VERTICAL
            }
        }

        // Microphone status icon. Image resource is supplied later via [setIcons] +
        // [updateParticipant]; init only sets layout & visibility.
        ivMicStatus = ImageView(context).apply {
            visibility = VISIBLE
            layoutParams = LinearLayout.LayoutParams(
                dpToPx(MIC_ICON_SIZE_DP),
                dpToPx(MIC_ICON_SIZE_DP)
            ).apply {
                gravity = Gravity.CENTER_VERTICAL
                marginStart = dpToPx(MIC_ICON_MARGIN_START_DP)
            }
        }

        // User name
        tvUserName = TextView(context).apply {
            ellipsize = TextUtils.TruncateAt.END
            maxLines = 1
            isSingleLine = true
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, NAME_TEXT_SIZE_SP)
            val padH = dpToPx(NAME_PADDING_HORIZONTAL_DP)
            setPaddingRelative(padH, 0, padH, 0)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER_VERTICAL
            }
        }

        row.addView(ivUserAvatar)
        row.addView(ivMicStatus)
        row.addView(tvUserName)
        addView(row)
    }

    /**
     * Inject (or replace) drawable resources used by this overlay. Triggers a
     * refresh if a participant has already been bound.
     */
    fun setIcons(icons: RoomViewIcons) {
        this.icons = icons
        // Re-apply mic icon based on current state. The caller (RoomVideoGridAdapter)
        // is responsible for calling updateParticipant() again as new bind happens;
        // we cannot refresh role here without a participant reference.
    }

    fun updateParticipant(participant: RoomParticipant) {
        tvUserName.text = participant.getDisplayName()
        updateRoleIcon(participant.role)

        // Mic status: prefer Drawable?, fall back to @DrawableRes Int, skip when both empty.
        val isMicOn = participant.microphoneStatus == DeviceStatus.ON
        val micDrawable = if (isMicOn) icons.microphoneOnDrawable else icons.microphoneOffDrawable
        val micRes = if (isMicOn) icons.microphoneOn else icons.microphoneOff
        when {
            micDrawable != null -> ivMicStatus.setImageDrawable(micDrawable)
            micRes != 0 -> ivMicStatus.setImageResource(micRes)
        }
    }

    private fun updateRoleIcon(role: ParticipantRole) {
        when (role) {
            ParticipantRole.OWNER -> applyRoleIcon(icons.roleOwnerDrawable, icons.roleOwner)
            ParticipantRole.ADMIN -> applyRoleIcon(icons.roleManagerDrawable, icons.roleManager)
            ParticipantRole.GENERAL_USER -> ivUserAvatar.visibility = GONE
        }
    }

    private fun applyRoleIcon(drawable: android.graphics.drawable.Drawable?, @androidx.annotation.DrawableRes resId: Int) {
        when {
            drawable != null -> {
                ivUserAvatar.visibility = VISIBLE
                ivUserAvatar.setImageDrawable(drawable)
            }
            resId != 0 -> {
                ivUserAvatar.visibility = VISIBLE
                ivUserAvatar.setImageResource(resId)
            }
            else -> ivUserAvatar.visibility = GONE
        }
    }
}
