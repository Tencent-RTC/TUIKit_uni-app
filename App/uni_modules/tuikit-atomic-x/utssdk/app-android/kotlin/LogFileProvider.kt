package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class LogFileProvider {
    companion object {
        val shared = LogFileProvider()
    }

    private val fileModelArray = mutableListOf<Pair<String, String>>()

    /**
     * 获取日志文件列表
     * 与 iOS LogUpload.fetchLogfileList 对齐，扫描以下目录：
     * 1. context.filesDir/log/  下的 .clog 文件（对应 iOS Documents/log/）
     * 2. context.filesDir/log/  下的 .xlog 文件（对应 iOS Documents/log/）
     * 3. context.cacheDir/com_tencent_imsdk_log/ 下的 .xlog 文件（对应 iOS Library/Caches/com_tencent_imsdk_log/）
     * 同时也扫描外部存储对应路径作为补充（部分 SDK 配置可能使用外部存储）
     *
     * @param context Android Context
     * @return 日志文件列表 JSON 字符串，格式: [{"fileName": string, "filePath": string}]
     */
    fun fetchLogfileList(context: Context): String {
        fileModelArray.clear()
        val jsonArray = JSONArray()

        // 1. 扫描 TRTC/LiteAV 日志目录
        //    内部存储: context.filesDir/log/ （对应 iOS Documents/log/）
        //    外部存储: context.getExternalFilesDir(null)/log/
        val logDirs = mutableListOf<File>()
        context.filesDir?.let { logDirs.add(File(it, "log")) }
        context.getExternalFilesDir(null)?.let { logDirs.add(File(it, "log")) }

        for (logDir in logDirs) {
            collectFiles(logDir, ".clog", jsonArray)
            collectFiles(logDir, ".xlog", jsonArray)
        }

        // 2. 扫描 IM SDK 日志目录（对应 iOS Library/Caches/com_tencent_imsdk_log/）
        val imsdkLogDirs = mutableListOf<File>()
        imsdkLogDirs.add(File(context.cacheDir, "com_tencent_imsdk_log"))
        context.externalCacheDir?.let { imsdkLogDirs.add(File(it, "com_tencent_imsdk_log")) }

        for (dir in imsdkLogDirs) {
            collectFiles(dir, ".xlog", jsonArray)
        }

        android.util.Log.i("LogFileProvider", "fetchLogfileList found ${jsonArray.length()} files")

        return jsonArray.toString()
    }

    /**
     * 分享指定索引的日志文件（弹出系统分享面板）
     *
     * @param activity Activity Context，用于启动分享 Intent
     * @param row 日志文件在列表中的索引
     */
    fun shareLog(activity: Context, row: Int) {
        if (row < 0 || row >= fileModelArray.size) {
            return
        }
        val (fileName, filePath) = fileModelArray[row]
        val file = File(filePath)
        if (!file.exists()) {
            return
        }

        try {
            // 尝试使用 FileProvider 创建 content URI（Android 7.0+ 需要）
            val uri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.atomicx.fileprovider",
                file
            )
            startShareIntent(activity, uri, fileName)
        } catch (e: Exception) {
            // Fallback: 尝试直接使用 file URI（低版本 Android 可用）
            try {
                val uri = Uri.fromFile(file)
                startShareIntent(activity, uri, fileName)
            } catch (e2: Exception) {
                android.util.Log.e("LogFileProvider", "Failed to share log file: ${e2.message}")
            }
        }
    }

    private fun startShareIntent(context: Context, uri: Uri, fileName: String) {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "*/*"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(shareIntent, fileName)
        // 解决可能从非 Activity Context 启动的问题
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }

    private fun collectFiles(directory: File, extension: String, jsonArray: JSONArray) {
        if (!directory.exists() || !directory.isDirectory) {
            return
        }
        val files = directory.listFiles() ?: return
        for (file in files) {
            if (file.isDirectory) {
                // 递归扫描子目录（TRTC 日志可能在 log/liteav/ 等子目录中）
                collectFiles(file, extension, jsonArray)
            } else if (file.isFile && file.name.endsWith(extension)) {
                val jsonObj = JSONObject()
                jsonObj.put("fileName", file.name)
                jsonObj.put("filePath", file.absolutePath)
                jsonArray.put(jsonObj)
                fileModelArray.add(Pair(file.name, file.absolutePath))
            }
        }
    }
}
