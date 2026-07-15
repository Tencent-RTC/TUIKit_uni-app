import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { useGroupState } from '../../../state/GroupState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

export function useTransferGroupOwner(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { memberList: allMembers, hasMoreMembers, loadMoreMembers } = useGroupMemberState({ groupID })
  const { changeOwner } = useGroupState()

  const userList = {
    get value(): User[] {
      return (allMembers.value || [])
        .filter(member => member.role !== GroupMemberRole.OWNER)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择新群主', icon: 'none' }); return }
    try {
      await changeOwner(groupID, selectedUsers[0].userID)
      uni.showToast({ title: '转让成功', icon: 'success' })
      uni.$emit('onGroupOwnerChanged', { groupID, newOwnerID: selectedUsers[0].userID })
      setTimeout(() => { uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '转让失败', icon: 'none' }); console.error('[useTransferGroupOwner] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try { await loadMoreMembers() } catch (error) { console.error('[useTransferGroupOwner] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 1, title: '选择新群主', hasMore, handleConfirm, onReachEnd }
}
