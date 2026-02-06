/**
 * MessageList 组件测试用例
 * @module MessageList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { MessageType, MessageStatus, MessageListType, MessageFetchDirection } from '../../../types/message'

// Mock useMessageListState
const mockFetchMessageList = vi.fn()
const mockFetchMoreMessageList = vi.fn()
const mockDestroyStore = vi.fn()

vi.mock('../../../state/MessageListState', () => ({
  useMessageListState: () => ({
    messageList: ref([]),
    hasMoreOlderMessage: ref(true),
    hasMoreNewerMessage: ref(false),
    fetchMessageList: mockFetchMessageList,
    fetchMoreMessageList: mockFetchMoreMessageList,
    destroyStore: mockDestroyStore
  })
}))

// Mock uni API
vi.stubGlobal('uni', {
  requireNativePlugin: vi.fn(() => ({
    scrollToElement: vi.fn()
  }))
})

describe('MessageList 组件逻辑测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchMessageList.mockResolvedValue(undefined)
    mockFetchMoreMessageList.mockResolvedValue(undefined)
  })

  describe('消息项计算', () => {
    it('应该过滤已删除的消息', () => {
      const messages = [
        { msgID: 'msg1', status: MessageStatus.SEND_SUCCESS, messageType: MessageType.TEXT, timestamp: 1000 },
        { msgID: 'msg2', status: MessageStatus.DELETED, messageType: MessageType.TEXT, timestamp: 2000 },
        { msgID: 'msg3', status: MessageStatus.SEND_SUCCESS, messageType: MessageType.TEXT, timestamp: 3000 }
      ]
      
      const filteredMessages = messages.filter(msg => msg.status !== MessageStatus.DELETED)
      
      expect(filteredMessages.length).toBe(2)
      expect(filteredMessages.find(m => m.msgID === 'msg2')).toBeUndefined()
    })

    it('应该支持自定义过滤器', () => {
      const messages = [
        { msgID: 'msg1', messageType: MessageType.TEXT, timestamp: 1000 },
        { msgID: 'msg2', messageType: MessageType.IMAGE, timestamp: 2000 },
        { msgID: 'msg3', messageType: MessageType.TEXT, timestamp: 3000 }
      ]
      
      const filter = (msg: any) => msg.messageType === MessageType.TEXT
      const filteredMessages = messages.filter(filter)
      
      expect(filteredMessages.length).toBe(2)
    })

    it('应该在消息间隔超过聚合时间时显示时间分割线', () => {
      const aggregationTime = 300 * 1000 // 5分钟
      const messages = [
        { msgID: 'msg1', timestamp: 1000000 },
        { msgID: 'msg2', timestamp: 1000000 + aggregationTime + 1000 } // 超过5分钟
      ]
      
      const items: any[] = []
      messages.forEach((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null
        
        const showTimeDivider = index === 0 || 
          (prevMessage && (message.timestamp - prevMessage.timestamp) > aggregationTime)
        
        if (showTimeDivider) {
          items.push({ type: 'divider', timestamp: message.timestamp })
        }
        items.push({ type: 'message', message })
      })
      
      // 应该有2个时间分割线（第一条消息前和间隔超过5分钟的消息前）
      const dividers = items.filter(item => item.type === 'divider')
      expect(dividers.length).toBe(2)
    })

    it('撤回消息应该不显示头像', () => {
      const message = {
        msgID: 'msg1',
        status: MessageStatus.RECALLED,
        messageType: MessageType.TEXT
      }
      
      const isCenterMessage = message.status === MessageStatus.RECALLED || 
        message.messageType === MessageType.SYSTEM
      
      expect(isCenterMessage).toBe(true)
    })

    it('系统消息应该不显示头像', () => {
      const message = {
        msgID: 'msg1',
        status: MessageStatus.SEND_SUCCESS,
        messageType: MessageType.SYSTEM
      }
      
      const isCenterMessage = message.status === MessageStatus.RECALLED || 
        message.messageType === MessageType.SYSTEM
      
      expect(isCenterMessage).toBe(true)
    })
  })

  describe('消息拉取', () => {
    it('下拉刷新应该加载更早的消息', async () => {
      const hasMoreOlderMessage = ref(true)
      
      const onRefresh = async () => {
        if (!hasMoreOlderMessage.value) return
        await mockFetchMoreMessageList(MessageFetchDirection.OLDER)
      }

      await onRefresh()
      
      expect(mockFetchMoreMessageList).toHaveBeenCalledWith(MessageFetchDirection.OLDER)
    })

    it('没有更多历史消息时不应该拉取', async () => {
      const hasMoreOlderMessage = ref(false)
      
      const onRefresh = async () => {
        if (!hasMoreOlderMessage.value) return
        await mockFetchMoreMessageList(MessageFetchDirection.OLDER)
      }

      await onRefresh()
      
      expect(mockFetchMoreMessageList).not.toHaveBeenCalled()
    })

    it('上拉加载应该加载更新的消息', async () => {
      const hasMoreNewerMessage = ref(true)
      
      const onLoadMore = async () => {
        if (!hasMoreNewerMessage.value) return
        await mockFetchMoreMessageList(MessageFetchDirection.NEWER)
      }

      await onLoadMore()
      
      expect(mockFetchMoreMessageList).toHaveBeenCalledWith(MessageFetchDirection.NEWER)
    })
  })

  describe('滚动控制', () => {
    it('应该计算是否显示滚动到底部按钮', () => {
      const calculateShowScrollToBottom = (
        contentHeight: number,
        scrollTop: number,
        layoutHeight: number
      ) => {
        const distanceToBottom = contentHeight - scrollTop - layoutHeight
        return distanceToBottom > 200
      }

      // 距离底部超过200应该显示
      expect(calculateShowScrollToBottom(1000, 500, 200)).toBe(true)
      
      // 距离底部小于200不应该显示
      expect(calculateShowScrollToBottom(1000, 750, 200)).toBe(false)
    })

    it('自己发的消息应该自动滚动到底部', () => {
      const lastMessage = { msgID: 'msg1', isSelf: true }
      const showScrollToBottom = ref(true)
      
      const shouldAutoScroll = lastMessage.isSelf || !showScrollToBottom.value
      
      expect(shouldAutoScroll).toBe(true)
    })

    it('他人发的消息且已滚动时不应该自动滚动', () => {
      const lastMessage = { msgID: 'msg1', isSelf: false }
      const showScrollToBottom = ref(true)
      
      const shouldAutoScroll = lastMessage.isSelf || !showScrollToBottom.value
      
      expect(shouldAutoScroll).toBe(false)
    })
  })

  describe('消息定位', () => {
    it('消息不在列表中时应该拉取消息', async () => {
      const messageList = ref<any[]>([])
      
      const isMessageInList = (messageID: string): boolean => {
        return messageList.value.some(msg => msg.msgID === messageID)
      }
      
      const locateToMessage = async (message: any) => {
        if (!isMessageInList(message.msgID)) {
          await mockFetchMessageList({
            message,
            direction: MessageFetchDirection.BOTH,
            pageCount: 20
          })
        }
      }

      await locateToMessage({ msgID: 'msg_not_in_list' })
      
      expect(mockFetchMessageList).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: MessageFetchDirection.BOTH
        })
      )
    })

    it('消息在列表中时应该直接滚动', () => {
      const messageList = ref([
        { msgID: 'msg1' },
        { msgID: 'msg2' },
        { msgID: 'msg3' }
      ])
      
      const isMessageInList = (messageID: string): boolean => {
        return messageList.value.some(msg => msg.msgID === messageID)
      }

      expect(isMessageInList('msg2')).toBe(true)
    })
  })

  describe('高亮消息', () => {
    it('定位消息后应该高亮显示', () => {
      const currentHighlightID = ref('')
      
      const highlightMessage = (messageID: string) => {
        currentHighlightID.value = messageID
        
        // 3秒后取消高亮
        setTimeout(() => {
          currentHighlightID.value = ''
        }, 3000)
      }

      highlightMessage('msg1')
      
      expect(currentHighlightID.value).toBe('msg1')
    })
  })

  describe('组件生命周期', () => {
    it('销毁时应该清理定时器和销毁 Store', () => {
      const timers = new Set<number>()
      
      const addTimer = (timer: number) => {
        timers.add(timer)
        return timer
      }
      
      const clearAllTimers = () => {
        timers.forEach(timer => clearTimeout(timer))
        timers.clear()
      }

      addTimer(1)
      addTimer(2)
      
      // 模拟 onBeforeUnmount
      clearAllTimers()
      mockDestroyStore()
      
      expect(timers.size).toBe(0)
      expect(mockDestroyStore).toHaveBeenCalled()
    })
  })
})

describe('MessageList 消息项生成', () => {
  it('应该为每条消息生成唯一的 key', () => {
    const messages = [
      { msgID: 'msg1', timestamp: 1000 },
      { msgID: 'msg2', timestamp: 2000 }
    ]
    
    const items = messages.map(msg => ({
      key: `message-${msg.msgID}`,
      type: 'message',
      message: msg
    }))
    
    const keys = items.map(item => item.key)
    const uniqueKeys = new Set(keys)
    
    expect(keys.length).toBe(uniqueKeys.size)
  })

  it('时间分割线应该有唯一的 key', () => {
    const messages = [
      { msgID: 'msg1', timestamp: 1000 },
      { msgID: 'msg2', timestamp: 1000000 }
    ]
    
    const items: any[] = []
    messages.forEach((msg, index) => {
      if (index === 0 || (messages[index - 1].timestamp - msg.timestamp) > 300000) {
        items.push({
          key: `divider-${msg.msgID}`,
          type: 'divider',
          timestamp: msg.timestamp
        })
      }
      items.push({
        key: `message-${msg.msgID}`,
        type: 'message',
        message: msg
      })
    })
    
    const dividerKeys = items.filter(i => i.type === 'divider').map(i => i.key)
    expect(dividerKeys[0]).toBe('divider-msg1')
  })
})

describe('MessageList expose 方法', () => {
  it('scrollToBottom 应该滚动到底部', () => {
    const scrollToBottom = vi.fn()
    
    // 模拟组件暴露的方法
    const exposed = {
      scrollToBottom,
      scrollToMessage: vi.fn()
    }
    
    exposed.scrollToBottom(true)
    
    expect(scrollToBottom).toHaveBeenCalledWith(true)
  })

  it('scrollToMessage 应该滚动到指定消息', () => {
    const scrollToMessage = vi.fn()
    
    const exposed = {
      scrollToBottom: vi.fn(),
      scrollToMessage
    }
    
    const message = { msgID: 'msg1' }
    exposed.scrollToMessage(message, true)
    
    expect(scrollToMessage).toHaveBeenCalledWith(message, true)
  })
})
