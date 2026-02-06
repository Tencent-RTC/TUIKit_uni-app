import { computed } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import useLoginState from '../../../state/LoginState'

declare const uni: any

/**
 * 选择群成员 Hook
 * 
 * 场景：从群成员中选择成员（通用选择，不执行具体操作）
 * 数据源：群成员列表
 * 过滤：无
 */
export function useSelectGroupMember(routeParams?: any): UserPickerHookResult {
        console.warn('routeParams', routeParams)
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  const maxCount = routeParams?.maxCount || 500
  const title = routeParams?.title || '选择群成员'
  const excludeSelf = routeParams?.excludeSelf ?? true
  
  // ======================== 数据源 ========================
  const groupMemberState = useGroupMemberState({ groupID })
  const { loginUserInfo } = useLoginState()
  const { 
    groupMemberList: allMembers,
    hasMoreGroupMembers, 
    fetchMoreGroupMemberList, 
    destroyStore 
  } = groupMemberState
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表 */
  const userList = computed<User[]>(() => {
    let members = allMembers.value || []

    // 如果需要排除自己
    if (excludeSelf && loginUserInfo.value?.userID) {
      members = members.filter(member => member.userID !== loginUserInfo.value?.userID)
    }
    
    return members.map(member => ({
      userID: member.userID,
      nickname: member.nameCard || member.nickname || member.userID,
      avatarURL: member.avatarURL || ''
    }))
  })

  /** 锁定项（选择场景无锁定项） */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据 */
  const hasMore = computed(() => hasMoreGroupMembers.value)

  // ======================== 方法 ========================

  /** 确认选择 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    await destroyStore();
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try {
      await fetchMoreGroupMemberList()
    } catch (error) {
      console.error('[useSelectGroupMember] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount,
    title,
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
