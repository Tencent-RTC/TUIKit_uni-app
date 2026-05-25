import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { type ContactInfo } from '../../../types/contact'

declare const uni: any

export function useCreateGroup(_routeParams?: any): UserPickerHookResult {
  const { friendList, destroyStore } = useContactState('createGroup')

  const userList = {
    get value(): User[] {
      return (friendList.value || []).map((contact: ContactInfo) => ({
        userID: contact.userID,
        nickname: (contact && contact.remark) || (contact && contact.nickname) || contact.userID,
        avatarURL: contact.avatarURL || ''
      }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return false } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请至少选择一个群成员', icon: 'none' })
      return
    }
    const selectedUserIDs = selectedUsers.map(user => user.userID)
    uni.$selectedUserData = JSON.stringify(selectedUserIDs)
    uni.navigateTo({ url: `/pages/scenes/chat/createGroup/createGroup` })
  }

  const handleCancel = async (): Promise<void> => {
    try { await destroyStore() } catch (error) { console.error('[useCreateGroup] handleCancel failed:', error) }
  }

  return { userList, lockedItems, maxCount: 500, title: '选择群成员', hasMore, handleConfirm, handleCancel }
}
