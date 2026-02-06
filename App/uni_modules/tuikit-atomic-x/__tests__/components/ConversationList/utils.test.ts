/**
 * ConversationList utils 测试用例
 * @module utils.test
 */
import { describe, it, expect } from 'vitest'
import { 
  getSenderName, 
  parseTextToSegments, 
  truncateSegments,
  parseMessageToRichTextNodes,
  getMessageAbstract
} from '../../../components/ConversationList/utils'
import { MessageType, MessageStatus } from '../../../types/message'

describe('getSenderName', () => {
  it('非群聊消息应该返回空字符串', () => {
    const message = {
      groupID: '',
      isSelf: false,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    expect(getSenderName(message as any)).toBe('')
  })

  it('群聊中自己发的消息应该返回"我"', () => {
    const message = {
      groupID: 'group1',
      isSelf: true,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    expect(getSenderName(message as any)).toBe('我')
  })

  it('应该优先返回好友备注', () => {
    const message = {
      groupID: 'group1',
      isSelf: false,
      sender: {
        userID: 'user1',
        friendRemark: '好友备注',
        nameCard: '群名片',
        nickname: '昵称'
      }
    }
    expect(getSenderName(message as any)).toBe('好友备注')
  })

  it('没有好友备注时应该返回群名片', () => {
    const message = {
      groupID: 'group1',
      isSelf: false,
      sender: {
        userID: 'user1',
        friendRemark: '',
        nameCard: '群名片',
        nickname: '昵称'
      }
    }
    expect(getSenderName(message as any)).toBe('群名片')
  })

  it('没有群名片时应该返回昵称', () => {
    const message = {
      groupID: 'group1',
      isSelf: false,
      sender: {
        userID: 'user1',
        friendRemark: '',
        nameCard: '',
        nickname: '昵称'
      }
    }
    expect(getSenderName(message as any)).toBe('昵称')
  })

  it('都没有时应该返回 userID', () => {
    const message = {
      groupID: 'group1',
      isSelf: false,
      sender: {
        userID: 'user1',
        friendRemark: '',
        nameCard: '',
        nickname: ''
      }
    }
    expect(getSenderName(message as any)).toBe('user1')
  })
})

describe('parseTextToSegments', () => {
  it('应该解析纯文本', () => {
    const segments = parseTextToSegments('Hello World')
    expect(segments).toEqual([
      { type: 'text', content: 'Hello World' }
    ])
  })

  it('应该解析表情', () => {
    const segments = parseTextToSegments('[TUIEmoji_Smile]')
    expect(segments.length).toBe(1)
    expect(segments[0].type).toBe('emoji')
    expect(segments[0].src).toBeDefined()
  })

  it('应该解析混合内容', () => {
    const segments = parseTextToSegments('你好[TUIEmoji_Smile]世界')
    expect(segments.length).toBe(3)
    expect(segments[0]).toEqual({ type: 'text', content: '你好' })
    expect(segments[1].type).toBe('emoji')
    expect(segments[2]).toEqual({ type: 'text', content: '世界' })
  })

  it('空文本应该返回包含空文本的数组', () => {
    const segments = parseTextToSegments('')
    expect(segments).toEqual([{ type: 'text', content: '' }])
  })

  it('未知表情应该作为文本处理', () => {
    const segments = parseTextToSegments('[TUIEmoji_Unknown]')
    expect(segments).toEqual([
      { type: 'text', content: '[TUIEmoji_Unknown]' }
    ])
  })
})

describe('truncateSegments', () => {
  it('短文本不应该被截断', () => {
    const segments = [{ type: 'text' as const, content: 'Hello' }]
    const result = truncateSegments(segments, 15)
    expect(result).toEqual([{ type: 'text', content: 'Hello' }])
  })

  it('长文本应该被截断并添加省略号', () => {
    const segments = [{ type: 'text' as const, content: '这是一段很长很长的文本内容' }]
    const result = truncateSegments(segments, 5)
    expect(result[0].content).toBe('这是一段很...')
  })

  it('应该正确处理表情', () => {
    const segments = [
      { type: 'emoji' as const, src: 'emoji.png' },
      { type: 'emoji' as const, src: 'emoji2.png' },
      { type: 'text' as const, content: '文本' }
    ]
    const result = truncateSegments(segments, 3)
    expect(result.length).toBe(3)
  })

  it('超出长度时应该截断', () => {
    const segments = [
      { type: 'text' as const, content: '12345' },
      { type: 'text' as const, content: '67890' }
    ]
    const result = truncateSegments(segments, 7)
    expect(result.length).toBe(2)
    expect(result[1].content).toBe('67...')
  })
})

describe('getMessageAbstract', () => {
  it('撤回消息应该返回 [消息已撤回]', () => {
    const message = {
      status: MessageStatus.RECALLED,
      messageType: MessageType.TEXT,
      messageBody: { text: '原始内容' }
    }
    expect(getMessageAbstract(message as any)).toBe('[消息已撤回]')
  })

  it('删除消息应该返回 [消息已删除]', () => {
    const message = {
      status: MessageStatus.DELETED,
      messageType: MessageType.TEXT,
      messageBody: { text: '原始内容' }
    }
    expect(getMessageAbstract(message as any)).toBe('[消息已删除]')
  })

  it('文本消息应该返回文本内容', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.TEXT,
      messageBody: { text: '你好' },
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('你好')
  })

  it('图片消息应该返回 [图片]', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.IMAGE,
      messageBody: {},
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[图片]')
  })

  it('视频消息应该返回 [视频]', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.VIDEO,
      messageBody: {},
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[视频]')
  })

  it('语音消息应该返回 [语音]', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.SOUND,
      messageBody: {},
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[语音]')
  })

  it('文件消息应该返回 [文件] + 文件名', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.FILE,
      messageBody: { fileName: 'document.pdf' },
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[文件] document.pdf')
  })

  it('表情消息应该返回 [表情]', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.FACE,
      messageBody: {},
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[表情]')
  })

  it('自定义消息应该返回描述', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.CUSTOM,
      messageBody: { customMessage: { description: '自定义描述' } },
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('自定义描述')
  })

  it('合并消息应该返回 [聊天记录] + 标题', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.MERGED,
      messageBody: { mergedMessage: { title: '聊天记录标题' } },
      groupID: ''
    }
    expect(getMessageAbstract(message as any)).toBe('[聊天记录] 聊天记录标题')
  })

  it('系统消息应该返回 [系统消息] 且不带发送者名称', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.SYSTEM,
      messageBody: {},
      groupID: 'group1',
      isSelf: false,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    // 系统消息不应该有发送者前缀
    expect(getMessageAbstract(message as any)).toBe('[系统消息]')
  })

  it('群聊消息应该带发送者名称前缀', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.TEXT,
      messageBody: { text: '你好' },
      groupID: 'group1',
      isSelf: false,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    expect(getMessageAbstract(message as any)).toBe('User1: 你好')
  })

  it('群聊中自己发的消息应该显示"我:"', () => {
    const message = {
      status: MessageStatus.SEND_SUCCESS,
      messageType: MessageType.TEXT,
      messageBody: { text: '你好' },
      groupID: 'group1',
      isSelf: true,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    expect(getMessageAbstract(message as any)).toBe('我: 你好')
  })
})

describe('parseMessageToRichTextNodes', () => {
  it('文本消息应该解析为 rich-text nodes', () => {
    const message = {
      messageType: MessageType.TEXT,
      messageBody: { text: 'Hello' },
      groupID: ''
    }
    const nodes = parseMessageToRichTextNodes(message as any)
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('群聊文本消息应该包含发送者前缀', () => {
    const message = {
      messageType: MessageType.TEXT,
      messageBody: { text: 'Hello' },
      groupID: 'group1',
      isSelf: false,
      sender: { userID: 'user1', nickname: 'User1' }
    }
    const nodes = parseMessageToRichTextNodes(message as any)
    expect(nodes[0].text).toContain('User1:')
  })

  it('非文本消息应该返回摘要', () => {
    const message = {
      messageType: MessageType.IMAGE,
      messageBody: {},
      groupID: '',
      status: MessageStatus.SEND_SUCCESS
    }
    const nodes = parseMessageToRichTextNodes(message as any)
    expect(nodes[0].text).toBe('[图片]')
  })
})
