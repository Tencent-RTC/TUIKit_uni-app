/**
 * ConversationListState 测试用例
 * @module ConversationListState.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
    __CONVERSATION_LIST_STATE_INSTANCES__: new Map()
  }
}))

describe('ConversationListState', () => {
  let ConversationListState: any
  let useConversationListState: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 模拟 createStore 成功响应
    mockCallAPI.mockImplementation((options, callback) => {
      if (options.api === 'createStore') {
        callback(JSON.stringify({ errCode: 0, errMsg: 'success' }))
      } else if (options.api === 'fetchConversationList') {
        callback(JSON.stringify({ errCode: 0 }))
      }
    })

    const module = await import('../../state/ConversationListState')
    ConversationListState = module.ConversationListState
    useConversationListState = module.useConversationListState
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = ConversationListState.getInstance('test_store')
      const instance2 = ConversationListState.getInstance('test_store')
      expect(instance1).toBe(instance2)
    })

    it('不同 storeID 应该返回不同实例', () => {
      const instance1 = ConversationListState.getInstance('store_1')
      const instance2 = ConversationListState.getInstance('store_2')
      expect(instance1).not.toBe(instance2)
    })

    it('默认 storeID 应该是 default_conversation_store', () => {
      const instance = ConversationListState.getInstance()
      expect(instance.storeID).toBe('default_conversation_store')
    })
  })

  describe('useConversationListState', () => {
    it('应该返回 ConversationListState 实例', () => {
      const state = useConversationListState('test_hook_store')
      expect(state).toBeDefined()
      expect(state.storeID).toBe('test_hook_store')
    })

    it('应该包含所有必要的属性和方法', () => {
      const state = useConversationListState()
      
      // 检查属性
      expect(state.conversationList).toBeDefined()
      expect(state.totalUnreadCount).toBeDefined()
      expect(state.hasMoreConversation).toBeDefined()
      
      // 检查方法
      expect(typeof state.fetchConversationList).toBe('function')
      expect(typeof state.fetchMoreConversationList).toBe('function')
      expect(typeof state.fetchConversationInfo).toBe('function')
      expect(typeof state.pinConversation).toBe('function')
      expect(typeof state.muteConversation).toBe('function')
      expect(typeof state.deleteConversation).toBe('function')
      expect(typeof state.clearConversationUnreadCount).toBe('function')
      expect(typeof state.destroyStore).toBe('function')
    })
  })

  describe('fetchConversationList', () => {
    it('应该调用 callAPI 并传递正确的参数', async () => {
      const state = useConversationListState('fetch_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchConversationList') {
          expect(options.storeName).toBe('ConversationListStore')
          expect(options.storeID).toBe('fetch_test')
          expect(options.params.option.count).toBe(50)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.fetchConversationList(50)
    })

    it('拉取失败时应该 reject', async () => {
      const state = useConversationListState('fetch_fail_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchConversationList') {
          callback(JSON.stringify({ errCode: -1, errMsg: '拉取失败' }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await expect(state.fetchConversationList()).rejects.toThrow('拉取失败')
    })
  })

  describe('fetchConversationInfo', () => {
    it('应该返回会话信息', async () => {
      const state = useConversationListState('info_test')
      const mockConversation = {
        conversationID: 'c2c_user1',
        title: '测试用户',
        unreadCount: 5
      }
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'fetchConversationInfo') {
          expect(options.params.conversationID).toBe('c2c_user1')
          callback(JSON.stringify({ errCode: 0, ...mockConversation }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      const result = await state.fetchConversationInfo('c2c_user1')
      expect(result.conversationID).toBe('c2c_user1')
      expect(result.title).toBe('测试用户')
    })
  })

  describe('pinConversation', () => {
    it('应该调用置顶 API', async () => {
      const state = useConversationListState('pin_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'pinConversation') {
          expect(options.params.conversationID).toBe('c2c_user1')
          expect(options.params.pin).toBe(true)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.pinConversation('c2c_user1', true)
    })

    it('取消置顶应该传递 pin=false', async () => {
      const state = useConversationListState('unpin_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'pinConversation') {
          expect(options.params.pin).toBe(false)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.pinConversation('c2c_user1', false)
    })
  })

  describe('muteConversation', () => {
    it('应该调用免打扰 API', async () => {
      const state = useConversationListState('mute_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'muteConversation') {
          expect(options.params.conversationID).toBe('c2c_user1')
          expect(options.params.mute).toBe(true)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.muteConversation('c2c_user1', true)
    })
  })

  describe('deleteConversation', () => {
    it('应该调用删除 API', async () => {
      const state = useConversationListState('delete_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'deleteConversation') {
          expect(options.params.conversationID).toBe('c2c_user1')
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.deleteConversation('c2c_user1')
    })

    it('删除失败时应该 reject', async () => {
      const state = useConversationListState('delete_fail_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'deleteConversation') {
          callback(JSON.stringify({ errCode: -1, errMsg: '删除失败' }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await expect(state.deleteConversation('c2c_user1')).rejects.toThrow('删除失败')
    })
  })

  describe('clearConversationUnreadCount', () => {
    it('应该调用清空未读数 API', async () => {
      const state = useConversationListState('clear_unread_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'clearConversationUnreadCount') {
          expect(options.params.conversationID).toBe('c2c_user1')
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.clearConversationUnreadCount('c2c_user1')
    })
  })

  describe('setConversationDraft', () => {
    it('应该设置会话草稿', async () => {
      const state = useConversationListState('draft_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'setConversationDraft') {
          expect(options.params.conversationID).toBe('c2c_user1')
          expect(options.params.draft).toBe('草稿内容')
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.setConversationDraft('c2c_user1', '草稿内容')
    })

    it('应该支持清空草稿', async () => {
      const state = useConversationListState('clear_draft_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'setConversationDraft') {
          expect(options.params.draft).toBeNull()
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.setConversationDraft('c2c_user1', null)
    })
  })

  describe('destroyStore', () => {
    it('应该移除监听器并重置数据', () => {
      const state = useConversationListState('destroy_test')
      
      // 模拟有数据
      state.conversationList.value = [{ conversationID: 'c2c_user1' }]
      state.totalUnreadCount.value = 10
      
      state.destroyStore()
      
      // 验证数据被重置
      expect(state.conversationList.value).toEqual([])
      expect(state.totalUnreadCount.value).toBe(0)
      
      // 验证 removeListener 被调用
      expect(mockRemoveListener).toHaveBeenCalled()
    })
  })
})

describe('ConversationListState 事件监听', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCallAPI.mockImplementation((options, callback) => {
      callback(JSON.stringify({ errCode: 0 }))
    })
  })

  it('应该监听 conversationList 变化', async () => {
    const module = await import('../../state/ConversationListState')
    module.useConversationListState('listener_test')

    // 验证 addListener 被调用，包含 conversationList
    expect(mockAddListener).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'ConversationListStore',
        dataName: 'conversationList'
      }),
      expect.any(Function)
    )
  })

  it('应该监听 totalUnreadCount 变化', async () => {
    const module = await import('../../state/ConversationListState')
    module.useConversationListState('unread_listener_test')

    expect(mockAddListener).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'ConversationListStore',
        dataName: 'totalUnreadCount'
      }),
      expect.any(Function)
    )
  })
})
