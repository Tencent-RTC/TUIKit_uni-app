package uts.sdk.modules.atomicx.observer

import com.google.gson.Gson
import io.trtc.tuikit.atomicxcore.api.live.BattleStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object BattleStoreObserver {
    private val gson = Gson()
    private var bindDataJob: Job? = null

    fun battleStoreChanged(liveID: String, callback: (String, String) -> Unit) {
        bindDataJob?.cancel()
        bindDataJob = CoroutineScope(Dispatchers.Main).launch {
            launch {
                BattleStore.create(liveID).battleState.currentBattleInfo.collect { currentBattleInfo ->
                    callback("currentBattleInfo", gson.toJson(currentBattleInfo))
                }
            }
            
            launch {
                BattleStore.create(liveID).battleState.battleUsers.collect { battleUsers ->
                    callback("battleUsers", gson.toJson(battleUsers))
                }
            }
            
            launch {
                BattleStore.create(liveID).battleState.battleScore.collect { battleScore ->
                    callback("battleScore", gson.toJson(battleScore))
                }
            }
        }
    }
}