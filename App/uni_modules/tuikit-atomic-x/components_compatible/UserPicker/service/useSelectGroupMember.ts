import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import useLoginState from '../../../state/LoginState'
import { useSearchState } from '../../../state/SearchState'
import { SearchType, KeywordListMatchType } from '../../../types/search'
import { AT_ALL_TAG } from '../../../utils/mention'
import { makeReactive } from '../../../utils/reactiveCompat'

declare const uni: any

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_INSTANCE_ID = 'groupMemberPicker_search'

/**
 * 选择群成员 Hook - Vue2 兼容版（统一处理普通选择 + @ 提及选人两种业务）
 *
 * routeParams 支持的开关与 Vue3 版本一致：
 *  - conversationID: 会话 ID（必传）
 *  - excludeSelf: 是否过滤当前登录用户，默认 true
 *  - maxCount: 最大可选人数，默认 500
 *  - title: 页面标题，默认 '选择群成员'
 *  - singleSelect: 单选模式（点击立即返回），默认 false
 *  - enableAtAll: 是否在顶部置顶 @所有人，默认 false
 *  - enableRemoteSearch: 是否启用 SearchState 服务端搜索，默认 false
 */
export function useSelectGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  const excludeSelf: boolean = routeParams && routeParams.excludeSelf != null ? !!routeParams.excludeSelf : true
  const maxCount: number = (routeParams && routeParams.maxCount) || 500
  const title: string = (routeParams && routeParams.title) || '选择群成员'
  const singleSelect: boolean = !!(routeParams && routeParams.singleSelect)
  const enableAtAll: boolean = !!(routeParams && routeParams.enableAtAll)
  const enableRemoteSearch: boolean = !!(routeParams && routeParams.enableRemoteSearch)

  // ======================== 数据源：群成员浏览 ========================
  const groupMemberState: any = groupID ? useGroupMemberState({ groupID }) : null
  const allMembers: any = groupMemberState ? groupMemberState.groupMemberList : makeReactive({ value: [] })
  const hasMoreGroupMembers: any = groupMemberState ? groupMemberState.hasMoreGroupMembers : makeReactive({ value: false })

  // 首屏拉取（仅 enableRemoteSearch 场景下需要主动拉）
  if (enableRemoteSearch && groupMemberState && (allMembers.value || []).length === 0) {
    groupMemberState.fetchGroupMemberList().catch((err: any) => {
      console.error('[useSelectGroupMember] fetchGroupMemberList failed:', err)
    })
  }

  // ======================== 当前登录用户 ========================
  const loginState: any = useLoginState() as any

  // ======================== 服务端搜索（按需启用） ========================
  const searchState: any = enableRemoteSearch ? useSearchState(SEARCH_INSTANCE_ID) : null
  const searchKeywordRef: any = makeReactive({ value: '' })

  let searchDebounceTimer: any = null

  const onSearchChange: ((kw: string) => void) | undefined = enableRemoteSearch
    ? function(kw: string): void {
        searchKeywordRef.value = kw
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
        searchDebounceTimer = setTimeout(function() {
          const trimmed = (kw || '').trim()
          if (!trimmed) {
            searchState.clearSearchResults()
            return
          }
          searchState
            .search([trimmed], {
              keywordListMatchType: KeywordListMatchType.OR,
              searchType: SearchType.GroupMember,
              searchCount: 100,
              groupMemberFilter: { groupIDList: [groupID] },
            })
            .catch(function(err: any) {
              console.error('[useSelectGroupMember] search failed:', err && err.code)
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

  // ======================== userList getter（浏览/搜索切换 + 过滤自己） ========================
  const userList = {
    get value(): User[] {
      const isSearching = enableRemoteSearch && (searchKeywordRef.value || '').trim().length > 0
      let source: any[]
      if (isSearching && searchState) {
        const map = (searchState.groupMemberList && searchState.groupMemberList.value) || {}
        source = map[groupID] || []
      } else {
        source = allMembers.value || []
      }
      const myID = (loginState && loginState.state && loginState.state.loginUserInfo && loginState.state.loginUserInfo.userID) || ''
      const filtered = excludeSelf && myID
        ? source.filter(function(m: any) { return m.userID !== myID })
        : source
      return filtered.map(function(m: any) {
        return {
          userID: m.userID,
          nickname: m.nameCard || m.nickname || m.userID,
          avatarURL: m.avatarURL || ''
        }
      })
    }
  }

  const pinnedTopItems = {
    get value(): User[] {
      if (!enableAtAll) return []
      return [{ userID: AT_ALL_TAG, nickname: '所有人', avatarURL: '' }]
    }
  }

  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value(): boolean { return !!hasMoreGroupMembers.value } }

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
    const isSearching = enableRemoteSearch && (searchKeywordRef.value || '').trim().length > 0
    if (isSearching) return
    if (!groupMemberState) return
    if (!hasMoreGroupMembers.value) return
    try {
      await groupMemberState.fetchMoreGroupMemberList()
    } catch (err) {
      console.error('[useSelectGroupMember] fetchMoreGroupMemberList failed:', err)
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
