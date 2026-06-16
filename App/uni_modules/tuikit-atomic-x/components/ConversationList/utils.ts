import { MessageInfo, MessageStatus, MessageType } from "../../types/message";
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
 * 安全截取字符串前 N 个"用户感知字符"
 *
 * 直接 substring(0, n) 可能切到 surrogate pair 中间（emoji 占 2 个 UTF-16 code unit），
 * 导致 nvue 渲染整段失败。改用 Array.from 按 code point 切，并对 ZWJ 序列做整体回溯：
 * - 切点紧邻 ZWJ (U+200D) → 向前回溯到序列起点
 * - 切点紧邻 variation selector (U+FE0F) 或 skin tone modifier (U+1F3FB-U+1F3FF) → 同上
 *
 * @param text 源字符串
 * @param n 期望保留的字符数（按 code point 计算）
 * @returns 安全截断后的字符串
 */
const safeTruncateText = (text: string, n: number): string => {
  if (n <= 0) return ''
  const chars = Array.from(text)
  if (chars.length <= n) return text

  // 切点：保留前 n 个 code point；如果切点上一个字符是 ZWJ 序列的一部分，回溯到序列起点
  let cut = n
  while (cut > 0) {
    const prev = chars[cut - 1]
    const next = chars[cut]
    const cp = next ? next.codePointAt(0) || 0 : 0
    const prevCp = prev ? prev.codePointAt(0) || 0 : 0
    // 切点之后是 ZWJ / variation selector / skin tone → 切点前的 emoji 是不完整序列
    const nextIsCombiner = cp === 0x200D || cp === 0xFE0F || (cp >= 0x1F3FB && cp <= 0x1F3FF)
    // 切点之前是 ZWJ → 切点前的 emoji 序列被截断
    const prevIsZwj = prevCp === 0x200D
    if (nextIsCombiner || prevIsZwj) {
      cut--
      continue
    }
    break
  }
  return chars.slice(0, cut).join('')
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
      // 文本长度按 code point 计算（一个 emoji 视为 1 个长度），与前端肉眼感知一致
      const chars = Array.from(segment.content || '')
      const textLength = chars.length
      
      if (totalLength + textLength <= maxLength) {
        result.push(segment)
        totalLength += textLength
      } else {
        const remainingLength = maxLength - totalLength
        if (remainingLength > 0) {
          result.push({
            type: 'text',
            content: safeTruncateText(segment.content || '', remainingLength) + '...'
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
      // 判断是否为通话消息
      if (isCallMessage(message)) {
        const callData = parseCallMessageData(message)
        messageContent = isVideoCall(callData) ? '[视频通话]' : '[语音通话]'
      } else {
        messageContent = messageBody?.customMessage?.description || '[自定义消息]'
      }
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

  if (message.groupID && message.messageType !== MessageType.SYSTEM && !isCallMessage(message)) {
    const senderName = getSenderName(message);
    return senderName ? `${senderName}: ${messageContent}` : messageContent;
  }
  return messageContent;
}

export { getMessageAbstract };
