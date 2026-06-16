package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import androidx.constraintlayout.widget.ConstraintLayout
import com.google.gson.Gson
import uts.sdk.modules.atomicx.kotlin.roomview.RoomView
import uts.sdk.modules.atomicx.kotlin.roomview.RoomViewIcons
import uts.sdk.modules.atomicx.kotlin.roomview.RoomViewLogger
import io.trtc.tuikit.atomicxcore.api.room.RoomType
import java.io.File
import java.net.URI

private val logger = RoomViewLogger.getLogger("RoomRenderView")

class RoomRenderView(
    context: Context,
    attrs: AttributeSet? = null,
) : ConstraintLayout(context, attrs) {

    private var nativeRoomView: RoomView? = null

    private var cachedRoomID: String = ""
    private var cachedRoomType: RoomType = RoomType.STANDARD
    private var cachedIcons: RoomViewIcons = RoomViewIcons()
    private var isNativeViewInitialized = false
    private var isAttached = false

    private val gson = Gson()

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        logger.info("onAttachedToWindow")
        isAttached = true
        tryInitializeView()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        logger.info("onDetachedFromWindow")
        isAttached = false
        nativeRoomView = null
        isNativeViewInitialized = false
    }

    fun setRoomID(roomID: Any?) {
        if (roomID !is String) {
            logger.warn("setRoomID: ignore non-String value=$roomID type=${roomID?.javaClass?.simpleName}")
            return
        }
        if (cachedRoomID == roomID) return
        logger.info("setRoomID: $roomID (prev=$cachedRoomID)")
        cachedRoomID = roomID
        if (isNativeViewInitialized) {
            isNativeViewInitialized = false
            nativeRoomView = null
            removeAllViews()
        }
        tryInitializeView()
    }

    fun setRoomType(roomType: Any?) {
        if (roomType !is Number) {
            logger.warn("setRoomType: ignore non-Number value=$roomType type=${roomType?.javaClass?.simpleName}")
            return
        }
        val intValue = roomType.toInt()
        val newType = parseRoomType(intValue)
        if (cachedRoomType == newType && isNativeViewInitialized) return
        logger.info("setRoomType: $intValue -> $newType")
        cachedRoomType = newType
        if (isNativeViewInitialized) {
            isNativeViewInitialized = false
            nativeRoomView = null
            removeAllViews()
        }
        tryInitializeView()
    }

    fun setIcons(icons: Any?) {
        if (icons !is String) {
            logger.warn("setIcons: ignore non-String value type=${icons?.javaClass?.simpleName}")
            return
        }
        try {
            val mapData = gson.fromJson<MutableMap<String, String?>>(icons.toString(), MutableMap::class.java)
            if (mapData == null) {
                logger.error("setIcons: failed to parse JSON, raw=$icons")
                return
            }
            if (mapData.isEmpty()) {
                logger.warn("setIcons: empty map, fallback to default icons")
            }

            cachedIcons = RoomViewIcons(
                defaultAvatarDrawable = resolveDrawable(mapData["defaultAvatar"]),
                defaultAvatar = resolveDrawableId(mapData["defaultAvatar"]),
                microphoneOnDrawable = resolveDrawable(mapData["microphoneOn"]),
                microphoneOn = resolveDrawableId(mapData["microphoneOn"]),
                microphoneOffDrawable = resolveDrawable(mapData["microphoneOff"]),
                microphoneOff = resolveDrawableId(mapData["microphoneOff"]),
                roleOwnerDrawable = resolveDrawable(mapData["roleOwner"]),
                roleOwner = resolveDrawableId(mapData["roleOwner"]),
                roleManagerDrawable = resolveDrawable(mapData["roleManager"]),
                roleManager = resolveDrawableId(mapData["roleManager"]),
                arrowLeftDrawable = resolveDrawable(mapData["arrowLeft"]),
                arrowLeft = resolveDrawableId(mapData["arrowLeft"]),
                arrowRightDrawable = resolveDrawable(mapData["arrowRight"]),
                arrowRight = resolveDrawableId(mapData["arrowRight"]),
            )

            if (isNativeViewInitialized) {
                isNativeViewInitialized = false
                nativeRoomView = null
                removeAllViews()
                tryInitializeView()
            }
        } catch (e: Exception) {
            logger.error("setIcons failed: ${e.message}, raw=$icons")
        }
    }

    private fun parseRoomType(value: Int): RoomType {
        return when (value) {
            2 -> RoomType.WEBINAR
            else -> RoomType.STANDARD
        }
    }

    private fun isFilePath(name: String?): Boolean {
        if (name.isNullOrEmpty()) return false
        return name.startsWith("file://") || name.startsWith("/")
    }

    private fun resolveDrawable(name: String?): Drawable? {
        if (!isFilePath(name)) return null
        val raw = name!!
        val path = try {
            if (raw.startsWith("file://")) URI(raw).path else raw
        } catch (_: Exception) {
            raw.removePrefix("file://")
        }
        if (path.isNullOrEmpty()) return null
        return try {
            val file = File(path)
            if (!file.exists() || !file.isFile) {
                logger.warn("resolveDrawable: file not found: $path")
                return null
            }
            val bitmap = BitmapFactory.decodeFile(path)
            if (bitmap == null) {
                logger.warn("resolveDrawable: decodeFile returned null: $path")
                return null
            }
            BitmapDrawable(context.resources, bitmap)
        } catch (e: Exception) {
            logger.error("resolveDrawable failed for $path: ${e.message}")
            null
        }
    }

    private fun resolveDrawableId(name: String?): Int {
        if (name.isNullOrEmpty()) return 0
        if (isFilePath(name)) return 0
        return try {
            context.resources.getIdentifier(name, "drawable", context.packageName)
        } catch (e: Exception) {
            logger.error("resolveDrawableId failed for $name: ${e.message}")
            0
        }
    }

    private fun tryInitializeView() {
        if (isNativeViewInitialized) return
        if (!isAttached) return
        if (cachedRoomID.isEmpty()) return

        removeAllViews()

        try {
            val roomView = RoomView(context, null, 0)
            val layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            addView(roomView, layoutParams)

            roomView.init(cachedRoomID, cachedRoomType, cachedIcons)

            nativeRoomView = roomView
            isNativeViewInitialized = true
            logger.info("initializeView: roomID=$cachedRoomID roomType=$cachedRoomType")
        } catch (e: Throwable) {
            logger.error("initializeView failed: roomID=$cachedRoomID roomType=$cachedRoomType err=${e.message}")
            removeAllViews()
            nativeRoomView = null
            isNativeViewInitialized = false
        }
    }
}
