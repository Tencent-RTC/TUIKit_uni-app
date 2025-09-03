package uts.sdk.modules.uiComponent.kotlin;

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.opensource.svgaplayer.SVGACallback
import com.opensource.svgaplayer.SVGAImageView
import com.opensource.svgaplayer.SVGAParser
import com.opensource.svgaplayer.SVGAVideoEntity
import com.tencent.cloud.uikit.state.common.Logger
import io.dcloud.uts.console
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.InputStream
import java.net.URL

class SVGAAnimationView(context: Context) : FrameLayout(context), SVGACallback {
    private val svgaParser: SVGAParser
    private val svgaImageView: SVGAImageView
    private var svgaCallback: SVGACallback? = null

    init {
        svgaImageView = SVGAImageView(context)
        val lp: FrameLayout.LayoutParams =
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        addView(svgaImageView, lp)
        svgaImageView.loops = 1
        svgaImageView.callback = this
        svgaParser = SVGAParser.shareParser()
        svgaParser.init(context)
    }

    fun setCallback(callback: SVGACallback) {
        svgaCallback = callback
    }

    // val playUrl = "/sdcard/Android/data/uni.app.UNIFA697C8/images/sports_car.svga"
    fun startAnimation(playUrl: String) {
        console.log("startAnimation playUrl: ", playUrl)
        Logger.e(TAG + "startAnimation, playUrl: $playUrl")

        if (playUrl.isNullOrEmpty()) {
            console.error("startAnimation, playUrl is empty")
            Logger.e(TAG + "startAnimation, playUrl is empty")
            svgaCallback?.onFinished()
            return
        }

        if (playUrl.endsWith(".svga") && isUrl(playUrl)) {
            decodeFromURL(playUrl)
        } else {
            decodeFromInputStream(playUrl)
        }
    }

    private fun isUrl(url: String): Boolean {
        return url.startsWith("http") || url.startsWith("https")
    }

    fun stopAnimation() {
        svgaImageView.stopAnimation(true)
    }

    private fun decodeFromURL(playUrl: String) {
        console.log("decodeFromURL, playUrl: ", playUrl);

        svgaParser.decodeFromURL(URL(playUrl),
            object : SVGAParser.ParseCompletion {
                override fun onComplete(videoItem: SVGAVideoEntity) {
                    console.log("decodeFromURL onComplete, videoItem: ", videoItem);
                    Logger.i(TAG + "startAnimation decodeFromURL, videoItem: $videoItem")

                    svgaImageView.setVisibility(View.VISIBLE)
                    svgaImageView.setVideoItem(videoItem)
                    svgaImageView.startAnimation()
                }

                override fun onError() {
                    console.log("===== decodeFromURL failed");
                    Logger.e(TAG + "decodeFromURL failed, playUrl: $playUrl")
                    svgaCallback?.onFinished()
                }
            }
        )
    }

    private fun decodeFromInputStream(filePath: String) {
        console.log("decodeFromInputStream, filePath: ", filePath);
        val stream = openInputStream(filePath)
        if (stream == null) {
            console.log("decodeFromInputStream, filePath is null");
            Logger.e(TAG + "decodeFromInputStream failed, filePath is null")
            return
        }
        svgaParser.decodeFromInputStream(stream, "", object : SVGAParser.ParseCompletion {
            override fun onComplete(videoItem: SVGAVideoEntity) {
                console.log("======startAnimation decodeFromInputStream start: ", videoItem)
                Logger.i(TAG + "decodeFromInputStream start: videoItem: $videoItem")
                svgaImageView.setVisibility(VISIBLE)
                svgaImageView.setVideoItem(videoItem)
                svgaImageView.startAnimation()
            }

            override fun onError() {
                console.log("======decodeFromInputStream parse failed: ", filePath)
                Logger.e(TAG + "decodeFromInputStream parse failed, filePath: $filePath")
                svgaCallback?.onFinished()
            }
        }, true, null, "")
    }

    override fun onFinished() {
        console.log("SVGAAnimationView onFinished")
        Logger.i(TAG + "onFinished")
        svgaImageView.setVisibility(View.GONE)
        svgaCallback?.onFinished()
    }

    override fun onPause() {
    }

    override fun onRepeat() {
    }

    override fun onStep(frame: Int, percentage: Double) {
    }

    private fun openInputStream(path: String): InputStream? {
        try {
            val file = File(path)
            if (file.exists()) {
                return FileInputStream(file)
            }
        } catch (e: FileNotFoundException) {
            Log.i(TAG, " " + e.localizedMessage)
        }
        return null
    }

    companion object {
        private const val TAG = "UTS-SVGAAnimationView: "
    }
}
