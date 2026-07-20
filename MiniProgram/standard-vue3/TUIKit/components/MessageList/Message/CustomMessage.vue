<template>
    <view class="bubble" :class="{ 'bubble-me': message?.flow === 'out' }">
        <div v-if="isCallSignaling(message)" @click="rePlayCall(handleCallKitSignaling(message).callType)"
            style="display: flex; align-items: center;">
            <image class="callMessage-icon"
                :src="handleCallKitSignaling(message).callType === 1 ? CallVoiceIcon : CallVideoIcon" />
            <text class="text">{{ handleCallKitSignaling(message).callTip }}</text>
        </div>
        <div v-else>
            <text class="text">{{ message?.payload }}</text>
        </div>
    </view>
</template>


<script lang="ts" setup>
import { useMessageListState } from '../../../index';
import CallVoiceIcon from '../../../assets/chat/voice-call-message.svg';
import CallVideoIcon from '../../../assets/chat/call-video.svg';
import { removeC2C } from '../../../utils';
import { isCallIntegrated } from '../../../utils/callIntegration';
import { handleCallKitSignaling, isCallSignaling } from '../../../utils/processCallSignaling';
import { TUIBridge } from '../../../TUIBridge';
import { EVENT } from '../../../constants/event';
const { activeConversationID } = useMessageListState();
const props = defineProps({
    message: {
        type: Object,
    },
})

async function rePlayCall(callType) {
    // When the Call kit is not installed in the host project, the On_Calls
    // event has no listener and notifyEvent would silently no-op. Surface a
    // hint instead so the user understands why nothing happened.
    if (!isCallIntegrated()) {
        uni.showToast({ title: '通话功能未集成', icon: 'none' });
        return;
    }
    const userID = removeC2C(activeConversationID.value)
    TUIBridge.notifyEvent({
        eventName: EVENT.ON_CALLS,
        params: {
            userIDList: [userID],
            type: callType,
        },
    });
}

</script>

<style lang="scss" scoped>
@import './Message.module.scss';
</style>