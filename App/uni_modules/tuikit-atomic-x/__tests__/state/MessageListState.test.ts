/**
 * MessageListState 测试用例
 * @module MessageListState.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MessageFetchDirection, MessageListType, MessageMediaFileType } from '../../types/message'

// Mock callAPI 和 addListener
const mockCallAPI = vi.fn()
const mockAddListener = vi.fn()
const mockRemoveListener = vi.fn()

vi.mock('@/uni_modules/tuikit-atomic-x', () => ({
  callAPI: mockCallAPI,
  addListener: mockAddListener,
  removeListener: mockRemoveListener
}))

// Mock getApp
vi.stubGlobal('getApp', () => ({
  globalData: {
    __MESSAGE_LIST_STATE_INSTANCES__: new Map()
  }
}))

describe('MessageListState', () => {
  let MessageListState: any
  let useMessageListState: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 模拟 createStore 成功响应
    mockCallAPI.mockImplementation((options, callback) => {
      if (options.api === 'createStore') {
        callback(JSON.stringify({ errCode: 0, errMsg: 'success' }))
      } else if (options.api === 'fetchMessageList') {
        callback(JSON.stringify({ errCode: 0 }))
      }
    })

    const module = await import('../../state/MessageListState')
    MessageListState = module.MessageListState
    useMessageListState = module.useMessageListState
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = MessageListState.getInstance('c2c_user1', MessageListType.HISTORY, 'test_store')
      const instance2 = MessageListState.getInstance('c2c_user1', MessageListType.HISTORY, 'test_store')
      expect(instance1).toBe(instance2)
    })

    it('不同 conversationID 应该返回不同实例', () => {
      const instance1 = MessageListState.getInstance('c2c_user1', MessageListType.HISTORY, 'store')
      const instance2 = MessageListState.getInstance('c2c_user2', MessageListType.HISTORY, 'store')
      expect(instance1).not.toBe(instance2)
    })

    it('不同 messageListType 应该返回不同实例', () => {
      const instance1 = MessageListState.getInstance('c2c_user1', MessageListType.HISTORY, 'store')
      const instance2 = MessageListState.getInstance('c2c_user1', MessageListType.SEARCH, 'store')
      expect(instance1).not.toBe(instance2)
    })

    it('storeID 应该包含 conversationID 和 messageListType', () => {
      const instance = MessageListState.getInstance('c2c_user1', MessageListType.HISTORY, 'base_store')
      expect(instance.storeID).toBe('base_store:c2c_user1:0') // MessageListType.HISTORY = 0
    })
  })

  describe('useMessageListState', () => {
    it('应该返回 MessageListState 实例', () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        messageListType: MessageListType.HISTORY,
        storeID: 'test_hook_store'
      })
      expect(state).toBeDefined()
      expect(state.conversationID).toBe('c2c_user1')
    })

    it('应该包含所有必要的属性和方法', () => {
      const state = useMessageListState({ conversationID: 'c2c_user1' })
      
      // 检查属性
      expect(state.messageList).toBeDefined()
      expect(state.hasMoreOlderMessage).toBeDefined()
      expect(state.hasMoreNewerMessage).toBeDefined()
      
      // 检查方法
      expect(typeof state.fetchMessageList).toBe('function')
      expect(typeof state.fetchMoreMessageList).toBe('function')
      expect(typeof state.downloadMessageResource).toBe('function')
      expect(typeof state.sendMessageReadReceipts).toBe('function')
      expect(typeof state.deleteMessages).toBe('function')
      expect(typeof state.forwardMessages).toBe('function')
      expect(typeof state.destroyStore).toBe('function')
    })

    it('应该使用默认值', () => {
      const state = useMessageListState({})
      expect(state.conversationID).toBe('')
      expect(state.messageListType).toBe(MessageListType.HISTORY)
    })
  })

  describe('fetchMessageList', () => {
    it('应该调用 callAPI 并传递正确的参数', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'fetch_test'
      })
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchMessageList') {
          const parsedOption = JSON.parse(options.params.option)
          expect(parsedOption.pageCount).toBe(30)
          expect(parsedOption.direction).toBe(MessageFetchDirection.OLDER)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.fetchMessageList({
        pageCount: 30,
        direction: MessageFetchDirection.OLDER
      })
    })

    it('应该支持定位消息拉取', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'locate_test'
      })
      
      const locateMessage = { msgID: 'msg_123', timestamp: 1234567890 }
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchMessageList') {
          const parsedOption = JSON.parse(options.params.option)
          expect(parsedOption.message).toEqual(locateMessage)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.fetchMessageList({
        message: locateMessage,
        direction: MessageFetchDirection.BOTH,
        pageCount: 20
      })
    })

    it('拉取失败时应该 reject', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'fetch_fail_test'
      })
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchMessageList') {
          callback(JSON.stringify({ errCode: -1, errMsg: '拉取消息失败' }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await expect(state.fetchMessageList({ pageCount: 20 })).rejects.toThrow('拉取消息失败')
    })
  })

  describe('fetchMoreMessageList', () => {
    it('应该加载更早的消息', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'more_older_test'
      })
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchMoreMessageList') {
          expect(options.params.direction).toBe(MessageFetchDirection.OLDER)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.fetchMoreMessageList(MessageFetchDirection.OLDER)
    })

    it('应该加载更新的消息', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'more_newer_test'
      })
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchMoreMessageList') {
          expect(options.params.direction).toBe(MessageFetchDirection.NEWER)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.fetchMoreMessageList(MessageFetchDirection.NEWER)
    })
  })

  describe('downloadMessageResource', () => {
    it('应该下载消息资源', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'download_test'
      })
      
      const message = { msgID: 'msg_123', messageType: 3 } // IMAGE
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'downloadMessageResource') {
          expect(options.params.message).toEqual(message)
          expect(options.params.resourceType).toBe(MessageMediaFileType.IMAGE)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.downloadMessageResource(message, MessageMediaFileType.IMAGE)
    })
  })

  describe('deleteMessages', () => {
    it('应该删除消息并从本地列表移除', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'delete_test'
      })
      
      // 模拟消息列表
      state.messageList.value = [
        { msgID: 'msg_1' },
        { msgID: 'msg_2' },
        { msgID: 'msg_3' }
      ]
      
      const messagesToDelete = [{ msgID: 'msg_2' }]
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'deleteMessages') {
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.deleteMessages(messagesToDelete)
      
      // 验证消息被从列表中移除
      expect(state.messageList.value.length).toBe(2)
      expect(state.messageList.value.find(m => m.msgID === 'msg_2')).toBeUndefined()
    })

    it('删除失败时应该 reject', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'delete_fail_test'
      })
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'deleteMessages') {
          callback(JSON.stringify({ errCode: -1, errMsg: '删除失败' }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await expect(state.deleteMessages([{ msgID: 'msg_1' }])).rejects.toThrow('删除失败')
    })
  })

  describe('forwardMessages', () => {
    it('应该转发消息到多个会话', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'forward_test'
      })
      
      const messages = [{ msgID: 'msg_1' }, { msgID: 'msg_2' }]
      const forwardOption = { isOneByOne: true }
      const targetConversations = ['c2c_user2', 'group_123']
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'forwardMessages') {
          expect(options.params.messageList).toEqual(messages)
          expect(options.params.forwardOption).toEqual(forwardOption)
          expect(options.params.conversationIDList).toEqual(targetConversations)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.forwardMessages(messages, forwardOption, targetConversations)
    })
  })

  describe('sendMessageReadReceipts', () => {
    it('应该发送已读回执', async () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'receipt_test'
      })
      
      const messages = [{ msgID: 'msg_1' }, { msgID: 'msg_2' }]
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'sendMessageReadReceipts') {
          expect(options.params.messageList).toEqual(messages)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.sendMessageReadReceipts(messages)
    })
  })

  describe('destroyStore', () => {
    it('应该移除监听器并重置数据', () => {
      const state = useMessageListState({
        conversationID: 'c2c_user1',
        storeID: 'destroy_test'
      })
      
      // 模拟有数据
      state.messageList.value = [{ msgID: 'msg_1' }]
      state.hasMoreOlderMessage.value = false
      state.hasMoreNewerMessage.value = true
      
      state.destroyStore()
      
      // 验证数据被重置
      expect(state.messageList.value).toEqual([])
      expect(state.hasMoreOlderMessage.value).toBe(true)
      expect(state.hasMoreNewerMessage.value).toBe(false)
      
      // 验证 removeListener 被调用
      expect(mockRemoveListener).toHaveBeenCalled()
    })
  })
})

describe('MessageListState 事件监听', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCallAPI.mockImplementation((options, callback) => {
      callback(JSON.stringify({ errCode: 0 }))
    })
  })

  it('应该监听 messageList 变化', async () => {
    const module = await import('../../state/MessageListState')
    module.useMessageListState({
      conversationID: 'c2c_user1',
      storeID: 'listener_test'
    })

    expect(mockAddListener).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'MessageListStore',
        dataName: 'messageList'
      }),
      expect.any(Function)
    )
  })

  it('应该监听 hasMoreOlderMessage 变化', async () => {
    const module = await import('../../state/MessageListState')
    module.useMessageListState({
      conversationID: 'c2c_user1',
      storeID: 'older_listener_test'
    })

    expect(mockAddListener).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'MessageListStore',
        dataName: 'hasMoreOlderMessage'
      }),
      expect.any(Function)
    )
  })

  it('应该监听 hasMoreNewerMessage 变化', async () => {
    const module = await import('../../state/MessageListState')
    module.useMessageListState({
      conversationID: 'c2c_user1',
      storeID: 'newer_listener_test'
    })

    expect(mockAddListener).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'MessageListStore',
        dataName: 'hasMoreNewerMessage'
      }),
      expect.any(Function)
    )
  })
})

describe('MessageListState 自动拉取消息', () => {
  it('HISTORY 类型应该自动拉取消息', async () => {
    mockCallAPI.mockImplementation((options, callback) => {
      callback(JSON.stringify({ errCode: 0 }))
    })

    const module = await import('../../state/MessageListState')
    module.useMessageListState({
      conversationID: 'c2c_user1',
      messageListType: MessageListType.HISTORY,
      storeID: 'auto_fetch_test'
    })

    // 验证 fetchMessageList 被调用
    expect(mockCallAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        api: 'fetchMessageList'
      }),
      expect.any(Function)
    )
  })
})
