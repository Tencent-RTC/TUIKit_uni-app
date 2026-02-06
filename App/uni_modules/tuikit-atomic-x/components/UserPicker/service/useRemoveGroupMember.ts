import { computed } from 'vue';
import { type UserPickerHookResult, type User } from './types';
import { useGroupMemberState } from '../../../state/GroupMemberState';
import useLoginState from '../../../state/LoginState';
import { GroupMemberRole } from '../../../types/group';

declare const uni: any

/**
 * 删除群成员 Hook
 * 
 * 场景：从群成员中选择要删除的成员
 * 数据源：群成员列表
 * 过滤：权限大于等于自己的成员（群主/管理员不能被普通成员删除）
 */
export function useRemoveGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  
  // ======================== 数据源 ========================
  const { 
    groupMemberList: allMembers,
    hasMoreGroupMembers,
    deleteGroupMember,
    fetchGroupMemberList,
    fetchMoreGroupMemberList,
  } = useGroupMemberState({ groupID });


  const { loginUserInfo } = useLoginState();
  
  // 当前用户角色（从成员列表中查找）
  const currentUserRole = computed(() => {
    const currentUser = allMembers.value.find(m => m.userID === loginUserInfo.value?.userID)
    return currentUser?.role || GroupMemberRole.Member
  })
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：过滤掉权限大于等于自己的成员 */
  const userList = computed<User[]>(() => {
    const myRole = currentUserRole.value || GroupMemberRole.Member
    
    return (allMembers.value || [])
      .filter(member => member.role < myRole)
      .map(member => ({
        userID: member.userID,
        nickname: member.nameCard || member.nickname || member.userID,
        avatarURL: member.avatarURL || ''
      }))
  })

  /** 锁定项（删除场景无锁定项） */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据 */
  const hasMore = computed(() => hasMoreGroupMembers.value)

  // ======================== 方法 ========================

  /** 确认删除 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择要删除的成员', icon: 'none' })
      return
    }
    
    const members = selectedUsers.map(user => user.userID)
    
    try {
      await deleteGroupMember(members);
      uni.showToast({ title: '删除成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '删除失败', icon: 'none' })
      console.error('[useRemoveGroupMember] handleConfirm failed:', error)
    }
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try {
      await fetchMoreGroupMemberList()
    } catch (error) {
      console.error('[useRemoveGroupMember] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 100,
    title: '删除群成员',
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
