/**
 * SearchState 测试用例
 * @module SearchState.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchType, KeywordListMatchType } from '../../types/search'

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
    __SEARCH_STATE_INSTANCES__: new Map()
  }
}))

describe('SearchState', () => {
  let SearchState: any
  let useSearchState: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 模拟 createStore 成功响应
    mockCallAPI.mockImplementation((options, callback) => {
      if (options.api === 'createStore') {
        callback(JSON.stringify({ errCode: 0, errMsg: 'success' }))
      }
    })

    // 动态导入以获取新实例
    const module = await import('../../state/SearchState')
    SearchState = module.SearchState
    useSearchState = module.useSearchState
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = SearchState.getInstance('test_store')
      const instance2 = SearchState.getInstance('test_store')
      expect(instance1).toBe(instance2)
    })

    it('不同 storeID 应该返回不同实例', () => {
      const instance1 = SearchState.getInstance('store_1')
      const instance2 = SearchState.getInstance('store_2')
      expect(instance1).not.toBe(instance2)
    })

    it('默认 storeID 应该是 default_search_store', () => {
      const instance = SearchState.getInstance()
      expect(instance.storeID).toBe('default_search_store')
    })
  })

  describe('useSearchState', () => {
    it('应该返回 SearchState 实例', () => {
      const state = useSearchState('test_hook_store')
      expect(state).toBeDefined()
      expect(state.storeID).toBe('test_hook_store')
    })

    it('应该包含所有必要的属性和方法', () => {
      const state = useSearchState()
      
      // 检查属性
      expect(state.userList).toBeDefined()
      expect(state.friendList).toBeDefined()
      expect(state.groupList).toBeDefined()
      expect(state.groupMemberList).toBeDefined()
      expect(state.messageResults).toBeDefined()
      expect(state.hasMoreUserList).toBeDefined()
      expect(state.hasMoreFriendList).toBeDefined()
      expect(state.hasMoreGroupList).toBeDefined()
      expect(state.hasMoreGroupMemberList).toBeDefined()
      expect(state.hasMoreMessageResults).toBeDefined()
      
      // 检查方法
      expect(typeof state.search).toBe('function')
      expect(typeof state.searchMore).toBe('function')
      expect(typeof state.clearSearchResults).toBe('function')
      expect(typeof state.destroyStore).toBe('function')
    })
  })

  describe('search', () => {
    it('应该调用 callAPI 并传递正确的参数', async () => {
      const state = useSearchState('search_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'search') {
          expect(options.storeName).toBe('SearchStore')
          expect(options.storeID).toBe('search_test')
          expect(options.params.keywordList).toBe(JSON.stringify(['测试关键词']))
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.search(['测试关键词'])
    })

    it('应该支持搜索选项', async () => {
      const state = useSearchState('search_option_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'search') {
          const parsedOption = JSON.parse(options.params.option)
          expect(parsedOption.isCloudSearch).toBe(true)
          expect(parsedOption.searchCount).toBe(50)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.search(['关键词'], {
        isCloudSearch: true,
        searchCount: 50,
        searchType: SearchType.Friend.or(SearchType.Group)
      })
    })

    it('搜索失败时应该 reject', async () => {
      const state = useSearchState('search_fail_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'search') {
          callback(JSON.stringify({ errCode: -1, errMsg: '搜索失败' }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await expect(state.search(['关键词'])).rejects.toThrow('搜索失败')
    })
  })

  describe('searchMore', () => {
    it('应该调用 callAPI 加载更多', async () => {
      const state = useSearchState('search_more_test')
      
      mockCallAPI.mockImplementation((options, callback) => {
        if (options.api === 'searchMore') {
          expect(options.params.searchType).toBe(SearchType.Friend.value)
          callback(JSON.stringify({ errCode: 0 }))
        } else {
          callback(JSON.stringify({ errCode: 0 }))
        }
      })

      await state.searchMore(SearchType.Friend)
    })
  })

  describe('clearSearchResults', () => {
    it('应该清空所有搜索结果', () => {
      const state = useSearchState('clear_test')
      
      // 模拟有数据
      state.userList.value = [{ userID: 'user1' }]
      state.friendList.value = [{ userID: 'friend1' }]
      state.groupList.value = [{ groupID: 'group1' }]
      state.messageResults.value = [{ conversationID: 'conv1' }]
      
      state.clearSearchResults()
      
      expect(state.userList.value).toEqual([])
      expect(state.friendList.value).toEqual([])
      expect(state.groupList.value).toEqual([])
      expect(state.messageResults.value).toEqual([])
      expect(state.hasMoreUserList.value).toBe(false)
      expect(state.hasMoreFriendList.value).toBe(false)
      expect(state.hasMoreGroupList.value).toBe(false)
      expect(state.hasMoreMessageResults.value).toBe(false)
    })
  })

  describe('destroyStore', () => {
    it('应该移除监听器并调用 destroyStore API', () => {
      const state = useSearchState('destroy_test')
      
      state.destroyStore()
      
      // 验证 removeListener 被调用
      expect(mockRemoveListener).toHaveBeenCalled()
      
      // 验证 destroyStore API 被调用
      expect(mockCallAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          api: 'destroyStore',
          storeName: 'SearchStore',
          storeID: 'destroy_test'
        }),
        expect.any(Function)
      )
    })
  })
})

describe('SearchState 事件监听', () => {
  it('应该在 createStore 成功后绑定事件监听', async () => {
    mockCallAPI.mockImplementation((options, callback) => {
      if (options.api === 'createStore') {
        callback(JSON.stringify({ errCode: 0 }))
      }
    })

    const module = await import('../../state/SearchState')
    module.useSearchState('event_test')

    // 验证 addListener 被调用了多次（用户、好友、群组、消息等）
    expect(mockAddListener).toHaveBeenCalled()
  })
})
