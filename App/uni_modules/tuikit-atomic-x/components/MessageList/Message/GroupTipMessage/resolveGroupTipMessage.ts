/**
 * 解析群提示消息文本
 */

import type { MessageInfo } from '../../../../types/message'

export const resolveGroupTipMessage = (message: MessageInfo): string => {
  const systemMessages = message.messageBody?.systemMessage || []
  
  // 如果没有系统消息，返回默认文本
  if (systemMessages.length === 0) {
    return '系统消息'
  }
  
  // 获取第一个系统消息
  const systemMessage = systemMessages[0]
  
  // 根据系统消息类型返回不同的提示文本
  switch (systemMessage.type) {
    case 'JoinGroup':
      return `${systemMessage.joinMember} 加入了群聊`
    
    case 'InviteToGroup':
      return `${systemMessage.inviter} 邀请 ${systemMessage.inviteesShowName} 加入了群聊`
    
    case 'QuitGroup':
      return `${systemMessage.quitMember} 退出了群聊`
    
    case 'KickedFromGroup':
      return `${systemMessage.kickOperator} 将 ${systemMessage.kickedMembersShowName} 移出了群聊`
    
    case 'SetGroupAdmin':
      return `${systemMessage.setAdminOperator} 设置 ${systemMessage.setAdminMembersShowName} 为管理员`
    
    case 'CancelGroupAdmin':
      return `${systemMessage.cancelAdminOperator} 取消了 ${systemMessage.cancelAdminMembersShowName} 的管理员身份`
    
    case 'ChangeGroupName':
      return `${systemMessage.groupNameOperator} 修改了群名称为 ${systemMessage.groupName}`
    
    case 'ChangeGroupAvatar':
      return `${systemMessage.groupAvatarOperator} 修改了群头像`
    
    case 'ChangeGroupNotification':
      return `${systemMessage.groupNotificationOperator} 修改了群公告`
    
    case 'ChangeGroupIntroduction':
      return `${systemMessage.groupIntroductionOperator} 修改了群简介`
    
    case 'ChangeGroupOwner':
      return `${systemMessage.groupOwnerOperator} 将群主转让给 ${systemMessage.groupOwner}`
    
    case 'ChangeGroupMuteAll':
      return systemMessage.isMuteAll 
        ? `${systemMessage.groupMuteAllOperator} 开启了全员禁言` 
        : `${systemMessage.groupMuteAllOperator} 关闭了全员禁言`
    
    case 'ChangeJoinGroupApproval':
      return `${systemMessage.groupJoinApprovalOperator} 修改了群加入审批方式`
    
    case 'ChangeInviteToGroupApproval':
      return `${systemMessage.groupInviteApprovalOperator} 修改了群邀请审批方式`
    
    case 'MuteGroupMember':
      const muteText = systemMessage.isSelfMuted ? '你被' : ''
      const muteTime = systemMessage.muteTime > 0 
        ? `禁言${Math.floor(systemMessage.muteTime / 60)}分钟` 
        : '解除禁言'
      return `${muteText}${systemMessage.muteGroupMemberOperator} ${muteTime}`
    
    case 'PinGroupMessage':
      return `${systemMessage.pinGroupMessageOperator} 置顶了一条消息`
    
    case 'UnpinGroupMessage':
      return `${systemMessage.unpinGroupMessageOperator} 取消置顶了一条消息`
    
    case 'RecallMessage':
      const recaller = systemMessage.recallMessageOperator
      if (systemMessage.isRecalledBySelf) {
        return '你撤回了一条消息'
      }
      return `${recaller} 撤回了一条消息`
    
    case 'Unknown':
    default:
      return '系统消息'
  }
}
