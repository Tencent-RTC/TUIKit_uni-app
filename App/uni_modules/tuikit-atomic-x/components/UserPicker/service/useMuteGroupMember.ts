import { computed } from 'vue';
import { type UserPickerHookResult, type User } from './types';
import { useGroupMemberState } from '../../../state/GroupMemberState';
import { GroupMemberRole } from '../../../types/group';

declare const uni: any

// 默认禁言时长：1年（秒）
const DEFAULT_MUTE_DURATION = 24 * 60 * 60 * 365

/**
 * 禁言群成员 Hook
 * 
 * 场景：从普通群成员中选择用户进行禁言
 * 数据源：群成员列表
 * 过滤：只显示普通成员（role = Member），且未被禁言的
 */
export function useMuteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = routeParams?.conversationID || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  const muteDuration = routeParams?.muteDuration || DEFAULT_MUTE_DURATION
  
  // ======================== 数据源 ========================
  const groupMemberState = useGroupMemberState({ groupID })
  const { 
    groupMemberList: allMembers, 
    hasMoreGroupMembers, 
    setGroupMemberMuteTime, 
    fetchMoreGroupMemberList, 
  } = groupMemberState
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：只显示普通成员且未被禁言的 */
  const userList = computed<User[]>(() => {
    const now = Math.floor(Date.now() / 1000)
    
    return (allMembers.value || [])
      .filter(member => {
        // 只能禁言普通成员
        if (member.role !== GroupMemberRole.Member) return false
        // 过滤已被禁言的成员
        if (member.muteUntil && member.muteUntil > now) return false
        return true
      })
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

  /** 确认禁言 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择要禁言的成员', icon: 'none' })
      return
    }
    
    try {      
      for (const user of selectedUsers) {
        await setGroupMemberMuteTime(user.userID, muteDuration)
      }
      uni.showToast({ title: '禁言成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 300);
    } catch (error) {
      uni.showToast({ title: '禁言失败', icon: 'none' })
      console.error('[useMuteGroupMember] handleConfirm failed:', error)
    }
  }

  /** 触底加载更多 */
  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try {
      await fetchMoreGroupMemberList()
    } catch (error) {
      console.error('[useMuteGroupMember] onReachEnd failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 100,
    title: '添加禁言成员',
    hasMore,
    handleConfirm,
    onReachEnd,
  }
}
