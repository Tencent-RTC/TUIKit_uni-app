<template>
    <div class="panel-box">
        <div class="panel-item" @click="handleCall">
            <image class="panel-icon" :src="CallVideoIcon"></image>
        </div>
        <text class="panel-text">视频通话</text>
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
import { removeC2C } from '../../../utils';
import { TUIBridge } from '../../../TUIBridge';
import { EVENT } from '../../../constants/event';
import { isCallIntegrated } from '../../../utils/callIntegration';
export default {
  data() {
    return {
      CallVideoIcon: require('../../../assets/chat/call-video.svg')
    }
  },
  methods: {
    handleCall() {
      this.$emit('closePanel');
      const { activeConversation } = useConversationListState();
      if (!isCallIntegrated()) {
        uni.showToast({ title: '通话功能未集成', icon: 'none' });
        return;
    }
      if (activeConversation.type === 'GROUP') {
        // 群聊：触发显示用户选择器事件
        this.$emit('showUserPicker', { type: 2 });
      } else {
        // 单聊：直接呼叫
        const userID = removeC2C(activeConversation.conversationID);
        TUIBridge.notifyEvent({
          eventName: EVENT.ON_CALLS,
          params: {
            userIDList: [userID],
            type: 2,
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