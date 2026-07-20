<template>
  <view class="group-tip-message">
    <text class="tip-text">{{ renderText() }}</text>
  </view>
</template>

<script>
// @ts-nocheck
import { handleCallKitSignaling, isCallSignaling } from '../../../utils/processCallSignaling';
import { MessageType } from '../../../constants/chat';
import { JSONToObject } from '../../../states/chat-uikit-engine-lite/utils/common-utils';

export default {
  name: 'GroupTipMessage',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  methods: {
    renderText() {
      try {
        if (this.message && this.message.type === MessageType.MSG_CUSTOM &&
          this.message.payload && this.message.payload.data) {
          const data = JSONToObject(this.message.payload.data);
          if (data && data.businessID === 'group_create') {
            const showName = this.message.nick || this.message.from || data.opUser || '';
            return `${showName} 创建群组`;
          }
        }

        if (!this.message || typeof this.message.getMessageContent !== 'function') {
          console.warn('Message object or getMessageContent method not found', this.message);
          return this.resolveGroupTipMessage(this.message).text;
        }

        const messageContent = this.message.getMessageContent();
        if (messageContent && messageContent.businessID === 'group_create') {
          return `${messageContent.showName || ''} 创建群组`;
        }
        if (isCallSignaling(this.message) && this.message.conversationType === 'GROUP') {
          return handleCallKitSignaling(this.message);
        }
        return this.resolveGroupTipMessage(this.message).text;
      } catch (error) {
        console.error('Error in renderText:', error);
        return this.resolveGroupTipMessage(this.message).text;
      }
    },

    resolveGroupTipMessage(message) {
      const ret = {
        text: '',
      };

      if (!message || !message.payload) {
        ret.text = '[群提示消息]';
        return ret;
      }

      let showName = message?.nick || message?.payload?.userIDList?.join(',');
      if (message?.payload?.memberList?.length > 0) {
        showName = '';
        message?.payload?.memberList?.map((user) => {
          const _showName = user?.nick || user?.userID;
          showName += `${_showName},`;
          return user;
        });
        showName = showName?.slice(0, -1);
      }

      switch (message.payload.operationType) {
        case 1: // GRP_TIP_MBR_JOIN
          ret.text = `${showName} 加入群组`;
          break;
        case 2: // GRP_TIP_MBR_QUIT
          ret.text = `${showName} 退出群组`;
          break;
        case 3: // GRP_TIP_MBR_KICKED_OUT
          ret.text = `${showName} 被踢出群组`;
          break;
        case 4: // GRP_TIP_MBR_SET_ADMIN
          ret.text = `${showName} 成为管理员`;
          break;
        case 5: // GRP_TIP_MBR_CANCELED_ADMIN
          ret.text = `${showName} 被撤销管理员`;
          break;
        case 6: // GRP_TIP_GRP_PROFILE_UPDATED
          ret.text = this.handleGroupProfileUpdated(message);
          break;
        case 7: // GRP_TIP_MBR_PROFILE_UPDATED
          message.payload.memberList.forEach((member) => {
            if (member.muteTime > 0) {
              ret.text = `${showName} 被禁言`;
            } else {
              ret.text = `${showName} 被取消禁言`;
            }
          });
          break;
        default:
          ret.text = `[群提示消息]`;
          break;
      }
      return ret;
    },

    handleGroupProfileUpdated(message) {
      if (!message || !message.payload || !message.payload.newGroupProfile) {
        return '';
      }

      const { nick, payload } = message;
      const { newGroupProfile, memberList, operatorID } = payload;
      let text = '';

      const showName = nick || operatorID;
      const key = Object.keys(newGroupProfile)[0];

      if (!key) {
        return '';
      }
      switch (key) {
        case 'muteAllMembers':
          if (newGroupProfile[key]) {
            text = `管理员 ${showName} 开启全员禁言`;
          } else {
            text = `管理员 ${showName} 取消全员禁言`;
          }
          break;
        case 'ownerID':
          if (memberList && memberList.length > 0) {
            text = `${memberList[0].nick || memberList[0].userID} 成为新的群主`;
          }
          break;
        case 'groupName':
          text = `${showName} 修改群名为 ${newGroupProfile[key]}`;
          break;
        case 'notification':
          text = `${showName} 发布新公告`;
          break;
        default:
          break;
      }
      return text;
    }
  }
}
</script>

<style scoped>
.group-tip-message {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx 32rpx;
  margin: 8rpx 0;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  line-height: 1.4;
  max-width: 80%;
  word-break: break-all;
}
</style>