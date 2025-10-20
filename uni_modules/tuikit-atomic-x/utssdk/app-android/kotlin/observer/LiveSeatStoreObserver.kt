package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.LiveSeatStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import uts.sdk.modules.atomicx.kotlin.Logger
import io.dcloud.uts.console

object LiveSeatStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun liveSeatStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                LiveSeatStore.create(liveID).liveSeatState.seatList.collect { seatList ->
                    val list = gson.toJson(seatList)
                    console.info("UTS-Live: liveSeatStoreChanged, seatList: ", list)
                    Logger.i("UTS-Live: " + "liveSeatStoreChanged, seatList: "+ list);
                    callback("seatList", gson.toJson(seatList))
                }
            }
            launch {
                LiveSeatStore.create(liveID).liveSeatState.canvas.collect { canvas ->
                    callback("canvas", gson.toJson(canvas))
                }
            }
            launch {
                LiveSeatStore.create(liveID).liveSeatState.speakingUsers.collect { speakingUsers ->
                    callback("speakingUsers", gson.toJson(speakingUsers))
                }
            }
        }
    }
} 