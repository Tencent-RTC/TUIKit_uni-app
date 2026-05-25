import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { useGroupState } from '../../../state/GroupState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

export function useTransferGroupOwner(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { groupMemberList: allMembers, hasMoreGroupMembers, fetchMoreGroupMemberList } = useGroupMemberState({ groupID })
  const { changeGroupOwner } = useGroupState()

  const userList = {
    get value(): User[] {
      return (allMembers.value || [])
        .filter(member => member.role !== GroupMemberRole.Owner)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreGroupMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择新群主', icon: 'none' }); return }
    try {
      await changeGroupOwner(groupID, selectedUsers[0].userID)
      uni.showToast({ title: '转让成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '转让失败', icon: 'none' }); console.error('[useTransferGroupOwner] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try { await fetchMoreGroupMemberList() } catch (error) { console.error('[useTransferGroupOwner] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 1, title: '选择新群主', hasMore, handleConfirm, onReachEnd }
}
