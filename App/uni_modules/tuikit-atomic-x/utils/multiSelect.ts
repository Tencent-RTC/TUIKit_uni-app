/**
 * 消息多选的公共判定：哪些消息不支持被多选。
 * Message（勾选圈置灰）与 MessageList（长按进多选、批量选择）共用，避免两处各写一份规则。
 */

import type { MessageInfo } from '../types/message'
import { MessageStatus } from '../types/message'
import { isCallMessage } from './callMessageUtils'

/**
 * 消息是否可以被多选。发送失败的消息、通话消息不可选（界面只置灰，不另外提示）。
 */
export function isMessageMultiSelectable(message?: MessageInfo | null): boolean {
  if (!message) return false
  if (message.status === MessageStatus.SEND_FAIL) return false
  if (isCallMessage(message)) return false
  return true
}
