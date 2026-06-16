package uts.sdk.modules.atomicx.kotlin.roomview

import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver
import io.trtc.tuikit.atomicxcore.api.device.DeviceStatus
import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant

/**
 * Subscribes to [TUIRoomEngine] and exposes a UI-friendly view of a room's
 * participants and their speaking volumes.
 *
 * Lifecycle:
 *  - [start] adds the engine observer and pulls the initial full list.
 *  - [stop] removes the observer and clears all internal state, so a single
 *    instance can be reused across rebinds (e.g. when a host view is detached
 *    and reattached, or the room id changes).
 *
 * Threading: events from [TUIRoomEngine] are delivered on the main thread,
 * which is also where listener callbacks fire. State mutation is therefore
 * single-threaded by construction.
 */
internal class RoomParticipantSource(
    private val listener: Listener
) {

    private val logger = RoomViewLogger.getLogger("RoomParticipantSource")

    /** Callbacks for participant-related state changes. */
    interface Listener {
        /**
         * Fired whenever the participant list changes, with the screen-share
         * participant already derived. Either or both may be empty / null.
         *
         * The supplied list is a fresh snapshot (callers don't need to copy it
         * before retaining it, but mutating it is undefined).
         */
        fun onParticipantsChanged(
            participants: List<RoomParticipant>,
            screenShareParticipant: RoomParticipant?
        )

        /**
         * Fired on every voice-volume tick from the engine.
         *
         * The map is keyed by `userID` and values are the most recent volume
         * (0..100). Users not present in the map are silent for this tick.
         */
        fun onSpeakingVolumesChanged(volumes: Map<String, Int>)
    }

    private companion object {
        // Engine API / event keys.
        const val KEY_GET_PARTICIPANT_LIST = "roomParticipantStore.getParticipantList"
        const val KEY_ON_PARTICIPANT_LIST_CHANGED = "roomParticipantState.onParticipantListChanged"

        // Numeric values for participant list change events.
        const val LIST_MODIFY_TYPE_FULL = 1
        const val LIST_MODIFY_TYPE_ADD = 2
        const val LIST_MODIFY_TYPE_REMOVE = 3
        const val LIST_MODIFY_TYPE_REPLACE = 4
    }

    private val roomEngine: TUIRoomEngine = TUIRoomEngine.sharedInstance()
    private val observer = EngineObserver()

    /**
     * Insertion-ordered map of participants. Acts as the single source of
     * truth for the snapshot we hand out via [Listener.onParticipantsChanged].
     */
    private val participantMap: LinkedHashMap<String, RoomParticipant> = LinkedHashMap()

    private var roomID: String = ""
    private var isObserving = false

    /** Begin observing engine events for [roomID]. Idempotent for the same id. */
    fun start(roomID: String) {
        if (roomID.isEmpty()) return
        if (isObserving && this.roomID == roomID) return
        if (isObserving) {
            // Re-bind to a different room: tear down first to drop stale state.
            stop()
        }
        this.roomID = roomID
        roomEngine.addObserver(observer)
        isObserving = true
        fetchInitialParticipantList()
    }

    /** Stop observing and reset all internal state. Safe to call when not started. */
    fun stop() {
        if (!isObserving) return
        roomEngine.removeObserver(observer)
        isObserving = false
        roomID = ""
        participantMap.clear()
    }

    private fun fetchInitialParticipantList() {
        val params = JsonCodec.gson.toJson(mapOf("cursor" to ""))
        roomEngine.call(KEY_GET_PARTICIPANT_LIST, params) { code, message, data ->
            if (code != 0) {
                logger.error("getParticipantList failed: code=$code, message=$message")
                return@call
            }
            val list = data.parseListAt<RoomParticipant>("participantList")
            applyChange(LIST_MODIFY_TYPE_FULL, list)
        }
    }

    /**
     * Single point that mutates [participantMap] in response to a participant
     * event, then notifies the listener. Also derives the screen-share
     * participant from the latest snapshot.
     */
    private fun applyChange(modifyType: Int, list: List<RoomParticipant>) {
        when (modifyType) {
            LIST_MODIFY_TYPE_FULL -> {
                participantMap.clear()
                list.forEach { participantMap[it.userID] = it }
            }

            LIST_MODIFY_TYPE_ADD, LIST_MODIFY_TYPE_REPLACE -> {
                list.forEach { participantMap[it.userID] = it }
            }

            LIST_MODIFY_TYPE_REMOVE -> {
                list.forEach { participantMap.remove(it.userID) }
            }

            else -> return
        }

        val snapshot = participantMap.values.toList()
        val screenShare = snapshot.firstOrNull { it.screenShareStatus == DeviceStatus.ON }
        logger.info(
            "applyChange: modifyType=$modifyType, total=${snapshot.size}, " +
                    "screenShare=${screenShare?.userID}"
        )
        listener.onParticipantsChanged(snapshot, screenShare)
    }

    private inner class EngineObserver : TUIRoomObserver() {
        override fun on(key: String, jsonData: String) {
            // Filter out events not targeted at this room. Payload always
            // carries a `roomID` field for room-scoped events.
            val eventRoomID = jsonData.parseAt<String>("roomID")
            if (roomID != eventRoomID) return

            when (key) {
                KEY_ON_PARTICIPANT_LIST_CHANGED -> {
                    val modifyType = jsonData.parseAt<Int>("listModifyType") ?: return
                    val list = jsonData.parseListAt<RoomParticipant>("participantList")
                    applyChange(modifyType, list)
                }
            }
        }

        override fun onUserVoiceVolumeChanged(volumeMap: Map<String, Int>) {
            listener.onSpeakingVolumesChanged(volumeMap)
        }
    }
}
