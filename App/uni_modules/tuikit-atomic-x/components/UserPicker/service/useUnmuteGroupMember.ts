import { computed } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'

declare const uni: any

/**
 * 取消禁言群成员 Hook
 * 
 * 场景：从已禁言成员中选择用户解除禁言
 * 数据源：群成员列表
 * 过滤：只显示已被禁言的成员
 */
export function useUnmuteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  
  // ======================== 数据源 ========================
  const groupMemberState = useGroupMemberState({ groupID })
  const { 
    groupMemberList: allMembers, 
    hasMoreGroupMembers, 
    setGroupMemberMuteTime, 
    fetchMoreGroupMemberList, 
  } = groupMemberState
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：只显示已被禁言的成员 */
  const userList = computed<User[]>(() => {
    const now = Math.floor(Date.now() / 1000)
    
    return (allMembers.value || [])
      .filter(member => member.muteUntil && member.muteUntil > now)
      .map(member => ({
        userID: member.userID,
        nickname: member.nameCard || member.nickname || member.userID,
        avatarURL: member.avatarURL || ''
      }))
  })

  /** 锁定项 */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据 */
  const hasMore = computed(() => hasMoreGroupMembers.value)

  // ======================== 方法 ========================

  /** 确认解除禁言 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择要解除禁言的成员', icon: 'none' })
      return
    }
    
    try {
      
      // 设置禁言时间为0即解除禁言
      for (const user of selectedUsers) {
        await setGroupMemberMuteTime(user.userID, 0)
      }
      
      uni.showToast({ title: '解除成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '解除失败', icon: 'none' })
      console.error('[useUnmuteGroupMember] handleConfirm failed:', error)
    }
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try {
      await fetchMoreGroupMemberList()
    } catch (error) {
      console.error('[useUnmuteGroupMember] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 100,
    title: '解除禁言',
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
