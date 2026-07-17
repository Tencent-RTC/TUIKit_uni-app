<template>
  <div class="panel-box">
    <div class="panel-item" @click="handleCall">
      <image class="panel-icon" :src="CallVoiceIcon"></image>
    </div>
    <text class="panel-text">语音通话</text>
  </div>
</template>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
  }
}
</script>

<script lang="ts">
// @ts-nocheck
import { useConversationListState } from '../../../states/ConversationListState';
import { removeC2C } from '../../../utils'
import { TUIBridge } from '../../../TUIBridge';
import { EVENT } from '../../../constants/event';
import { isCallIntegrated } from '../../../utils/callIntegration';
export default {
  data() {
    return {
      CallVoiceIcon: require('../../../assets/chat/call-voice.svg')
    };
  },
  methods: {
    handleCall() {
      this.$emit('closePanel');
      if (!isCallIntegrated()) {
        uni.showToast({ title: '通话功能未集成', icon: 'none' });
        return;
    }
      const { activeConversation } = useConversationListState();

      if (activeConversation.type === 'GROUP') {
        // 群聊：触发显示用户选择器事件
        this.$emit('showUserPicker', { type: 1 });
      } else {
        // 单聊：直接呼叫
        const userID = removeC2C(activeConversation.conversationID);
        TUIBridge.notifyEvent({
          eventName: EVENT.ON_CALLS,
          params: {
            userIDList: [userID],
            type: 1,
          },
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import './AttachmentPicker.module.scss';
</style>