<template>
    <view class="conversation-list">
        <!-- 会话列表 -->
        <view v-for="conversation in conversationList" :key="conversation.conversationID" class="conversation-item"
            @click="handleItemClick(conversation)">
            <!-- 头像和未读数 -->
            <view class="avatar-container">
                <Avatar :avatarStyle='avatarStyle' :src='getConversationAvatar(conversation)'>
                </Avatar>
                <view v-if="conversation.unreadCount > 0" class="badge">
                    {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                </view>
            </view>
            <!-- 会话内容 -->
            <view class="content">
                <!-- 昵称和时间 -->
                <view class="header">
                    <text class="nickname">{{ getConversationDisplayName(conversation) }}</text>
                    <text class="time" v-if="conversation.lastMessage?.lastTime">{{
                        calculateTimestamp(conversation.lastMessage?.lastTime) }}</text>
                </view>

                <!-- 最后的消息 -->
                <view v-if="conversation.lastMessage?.type" class="footer">
                    <text class="last-message">
                        {{ getLastMessagePreview(conversation.lastMessage) }}
                    </text>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { useConversationListState } from '../../index';
import Avatar from '../Avatar/Avatar.vue'
import defaultAvatarIcon from '../../assets/base/default-avatar.png';
import defaultGroupAvatarIcon from '../../assets/base/default-group-avatar.png';
import { handleCallKitSignaling, isCallSignaling } from '../../utils/processCallSignaling';
import { calculateTimestamp } from '../../utils/time';
import { MessageType } from '../../constants/chat'

const avatarStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '4px',
    marginRight: '12px'
}

const props = defineProps({
    onConversationSelect: {
        type: Function,
        default: null
    }
})

const { conversationList, setActiveConversation } = useConversationListState();

const handleItemClick = (conversation: any) => {
    if (props.onConversationSelect) {
        props.onConversationSelect(conversation)
    } else {
        setActiveConversation(conversation.conversationID)
    }
};

const getLastMessagePreview = (lastMessage?: any) => {
    if (!lastMessage) return '';

    switch (lastMessage.type) {
        case MessageType.MSG_TEXT:
            return lastMessage.payload.text;
        case MessageType.MSG_IMAGE:
            return '[图片]';
        case MessageType.MSG_VIDEO:
            return '[视频]';
        case MessageType.MSG_CUSTOM:
            return handleCustomMessage(lastMessage);
        case MessageType.MSG_GRP_TIP:
            return '[群提示消息]';
        default:
            return '[未知消息]';
    }
};

const getConversationDisplayName = (conversation: any) => {
    // 群组会话：使用群组名称
    if (conversation.type === 'GROUP') {
        return conversation.groupProfile?.name || conversation.conversationID;
    }
    // C2C 会话：备注 -> 昵称 -> 用户ID
    return conversation.remark || conversation.userProfile?.nick || conversation.userProfile?.userID;
};

const getConversationAvatar = (conversation: any) => {
    // 群组会话：使用群组头像
    if (conversation.type === 'GROUP') {
        return conversation.groupProfile?.avatar || defaultGroupAvatarIcon;
    }
    // C2C 会话：使用用户头像 -> 默认头像
    return conversation.userProfile?.avatar || defaultAvatarIcon;
};

function handleCustomMessage(message) {
    if (!isCallSignaling(message)) {
        return '[自定义消息]'
    }

    return handleCallKitSignaling(message).callTip
}

</script>

<style lang="scss" scoped>
.conversation-list {
    background-color: #F9FAFC;
    height: 100%;
    overflow-y: auto;
}

.conversation-item {
    display: flex;
    padding: 12px 16px;
    background-color: #fff;
    border-bottom: 1px solid #f0f0f0;

    &:active {
        background-color: #f9f9f9;
    }
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nickname {
    font-family: PingFang SC;
    font-size: 17px;
    font-weight: 400;
    color: #000000E5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.time {
    font-family: PingFang HK;
    font-style: Regular;
    font-weight: 400;
    font-size: 12px;
    color: #00000066;
    margin-left: 8px;
}

.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.last-message {
    font-family: PingFang SC;
    font-weight: 400;
    font-style: Regular;
    font-size: 14px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.avatar-container {
    width: 48px;
    height: 48px;
    position: relative;
    margin-right: 12px;
}

.badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background-color: #E54545;
    color: white;
    font-size: 12px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    z-index: 1;
    line-height: 18px;
}
</style>