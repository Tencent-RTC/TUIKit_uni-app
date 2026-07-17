<template>
  <view class="group-tip-message">
    <text class="tip-text">{{ renderText() }}</text>
  </view>
</template>

<script lang="ts" setup>
import { handleCallKitSignaling, isCallSignaling } from '../../../utils/processCallSignaling';

interface Props {
  message: any;
}

const props = defineProps<Props>();

const renderText = () => {
  const messageContent = props.message.getMessageContent()
  if (messageContent.businessID === 'group_create') {
    return `${messageContent.showName || ''} 创建群组`;
  }
  if (isCallSignaling(props.message) && props.message.conversationType === 'GROUP') {
    return handleCallKitSignaling(props.message);
  }
  return resolveGroupTipMessage(props.message).text;
};

const resolveGroupTipMessage = (message: any) => {
  const ret: {
    text: string;
  } = {
    text: '',
  };

  let showName: string = message?.nick || message?.payload?.userIDList?.join(',');
  if (message?.payload?.memberList?.length > 0) {
    showName = '';
    message?.payload?.memberList?.map((user: any) => {
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
      ret.text = handleGroupProfileUpdated(message);
      break;
    case 7: // GRP_TIP_MBR_PROFILE_UPDATED
      message.payload.memberList.forEach((member: any) => {
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
}

const handleGroupProfileUpdated = (message: any) => {
  const { nick, payload } = message;
  const { newGroupProfile, memberList, operatorID } = payload;
  let text = '';

  const showName: string = nick || operatorID;
  const key: string = Object.keys(newGroupProfile)[0];
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