package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.Barrage
import io.trtc.tuikit.atomicxcore.api.BarrageStore
import io.trtc.tuikit.atomicxcore.api.BarrageType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object BarrageStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun barrageStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                BarrageStore.create(liveID).barrageState.messageList.collect { messageList ->
                    callback("messageList", gson.toJson(messageList))
                }
            }
            // TODO: 底层未实现，暂时隐藏
            // launch {
            //     BarrageStore.create(liveID).barrageState.allowSendMessage.collect { allowSendMessage ->
            //         callback("allowSendMessage", gson.toJson(allowSendMessage))
            //     }
            // }
        }
    }
}
