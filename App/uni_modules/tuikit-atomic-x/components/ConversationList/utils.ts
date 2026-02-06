import { MessageInfo, MessageStatus, MessageType } from "../../types/message";
import { parseEmojiToNodes, type RichTextNode } from "../../utils/emojiUtils";
import { emojiUrlMap, emojiBaseUrl } from "../../constants/emoji";

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
  if (!message.groupID) {
    return '';
  }
  
  if (message.isSelf) {
    return '我';
  }
  
  return message.sender.friendRemark
    || message.sender.nameCard
    || message.sender.nickname
    || message.sender.userID;
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
      const textLength = segment.content?.length || 0
      
      if (totalLength + textLength <= maxLength) {
        result.push(segment)
        totalLength += textLength
      } else {
        const remainingLength = maxLength - totalLength
        if (remainingLength > 0) {
          result.push({
            type: 'text',
            content: segment.content?.substring(0, remainingLength) + '...'
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
  if (message.messageType === MessageType.TEXT && message.messageBody?.text) {
    const text = message.messageBody.text;
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
  if (message.status === MessageStatus.RECALLED) {
    return '[消息已撤回]'
  }
  
  if (message.status === MessageStatus.DELETED) {
    return '[消息已删除]'
  }
  
  const messageBody = message.messageBody;
  let messageContent = '';
  
  switch (message.messageType) {
    case MessageType.TEXT:
      messageContent = messageBody?.text || '[文本消息]'
      break;
      
    case MessageType.IMAGE:
      messageContent ='[图片]'
      break;
      
    case MessageType.VIDEO:
      messageContent ='[视频]'
      break;
      
    case MessageType.SOUND:
      messageContent ='[语音]'
      break;
      
    case MessageType.FILE:
      messageContent =`[文件] ${messageBody?.fileName || ''}`
      break;
      
    case MessageType.FACE:
      messageContent ='[表情]'
      break;
      
    case MessageType.CUSTOM:
      messageContent = messageBody?.customMessage?.description || '[自定义消息]'
      break;
      
    case MessageType.MERGED:
      messageContent =  `[聊天记录] ${messageBody?.mergedMessage?.title || ''}`
      break;
      
    case MessageType.SYSTEM:
      messageContent = '[系统消息]'
      break;
      
    default:
      messageContent = '[未知消息]'
  }

  if (message.groupID && message.messageType !== MessageType.SYSTEM) {
    const senderName = getSenderName(message);
    return senderName ? `${senderName}: ${messageContent}` : messageContent;
  }
  return messageContent;
}

export { getMessageAbstract };
