import { computed } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { type ContactInfo } from '../../../types/contact'

declare const uni: any

/**
 * 发起 C2C 会话 Hook
 * 
 * 场景：从好友列表中选择用户发起单聊
 * 数据源：好友列表
 */
export function useStartC2CConversation(_routeParams?: any): UserPickerHookResult {
  // ======================== 数据源 ========================
  const { friendList, destroyStore } = useContactState()
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：好友列表 */
  const userList = computed<User[]>(() => {
    return (friendList.value || []).map((contact: ContactInfo) => ({
      userID: contact.userID,
      nickname: contact?.remark || contact?.nickname || contact.userID,
      avatarURL: contact.avatarURL || ''
    }))
  })

  /** 锁定项 */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据（好友列表不分页） */
  const hasMore = computed(() => false)

  // ======================== 方法 ========================

  /** 确认选择，跳转到聊天页 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({ title: '请选择联系人', icon: 'none' })
      return
    }
    
    const selectedUser = selectedUsers[0]
    const conversationID = `c2c_${selectedUser.userID}`
    await destroyStore()
    
    uni.redirectTo({
      url: `/pages/scenes/chat/chat/index?conversationID=${conversationID}`
    })
  }

  /** 处理取消操作 */
  const handleCancel = async (): Promise<void> => {
    try {
      await destroyStore()
    } catch (error) {
      console.error('[useStartC2CConversation] handleCancel failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 1,
    title: '选择联系人',
    hasMore,
    handleConfirm,
    handleCancel,
    // C2C 会话不需要 onReachEnd
  }
}
