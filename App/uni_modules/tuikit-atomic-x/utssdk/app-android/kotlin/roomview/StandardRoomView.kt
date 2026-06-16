package uts.sdk.modules.atomicx.kotlin.roomview

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import io.trtc.tuikit.atomicxcore.api.device.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant
import io.trtc.tuikit.atomicxcore.api.view.VideoStreamType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class StandardRoomView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    companion object {
        private const val PAGING_GRID_ROWS = 3
        private const val PAGING_GRID_COLUMNS = 2
        private const val PAGE_SIZE = PAGING_GRID_ROWS * PAGING_GRID_COLUMNS
        private const val MAX_RECYCLED_VIEWS = 12
        private const val ITEM_SPACING_DP = 8
        private const val SPEAKING_VOLUME_THRESHOLD = 25
        private const val ARROW_SIZE_DP = 24
        private const val ARROW_MARGIN_DP = 12
    }

    private val logger = RoomViewLogger.getLogger("StandardRoomView")

    // Observer lifecycle state (inlined from former BaseView).
    private var roomID: String = ""
    private var isObserving = false

    /**
     * Drawable resources supplied by the host. The arrows owned directly by this view
     * read from here; everything else is forwarded to [RoomVideoGridAdapter.setIcons].
     * Any field left as 0 is silently skipped to avoid `Resources$NotFoundException`.
     */
    private var icons: RoomViewIcons = RoomViewIcons()

    // Pure-code view hierarchy. Image resources are applied later via
    // [applyIconsToArrows]; init only fixes layout & visibility.
    private val recyclerView: RecyclerView = RecyclerView(context).apply {
        overScrollMode = OVER_SCROLL_NEVER
    }
    private val arrowLeft: ImageView = ImageView(context).apply {
        visibility = GONE
    }
    private val arrowRight: ImageView = ImageView(context).apply {
        visibility = GONE
    }

    private var itemWidthPx = 0
    private var itemHeightPx = 0
    private val spacingPx by lazy { dpToPx(ITEM_SPACING_DP) }

    private lateinit var adapter: RoomVideoGridAdapter
    private lateinit var layoutStrategy: RoomVideoLayoutStrategy
    private lateinit var itemSizeDecoration: RoomVideoGridDecoration

    /**
     * Owns the engine subscription. We just hand it a [RoomParticipantSource.Listener]
     * and react to participant / speaking-volume snapshots; the wire protocol
     * (`TUIRoomEngine.call`, `KEY_ON_PARTICIPANT_LIST_CHANGED`, JSON decoding,
     * screen-share derivation, ...) is fully encapsulated there.
     */
    private val participantSource = RoomParticipantSource(ParticipantSourceListener())

    private var participants: List<RoomParticipant> = emptyList()
    private var screenShareParticipant: RoomParticipant? = null

    /** userID -> latest reported volume, fed by [ParticipantSourceListener]. */
    private val speakingMap: MutableMap<String, Int> = mutableMapOf()

    private val speakingStateCache = mutableMapOf<String, Boolean>()
    private var pendingUpdateJob: Job? = null
    private var isFirstUpdate = true
    private var lastHasScreenShare = false
    private var cachedVisibleRange: PagedVideoLayoutManager.VisibleRange? = null

    init {
        // Build view hierarchy programmatically.
        addView(
            recyclerView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER)
        )

        val arrowSize = dpToPx(ARROW_SIZE_DP)
        val arrowMargin = dpToPx(ARROW_MARGIN_DP)
        addView(
            arrowLeft,
            LayoutParams(arrowSize, arrowSize, Gravity.START or Gravity.CENTER_VERTICAL).apply {
                marginStart = arrowMargin
            }
        )
        addView(
            arrowRight,
            LayoutParams(arrowSize, arrowSize, Gravity.END or Gravity.CENTER_VERTICAL).apply {
                marginEnd = arrowMargin
            }
        )

        arrowLeft.setOnClickListener { scrollToPrevPage() }
        arrowRight.setOnClickListener { scrollToNextPage() }

        // First-pass size calculation; will be refined in onSizeChanged.
        calculateItemSize()
        initRecyclerView()
    }

    /**
     * Inject (or replace) drawable resources used by this view and its item grid.
     *
     * Safe to call at any time -- before or after [init], and any number of times.
     * The host typically wires this up once right after `new StandardRoomView(...)`
     * with whatever resource pipeline it has access to (host `R`, plugin assets, etc.).
     *
     * Resources left as `0` are silently ignored, so partial overrides are supported.
     */
    fun setIcons(icons: RoomViewIcons) {
        this.icons = icons
        applyIconsToArrows()
        if (::adapter.isInitialized) {
            adapter.setIcons(icons)
        }
    }

    private fun applyIconsToArrows() {
        // Drawable? takes precedence; fall back to @DrawableRes Int; skip when both empty.
        when {
            icons.arrowLeftDrawable != null -> arrowLeft.setImageDrawable(icons.arrowLeftDrawable)
            icons.arrowLeft != 0 -> arrowLeft.setImageResource(icons.arrowLeft)
        }
        when {
            icons.arrowRightDrawable != null -> arrowRight.setImageDrawable(icons.arrowRightDrawable)
            icons.arrowRight != 0 -> arrowRight.setImageResource(icons.arrowRight)
        }
    }

    /**
     * Entry point: bind this view to a room. Safe to call before or after the
     * view is attached to the window; observers will be activated as soon as
     * both `roomID` is set and the view is attached.
     */
    fun init(roomID: String) {
        if (roomID.isEmpty()) {
            return
        }
        this.roomID = roomID
        startObservingIfNeeded()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (roomID.isEmpty()) {
            return
        }
        startObservingIfNeeded()
    }

    override fun onDetachedFromWindow() {
        stopObserving()
        super.onDetachedFromWindow()
    }

    private fun startObservingIfNeeded() {
        if (isObserving) {
            return
        }
        if (roomID.isEmpty()) {
            return
        }
        participantSource.start(roomID)
        isObserving = true
    }

    private fun stopObserving() {
        if (!isObserving) {
            return
        }
        participantSource.stop()
        pendingUpdateJob?.cancel()
        pendingUpdateJob = null
        speakingMap.clear()
        speakingStateCache.clear()
        participants = emptyList()
        screenShareParticipant = null
        isFirstUpdate = true
        lastHasScreenShare = false
        cachedVisibleRange = null
        isObserving = false
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w <= 0 || h <= 0) return
        if (w == oldw && h == oldh) return

        val oldItemWidth = itemWidthPx
        val oldItemHeight = itemHeightPx
        calculateItemSize()
        if (oldItemWidth != itemWidthPx || oldItemHeight != itemHeightPx) {
            // Re-apply current layout mode so PagedVideoLayoutManager picks up new size.
            val currentItems = if (::adapter.isInitialized) adapter.getStreamItems() else emptyList()
            if (::layoutStrategy.isInitialized && currentItems.isNotEmpty()) {
                layoutStrategy.configureForParticipantCount(
                    currentItems.size,
                    screenShareParticipant != null
                )
            }
            recyclerView.requestLayout()
        }
    }

    private fun initRecyclerView() {
        itemSizeDecoration = RoomVideoGridDecoration(itemWidthPx, itemHeightPx, spacingPx)
        adapter = RoomVideoGridAdapter()
        // Forward icons that may have been supplied via [setIcons] before the
        // adapter existed (e.g. caller invoked setIcons() right after construction
        // but before init()).
        adapter.setIcons(icons)

        adapter.onDataUpdateCompleted = {
            recyclerView.post {
                updateVisibleItems()
            }
        }

        layoutStrategy = RoomVideoLayoutStrategy(context, recyclerView, itemSizeDecoration)

        recyclerView.adapter = adapter
        recyclerView.addItemDecoration(itemSizeDecoration)
        recyclerView.setItemViewCacheSize(0)
        recyclerView.recycledViewPool.setMaxRecycledViews(0, MAX_RECYCLED_VIEWS)
        recyclerView.itemAnimator = null

        recyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
                super.onScrollStateChanged(recyclerView, newState)
                if (newState == RecyclerView.SCROLL_STATE_IDLE) {
                    updateVisibleItems()
                }
            }
        })
    }

    private fun updateVisibleItems() {
        val currentRange = layoutStrategy.getVisibleRange() ?: return
        cachedVisibleRange = currentRange
        processVisibleItems(currentRange.startPosition, currentRange.endPosition)
        updateArrowsVisibility()
    }

    private fun processVisibleItems(startPosition: Int, endPosition: Int) {
        forEachViewHolder { holder, position, streamItem ->
            val isVisible = position in startPosition..endPosition
            holder.setActive(isVisible)

            if (isVisible && streamItem.streamType == VideoStreamType.CAMERA) {
                updateViewHolderSpeakingState(holder, streamItem.participant, speakingMap)
            }
        }
    }

    private inline fun forEachViewHolder(
        action: (holder: RoomVideoGridAdapter.VideoStreamViewHolder, position: Int, streamItem: VideoStreamItem) -> Unit
    ) {
        val streamItems = adapter.getStreamItems()
        if (streamItems.isEmpty()) return

        for (i in 0 until recyclerView.childCount) {
            val child = recyclerView.getChildAt(i) ?: continue
            val holder =
                recyclerView.getChildViewHolder(child) as? RoomVideoGridAdapter.VideoStreamViewHolder ?: continue

            val position = holder.adapterPosition
            if (position < 0 || position >= streamItems.size) continue

            val streamItem = streamItems[position]
            action(holder, position, streamItem)
        }
    }

    private fun calculateItemSize() {
        // Use actual view size if available, otherwise fallback to screen metrics
        val containerWidth = if (width > 0) width else context.resources.displayMetrics.widthPixels
        val containerHeight = if (height > 0) height else context.resources.displayMetrics.heightPixels

        val totalHorizontalSpacing = spacingPx * (PAGING_GRID_COLUMNS + 1)
        val availableWidth = containerWidth - totalHorizontalSpacing
        val maxItemWidth = availableWidth / PAGING_GRID_COLUMNS

        val totalVerticalSpacing = spacingPx * (PAGING_GRID_ROWS + 1)
        val availableHeight = containerHeight - totalVerticalSpacing
        val maxItemHeight = availableHeight / PAGING_GRID_ROWS

        val itemSize = minOf(maxItemWidth, maxItemHeight)
        itemWidthPx = itemSize
        itemHeightPx = itemSize

        if (::itemSizeDecoration.isInitialized) {
            itemSizeDecoration.updateItemSize(itemWidthPx, itemHeightPx, spacingPx)
        }

        logger.info(
            "Item size calculated: ${pxToDp(itemWidthPx)}dp x ${pxToDp(itemHeightPx)}dp " +
                    "(container: ${pxToDp(containerWidth)}dp x ${pxToDp(containerHeight)}dp, " +
                    "spacing: ${ITEM_SPACING_DP}dp, maxWidth: ${pxToDp(maxItemWidth)}dp, " +
                    "maxHeight: ${pxToDp(maxItemHeight)}dp)"
        )
    }

    private fun scheduleUpdateDisplayList() {
        val hasData = participants.isNotEmpty() || screenShareParticipant != null
        if (isFirstUpdate && hasData) {
            isFirstUpdate = false
            updateDisplayList()
        } else {
            pendingUpdateJob?.cancel()
            pendingUpdateJob = CoroutineScope(Dispatchers.Main).launch {
                delay(250)
                updateDisplayList()
            }
        }
    }

    private fun updateDisplayList() {
        val displayList = buildList {
            screenShareParticipant?.let { screenUser ->
                add(VideoStreamItem.screenShare(screenUser))
            }

            participants.forEach { participant ->
                add(VideoStreamItem.camera(participant))
            }
        }

        val hasScreenShare = screenShareParticipant != null

        logger.info(
            "updateDisplayList: total=${displayList.size}, hasScreenShare=$hasScreenShare, " +
                    "screenShareUserId=${screenShareParticipant?.userID}, participants=${participants.size}"
        )

        layoutStrategy.configureForParticipantCount(displayList.size, hasScreenShare)
        adapter.updateData(displayList)
        updateArrowsVisibility()

        speakingStateCache.keys.removeAll { userId ->
            displayList.none { it.participant.userID == userId }
        }

        if (!lastHasScreenShare && hasScreenShare) {
            recyclerView.scrollToPosition(0)
            recyclerView.post {
                updateVisibleItems()
            }
        }
        lastHasScreenShare = hasScreenShare
    }

    private fun updateSpeakingStates(speakingMap: Map<String, Int>) {
        val currentRange = cachedVisibleRange ?: return

        forEachViewHolder { holder, position, streamItem ->
            val isVisible = position in currentRange.startPosition..currentRange.endPosition

            if (isVisible && streamItem.streamType == VideoStreamType.CAMERA) {
                updateViewHolderSpeakingState(holder, streamItem.participant, speakingMap)
            }
        }
    }

    private fun updateArrowsVisibility() {
        val streamItems = adapter.getStreamItems()
        val hasScreenShare = screenShareParticipant != null

        val totalPages = if (hasScreenShare) {
            if (streamItems.size <= 1) {
                1
            } else {
                val remainingItems = streamItems.size - 1
                1 + (remainingItems + PAGE_SIZE - 1) / PAGE_SIZE
            }
        } else {
            (streamItems.size + PAGE_SIZE - 1) / PAGE_SIZE
        }

        if (totalPages <= 1) {
            arrowLeft.visibility = GONE
            arrowRight.visibility = GONE
            return
        }

        val currentPage = getCurrentPage()

        arrowLeft.visibility = if (currentPage > 0) VISIBLE else GONE
        arrowRight.visibility = if (currentPage < totalPages - 1) VISIBLE else GONE
    }

    private fun getCurrentPage(): Int {
        val currentRange = cachedVisibleRange ?: return 0
        return currentRange.pageIndex
    }

    private fun scrollToNextPage() {
        val pagedManager = layoutStrategy.getPagedLayoutManager() ?: return
        val target = pagedManager.findNextPageFirstPos()
        recyclerView.smoothScrollToPosition(target)
    }

    private fun scrollToPrevPage() {
        val pagedManager = layoutStrategy.getPagedLayoutManager() ?: return
        val target = pagedManager.findPrePageFirstPos()
        recyclerView.smoothScrollToPosition(target)
    }

    private fun updateViewHolderSpeakingState(
        viewHolder: RoomVideoGridAdapter.VideoStreamViewHolder,
        participant: RoomParticipant,
        speakingMap: Map<String, Int>
    ) {
        val volume = speakingMap[participant.userID] ?: 0
        val isMicOn = participant.microphoneStatus == DeviceStatus.ON
        val isSpeaking = isMicOn && volume > SPEAKING_VOLUME_THRESHOLD

        val cachedState = speakingStateCache[participant.userID]
        if (cachedState != isSpeaking) {
            speakingStateCache[participant.userID] = isSpeaking
            viewHolder.updateSpeakingState(isSpeaking)
        }
    }

    /**
     * Bridges [RoomParticipantSource] events to this view's display pipeline.
     * Kept as a thin adapter so [RoomParticipantSource] stays UI-agnostic.
     */
    private inner class ParticipantSourceListener : RoomParticipantSource.Listener {
        override fun onParticipantsChanged(
            participants: List<RoomParticipant>,
            screenShareParticipant: RoomParticipant?
        ) {
            this@StandardRoomView.participants = participants
            this@StandardRoomView.screenShareParticipant = screenShareParticipant
            scheduleUpdateDisplayList()
        }

        override fun onSpeakingVolumesChanged(volumes: Map<String, Int>) {
            speakingMap.clear()
            speakingMap.putAll(volumes)
            updateSpeakingStates(speakingMap)
        }
    }
}
