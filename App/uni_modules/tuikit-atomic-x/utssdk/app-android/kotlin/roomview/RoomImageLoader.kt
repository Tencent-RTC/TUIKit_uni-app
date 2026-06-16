package uts.sdk.modules.atomicx.kotlin.roomview

import android.app.Activity
import android.content.Context
import android.widget.ImageView
import androidx.annotation.DrawableRes
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.request.RequestOptions

/**
 * Local self-contained image loader for the roomview package.
 *
 * Replaces the dependency on `io.trtc.tuikit.atomicx.common.imageloader.ImageLoader`
 * with a minimal Glide-based loader that only supports the single use case the
 * roomview package has: loading a participant avatar URL into a circular
 * `ImageFilterView` with a default placeholder.
 *
 * If Glide is not available at runtime (e.g. when this package is shipped inside a
 * UTS plugin host that does not bundle Glide), the placeholder is set directly and
 * the failure is silently swallowed -- callers must already provide a sensible
 * placeholder resource id.
 */
internal object RoomImageLoader {

    /**
     * Load `url` into `target`, falling back to `placeholder` on any failure.
     * A `placeholder` of `0` is allowed and means "no placeholder drawable" --
     * Glide accepts it natively, and explicit `setImageResource` calls are skipped.
     */
    @JvmStatic
    fun load(
        context: Context,
        target: ImageView?,
        url: String?,
        @DrawableRes placeholder: Int
    ) {
        if (target == null) return
        if (url.isNullOrEmpty()) {
            if (placeholder != 0) target.setImageResource(placeholder)
            return
        }
        if (context is Activity && (context.isFinishing || context.isDestroyed)) {
            if (placeholder != 0) target.setImageResource(placeholder)
            return
        }
        try {
            val options = RequestOptions()
                .placeholder(placeholder)
                .error(placeholder)
                .transform(CenterCrop())
                .diskCacheStrategy(DiskCacheStrategy.ALL)
            Glide.with(context.applicationContext)
                .load(url)
                .apply(options)
                .into(target)
        } catch (_: Throwable) {
            if (placeholder != 0) target.setImageResource(placeholder)
        }
    }
}
