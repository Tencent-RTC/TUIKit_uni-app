import { computed } from 'vue';
import { type UserPickerHookResult, type User } from './types';
import { useGroupMemberState } from '../../../state/GroupMemberState';
import { GroupMemberRole } from '../../../types/group';

declare const uni: any

/**
 * 晋升管理员 Hook
 * 
 * 场景：从普通群成员中选择用户晋升为管理员
 * 数据源：群成员列表
 * 过滤：只显示普通成员（role = Member）
 */
export function usePromoteAdmin(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  
  // ======================== 数据源 ========================
  const { 
    memberList: allMembers, 
    hasMoreMembers, 
    setMemberRole, 
    loadMoreMembers,
  } = useGroupMemberState({ groupID });

  const {
    loadMembers
  } = useGroupMemberState({ groupID, role: GroupMemberRole.ADMIN});
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：只显示普通成员 */
  const userList = computed<User[]>(() => {
    return (allMembers.value || [])
      .filter(member => member.role === GroupMemberRole.MEMBER)
      .map(member => ({
        userID: member.userID,
        nickname: member.nameCard || member.nickname || member.userID,
        avatarURL: member.avatarURL || ''
      }))
  })

  /** 锁定项 */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据 */
  const hasMore = computed(() => hasMoreMembers.value)

  // ======================== 方法 ========================

  /** 确认晋升 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择要添加的管理员', icon: 'none' })
      return
    }
    
    try {
      for (const user of selectedUsers) {
        await setMemberRole(user.userID, GroupMemberRole.ADMIN)
      }
      
      uni.showToast({ title: '设置成功', icon: 'success' })
      setTimeout(() => {
        loadMembers();
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '设置失败', icon: 'none' })
      console.error('[usePromoteAdmin] handleConfirm failed:', error)
    }
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try {
      await loadMoreMembers()
    } catch (error) {
      console.error('[usePromoteAdmin] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 10,
    title: '添加管理员',
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
