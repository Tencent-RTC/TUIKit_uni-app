package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.GiftMessage
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import com.tencent.cloud.uikit.state.common.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

private const val TAG = "UTS-GiftStoreObserver: "

object GiftStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun giftStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {

            launch {
                V2RTCRoomEngine.getInstance().getGiftStore(liveId).giftState.giftInfoList.collect { giftInfoList ->
                    callback("giftInfoList", gson.toJson(giftInfoList))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getGiftStore(liveId).giftState.latestGift.collect { latestGift ->
                    Logger.i(TAG + "latestGift: $latestGift")
                    callback("latestGift", gson.toJson(convertGiftMessage(latestGift)))
                }
            }
            launch {
                V2RTCRoomEngine.getInstance().getGiftStore(liveId).giftState.giftStatics.collect { giftStatics ->
                    callback("giftStatics", gson.toJson(giftStatics))
                }
            }
        }
    }

    private fun convertGiftMessage(message: GiftMessage): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["roomId"] = message.roomId
        map["giftCount"] = message.giftCount
        map["sender"] = TypeConvert.convertUserInfoToMap(message.sender)
        map["giftInfo"] = message.giftInfo
        return map
    }
}