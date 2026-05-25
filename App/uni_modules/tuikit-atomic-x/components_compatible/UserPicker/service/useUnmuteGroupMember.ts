import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'

declare const uni: any

export function useUnmuteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { groupMemberList: allMembers, hasMoreGroupMembers, setGroupMemberMuteTime, fetchMoreGroupMemberList } = useGroupMemberState({ groupID })

  const userList = {
    get value(): User[] {
      const now = Math.floor(Date.now() / 1000)
      return (allMembers.value || [])
        .filter(member => member.muteUntil && member.muteUntil > now)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreGroupMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要解除禁言的成员', icon: 'none' }); return }
    try {
      for (const user of selectedUsers) { await setGroupMemberMuteTime(user.userID, 0) }
      uni.showToast({ title: '解除成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '解除失败', icon: 'none' }); console.error('[useUnmuteGroupMember] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try { await fetchMoreGroupMemberList() } catch (error) { console.error('[useUnmuteGroupMember] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 100, title: '解除禁言', hasMore, handleConfirm, onReachEnd }
}
