package uts.sdk.modules.uiComponent.observer

import com.google.gson.Gson
import com.tencent.cloud.uikit.state.AudienceInfo
import com.tencent.cloud.uikit.state.V2RTCRoomEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.uiComponent.kotlin.observer.TypeConvert

object LiveAudienceStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveAudienceStoreChanged(liveId: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                V2RTCRoomEngine.getInstance()
                    .getLiveAudienceStore(liveId).liveAudienceState.audienceList.collect { audienceList ->
                        val list = audienceList?.map { convertAudienceInfoToMap(it) }
                        callback("audienceList", gson.toJson(list))
                    }
            }

            launch {
                V2RTCRoomEngine.getInstance().getLiveAudienceStore(liveId).liveAudienceState.audienceListCursor
                    .collect { cursor ->
                        callback("audienceListCursor", gson.toJson(cursor))
                    }
            }

        }
    }

    private fun convertAudienceInfoToMap(info: AudienceInfo): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        map["userId"] = info.userId
        map["userName"] = info.userName
        map["avatarUrl"] = info.avatarUrl
        map["customInfo"] = info.customInfo
        map["userRole"] = TypeConvert.convertUserRole(info.userRole)
        map["isMessageDisabled"] = info.isMessageDisabled
        map["joinedTimestamp"] = info.joinedTimestamp
        return map
    }
} 