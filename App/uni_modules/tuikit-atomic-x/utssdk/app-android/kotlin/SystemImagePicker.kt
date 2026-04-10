package uts.sdk.modules.atomicx.kotlin

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import java.io.File
import java.io.FileOutputStream

object SystemImagePicker {
    private const val IMAGE_PICK_REQUEST_CODE = 30001

    private var successCallback: ((String) -> Unit)? = null
    private var cancelCallback: (() -> Unit)? = null

    fun pickSingleImage(
        activity: Activity,
        onSuccess: (String) -> Unit,
        onCancel: () -> Unit
    ) {
        successCallback = onSuccess
        cancelCallback = onCancel

        val intent = Intent(
            Intent.ACTION_PICK,
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        )
        intent.type = "image/*"
        activity.startActivityForResult(
            intent, IMAGE_PICK_REQUEST_CODE
        )
    }

    fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode != IMAGE_PICK_REQUEST_CODE) return
        if (resultCode != Activity.RESULT_OK || data == null) {
            cancelCallback?.invoke()
            clearCallbacks()
            return
        }
        val uri = data.data
        if (uri == null) {
            cancelCallback?.invoke()
            clearCallbacks()
            return
        }
        try {
            val path = copyToTempFile(activity, uri)
            if (path != null) {
                successCallback?.invoke(path)
            } else {
                cancelCallback?.invoke()
            }
        } catch (e: Throwable) {
            android.util.Log.e(
                "SystemImagePicker",
                "pickSingleImage error", e
            )
            cancelCallback?.invoke()
        }
        clearCallbacks()
    }

    private fun copyToTempFile(
        activity: Activity,
        uri: Uri
    ): String? {
        val resolver = activity.contentResolver
        val ext = getExtension(resolver, uri)
        val tempFile = File(
            activity.cacheDir,
            "${System.currentTimeMillis()}.$ext"
        )
        resolver.openInputStream(uri)?.use { input ->
            FileOutputStream(tempFile).use { output ->
                input.copyTo(output)
            }
        } ?: return null
        return tempFile.absolutePath
    }

    private fun getExtension(
        resolver: android.content.ContentResolver,
        uri: Uri
    ): String {
        val mimeType = resolver.getType(uri)
        if (mimeType != null) {
            val ext = MimeTypeMap.getSingleton()
                .getExtensionFromMimeType(mimeType)
            if (!ext.isNullOrEmpty()) return ext
        }
        return "jpg"
    }

    private fun clearCallbacks() {
        successCallback = null
        cancelCallback = null
    }
}
