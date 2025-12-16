package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import io.trtc.tuikit.atomicxcore.api.login.LoginStatus
import io.trtc.tuikit.atomicxcore.api.login.LoginStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object LoginStoreObserver {
    private val gson = GsonBuilder().serializeNulls().create()
    private var bindDataJob: Job? = null

    fun loginStoreChanged(callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                LoginStore.shared.loginState.loginUserInfo.collect { userInfo ->
                    callback("loginUserInfo", gson.toJson(userInfo))
                }
            }
            launch {
                LoginStore.shared.loginState.loginStatus.collect { loginStatus ->
                    // UNLOGIN \ LOGINED
                    callback("loginStatus", gson.toJson(loginStatus))
                }
            }
        }
    }
}
