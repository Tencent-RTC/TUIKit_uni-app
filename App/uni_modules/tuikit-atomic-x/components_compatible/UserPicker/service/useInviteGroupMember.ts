import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { useGroupMemberState } from '../../../state/GroupMemberState'

declare const uni: any

export function useInviteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { friendList, destroyStore: destroyContactListStore } = useContactState('inviteGroupMember')
  const { memberList: allMembers, hasMoreMembers, addMember, loadMoreMembers } = useGroupMemberState({ groupID })

  // Eagerly fetch all group members to get full exclusion list
  if (hasMoreMembers.value) {
    loadMoreMembers().catch(() => {})
  }

  const userList = {
    get value(): User[] {
      const existingMemberIDs = new Set((allMembers.value || []).map(m => m.userID))
      return (friendList.value || [])
        .filter(contact => !existingMemberIDs.has(contact.userID))
        .map(contact => ({ userID: contact.userID, nickname: contact.friendRemark || contact.nickname || contact.userID, avatarURL: contact.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要添加的成员', icon: 'none' }); return }
    try {
      await addMember(selectedUsers.map(u => u.userID))
      uni.showToast({ title: '添加成功', icon: 'success' })
      uni.$emit('onGroupMemberChanged', { type: 'add', groupID })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '添加失败', icon: 'none' }); console.error('[useInviteGroupMember] handleConfirm failed:', error) }
  }

  const handleCancel = async (): Promise<void> => {
    try { await destroyContactListStore() } catch (error) { console.error('[useInviteGroupMember] handleCancel failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try { await loadMoreMembers() } catch (error) { console.error('[useInviteGroupMember] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 100, title: '添加群成员', hasMore, handleConfirm, handleCancel, onReachEnd }
}
