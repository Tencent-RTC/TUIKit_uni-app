package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LoginStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun loginStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().loginState.loginUserInfo.collect { userInfo ->
                    callback("loginUserInfo", gson.toJson(userInfo))
                }
            }

            launch {
                V2RTCRoomEngine.getInstance().loginState.loginStatus.collect { loginStatus ->
                    callback("loginStatus", gson.toJson(loginStatus.value))
                }
            }
        }
    }
}