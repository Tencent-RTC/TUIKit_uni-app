/**
 * 解析群提示消息文本（Vue2 适配版）
 *
 * 注意：新版 atomicxcore 用 sealed class GroupTipsInfo，
 * Hybrid 序列化时用 `type` 字段做 discriminator（值为大驼峰类名，如 "JoinGroup"）。
 * 每个子类型字段不同：opUser/joinMember/inviter 等都是 GroupMember 对象（不是 string）。
 */

import type { MessageInfo } from '../../../../types/message'
import type { GroupMember } from '../../../../types/group'

/** 取 GroupMember 的展示名 */
const memberName = (m?: GroupMember | null): string => {
  if (!m) return ''
  return m.nameCard || m.friendRemark || m.nickname || m.userID || ''
}

/** 取多 GroupMember 的展示名拼接 */
const membersName = (list?: GroupMember[] | null): string => {
  if (!list || list.length === 0) return ''
  return list.map(memberName).filter(Boolean).join('、')
}

export const resolveGroupTipMessage = (message: MessageInfo): string => {
  const groupTips = (message.messagePayload as any)?.groupTips || []
  if (groupTips.length === 0) {
    return '系统消息'
  }

  const tip = groupTips[0]
  // 兼容 type / _type 字段名（底层用 type，旧代码可能用 _type）
  const tipType = tip?.type || tip?._type

  switch (tipType) {
    case 'JoinGroup':
      return `${memberName(tip.joinMember)} 加入了群聊`

    case 'InviteToGroup':
      return `${memberName(tip.inviter)} 邀请 ${membersName(tip.invitees)} 加入了群聊`

    case 'QuitGroup':
      return `${memberName(tip.quitMember)} 退出了群聊`

    case 'KickedFromGroup':
      return `${memberName(tip.opUser)} 将 ${membersName(tip.kickedMembers)} 移出了群聊`

    case 'SetGroupAdmin':
      return `${memberName(tip.opUser)} 设置 ${membersName(tip.setAdminMembers)} 为管理员`

    case 'CancelGroupAdmin':
      return `${memberName(tip.opUser)} 取消了 ${membersName(tip.cancelAdminMembers)} 的管理员身份`

    case 'ChangeGroupName':
      return `${memberName(tip.opUser)} 修改了群名称为 ${tip.groupName}`

    case 'ChangeGroupAvatar':
      return `${memberName(tip.opUser)} 修改了群头像`

    case 'ChangeGroupNotification':
      return `${memberName(tip.opUser)} 修改了群公告`

    case 'ChangeGroupIntroduction':
      return `${memberName(tip.opUser)} 修改了群简介`

    case 'ChangeGroupOwner':
      return `${memberName(tip.opUser)} 将群主转让给 ${tip.groupOwner}`

    case 'ChangeGroupMuteAll':
      return tip.isMuteAll
        ? `${memberName(tip.opUser)} 开启了全员禁言`
        : `${memberName(tip.opUser)} 关闭了全员禁言`

    case 'ChangeJoinGroupApproval':
      return `${memberName(tip.opUser)} 修改了群加入审批方式`

    case 'ChangeInviteToGroupApproval':
      return `${memberName(tip.opUser)} 修改了群邀请审批方式`

    case 'MuteGroupMember': {
      const muteText = tip.isSelfMuted ? '你被' : ''
      const muteTime = tip.muteTime > 0
        ? `禁言${Math.floor(tip.muteTime / 60)}分钟`
        : '解除禁言'
      return `${muteText}${memberName(tip.opUser)} ${muteTime}`
    }

    case 'PinGroupMessage':
      return `${memberName(tip.opUser)} 置顶了一条消息`

    case 'UnpinGroupMessage':
      return `${memberName(tip.opUser)} 取消置顶了一条消息`

    case 'Unknown':
    default:
      return '系统消息'
  }
}
