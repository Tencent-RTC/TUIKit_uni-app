import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

export function useDemoteAdmin(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { groupMemberList: allMembers, hasMoreGroupMembers, fetchGroupMemberList, setGroupMemberRole, fetchMoreGroupMemberList } = useGroupMemberState({ groupID, role: GroupMemberRole.Admin })

  const userList = {
    get value(): User[] {
      return (allMembers.value || [])
        .filter(member => member.role === GroupMemberRole.Admin)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreGroupMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要删除的管理员', icon: 'none' }); return }
    try {
      for (const user of selectedUsers) { await setGroupMemberRole(user.userID, GroupMemberRole.Member) }
      uni.showToast({ title: '设置成功', icon: 'success' })
      setTimeout(() => { fetchGroupMemberList(); uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '设置失败', icon: 'none' }); console.error('[useDemoteAdmin] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try { await fetchMoreGroupMemberList() } catch (error) { console.error('[useDemoteAdmin] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 10, title: '删除管理员', hasMore, handleConfirm, onReachEnd }
}
