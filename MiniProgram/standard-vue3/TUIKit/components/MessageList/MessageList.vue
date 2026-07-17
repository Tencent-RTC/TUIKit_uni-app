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
            <view v-for="(message, index) in messageList">

                <!-- 群 tips 消息 -->
                <GroupTipMessage v-if="shouldRenderAsGroupTip(message)" :message="message" />

                <!-- 消息时间分割线 -->
                <MessageTimestamp v-if="!shouldRenderAsGroupTip(message)" :currTime="message.time"
                    :prevTime="index > 0 ? messageList[index - 1].time : 0" />
                <!-- 非群 tips 消息 -->
                <view v-if="isSupportedMessageType(message)" :id="`msg-${message.ID}`" class="message-item"
                    :class="{ 'message-item-me': message?.flow === 'out' }">
                    <!-- 消息头像 -->
                    <Avatar :avatarStyle="avatarStyle" :src="message?.avatar || DefaultAvatarIcon" />
                    <!-- 消息内容 -->
                    <view class="message-content">
                        <!-- 群聊用户名显示 -->
                        <view v-if="activeConversation?.type === 'GROUP' && message?.flow === 'in'" class="sender-name">
                            {{ getDisplayName(message) }}
                        </view>
                        <!-- 文本消息 -->
                        <TextMessage v-if="message?.type === MessageType.MSG_TEXT" :message="message" />
                        <!-- 通话消息 -->
                        <CustomMessage v-if="message?.type === MessageType.MSG_CUSTOM" :message="message" />
                        <!-- 图片消息 -->
                        <ImageMessage v-if="message?.type === MessageType.MSG_IMAGE" :message="message" />
                        <!-- 视频消息 -->
                        <VideoMessage v-if="message?.type === MessageType.MSG_VIDEO" :message="message" />
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
export default {
    options: {
        virtualHost: true,
    }
}
</script>

<script lang="ts" setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import Avatar from '../Avatar/Avatar.vue'
import TextMessage from './Message/TextMessage.vue';
import CustomMessage from './Message/CustomMessage.vue';
import ImageMessage from './Message/ImageMessage.vue';
import VideoMessage from './Message/VideoMessage.vue';
import GroupTipMessage from './Message/GroupTipMessage.vue';
import MessageStatus from './MessageStatus/MessageStatus.vue';
import MessageTimestamp from './MessageTimeDivider/MessageTimeDivider.vue';
import DefaultAvatarIcon from '../../assets/base/default-avatar.png';
import NewMessageTipIcon from '../../assets/chat/new-message.svg';
import { useMessageListState, useConversationListState } from '../../chat';
import { isCallSignaling } from '../../utils/processCallSignaling';
import { MessageType } from '../../constants/chat'

const { setActiveConversation, activeConversation } = useConversationListState()
const { messageList, loadMoreOlderMessage, hasMoreOlderMessage } = useMessageListState();
const scrollViewRef = ref();
const showNewMessageTip = ref(false);
const newMessageCount = ref(0);
const autoScroll = ref(true);
const isLoadingOlderMessage = ref(false);
const showNoMoreTip = ref(false);
const historyFirstMessageID = ref<string>('');
const currentMessage = ref('');
const avatarStyle = ref({
    width: '40px',
    height: '40px',
    borderRadius: '5px'
})

// 获取显示的用户名
const getDisplayName = (message: any) => {
    const nameCard = message?.nameCard || '';
    const senderNick = message?.nick || '';
    const senderUserID = message?.from || '';

    // 如果是群聊，按优先级显示：nameCard > nick > userID
    if (activeConversation.value?.type === 'GROUP') {
        return nameCard || senderNick || senderUserID;
    }

    // 如果不是群聊，只显示昵称
    return senderNick || senderUserID;
};

const isSupportedMessageType = (message) => {
    const type = message?.type
    return [
        MessageType.MSG_TEXT,
        MessageType.MSG_CUSTOM,
        MessageType.MSG_IMAGE,
        MessageType.MSG_VIDEO
    ].includes(type) && !shouldRenderAsGroupTip(message)
}

const newMessageTipText = computed(() => {
    return `${newMessageCount.value}条新消息`
})

const scrollToBottom = () => {
    if (messageList.value?.length) {
        const lastMessage = messageList.value[messageList.value.length - 1]
        const targetId = `msg-${lastMessage.ID}`
        // Clear and re-set to ensure scroll triggers even when value is the same
        if (currentMessage.value === targetId) {
            currentMessage.value = ''
            setTimeout(() => {
                currentMessage.value = targetId
            }, 50)
        } else {
            currentMessage.value = targetId
        }
    }
}

const handleNewMessageTipClick = () => {
    showNewMessageTip.value = false
    newMessageCount.value = 0
    autoScroll.value = true
    scrollToBottom()
}

const handleScrollToTop = async (e) => {
    if (isLoadingOlderMessage.value) return;

    if (!hasMoreOlderMessage.value) {
        showNoMoreTip.value = true;
        setTimeout(() => {
            showNoMoreTip.value = false;
        }, 1000);
        return;
    }

    isLoadingOlderMessage.value = true;
    const currentFirstMessageID = messageList.value?.[0]?.ID || '';
    await loadMoreOlderMessage();
    historyFirstMessageID.value = currentFirstMessageID;
    isLoadingOlderMessage.value = false;
}

const handleScrollToBottom = () => {
    showNewMessageTip.value = false
}

onMounted(() => {
    scrollToBottom()
    // Listen for keyboard pop-up to auto scroll to bottom
    uni.$on('TUIChat:keyboardHeightChange', () => {
        scrollToBottom()
    })
})

onUnmounted(() => {
    setActiveConversation('')
    uni.$off('TUIChat:keyboardHeightChange')
})

watch(messageList, (newVal, oldVal) => {
    if (!newVal?.length) return

    const lastMessage = newVal[newVal.length - 1]
    const isMyMessage = lastMessage?.flow === 'out'

    if (isMyMessage) {
        scrollToBottom()
    } else {
        if (autoScroll.value) {
            // 新消息如果在底部一个屏幕范围内，自动滚动
            scrollToBottom()
            showNewMessageTip.value = false
            newMessageCount.value = 0
        } else {
            // 否则显示新消息提示
            newMessageCount.value += 1
            showNewMessageTip.value = true
        }
    }
}, { deep: true });

const shouldRenderAsGroupTip = (message: any) => {
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
    if ( message.type === MessageType.MSG_GRP_TIP ) {
        return true
    }

    return false;
};
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