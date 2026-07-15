/**
 * 解析群提示消息文本
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

/** 格式化禁言时长（秒），自适应「时/分/秒」 */
const formatMuteDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  if (m > 0) return s > 0 ? `${m}分钟${s}秒` : `${m}分钟`
  return `${s}秒`
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
      const op = memberName(tip.opUser)
      const target = tip.isSelfMuted ? '你' : membersName(tip.mutedGroupMembers)
      if (!target) return '系统消息'
      const duration = formatMuteDuration(Number(tip.muteTime) || 0)
      return duration
        ? `${op} 禁言了 ${target} ${duration}`
        : `${op} 解除了 ${target} 的禁言`
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
