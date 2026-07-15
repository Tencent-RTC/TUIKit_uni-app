import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import useLoginState from '../../../state/LoginState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

export function useRemoveGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { memberList: allMembers, hasMoreMembers, deleteMember, loadMoreMembers } = useGroupMemberState({ groupID })
  const loginState = useLoginState()

  const userList = {
    get value(): User[] {
      const myUserID = (loginState.state.loginUserInfo && loginState.state.loginUserInfo.userID)
      const currentUser = (allMembers.value || []).find(m => m.userID === myUserID)
      const myRole = (currentUser && currentUser.role) || GroupMemberRole.MEMBER
      return (allMembers.value || [])
        .filter(member => member.role < myRole)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要删除的成员', icon: 'none' }); return }
    try {
      await deleteMember(selectedUsers.map(user => user.userID))
      uni.showToast({ title: '删除成功', icon: 'success' })
      uni.$emit('onGroupMemberChanged', { type: 'remove', groupID })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '删除失败', icon: 'none' }); console.error('[useRemoveGroupMember] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try { await loadMoreMembers() } catch (error) { console.error('[useRemoveGroupMember] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 100, title: '删除群成员', hasMore, handleConfirm, onReachEnd }
}
