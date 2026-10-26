/**
 * 消息版式判定：哪些消息按“居中”渲染（撤回、系统提示、建群提示、群通话、业务自定义居中）。
 * 居中消息不带头像 / 气泡 / 勾选圈。这是唯一的判定来源：
 * Message（渲染分支）、MessageList（头像昵称、多选批量选择）都引用这里，不要各写一份。
 */

import type { MessageInfo } from '../types/message'
import { MessageStatus, MessageType } from '../types/message'
import { isGroupCallMessage } from './callMessageUtils'
import { safeJsonParse } from './utsUtils'

/** 业务自定义的居中判定：返回 true 的消息按居中渲染（不带头像 / 气泡） */
export type CustomCenterChecker = (message: MessageInfo, conversationID: string) => boolean

/** 系统提示（群成员变动等 TIPS 消息） */
export function isSystemTipMessage(message: MessageInfo): boolean {
  return message.messageType === MessageType.TIPS
}

/** 建群提示（自定义消息，businessID 为 group_create） */
export function isGroupCreateMessage(message: MessageInfo): boolean {
  if (message.messageType !== MessageType.CUSTOM) return false
  const customData = (message.messagePayload as any)?.customData
  const data = safeJsonParse<any>(customData || '{}', {})
  return !!data && data.businessID === 'group_create'
}

/** 业务自定义居中规则；未传则默认群聊里的通话消息居中 */
export function isCustomCenterMessage(
  message: MessageInfo,
  conversationID: string,
  customCenterChecker?: CustomCenterChecker | null
): boolean {
  if (customCenterChecker) return !!customCenterChecker(message, conversationID)
  return isGroupCallMessage(message, conversationID)
}

/** 是否按居中消息渲染 */
export function isCenterLayoutMessage(
  message: MessageInfo,
  conversationID: string,
  customCenterChecker?: CustomCenterChecker | null
): boolean {
  return (
    message.status === MessageStatus.REVOKED
    || isSystemTipMessage(message)
    || isGroupCreateMessage(message)
    || isCustomCenterMessage(message, conversationID, customCenterChecker)
  )
}
