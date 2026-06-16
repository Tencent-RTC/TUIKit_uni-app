package uts.sdk.modules.atomicx.kotlin.roomview

import android.graphics.drawable.Drawable
import androidx.annotation.DrawableRes

/**
 * Container of icon resources consumed by [StandardRoomView] / [WebinarRoomView].
 *
 * Each visual slot is exposed via TWO parallel fields:
 *  - `xxxDrawable: Drawable?` — runtime-decoded drawable (e.g. from a local file path
 *    or remote download). Takes precedence when non-null.
 *  - `xxx: Int (@DrawableRes)` — host-resource fallback. Used when the matching
 *    `Drawable?` field is null. Leave as `0` to mean "not set".
 *
 * The roomview package itself does NOT reference any host-side `R.drawable.*`. The
 * host (or wrapper module) populates whichever field it can produce:
 *  - When integrating from a regular Android app, supply [DrawableRes Int] values.
 *  - When integrating from a UTS plugin / uniapp host (where `R.drawable` is not
 *    accessible at runtime), supply pre-decoded [Drawable] values (e.g. via
 *    `BitmapFactory.decodeFile(...).toDrawable(resources)`).
 *
 * Any slot with both fields empty (`Drawable? == null` AND `Int == 0`) is silently
 * skipped — the corresponding [android.widget.ImageView] simply won't have its
 * image set, so no broken/empty drawable appears.
 */
data class RoomViewIcons(
    /** Default circular avatar placeholder (shown when camera off & no avatar URL). */
    val defaultAvatarDrawable: Drawable? = null,
    @DrawableRes val defaultAvatar: Int = 0,

    /** Microphone-on indicator drawn inside the name overlay. */
    val microphoneOnDrawable: Drawable? = null,
    @DrawableRes val microphoneOn: Int = 0,

    /** Microphone-off indicator drawn inside the name overlay. */
    val microphoneOffDrawable: Drawable? = null,
    @DrawableRes val microphoneOff: Int = 0,

    /** Owner role badge (e.g. crown icon). */
    val roleOwnerDrawable: Drawable? = null,
    @DrawableRes val roleOwner: Int = 0,

    /** Admin / manager role badge. */
    val roleManagerDrawable: Drawable? = null,
    @DrawableRes val roleManager: Int = 0,

    /** Page-left arrow (paging indicator on [StandardRoomView]). */
    val arrowLeftDrawable: Drawable? = null,
    @DrawableRes val arrowLeft: Int = 0,

    /** Page-right arrow (paging indicator on [StandardRoomView]). */
    val arrowRightDrawable: Drawable? = null,
    @DrawableRes val arrowRight: Int = 0,
)
