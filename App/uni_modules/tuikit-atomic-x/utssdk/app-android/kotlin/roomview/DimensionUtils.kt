package uts.sdk.modules.atomicx.kotlin.roomview

import android.content.Context
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.View
import android.view.WindowManager

/**
 * dp / px / screen-size helpers used internally by the roomview package.
 */

/** Convert dp to px using the given context. */
internal fun Context.dpToPx(dp: Int): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp.toFloat(), resources.displayMetrics).toInt()

/** Convert dp to px (Float overload). */
internal fun Context.dpToPx(dp: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics).toInt()

/** Convert px to dp. */
internal fun Context.pxToDp(px: Int): Int =
    (px / resources.displayMetrics.density).toInt()

/** View extension overloads. */
internal fun View.dpToPx(dp: Int): Int = context.dpToPx(dp)
internal fun View.dpToPx(dp: Float): Int = context.dpToPx(dp)
internal fun View.pxToDp(px: Int): Int = context.pxToDp(px)

/** Get screen width in pixels. */
internal fun getScreenWidth(context: Context): Int {
    val displayMetrics = DisplayMetrics()
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    @Suppress("DEPRECATION")
    windowManager.defaultDisplay.getMetrics(displayMetrics)
    return displayMetrics.widthPixels
}
