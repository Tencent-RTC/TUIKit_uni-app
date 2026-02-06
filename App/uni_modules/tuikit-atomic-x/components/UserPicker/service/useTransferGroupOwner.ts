import { computed } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { useGroupState } from '../../../state/GroupState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

/**
 * 转让群主 Hook
 * 
 * 场景：从群成员中选择一个用户转让群主
 * 数据源：群成员列表
 * 过滤：只显示管理员和普通成员（排除群主自己）
 */
export function useTransferGroupOwner(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  
  // ======================== 数据源 ========================
  const groupMemberState = useGroupMemberState({ groupID })
  const groupState = useGroupState()
  const { 
    groupMemberList: allMembers, 
    hasMoreGroupMembers, 
    fetchMoreGroupMemberList,
  } = groupMemberState
  const { changeGroupOwner } = groupState
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：排除群主自己 */
  const userList = computed<User[]>(() => {
    return (allMembers.value || [])
      .filter(member => member.role !== GroupMemberRole.Owner)
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

  /** 确认转让 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择新群主', icon: 'none' })
      return
    }
    
    const newOwnerID = selectedUsers[0].userID
    
    try {
      await changeGroupOwner(groupID, newOwnerID)
      uni.showToast({ title: '转让成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '转让失败', icon: 'none' })
      console.error('[useTransferGroupOwner] handleConfirm failed:', error)
    }
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try {
      await fetchMoreGroupMemberList()
    } catch (error) {
      console.error('[useTransferGroupOwner] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 1,
    title: '选择新群主',
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
