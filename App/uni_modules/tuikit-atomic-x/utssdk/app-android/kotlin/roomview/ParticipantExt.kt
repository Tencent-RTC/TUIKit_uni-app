package uts.sdk.modules.atomicx.kotlin.roomview

import io.trtc.tuikit.atomicxcore.api.room.RoomParticipant

/** [RoomParticipant] display name: prefers userName, falls back to userID when empty. */
internal fun RoomParticipant.getDisplayName(): String = when {
    userName.isNotEmpty() -> userName
    else -> userID
}
