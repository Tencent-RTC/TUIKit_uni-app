import { computed, watch } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { useGroupMemberState } from '../../../state/GroupMemberState'

declare const uni: any

/**
 * 邀请群成员 Hook
 * 
 * 场景：从好友列表中选择用户添加到群聊
 * 数据源：好友列表
 * 过滤：已是群成员的用户
 */
export function useInviteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  
  // ======================== 数据源 ========================
  const { friendList, destroyStore: destroyContactListStore } = useContactState('inviteGroupMember')
  const { memberList: allMembers, hasMoreMembers, addMember, loadMoreMembers } = useGroupMemberState({ groupID });

  watch(() => allMembers.value.length, async () =>{
    if (hasMoreMembers.value) {
      await loadMoreMembers();
    }
  }, {
    immediate: true,
  });
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表 = 好友列表 - 已有群成员 */
  const userList = computed<User[]>(() => {
    const existingMemberIDs = new Set(allMembers.value?.map(m => m.userID) || [])
    
    return (friendList.value || [])
      .filter((contact) => !existingMemberIDs.has(contact.userID))
      .map((contact) => ({
        userID: contact.userID,
        nickname: contact.friendRemark || contact.nickname || contact.userID,
        avatarURL: contact.avatarURL || ''
      }))
  });

  /** 锁定项（邀请场景无锁定项） */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据 */
  const hasMore = computed(() => hasMoreMembers.value)

  // ======================== 方法 ========================

  /** 确认添加 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择要添加的成员', icon: 'none' })
      return
    }
    
    try {
      await addMember(selectedUsers.map(u => u.userID))
      uni.showToast({ title: '添加成功', icon: 'success' });
      uni.$emit('onGroupMemberChanged', { type: 'add', groupID })
      setTimeout(() => {
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '添加失败', icon: 'none' })
      console.error('[useInviteGroupMember] handleConfirm failed:', error)
    }
  }

  /** 处理取消操作 */
  const handleCancel = async (): Promise<void> => {
    try {
      await destroyContactListStore()
    } catch (error) {
      console.error('[useInviteGroupMember] handleCancel failed:', error)
    }
  }

  /** 触底加载更多群成员 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try {
      await loadMoreMembers()
    } catch (error) {
      console.error('[useInviteGroupMember] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 100,
    title: '添加群成员',
    hasMore,
    handleConfirm,
    handleCancel,
    onReachEnd,
  }
}
