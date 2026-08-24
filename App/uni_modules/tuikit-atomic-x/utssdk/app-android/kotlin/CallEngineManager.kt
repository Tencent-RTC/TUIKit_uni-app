package uts.sdk.modules.atomicx.kotlin

import android.content.Context
import com.tencent.cloud.tuikit.engine.call.TUICallEngine
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine

object CallEngineManager {

    private const val TAG = "UTS-CallEngineManager: "

    /**
     * 初始化 TUICallEngine
     * @param context 上下文
     * @param sdkAppID 腾讯云 SDKAppID
     * @param userID 用户 ID
     * @param userSig 用户签名
     */
    fun initEngine(context: Context, sdkAppID: Int, userID: String, userSig: String) {
        TUICallEngine.createInstance(context).init(sdkAppID, userID, userSig, object : TUICommonDefine.Callback {
            override fun onSuccess() {
                Logger.i(TAG + "TUICallEngine init success")
            }

            override fun onError(code: Int, message: String?) {
                Logger.e(TAG + "TUICallEngine init failed, code: $code, message: ${message ?: ""}")
            }
        })
    }
}
