<template>
    <div class="panel-box">
        <div class="panel-item" @click="handleCall">
            <image class="panel-icon" :src="CallVoiceIcon"></image>
        </div>
        <text class="panel-text">语音通话</text>
    </div>
</template>


<script lang="ts" setup>
import { useConversationListState } from '../../../states/ConversationListState';
import { removeC2C } from '../../../utils'
import { isCallIntegrated } from '../../../utils/callIntegration';
import CallVoiceIcon from '../../../assets/chat/call-voice.svg'
import { TUIBridge } from '../../../TUIBridge';
import { EVENT } from '../../../constants/event';

const emit = defineEmits(['closePanel', 'showUserPicker']);
const { activeConversation } = useConversationListState();

const handleCall = () => {
    emit('closePanel');

    // When the Call kit is not installed in the host project, the On_Calls
    // event has no listener and notifyEvent would silently no-op. Surface a
    // hint instead so the user understands why nothing happened.
    if (!isCallIntegrated()) {
        uni.showToast({ title: '通话功能未集成', icon: 'none' });
        return;
    }

    if (activeConversation.value?.type === 'GROUP') {
        // 群聊：触发显示用户选择器事件
        emit('showUserPicker', { type: 1 });
    } else {
        // 单聊：直接呼叫
        const userID = removeC2C(activeConversation.value.conversationID);
        TUIBridge.notifyEvent({
            eventName: EVENT.ON_CALLS,
            params: {
                userIDList: [userID],
                type: 1,
            },
        });
    }
};
</script>

<style lang="scss" scoped>
@import './AttachmentPicker.module.scss';
</style>