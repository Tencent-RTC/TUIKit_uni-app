import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { type ContactInfo } from '../../../types/contact'

declare const uni: any

export function useStartC2CConversation(_routeParams?: any): UserPickerHookResult {
  const { friendList, destroyStore } = useContactState('startC2CConversation')

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
      uni.showToast({ title: '请选择联系人', icon: 'none' })
      return
    }
    const selectedUser = selectedUsers[0]
    const conversationID = `c2c_${selectedUser.userID}`
    await destroyStore()
    uni.redirectTo({ url: `/pages/scenes/chat/chat/index?conversationID=${conversationID}` })
  }

  const handleCancel = async (): Promise<void> => {
    try { await destroyStore() } catch (error) { console.error('[useStartC2CConversation] handleCancel failed:', error) }
  }

  return { userList, lockedItems, maxCount: 1, title: '选择联系人', hasMore, handleConfirm, handleCancel }
}
