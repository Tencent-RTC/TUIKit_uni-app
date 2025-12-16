package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.gift.GiftStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object GiftStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun giftStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                GiftStore.create(liveID).giftState.usableGifts.collect { usableGifts ->
                    callback("usableGifts", gson.toJson(usableGifts))
                }
            }
        }
    }
}