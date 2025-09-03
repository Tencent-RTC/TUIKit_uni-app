package uts.sdk.modules.uiComponent.kotlin

import android.graphics.BitmapFactory
import android.text.TextUtils
import com.google.gson.Gson
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine
import com.tencent.cloud.uikit.state.common.Logger

private const val TAG = "UTS-CallExperimentalApi: "

object ExperimentalApiInvoker {
    private val gson = Gson()

    // const data = { "api": "setTestEnvironment", "params": { "enableRoomTestEnv": true } } // 设置 IM 测试环境
    // const data = { "api": "setLocalVideoMuteImage", "params": { "image": "filePath" } }   // 设置垫片
    // const giftData = { "api": "setCurrentLanguage", "params": { "language" : "en"} }      // 礼物功能设置语言
    public fun callExperimentalAPI(jsonString: String, callback: TUIRoomDefine.ExperimentalAPIResponseCallback?) {
        val requestData: RequestData = gson.fromJson(jsonString, RequestData::class.java)
        if (requestData.api == "setLocalVideoMuteImage") {
            setLocalVideoMuteImage(requestData, callback)
            return
        }

        TUIRoomEngine.sharedInstance().callExperimentalAPI(jsonString) { jsonData ->
            Logger.i(TAG + "${requestData.api}: onResponse: $jsonData")
            callback?.onResponse(jsonData)
        }
    }

    private fun setLocalVideoMuteImage(data: RequestData, callback: TUIRoomDefine.ExperimentalAPIResponseCallback?) {
        try {
            val filePath = data.params?.image

            if (TextUtils.isEmpty(filePath)) {
                Logger.e(TAG + "setLocalVideoMuteImage: filePath is empty")
                callback?.onResponse("setLocalVideoMuteImage: filePath is empty")
                return
            }

            val bitmap = BitmapFactory.decodeFile(filePath)
            TUIRoomEngine.sharedInstance().setLocalVideoMuteImage(bitmap)
        } catch (e: Exception) {
            Logger.e(TAG + "setLocalVideoMuteImage: ${e.message}")
            callback?.onResponse("setLocalVideoMuteImage: unexpected error")
        }
    }
}

data class RequestData(
    val api: String,
    val params: Params?,
)

// 不要修改数据,每个数据对应一个关键字
data class Params(
    val image: String?
)