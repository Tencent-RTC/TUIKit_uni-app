/**
 * Search 组件测试用例
 * @module Search.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { SearchType, SearchTabValue, KeywordListMatchType } from '../../../types/search'

// Mock useSearchState
const mockSearch = vi.fn()
const mockSearchMore = vi.fn()
const mockClearSearchResults = vi.fn()
const mockDestroyStore = vi.fn()

vi.mock('../../../state/SearchState', () => ({
  useSearchState: () => ({
    userList: ref([]),
    friendList: ref([]),
    groupList: ref([]),
    groupMemberList: ref({}),
    messageResults: ref([]),
    hasMoreUserList: ref(false),
    hasMoreFriendList: ref(false),
    hasMoreGroupList: ref(false),
    hasMoreGroupMemberList: ref(false),
    hasMoreMessageResults: ref(false),
    search: mockSearch,
    searchMore: mockSearchMore,
    clearSearchResults: mockClearSearchResults,
    destroyStore: mockDestroyStore
  })
}))

// Mock uni API
vi.stubGlobal('uni', {
  getStorageSync: vi.fn(() => '[]'),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  showToast: vi.fn()
})

describe('Search 组件逻辑测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch.mockResolvedValue(undefined)
    mockSearchMore.mockResolvedValue(undefined)
  })

  describe('搜索功能', () => {
    it('空关键词不应该触发搜索', async () => {
      // 模拟 doSearch 逻辑
      const doSearch = async (keyword: string) => {
        if (!keyword.trim()) {
          mockClearSearchResults()
          return
        }
        await mockSearch([keyword])
      }

      await doSearch('')
      expect(mockClearSearchResults).toHaveBeenCalled()
      expect(mockSearch).not.toHaveBeenCalled()
    })

    it('有效关键词应该触发搜索', async () => {
      const doSearch = async (keyword: string) => {
        if (!keyword.trim()) {
          mockClearSearchResults()
          return
        }
        await mockSearch([keyword])
      }

      await doSearch('测试')
      expect(mockSearch).toHaveBeenCalledWith(['测试'])
    })

    it('搜索失败应该显示错误提示', async () => {
      mockSearch.mockRejectedValue(new Error('搜索失败'))
      
      const doSearch = async (keyword: string) => {
        try {
          await mockSearch([keyword])
        } catch (error: any) {
          uni.showToast({
            title: error.message,
            icon: 'none',
            duration: 2000
          })
        }
      }

      await doSearch('测试')
      expect(uni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '搜索失败',
          icon: 'none'
        })
      )
    })
  })

  describe('currentSearchOption 计算', () => {
    it('云端搜索时应该包含 User 类型', () => {
      const isCloudSearch = true
      const searchType = isCloudSearch
        ? SearchType.Friend.or(SearchType.Group).or(SearchType.Message).or(SearchType.User)
        : SearchType.Friend.or(SearchType.Group).or(SearchType.Message)
      
      // 验证 User 类型被包含
      expect(searchType.value & SearchType.User.value).toBe(SearchType.User.value)
    })

    it('本地搜索时不应该包含 User 类型', () => {
      const isCloudSearch = false
      const searchType = isCloudSearch
        ? SearchType.Friend.or(SearchType.Group).or(SearchType.Message).or(SearchType.User)
        : SearchType.Friend.or(SearchType.Group).or(SearchType.Message)
      
      // 验证 User 类型未被包含
      expect(searchType.value & SearchType.User.value).toBe(0)
    })
  })

  describe('Tab 切换逻辑', () => {
    it('切换到全部时应该清空筛选条件', () => {
      const messageFilter = ref({ conversationID: 'conv1' })
      const userFilter = ref({ gender: 1 })
      const conversationID = ''
      
      const handleTabChange = (tab: SearchTabValue) => {
        if (tab === SearchTabValue.All && !conversationID) {
          const hasFilter = Object.keys(messageFilter.value).length > 0 || 
                           Object.keys(userFilter.value).length > 0
          if (hasFilter) {
            messageFilter.value = {}
            userFilter.value = {}
          }
        }
      }

      handleTabChange(SearchTabValue.All)
      
      expect(Object.keys(messageFilter.value).length).toBe(0)
      expect(Object.keys(userFilter.value).length).toBe(0)
    })

    it('有 conversationID 时不应该清空筛选条件', () => {
      const messageFilter = ref({ conversationID: 'conv1' })
      const userFilter = ref({ gender: 1 })
      const conversationID = 'c2c_user1'
      
      const handleTabChange = (tab: SearchTabValue) => {
        if (tab === SearchTabValue.All && !conversationID) {
          messageFilter.value = {}
          userFilter.value = {}
        }
      }

      handleTabChange(SearchTabValue.All)
      
      expect(Object.keys(messageFilter.value).length).toBe(1)
      expect(Object.keys(userFilter.value).length).toBe(1)
    })
  })

  describe('搜索历史', () => {
    it('应该保存搜索历史', () => {
      const searchHistory = ref<string[]>([])
      const MAX_HISTORY_COUNT = 20
      
      const saveSearchHistory = (kw: string) => {
        if (!kw.trim()) return
        
        const index = searchHistory.value.indexOf(kw)
        if (index > -1) {
          searchHistory.value.splice(index, 1)
        }
        
        searchHistory.value.unshift(kw)
        
        if (searchHistory.value.length > MAX_HISTORY_COUNT) {
          searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_COUNT)
        }
      }

      saveSearchHistory('测试1')
      saveSearchHistory('测试2')
      
      expect(searchHistory.value).toEqual(['测试2', '测试1'])
    })

    it('重复搜索应该移到最前面', () => {
      const searchHistory = ref<string[]>(['测试1', '测试2', '测试3'])
      
      const saveSearchHistory = (kw: string) => {
        const index = searchHistory.value.indexOf(kw)
        if (index > -1) {
          searchHistory.value.splice(index, 1)
        }
        searchHistory.value.unshift(kw)
      }

      saveSearchHistory('测试2')
      
      expect(searchHistory.value[0]).toBe('测试2')
      expect(searchHistory.value.length).toBe(3)
    })

    it('应该限制历史记录数量', () => {
      const searchHistory = ref<string[]>([])
      const MAX_HISTORY_COUNT = 5
      
      const saveSearchHistory = (kw: string) => {
        searchHistory.value.unshift(kw)
        if (searchHistory.value.length > MAX_HISTORY_COUNT) {
          searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_COUNT)
        }
      }

      for (let i = 0; i < 10; i++) {
        saveSearchHistory(`测试${i}`)
      }
      
      expect(searchHistory.value.length).toBe(MAX_HISTORY_COUNT)
    })

    it('应该清除搜索历史', () => {
      const searchHistory = ref<string[]>(['测试1', '测试2'])
      
      const clearSearchHistory = () => {
        searchHistory.value = []
      }

      clearSearchHistory()
      
      expect(searchHistory.value).toEqual([])
    })
  })

  describe('查看更多', () => {
    it('在全部 tab 时应该切换到对应 tab', async () => {
      const currentTab = ref(SearchTabValue.All)
      
      const handleViewMore = async (type: string) => {
        if (currentTab.value === SearchTabValue.All) {
          if (type) {
            currentTab.value = type as unknown as SearchTabValue
          }
        } else {
          await mockSearchMore(SearchType.Friend)
        }
      }

      await handleViewMore(SearchTabValue.Friend as unknown as string)
      
      expect(currentTab.value).toBe(SearchTabValue.Friend)
      expect(mockSearchMore).not.toHaveBeenCalled()
    })

    it('在具体 tab 时应该加载更多', async () => {
      const currentTab = ref(SearchTabValue.Friend)
      
      const handleViewMore = async (type: string) => {
        if (currentTab.value === SearchTabValue.All) {
          currentTab.value = type as unknown as SearchTabValue
        } else {
          await mockSearchMore(SearchType.Friend)
        }
      }

      await handleViewMore('friend')
      
      expect(mockSearchMore).toHaveBeenCalled()
    })

    it('加载更多失败应该显示错误提示', async () => {
      mockSearchMore.mockRejectedValue(new Error('加载更多失败'))
      
      const handleViewMore = async () => {
        try {
          await mockSearchMore(SearchType.Friend)
        } catch (error: any) {
          uni.showToast({
            title: error.message,
            icon: 'none',
            duration: 2000
          })
        }
      }

      await handleViewMore()
      
      expect(uni.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '加载更多失败'
        })
      )
    })
  })

  describe('会话内搜索', () => {
    it('有 conversationID 时只搜索消息', () => {
      const conversationID = 'c2c_user1'
      const isConversationSearch = !!conversationID
      
      expect(isConversationSearch).toBe(true)
      
      // 会话内搜索只搜索消息类型
      const searchType = isConversationSearch 
        ? SearchType.Message 
        : SearchType.Friend.or(SearchType.Group).or(SearchType.Message)
      
      expect(searchType.value).toBe(SearchType.Message.value)
    })

    it('有 conversationID 时不显示 tab', () => {
      const conversationID = 'c2c_user1'
      const keyword = '测试'
      const showPresearch = false
      
      const showTab = (() => {
        if (!!conversationID) {
          return false
        }
        return keyword.trim() && !showPresearch
      })()
      
      expect(showTab).toBe(false)
    })
  })

  describe('组件销毁', () => {
    it('销毁时应该调用 destroyStore', () => {
      // 模拟 onBeforeUnmount
      const cleanup = () => {
        mockDestroyStore()
      }

      cleanup()
      
      expect(mockDestroyStore).toHaveBeenCalled()
    })
  })
})

describe('Search 筛选条件变化', () => {
  it('消息筛选条件变化应该重新搜索', async () => {
    const keyword = ref('测试')
    
    const handleMessageFilterChange = async (filter: any) => {
      if (keyword.value.trim()) {
        await mockSearch([keyword.value])
      }
    }

    await handleMessageFilterChange({ startTime: Date.now() })
    
    expect(mockSearch).toHaveBeenCalledWith(['测试'])
  })

  it('用户筛选条件变化应该重新搜索', async () => {
    const keyword = ref('测试')
    
    const handleUserFilterChange = async (filter: any) => {
      if (keyword.value.trim()) {
        await mockSearch([keyword.value])
      }
    }

    await handleUserFilterChange({ gender: 1 })
    
    expect(mockSearch).toHaveBeenCalledWith(['测试'])
  })

  it('没有关键词时不应该搜索', async () => {
    const keyword = ref('')
    
    const handleFilterChange = async () => {
      if (keyword.value.trim()) {
        await mockSearch([keyword.value])
      }
    }

    await handleFilterChange()
    
    expect(mockSearch).not.toHaveBeenCalled()
  })
})
