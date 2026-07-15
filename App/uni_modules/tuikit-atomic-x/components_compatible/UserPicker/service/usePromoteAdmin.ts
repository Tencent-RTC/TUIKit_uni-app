import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import { GroupMemberRole } from '../../../types/group'

declare const uni: any

export function usePromoteAdmin(routeParams?: any): UserPickerHookResult {
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''

  const { memberList: allMembers, hasMoreMembers, setMemberRole, loadMoreMembers } = useGroupMemberState({ groupID })
  const { loadMembers } = useGroupMemberState({ groupID, role: GroupMemberRole.ADMIN })

  const userList = {
    get value(): User[] {
      return (allMembers.value || [])
        .filter(member => member.role === GroupMemberRole.MEMBER)
        .map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) { uni.showToast({ title: '请选择要添加的管理员', icon: 'none' }); return }
    try {
      for (const user of selectedUsers) { await setMemberRole(user.userID, GroupMemberRole.ADMIN) }
      uni.showToast({ title: '设置成功', icon: 'success' })
      setTimeout(() => { loadMembers(); uni.navigateBack() }, 300)
    } catch (error) { uni.showToast({ title: '设置失败', icon: 'none' }); console.error('[usePromoteAdmin] handleConfirm failed:', error) }
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreMembers.value) return
    try { await loadMoreMembers() } catch (error) { console.error('[usePromoteAdmin] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount: 10, title: '添加管理员', hasMore, handleConfirm, onReachEnd }
}
