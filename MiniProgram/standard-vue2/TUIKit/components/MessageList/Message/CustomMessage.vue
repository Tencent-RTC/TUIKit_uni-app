<template>
    <view class="bubble" :class="{ 'bubble-me': message && message.flow === 'out' }">
        <div v-if="isCallSignaling(message)" @click="rePlayCall(handleCallKitSignaling(message).callType)"
            style="display: flex; align-items: center;">
            <image class="callMessage-icon"
                :src="handleCallKitSignaling(message).callType === 1 ? CallVoiceIcon : CallVideoIcon" />
            <text class="text">{{ handleCallKitSignaling(message).callTip }}</text>
        </div>
        <div v-else>
            <text class="text">{{ message && message.payload }}</text>
        </div>
    </view>
</template>

<script lang="ts">
// @ts-nocheck
import { useMessageListState } from '../../../index';
import CallVoiceIcon from '../../../assets/chat/voice-call-message.svg';
import CallVideoIcon from '../../../assets/chat/call-video.svg';
import { removeC2C } from '../../../utils';
import { handleCallKitSignaling, isCallSignaling } from '../../../utils/processCallSignaling';
import { TUIBridge } from '../../../TUIBridge';
import { EVENT } from '../../../constants/event';
import { isCallIntegrated } from '../../../utils/callIntegration';
export default {
    props: {
        message: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            CallVoiceIcon,
            CallVideoIcon
        }
    },
    computed: {
        activeConversationID() {
            const { activeConversationID } = useMessageListState();
            return activeConversationID;
        }
    },
    methods: {
        isCallSignaling(message) {
            return isCallSignaling(message);
        },
        handleCallKitSignaling(message) {
            return handleCallKitSignaling(message);
        },
        async rePlayCall(callType) {
            if (!isCallIntegrated()) {
                  uni.showToast({ title: '通话功能未集成', icon: 'none' });
                  return;
            }
            const userID = removeC2C(this.activeConversationID);
            TUIBridge.notifyEvent({
                eventName: EVENT.ON_CALLS,
                params: {
                    userIDList: [userID],
                    type: callType,
                },
            });
        }
    }
}
</script>

<style lang="scss" scoped>
@import './Message.module.scss';
</style>