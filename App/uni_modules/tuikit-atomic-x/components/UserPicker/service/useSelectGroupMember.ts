import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { useSearchState } from '../../../state/SearchState'
import { useLoginState } from '../../../state/LoginState'
import { SearchType, KeywordListMatchMode } from '../../../types/search'
import { AT_ALL_TAG } from '../../../utils/mention'
import type { GroupMember } from '../../../types/group'

declare const uni: any

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_INSTANCE_ID = 'groupMemberPicker_search'

/**
 * 选择群成员 Hook（统一处理普通选择 + @ 提及选人两种业务）
 *
 * routeParams 支持的开关：
 *  - conversationID: 会话 ID（必传）
 *  - excludeSelf: 是否过滤当前登录用户，默认 true
 *  - maxCount: 最大可选人数，默认 500
 *  - title: 页面标题，默认 '选择群成员'
 *  - singleSelect: 单选模式（点击立即返回），默认 false
 *  - enableAtAll: 是否在顶部置顶 @所有人，默认 false
 *  - enableRemoteSearch: 是否启用 SearchState 服务端搜索，默认 false
 *      （大群本地过滤会漏匹配，开启后用 SearchState 替换 dataSource）
 */
export function useSelectGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_')
    ? conversationID.replace('group_', '')
    : ''
  const excludeSelf: boolean = routeParams?.excludeSelf ?? true
  const maxCount: number = routeParams?.maxCount || 500
  const title: string = routeParams?.title || '选择群成员'
  const singleSelect: boolean = !!routeParams?.singleSelect
  const enableAtAll: boolean = !!routeParams?.enableAtAll
  const enableRemoteSearch: boolean = !!routeParams?.enableRemoteSearch

  // ======================== 数据源：群成员浏览 ========================
  const groupMemberState = groupID ? useGroupMemberState({ groupID }) : null
  const allMembers: Ref<GroupMember[]> = groupMemberState
    ? groupMemberState.memberList
    : ref<GroupMember[]>([])
  const hasMoreMembers: Ref<boolean> = groupMemberState
    ? groupMemberState.hasMoreMembers
    : ref<boolean>(false)

  // 首屏拉取（仅 enableRemoteSearch 场景下需要主动拉，普通场景由 GroupMemberState 自身管理）
  if (enableRemoteSearch && groupMemberState && allMembers.value.length === 0) {
    groupMemberState.loadMembers().catch((err) => {
      console.error('[useSelectGroupMember] loadMembers failed:', err)
    })
  }

  // ======================== 当前登录用户（用于过滤自己） ========================
  const { loginUserInfo } = useLoginState()
  const myUserID = computed<string>(() => loginUserInfo.value?.userID || '')

  // ======================== 服务端搜索（按需启用） ========================
  const searchState = enableRemoteSearch ? useSearchState(SEARCH_INSTANCE_ID) : null
  const searchKeyword = ref('')
  const isSearching = computed(() => enableRemoteSearch && searchKeyword.value.trim().length > 0)
  const searchResultList = computed<GroupMember[]>(() => {
    if (!searchState) return []
    const map = searchState.groupMemberList.value || {}
    return map[groupID] || []
  })

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const onSearchChange = enableRemoteSearch
    ? (kw: string): void => {
        searchKeyword.value = kw
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
        searchDebounceTimer = setTimeout(() => {
          const trimmed = kw.trim()
          if (!trimmed) {
            searchState!.clearSearchResults()
            return
          }
          searchState!
            .search([trimmed], {
              keywordListMatchMode: KeywordListMatchMode.OR,
              searchScope: [SearchType.GROUP_MEMBER],
              pageSize: 100,
              groupMemberFilter: { groupIDList: [groupID] },
            })
            .catch((err) => {
              console.error('[useSelectGroupMember] search failed:', err?.code)
              let toastTitle = '搜索失败'
              if (err && err.code === 7013) {
                toastTitle = '当前套餐不支持群成员搜索，可升级为旗舰版/企业版后使用'
              } else if (err && err.message) {
                toastTitle = err.message
              }
              uni.showToast({ title: toastTitle, icon: 'none' })
            })
        }, SEARCH_DEBOUNCE_MS)
      }
    : undefined

  // ======================== userList：浏览 / 搜索模式切换 + 过滤自己 ========================
  const userList = computed<User[]>(() => {
    const source = isSearching.value ? searchResultList.value : (allMembers.value || [])
    const me = myUserID.value
    const filtered = excludeSelf && me
      ? source.filter((m: GroupMember) => m.userID !== me)
      : source
    return filtered.map((m: GroupMember) => ({
      userID: m.userID,
      nickname: m.nameCard || m.nickname || m.userID,
      avatarURL: m.avatarURL || '',
    }))
  })

  // ======================== 置顶项：@所有人（按需启用） ========================
  const pinnedTopItems = computed<User[]>(() => {
    if (!enableAtAll) return []
    return [{ userID: AT_ALL_TAG, nickname: '所有人', avatarURL: '' }]
  })

  const lockedItems = computed<string[]>(() => [])
  const hasMore = computed<boolean>(() => hasMoreMembers.value)

  // ======================== 行为 ========================
  const cleanup = (): void => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
      searchDebounceTimer = null
    }
    if (searchState) {
      try { searchState.destroyStore() } catch (e) {
        console.error('[useSelectGroupMember] destroyStore failed:', e)
      }
    }
    if (groupMemberState) {
      try { groupMemberState.destroyStore() } catch (e) {
        console.error('[useSelectGroupMember] destroyStore (groupMember) failed:', e)
      }
    }
  }

  const handleConfirm = async (_selectedUsers: User[]): Promise<void> => {
    cleanup()
  }

  const handleCancel = async (): Promise<void> => {
    cleanup()
  }

  const onReachEnd = async (): Promise<void> => {
    // 搜索模式分页由 SearchState 控制（当前需求保持单页）
    if (isSearching.value) return
    if (!groupMemberState) return
    if (!hasMoreMembers.value) return
    try {
      await groupMemberState.loadMoreMembers()
    } catch (err) {
      console.error('[useSelectGroupMember] loadMoreMembers failed:', err)
    }
  }

  return {
    userList,
    lockedItems,
    maxCount,
    title,
    hasMore,
    handleConfirm,
    handleCancel,
    onReachEnd,
    singleSelect,
    pinnedTopItems,
    onSearchChange,
  }
}
