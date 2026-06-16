package uts.sdk.modules.atomicx.kotlin.roomview

import android.content.Context
import android.graphics.Color
import android.graphics.Outline
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.widget.ImageView
import androidx.constraintlayout.utils.widget.ImageFilterView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.constraintlayout.widget.ConstraintSet
import androidx.recyclerview.widget.AsyncListDiffer
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import io.trtc.tuikit.atomicxcore.api.device.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant
import io.trtc.tuikit.atomicxcore.api.view.FillMode
import io.trtc.tuikit.atomicxcore.api.view.RoomParticipantView
import io.trtc.tuikit.atomicxcore.api.view.VideoStreamType

/**
 * Room video grid adapter for managing video stream items.
 *
 * Pure-code implementation (no XML inflation). Each item view is a [VideoItemContainer]
 * (a [ConstraintLayout] subclass) containing 4 stacked layers:
 *   Layer 1: [RoomParticipantView]      - Video rendering layer
 *   Layer 2: avatar placeholder         - Shown when camera is off (hidden for screen share)
 *   Layer 3: speaking border            - Visual indicator for speaking state
 *   Layer 4: [RoomVideoNameOverlayView] - User name & status overlay
 */
class RoomVideoGridAdapter : RecyclerView.Adapter<RoomVideoGridAdapter.VideoStreamViewHolder>() {

    companion object {
        const val VIEW_TYPE_SCREEN_SHARE = 1
        const val VIEW_TYPE_CAMERA = 2
        private const val VIDEO_CORNER_RADIUS_DP = 16
        private const val AVATAR_SIZE_DP = 96
        private const val NAME_OVERLAY_MARGIN_DP = 8
        private const val SPEAKING_BORDER_WIDTH_DP = 3
        // #8022262E -- video item background
        private const val COLOR_VIDEO_ITEM_BG = 0x8022262E.toInt()
        // #FF1AFFC9 -- speaking indicator border
        private const val COLOR_SPEAKING_INDICATOR = 0xFF1AFFC9.toInt()
    }

    /**
     * Programmatically-built item container exposing each layer as a typed field.
     */
    private class VideoItemContainer(context: Context) : ConstraintLayout(context) {
        val participantView: RoomParticipantView = RoomParticipantView(context).apply {
            id = generateViewId()
            setBackgroundColor(COLOR_VIDEO_ITEM_BG)
        }
        val avatarPlaceholder: ImageFilterView = ImageFilterView(context).apply {
            id = generateViewId()
            scaleType = ImageView.ScaleType.CENTER_CROP
            // Avatar drawable is supplied later via the adapter's `icons` and applied
            // in `loadAvatar()`. Keeping init free of resource lookups lets this view
            // be constructed before [RoomVideoGridAdapter.setIcons] is invoked.
            visibility = GONE
            round = dpToPx(AVATAR_SIZE_DP / 2).toFloat()
        }
        val speakingBorder: View = View(context).apply {
            id = generateViewId()
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(VIDEO_CORNER_RADIUS_DP).toFloat()
                setColor(Color.TRANSPARENT)
                setStroke(dpToPx(SPEAKING_BORDER_WIDTH_DP), COLOR_SPEAKING_INDICATOR)
            }
            visibility = GONE
        }
        val nameOverlay: RoomVideoNameOverlayView = RoomVideoNameOverlayView(context).apply {
            id = generateViewId()
        }

        init {
            layoutParams = ViewGroup.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
            )

            addView(participantView, LayoutParams(0, 0))
            addView(avatarPlaceholder, LayoutParams(dpToPx(AVATAR_SIZE_DP), dpToPx(AVATAR_SIZE_DP)))
            addView(speakingBorder, LayoutParams(0, 0))
            addView(
                nameOverlay,
                LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
            )

            ConstraintSet().apply {
                clone(this@VideoItemContainer)

                // participantView -- fill parent
                connect(participantView.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
                connect(participantView.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)
                connect(participantView.id, ConstraintSet.TOP, ConstraintSet.PARENT_ID, ConstraintSet.TOP)
                connect(participantView.id, ConstraintSet.BOTTOM, ConstraintSet.PARENT_ID, ConstraintSet.BOTTOM)

                // avatar -- centered
                connect(avatarPlaceholder.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
                connect(avatarPlaceholder.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)
                connect(avatarPlaceholder.id, ConstraintSet.TOP, ConstraintSet.PARENT_ID, ConstraintSet.TOP)
                connect(avatarPlaceholder.id, ConstraintSet.BOTTOM, ConstraintSet.PARENT_ID, ConstraintSet.BOTTOM)

                // speakingBorder -- fill parent
                connect(speakingBorder.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
                connect(speakingBorder.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)
                connect(speakingBorder.id, ConstraintSet.TOP, ConstraintSet.PARENT_ID, ConstraintSet.TOP)
                connect(speakingBorder.id, ConstraintSet.BOTTOM, ConstraintSet.PARENT_ID, ConstraintSet.BOTTOM)

                // nameOverlay -- bottom-start with 8dp margin
                val m = dpToPx(NAME_OVERLAY_MARGIN_DP)
                connect(nameOverlay.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START, m)
                connect(nameOverlay.id, ConstraintSet.BOTTOM, ConstraintSet.PARENT_ID, ConstraintSet.BOTTOM, m)

                applyTo(this@VideoItemContainer)
            }
        }
    }

    private val diffCallback = DiffCallback()

    /**
     * DiffUtil callback for efficient list updates
     */
    private class DiffCallback : DiffUtil.ItemCallback<VideoStreamItem>() {
        override fun areItemsTheSame(oldItem: VideoStreamItem, newItem: VideoStreamItem): Boolean {
            return oldItem.uniqueId == newItem.uniqueId
        }

        override fun areContentsTheSame(oldItem: VideoStreamItem, newItem: VideoStreamItem): Boolean {
            val oldP = oldItem.participant
            val newP = newItem.participant
            return oldP.userName == newP.userName &&
                    oldP.nameCard == newP.nameCard &&
                    oldP.avatarURL == newP.avatarURL &&
                    oldP.cameraStatus == newP.cameraStatus &&
                    oldP.microphoneStatus == newP.microphoneStatus &&
                    oldP.screenShareStatus == newP.screenShareStatus &&
                    oldP.role == newP.role &&
                    oldItem.streamType == newItem.streamType
        }

        override fun getChangePayload(oldItem: VideoStreamItem, newItem: VideoStreamItem): Any? {
            return newItem
        }
    }

    private val differ = AsyncListDiffer(this, diffCallback)

    /**
     * Drawable resources supplied by the host (via [StandardRoomView.setIcons]).
     * Used by [VideoStreamViewHolder.loadAvatar] and propagated to each
     * [RoomVideoNameOverlayView] on bind. Any resource left as 0 is silently
     * skipped to avoid `Resources$NotFoundException`.
     */
    private var icons: RoomViewIcons = RoomViewIcons()

    var onDataUpdateCompleted: (() -> Unit)? = null

    /**
     * Inject (or replace) drawable resources. Triggers a full rebind so existing
     * ViewHolders pick up the new icons.
     */
    fun setIcons(icons: RoomViewIcons) {
        this.icons = icons
        notifyDataSetChanged()
    }

    init {
        differ.addListListener { previousList, currentList ->
            val oldSize = previousList.size
            val newSize = currentList.size

            val hasChanges = if (oldSize != newSize) {
                true
            } else {
                previousList.indices.any { index ->
                    previousList[index].uniqueId != currentList[index].uniqueId
                }
            }

            if (hasChanges) {
                onDataUpdateCompleted?.invoke()
            }
        }
    }

    fun updateData(newData: List<VideoStreamItem>) {
        differ.submitList(newData.toList())
    }

    override fun getItemViewType(position: Int): Int {
        val item = differ.currentList[position]
        return if (item.streamType == VideoStreamType.SCREEN) {
            VIEW_TYPE_SCREEN_SHARE
        } else {
            VIEW_TYPE_CAMERA
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VideoStreamViewHolder {
        val itemView = VideoItemContainer(parent.context)
        return VideoStreamViewHolder(itemView, viewType == VIEW_TYPE_SCREEN_SHARE)
    }

    override fun onBindViewHolder(holder: VideoStreamViewHolder, position: Int) {
        holder.bind(differ.currentList[position])
    }

    override fun onBindViewHolder(holder: VideoStreamViewHolder, position: Int, payloads: MutableList<Any>) {
        if (payloads.isEmpty()) {
            super.onBindViewHolder(holder, position, payloads)
            return
        }

        val item = payloads.firstOrNull() as? VideoStreamItem ?: differ.currentList[position]
        holder.updateParticipantState(item)
    }

    override fun getItemCount(): Int = differ.currentList.size

    fun getStreamItems(): List<VideoStreamItem> = differ.currentList

    // ========== Inner Classes ==========

    /**
     * ViewHolder for video stream items in the room video grid.
     *
     * @param itemView The item view (a programmatically built [VideoItemContainer])
     * @param isScreenShare Whether this ViewHolder displays screen share content
     */
    inner class VideoStreamViewHolder(
        itemView: View,
        private val isScreenShare: Boolean
    ) : RecyclerView.ViewHolder(itemView) {

        private val container = itemView as VideoItemContainer

        // Layer 1: Bottom layer - video rendering
        private val participantView: RoomParticipantView get() = container.participantView

        // Layer 2: Avatar placeholder layer
        private val avatarPlaceholder: ImageFilterView get() = container.avatarPlaceholder

        // Layer 3: Speaking state border
        private val speakingBorder: View get() = container.speakingBorder

        // Layer 4: User name and status information
        private val nameOverlay: RoomVideoNameOverlayView get() = container.nameOverlay

        // Track current stream to detect stream changes
        private var currentStreamId: String? = null

        init {
            setupRoundedCorners()
        }

        /**
         * Setup rounded corners for the video item
         */
        private fun setupRoundedCorners() {
            itemView.clipToOutline = true
            itemView.outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val radius = view.dpToPx(VIDEO_CORNER_RADIUS_DP).toFloat()
                    outline.setRoundRect(0, 0, view.width, view.height, radius)
                }
            }
        }

        /**
         * Bind video stream data to this ViewHolder
         * - Initializes participant view if stream changed
         * - Updates participant info if stream unchanged
         */
        fun bind(streamItem: VideoStreamItem) {
            val isStreamChanged = currentStreamId != streamItem.uniqueId

            if (isStreamChanged) {
                currentStreamId = streamItem.uniqueId
                participantView.init(streamItem.streamType, streamItem.participant)
            } else {
                participantView.updateParticipant(streamItem.participant)
            }
            val fillMode = if (streamItem.streamType == VideoStreamType.SCREEN) FillMode.FIT else FillMode.FILL
            participantView.setFillMode(fillMode)

            nameOverlay.setIcons(icons)
            nameOverlay.updateParticipant(streamItem.participant)
            updateAvatarVisibility(streamItem.participant)
            resetSpeakingState(streamItem.participant)
        }

        /**
         * Update avatar placeholder visibility based on camera status.
         * Rules:
         * - Screen share: Never show avatar
         * - Camera stream: Show avatar when camera is off
         */
        private fun updateAvatarVisibility(participant: RoomParticipant) {
            if (isScreenShare) {
                avatarPlaceholder.visibility = View.GONE
                return
            }

            val shouldShowAvatar = participant.cameraStatus != DeviceStatus.ON

            if (shouldShowAvatar) {
                loadAvatar(participant)
                avatarPlaceholder.visibility = View.VISIBLE
            } else {
                avatarPlaceholder.visibility = View.GONE
            }
        }

        /**
         * Load participant avatar image
         */
        private fun loadAvatar(participant: RoomParticipant) {
            val defaultDrawable = icons.defaultAvatarDrawable
            val defaultAvatar = icons.defaultAvatar
            if (participant.avatarURL.isEmpty()) {
                when {
                    defaultDrawable != null -> avatarPlaceholder.setImageDrawable(defaultDrawable)
                    defaultAvatar != 0 -> avatarPlaceholder.setImageResource(defaultAvatar)
                }
            } else {
                // RoomImageLoader currently accepts only @DrawableRes Int as placeholder.
                // When the host supplied a Drawable instead, pre-apply it so something is
                // visible while Glide loads the avatar (Glide will replace it on success).
                if (defaultDrawable != null) {
                    avatarPlaceholder.setImageDrawable(defaultDrawable)
                }
                RoomImageLoader.load(
                    participantView.context,
                    avatarPlaceholder,
                    participant.avatarURL,
                    defaultAvatar
                )
            }
        }

        /**
         * Set video rendering active state
         */
        fun setActive(active: Boolean) {
            participantView.setActive(active)
        }

        /**
         * Update speaking state visual indicator
         */
        fun updateSpeakingState(isSpeaking: Boolean) {
            speakingBorder.visibility = if (isSpeaking) View.VISIBLE else View.INVISIBLE
        }

        fun resetSpeakingState(participant: RoomParticipant) {
            if (participant.microphoneStatus == DeviceStatus.OFF) {
                speakingBorder.visibility = View.INVISIBLE
            }
        }

        /**
         * Update participant state (used for partial updates via DiffUtil payloads)
         */
        fun updateParticipantState(item: VideoStreamItem) {
            nameOverlay.setIcons(icons)
            nameOverlay.updateParticipant(item.participant)
            participantView.updateParticipant(item.participant)
            updateAvatarVisibility(item.participant)
            resetSpeakingState(item.participant)
        }
    }
}
