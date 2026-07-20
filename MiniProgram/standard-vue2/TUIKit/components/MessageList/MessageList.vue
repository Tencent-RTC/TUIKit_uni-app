<template>
  <div class="message-container">
      <!-- 消息列表滚动区域 -->
      <scroll-view ref="scrollViewRef" scroll-y class="message-list" :scroll-into-view="currentMessage"
          scroll-with-animation @scrolltolower="handleScrollToBottom" @scrolltoupper="handleScrollToTop">
          <!-- 下拉加载提示 -->
          <view v-if="isLoadingOlderMessage || showNoMoreTip" class="loading-tip">
              <text>{{ isLoadingOlderMessage ? '加载中...' : '没有更多消息了' }}</text>
          </view>
          <!-- 消息列表 -->
          <view v-for="(message, index) in messageList" :key="message.ID || index">

              <!-- 群 tips 消息 -->
              <GroupTipMessage v-if="shouldRenderAsGroupTip(message)" :message="message" />

              <!-- 消息时间分割线 -->
              <MessageTimestamp v-if="!shouldRenderAsGroupTip(message)" :currTime="message.time"
                  :prevTime="index > 0 ? messageList[index - 1].time : 0" />
              <!-- 非群 tips 消息 -->
              <view v-if="isSupportedMessageType(message)" :id="`msg-${message.ID}`" class="message-item"
                  :class="{ 'message-item-me': message && message.flow === 'out' }">
                  <!-- 消息头像 -->
                  <Avatar :avatarStyle="avatarStyle" :src="(message && message.avatar) || DefaultAvatarIcon" />
                  <!-- 消息内容 -->
                  <view class="message-content">
                      <!-- 群聊用户名显示 -->
                      <view v-if="activeConversation && activeConversation.type === 'GROUP' && message && message.flow === 'in'" class="sender-name">
                          {{ getDisplayName(message) }}
                      </view>
                      <!-- 文本消息 -->
                      <TextMessage v-if="message && message.type === MessageType.MSG_TEXT" :message="message" />
                      <!-- 通话消息 -->
                      <CustomMessage v-if="message && message.type === MessageType.MSG_CUSTOM" :message="message" />
                      <!-- 图片消息 -->
                      <ImageMessage v-if="message && message.type === MessageType.MSG_IMAGE" :message="message" />
                      <!-- 视频消息 -->
                      <VideoMessage v-if="message && message.type === MessageType.MSG_VIDEO" :message="message" />
                  </view>
                  <!-- 消息状态 -->
                  <MessageStatus class="message-status" :message="message" />
              </view>
          </view>
      </scroll-view>

      <!-- 新消息提示条，当有新消息且不在底部时显示 -->
      <view v-if="showNewMessageTip" class="new-message-tip" @click="handleNewMessageTipClick">
          <image :src="NewMessageTipIcon"></image>
          {{ newMessageTipText }}
      </view>

  </div>
</template>

<script lang="ts">
// @ts-nocheck
import Avatar from '../Avatar/Avatar.vue'
import TextMessage from './Message/TextMessage.vue';
import CustomMessage from './Message/CustomMessage.vue';
import ImageMessage from './Message/ImageMessage.vue';
import VideoMessage from './Message/VideoMessage.vue';
import MessageStatus from './MessageStatus/MessageStatus.vue';
import MessageTimestamp from './MessageTimeDivider/MessageTimeDivider.vue';
import GroupTipMessage from './Message/GroupTipMessage.vue';
import DefaultAvatarIcon from '../../assets/base/default-avatar.png';
import NewMessageTipIcon from '../../assets/chat/new-message.svg';
import { useMessageListState, useConversationListState } from '../../chat';
import { isCallSignaling } from '../../utils/processCallSignaling';
import { MessageType } from '../../constants/chat';

export default {
  options: {
      virtualHost: true,
  },
  components: {
      Avatar,
      TextMessage,
      CustomMessage,
      ImageMessage,
      VideoMessage,
      MessageStatus,
      MessageTimestamp,
      GroupTipMessage
  },
  data() {
      return {
          showNewMessageTip: false,
          newMessageCount: 0,
          autoScroll: true,
          isLoadingOlderMessage: false,
          showNoMoreTip: false,
          historyFirstMessageID: '',
          currentMessage: '',
          avatarStyle: {
              width: '40px',
              height: '40px',
              borderRadius: '5px'
          },
          MessageType: MessageType,
          DefaultAvatarIcon: DefaultAvatarIcon,
          NewMessageTipIcon: NewMessageTipIcon
      }
  },
  computed: {
      newMessageTipText() {
          return `${this.newMessageCount}条新消息`;
      },
      messageList() {
          const { messageList } = useMessageListState();
          return messageList || [];
      },
      hasMoreOlderMessage() {
          const { hasMoreOlderMessage } = useMessageListState();
          return hasMoreOlderMessage || false;
      },
      activeConversation() {
          const { activeConversation } = useConversationListState();
          return activeConversation;
      }
  },
  mounted() {
      this.scrollToBottom();
      // Listen for keyboard pop-up to auto scroll to bottom
      uni.$on('TUIChat:keyboardHeightChange', () => {
          this.scrollToBottom();
      });
  },
  beforeDestroy() {
      const { setActiveConversation } = useConversationListState();
      setActiveConversation('');
      uni.$off('TUIChat:keyboardHeightChange');
  },
  watch: {
      messageList: {
          handler(newVal, oldVal) {
              if (!newVal || !newVal.length) return;

              const lastMessage = newVal[newVal.length - 1];
              const isMyMessage = lastMessage && lastMessage.flow === 'out';

              if (isMyMessage) {
                  this.scrollToBottom();
              } else {
                  if (this.autoScroll) {
                      // 新消息如果在底部一个屏幕范围内，自动滚动
                      this.scrollToBottom();
                      this.showNewMessageTip = false;
                      this.newMessageCount = 0;
                  } else {
                      // 否则显示新消息提示
                      this.newMessageCount += 1;
                      this.showNewMessageTip = true;
                  }
              }
          },
          deep: true,
          immediate: true
      }
  },
  methods: {
      // 获取显示的用户名
      getDisplayName(message) {
          const nameCard = message?.nameCard || '';
          const senderNick = message?.nick || '';
          const senderUserID = message?.from || '';

          // 如果是群聊，按优先级显示：nameCard > nick > userID
          if (this.activeConversation && this.activeConversation.type === 'GROUP') {
              return nameCard || senderNick || senderUserID;
          }

          // 如果不是群聊，只显示昵称
          return senderNick || senderUserID;
      },

      isSupportedMessageType(message) {
          const type = message?.type;
          return [
              MessageType.MSG_TEXT,
              MessageType.MSG_CUSTOM,
              MessageType.MSG_IMAGE,
              MessageType.MSG_VIDEO
          ].includes(type) && !this.shouldRenderAsGroupTip(message);
      },

      shouldRenderAsGroupTip(message) {
          // 创建群消息
          if (message.type === MessageType.MSG_CUSTOM && message.getMessageContent().businessID === 'group_create') {
              return true;
          }
          // 群通话消息
          if (
              message.type === MessageType.MSG_CUSTOM
              && isCallSignaling(message)
              && message.conversationType === "GROUP"
          ) {
              return true;
          }
          // 群提示消息
          if (message.type === MessageType.MSG_GRP_TIP) {
              return true;
          }

          return false;
      },
      scrollToBottom() {
          if (this.messageList && this.messageList.length) {
              const lastMessage = this.messageList[this.messageList.length - 1];
              const targetId = `msg-${lastMessage.ID}`;
              // Clear and re-set to ensure scroll triggers even when value is the same
              if (this.currentMessage === targetId) {
                  this.currentMessage = '';
                  setTimeout(() => {
                      this.currentMessage = targetId;
                  }, 50);
              } else {
                  this.currentMessage = targetId;
              }
          }
      },
      handleNewMessageTipClick() {
          this.showNewMessageTip = false;
          this.newMessageCount = 0;
          this.autoScroll = true;
          this.scrollToBottom();
      },
      async handleScrollToTop(e) {
          if (this.isLoadingOlderMessage) return;

          if (!this.hasMoreOlderMessage) {
              this.showNoMoreTip = true;
              setTimeout(() => {
                  this.showNoMoreTip = false;
              }, 1000);
              return;
          }

          this.isLoadingOlderMessage = true;
          const currentFirstMessageID = (this.messageList && this.messageList[0] && this.messageList[0].ID) || '';
          const { loadMoreOlderMessage } = useMessageListState();
          await loadMoreOlderMessage();
          this.historyFirstMessageID = currentFirstMessageID;
          this.isLoadingOlderMessage = false;
      },
      handleScrollToBottom() {
          this.showNewMessageTip = false;
      }
  }
}
</script>

<style lang="scss" scoped>
.message-container {
  background-color: #F9FAFC;
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.loading-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  color: #999;
  font-size: 14px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
      opacity: 0;
  }

  to {
      opacity: 1;
  }
}

@keyframes rotating {
  from {
      transform: rotate(0deg)
  }

  to {
      transform: rotate(360deg)
  }
}

.new-message-tip {
  position: absolute;
  bottom: 50px;
  right: 10px;
  background-color: #FFFFFF;
  color: #1C66E5;
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 12px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  image {
      width: 12px;
      height: 11px;
      margin-right: 5px;
  }
}

.message-list {
  flex: 1;
  overflow: auto;
  margin: 8px;
  overscroll-behavior: contain;

  ::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
      color: transparent;
  }

  -webkit-overflow-scrolling: touch;
}

.message-item {
  display: flex;
  margin: 7px 0;

  &.message-item-me {
      flex-direction: row-reverse;
  }
}

.message-status {
  position: relative;
}

.message-content {
  margin: 0 20rpx;
  max-width: 70%;
}

.sender-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  line-height: 1.2;
}
</style>