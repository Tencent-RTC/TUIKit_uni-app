<template>
    <view class="conversation-list">
        <view v-for="conversation in conversationList" :key="conversation.conversationID" class="conversation-item"
            @click="handleItemClick(conversation)">
            <view class="avatar-container">
                <Avatar :avatarStyle='avatarStyle' :src='getConversationAvatar(conversation)'>
                </Avatar>
                <view v-if="conversation.unreadCount > 0" class="badge">
                    {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                </view>
            </view>
            <view class="content">
                <view class="header">
                    <text class="nickname">{{ getConversationDisplayName(conversation) }}</text>
                    <text class="time" v-if="conversation.lastMessage && conversation.lastMessage.lastTime">{{
                        calculateTimestamp(conversation.lastMessage.lastTime) }}</text>
                </view>
                <view v-if="conversation.lastMessage && conversation.lastMessage.type" class="footer">
                    <text class="last-message">
                        {{ getLastMessagePreview(conversation.lastMessage) }}
                    </text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
// @ts-nocheck
import { useConversationListState } from '../../index';
import Avatar from '../Avatar/Avatar.vue'
import defaultAvatarIcon from '../../assets/base/default-avatar.png';
import defaultGroupAvatarIcon from '../../assets/base/default-group-avatar.png';
import { handleCallKitSignaling, isCallSignaling } from '../../utils/processCallSignaling';
import { calculateTimestamp } from '../../utils/time';
import { MessageType } from '../../constants/chat'
const { setActiveConversation } = useConversationListState();

export default {
    name: 'ConversationList',
    components: {
        Avatar
    },
    props: {
        onConversationSelect: {
            type: Function,
            default: null
        }
    },
    data() {        
        return {
            avatarStyle: {
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                marginRight: '12px'
            },
            defaultAvatarIcon: defaultAvatarIcon,
            defaultGroupAvatarIcon: defaultGroupAvatarIcon,
            setActiveConversation: setActiveConversation
        }
    },
    computed: {
      conversationList() {
        const { conversationList } = useConversationListState();
        return conversationList;
      }
    },
    methods: {
        getConversationDisplayName(conversation) {
            if (conversation.type === 'GROUP') {
                return conversation.groupProfile && conversation.groupProfile.name || conversation.conversationID;
            }
            return conversation.remark || (conversation.userProfile && conversation.userProfile.nick) || (conversation.userProfile && conversation.userProfile.userID);
        },
        getConversationAvatar(conversation) {
            if (conversation.type === 'GROUP') {
                return (conversation.groupProfile && conversation.groupProfile.avatar) || this.defaultGroupAvatarIcon;
            }
            return (conversation.userProfile && conversation.userProfile.avatar) || this.defaultAvatarIcon;
        },
        handleItemClick(conversation) {
            if (this.$props.onConversationSelect) {
                this.$props.onConversationSelect(conversation)
            } else {
                this.setActiveConversation(conversation.conversationID)
            }
        },
        getLastMessagePreview(lastMessage) {
            if (!lastMessage) return '';
            switch (lastMessage.type) {
                case MessageType.MSG_TEXT:
                    return lastMessage.payload.text;
                case MessageType.MSG_IMAGE:
                    return '[图片]';
                case MessageType.MSG_VIDEO:
                    return '[视频]';
                case MessageType.MSG_CUSTOM:
                    return this.handleCustomMessage(lastMessage);
                case MessageType.MSG_GRP_TIP:
                    return '[群提示消息]';
                default:
                    return '[未知消息]';
            }
        },
        handleCustomMessage(message) {
            if (!isCallSignaling(message)) {
                return '[自定义消息]'
            }
            return handleCallKitSignaling(message).callTip
        },
        calculateTimestamp(time) {
            return calculateTimestamp(time);
        }
    }
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