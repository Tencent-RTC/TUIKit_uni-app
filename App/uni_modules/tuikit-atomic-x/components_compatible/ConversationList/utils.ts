import { MessageInfo, MessageStatus, MessageType } from "../../types/message";
import { ConversationType } from "../../types/conversation";
import { parseEmojiToNodes, type RichTextNode } from "../../utils/emojiUtils";
import { emojiUrlMap, emojiBaseUrl } from "../../constants/emoji";
import { isCallMessage, parseCallMessageData, isVideoCall } from "../../utils/callMessageUtils";

export type { RichTextNode } from "../../utils/emojiUtils";

export interface MessageSegment {
  type: 'text' | 'emoji'
  content?: string
  src?: string
}

/**
 * 获取群聊消息的发送者名称
 * @param message 消息对象
 * @returns 发送者名称，如果不是群聊或无法获取则返回空字符串
 */
export const getSenderName = (message: MessageInfo): string => {
  // 新版 MessageInfo.conversationType 是 ConversationType 整数枚举（GROUP=2），不是字符串 'Group'
  // 兜底兼容旧版字段：(message as any).groupID / (message as any).conversationID
  const m = message as any;
  const isGroup = m.conversationType === ConversationType.GROUP
    || !!m.groupID
    || (m.conversationID || '').startsWith('group_');
  if (!isGroup) {
    return '';
  }
  
  if (message.isSentBySelf) {
    return '我';
  }
  
  return message.from.friendRemark
    || message.from.nameCard
    || message.from.nickname
    || message.from.userID;
}

/**
 * 将文本解析为片段数组（文本 + 表情）
 * @param text 要解析的文本
 * @returns 消息片段数组
 */
export const parseTextToSegments = (text: string): MessageSegment[] => {
  const segments: MessageSegment[] = []
  const emojiRegex = /\[TUIEmoji_[^\]]+\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }

    const emojiKey = match[0]
    const emojiFileName = emojiUrlMap[emojiKey]
    if (emojiFileName) {
      segments.push({
        type: 'emoji',
        src: emojiBaseUrl + emojiFileName
      })
    } else {
      segments.push({
        type: 'text',
        content: emojiKey
      })
    }

    lastIndex = emojiRegex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }
  
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: text
    })
  }

  return segments
}

/**
 * 截断片段数组，控制总长度并添加省略号
 * @param segments 消息片段数组
 * @param maxLength 最大长度，默认15
 * @returns 截断后的片段数组
 */
export const truncateSegments = (segments: MessageSegment[], maxLength: number = 15): MessageSegment[] => {
  let totalLength = 0
  const result: MessageSegment[] = []
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    
    if (segment.type === 'text') {
      const textLength = (segment.content && segment.content.length) || 0
      
      if (totalLength + textLength <= maxLength) {
        result.push(segment)
        totalLength += textLength
      } else {
        const remainingLength = maxLength - totalLength
        if (remainingLength > 0) {
          result.push({
            type: 'text',
            content: (segment.content ? segment.content.substring(0, remainingLength) : '') + '...'
          })
        } else {
          result.push({
            type: 'text',
            content: '...'
          })
        }
        return result
      }
    } else if (segment.type === 'emoji') {
      if (totalLength + 1 <= maxLength) {
        result.push(segment)
        totalLength += 1
      } else {
        result.push({
          type: 'text',
          content: '...'
        })
        return result
      }
    }
  }
  
  return result
}

/**
 * 将消息转换为 rich-text nodes，统一处理表情解析和群聊发送者前缀
 * @param message 消息对象
 * @returns rich-text 组件的 nodes 数组
 */
export const parseMessageToRichTextNodes = (message: MessageInfo): RichTextNode[] => {
  if (message.messageType === MessageType.TEXT && (message.messagePayload as any) && (message.messagePayload as any).text) {
    const text = (message.messagePayload as any).text;
    let contentNodes = parseEmojiToNodes(text);
    
    const senderName = getSenderName(message);
    if (senderName) {
      contentNodes = [
        { type: 'text', text: `${senderName}: ` },
        ...contentNodes
      ];
    }
    
    return contentNodes;
  }
  
  const abstract = getMessageAbstract(message);
  return [{ type: 'text', text: abstract }];
}

const getMessageAbstract = (message: MessageInfo): string => {
  if (message.status === MessageStatus.REVOKED) {
    const senderName = getSenderName(message)
    if (senderName.length > 0) {
      return `${senderName}: 撤回了一条消息`
    }
    return '撤回了一条消息'
  }
  
  if (message.status === MessageStatus.DELETED) {
    return '[消息已删除]'
  }
  
  const messagePayload = message.messagePayload as any;
  let messageContent = '';
  
  switch (message.messageType) {
    case MessageType.TEXT:
      messageContent = (messagePayload && messagePayload.text) || '[文本消息]'
      break;
      
    case MessageType.IMAGE:
      messageContent ='[图片]'
      break;
      
    case MessageType.VIDEO:
      messageContent ='[视频]'
      break;
      
    case MessageType.AUDIO:
      messageContent ='[语音]'
      break;
      
    case MessageType.FILE:
      messageContent =`[文件] ${(messagePayload && messagePayload.fileName) || ''}`
      break;
      
    case MessageType.FACE:
      messageContent ='[表情]'
      break;
      
    case MessageType.CUSTOM:
      // 判断是否为通话消息
      if (isCallMessage(message)) {
        const callData = parseCallMessageData(message)
        messageContent = isVideoCall(callData) ? '[视频通话]' : '[语音通话]'
      } else {
        messageContent = (messagePayload && messagePayload.description) || '[自定义消息]'
      }
      break;
      
    case MessageType.MERGED:
      messageContent = '[聊天记录] ' + ((messagePayload && messagePayload.title) ? messagePayload.title : '')
      break;
      
    case MessageType.TIPS:
      messageContent = '[系统消息]'
      break;
      
    default:
      messageContent = '[未知消息]'
  }

  const m = message as any;
  const isGroup = m.conversationType === ConversationType.GROUP
    || !!m.groupID
    || (m.conversationID || '').startsWith('group_');
  if (isGroup && message.messageType !== MessageType.TIPS && !isCallMessage(message)) {
    const senderName = getSenderName(message);
    return senderName ? `${senderName}: ${messageContent}` : messageContent;
  }
  return messageContent;
}

export { getMessageAbstract };
