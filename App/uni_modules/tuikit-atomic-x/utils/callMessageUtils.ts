/**
 * 通话消息处理公共工具
 * 用于解析通话消息并生成上屏显示文本
 */

import type { MessageInfo } from '../types/message'
import { safeJsonParse } from './utsUtils'

// 通话类型枚举
export const CallType = {
  AUDIO: 0,
  VIDEO: 1
} as const

// 通话消息解析结果类型
export interface CallMessageData {
  businessID: number
  timeout?: number
  inviteID?: string
  actionType: number
  inviter?: string
  inviteeList?: string[]
  groupID?: string
  callInfo: {
    businessID?: number
    call_end?: number
    call_type?: number
    line_busy?: string
    platform?: string
    room_id?: number
    version?: number
    data?: {
      cmd?: string
      inviter?: string
      message?: string
      room_id?: number
      str_room_id?: string
    }
  }
}

/**
 * 判断消息是否为通话消息
 */
export function isCallMessage(message: MessageInfo): boolean {
  const customMessage = message.messageBody?.customMessage
  if (!customMessage?.data) {
    return false
  }

  const dataContent = safeJsonParse<any>(customMessage.data as string, null)
  return dataContent && dataContent.businessID === 1
}

/**
 * 判断是否是群组内的通话消息
 * 群组内的通话消息需要居中显示，不带头像和气泡
 */
export function isGroupCallMessage(message: MessageInfo, conversationID: string): boolean {
  if (!isCallMessage(message)) {
    return false
  }
  // 检查是否是群聊会话
  return conversationID.startsWith('group_')
}

/**
 * 解析通话消息内容
 */
export function parseCallMessageData(message: MessageInfo): CallMessageData | null {
  const customMessage = message.messageBody?.customMessage
  if (!customMessage?.data) {
    return null
  }

  const dataContent = safeJsonParse<any>(customMessage.data as string, null)
  if (!dataContent || dataContent.businessID !== 1) {
    return null
  }

  const callInfo = safeJsonParse<any>(dataContent.data, null)
  if (!callInfo) {
    return null
  }

  return {
    businessID: dataContent.businessID,
    timeout: dataContent.timeout,
    inviteID: dataContent.inviteID,
    actionType: dataContent.actionType,
    inviter: dataContent.inviter,
    inviteeList: dataContent.inviteeList,
    groupID: dataContent.groupID,
    callInfo: {
      businessID: callInfo.businessID,
      call_end: callInfo.call_end,
      call_type: callInfo.call_type,
      line_busy: callInfo.line_busy,
      platform: callInfo.platform,
      room_id: callInfo.room_id,
      version: callInfo.version,
      data: {
        cmd: callInfo.data?.cmd,
        inviter: callInfo.data?.inviter,
        message: callInfo.data?.message,
        room_id: callInfo.data?.room_id,
        str_room_id: callInfo.data?.str_room_id
      }
    }
  }
}

/**
 * 判断是否是视频通话
 */
export function isVideoCall(data: CallMessageData | null): boolean {
  if (!data) return false

  // 通过 call_type 判断
  if (data.callInfo.call_type === 2) {
    return true
  }

  // 通过 cmd 判断
  const cmd = data.callInfo.data?.cmd
  if (cmd === 'videoCall' || cmd === 'switchToVideo') {
    return true
  }

  return false
}

/**
 * 格式化通话时长
 */
export function formatCallDuration(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return '00:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 截取字符串
 */
function substringByLength(str: string, maxLength = 12): string {
  if (!str || str.length <= maxLength) {
    return str
  }
  return `${str.substring(0, maxLength)}...`
}

/**
 * 获取消息发送者显示名称
 */
export function getMessageSenderName(message: MessageInfo, maxLength = 12): string {
  const sender = message.sender
  const name = sender.friendRemark || sender.nameCard || sender.nickname || sender.userID
  return substringByLength(name, maxLength)
}

/**
 * 生成通话消息上屏文本
 * @param message 消息信息
 * @param showSenderName 是否显示发送者名称（用于群聊场景，默认为 true）
 * @returns 上屏显示的文本
 */
export function getCallMessageText(message: MessageInfo, showSenderName = true): string {
  const data = parseCallMessageData(message)
  if (!data) {
    return '通话消息'
  }

  const { actionType, callInfo, groupID } = data
  const objectData = callInfo
  const isSelfInviter = message.isSelf
  const senderName = showSenderName ? getMessageSenderName(message) : ''

  switch (actionType) {
    case 1: {
      // 发起/挂断
      const cmd = objectData.data?.cmd
      if (cmd === 'audioCall' || cmd === 'videoCall') {
        if (groupID && senderName) {
          return `${senderName} 发起通话`
        }
        return '发起通话'
      }
      if (cmd === 'hangup') {
        if (groupID) {
          return '通话结束'
        }
        return `${formatCallDuration(objectData.call_end || 0)} 通话时长`
      }
      if (cmd === 'switchToAudio') {
        return '切换为语音通话'
      }
      if (cmd === 'switchToVideo') {
        return '切换为视频通话'
      }
      // CMD 异常时默认返回发起通话
      return '发起通话'
    }

    case 2:
      // 取消
      if (groupID && senderName) {
        return `${senderName} 已取消`
      }
      if (isSelfInviter) {
        return '已取消'
      }
      return '对方已取消'

    case 3:
      // 接听
      if (objectData.data?.cmd === 'switchToAudio') {
        return '切换为语音通话'
      }
      if (objectData.data?.cmd === 'switchToVideo') {
        return '切换为视频通话'
      }
      if (groupID && senderName) {
        return `${senderName} 已接听`
      }
      return '已接听'

    case 4:
      // 拒绝
      if (groupID && senderName) {
        return `${senderName} 已拒绝`
      }
      // 检查忙线状态
      if (objectData.line_busy === 'line_busy' || objectData.data?.message === 'lineBusy') {
        if (isSelfInviter) {
          return '对方忙线'
        }
        return '忙线未接听'
      }
      if (isSelfInviter) {
        return '对方已拒绝'
      }
      return '已拒绝'

    case 5:
      // 超时无应答
      if (objectData.data?.cmd === 'switchToAudio') {
        return '切换为语音通话'
      }
      if (objectData.data?.cmd === 'switchToVideo') {
        return '切换为视频通话'
      }
      if (groupID && senderName) {
        return `${senderName} 无应答`
      }
      if (isSelfInviter) {
        return '对方无应答'
      }
      return '未接听'

    default:
      return '通话消息'
  }
}