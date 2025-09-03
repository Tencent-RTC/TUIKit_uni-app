package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.MessageInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object BarrageStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun barrageStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance().getBarrageStore(liveId).barrageState.messageList.collect { messageList ->
                    val list = messageList.map { convertMessageInfoToMap(it) }
                    callback("messageList", gson.toJson(list))
                }
            }
        }
    }

    private fun convertMessageInfoToMap(messageInfo: MessageInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["roomId"] = messageInfo.roomId
        map["sender"] = TypeConvert.convertUserInfoToMap(messageInfo.sender)
        map["sequence"] = messageInfo.sequence
        map["timestampInSecond"] = messageInfo.timestampInSecond
        map["messageType"] = convertMessageType(messageInfo.messageType.value)
        map["textContent"] = messageInfo.textContent
        map["extensionInfo"] = messageInfo.extensionInfo
        map["businessId"] = messageInfo.businessId
        map["data"] = messageInfo.data
        return map
    }

    private fun convertMessageType(type: Int): String {
        if (type == 1) {
            return "CUSTOM"
        }
        return "TEXT"
    }
}
