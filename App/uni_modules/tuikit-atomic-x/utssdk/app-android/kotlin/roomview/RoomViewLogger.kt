package uts.sdk.modules.atomicx.kotlin.roomview

import android.util.Log
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine
import org.json.JSONException
import org.json.JSONObject

/**
 * Logger utility for the RoomView module.
 *
 * Dual channel:
 *  - Always writes to logcat (for local debugging).
 *  - Best-effort forward to the TUI SDK log channel via
 *    [TUIRoomEngine.callExperimentalAPI] with `"TuikitLog"`, so logs can be
 *    collected on the server side. Serialization failures or an uninitialized
 *    engine never affect the logcat path.
 *
 * Usage:
 * ```kotlin
 * private val logger = RoomViewLogger.getLogger("MyView")
 * logger.info("hello")
 * ```
 */
class RoomViewLogger private constructor(
    private val moduleName: String,
    private val fileName: String
) {

    companion object {
        const val MODULE_NAME = "RoomView"

        private const val API = "TuikitLog"
        private const val LOG_KEY_API = "api"
        private const val LOG_KEY_PARAMS = "params"
        private const val LOG_KEY_PARAMS_LEVEL = "level"
        private const val LOG_KEY_PARAMS_MESSAGE = "message"
        private const val LOG_KEY_PARAMS_MODULE = "module"
        private const val LOG_KEY_PARAMS_FILE = "file"
        private const val LOG_KEY_PARAMS_LINE = "line"

        private const val LOG_LEVEL_INFO = 0
        private const val LOG_LEVEL_WARNING = 1
        private const val LOG_LEVEL_ERROR = 2

        private const val LOGCAT_TAG = "RoomView"

        @JvmStatic
        fun getLogger(file: String) = RoomViewLogger(MODULE_NAME, file)

        private fun log(module: String, file: String, level: Int, message: String) {
            // 1. Always write to logcat for local debugging.
            when (level) {
                LOG_LEVEL_WARNING -> Log.w(LOGCAT_TAG, "[$file] $message")
                LOG_LEVEL_ERROR -> Log.e(LOGCAT_TAG, "[$file] $message")
                else -> Log.i(LOGCAT_TAG, "[$file] $message")
            }

            // 2. Best-effort forward to the TUI SDK log channel; silently
            //    swallow any failure so logging cannot affect the UI.
            try {
                val payload = JSONObject().apply {
                    put(LOG_KEY_API, API)
                    put(LOG_KEY_PARAMS, JSONObject().apply {
                        put(LOG_KEY_PARAMS_LEVEL, level)
                        put(LOG_KEY_PARAMS_MESSAGE, message)
                        put(LOG_KEY_PARAMS_MODULE, module)
                        put(LOG_KEY_PARAMS_FILE, file)
                        put(LOG_KEY_PARAMS_LINE, 0)
                    })
                }.toString()
                TUIRoomEngine.sharedInstance().callExperimentalAPI(payload, null)
            } catch (e: JSONException) {
                Log.e(LOGCAT_TAG, e.toString())
            } catch (e: Throwable) {
                Log.e(LOGCAT_TAG, "log forward failed: $e")
            }
        }
    }

    fun info(message: String) = log(moduleName, fileName, LOG_LEVEL_INFO, message)
    fun warn(message: String) = log(moduleName, fileName, LOG_LEVEL_WARNING, message)
    fun error(message: String) = log(moduleName, fileName, LOG_LEVEL_ERROR, message)
}
