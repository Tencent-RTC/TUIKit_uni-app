import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { useGroupMemberState } from '../../../state/GroupMemberState'

declare const uni: any

export function useInviteGroupMember(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { friendList, destroyStore: destroyContactListStore } = useContactState('inviteGroupMember')
  const { groupMemberList: allMembers, hasMoreGroupMembers, addGroupMember, fetchMoreGroupMemberList } = useGroupMemberState({ groupID })

  // Eagerly fetch all group members to get full exclusion list
  if (hasMoreGroupMembers.value) {
    fetchMoreGroupMemberList().catch(() => {})
  }

  const userList = {
    get value(): User[] {
      const existingMemberIDs = new Set((allMembers.value || []).map(m => m.userID))
      return (friendList.value || [])
        .filter(contact => !existingMemberIDs.has(contact.userID))
        .map(contact => ({ userID: contact.userID, nickname: contact.remark || contact.nickname || contact.userID, avatarURL: contact.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreGroupMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要添加的成员', icon: 'none' }); return }
    try {
      await addGroupMember(selectedUsers.map(u => u.userID))
      uni.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '添加失败', icon: 'none' }); console.error('[useInviteGroupMember] handleConfirm failed:', error) }
  }

  const handleCancel = async (): Promise<void> => {
    try { await destroyContactListStore() } catch (error) { console.error('[useInviteGroupMember] handleCancel failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try { await fetchMoreGroupMemberList() } catch (error) { console.error('[useInviteGroupMember] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 100, title: '添加群成员', hasMore, handleConfirm, handleCancel, onReachEnd }
}
