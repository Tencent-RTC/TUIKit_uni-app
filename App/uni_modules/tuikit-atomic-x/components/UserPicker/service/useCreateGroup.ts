import { computed } from 'vue'
import { type UserPickerHookResult, type User } from './types'
import { useContactState } from '../../../state/ContactState'
import { type ContactInfo } from '../../../types/contact'

declare const uni: any

/**
 * 创建群聊 Hook
 * 
 * 场景：从好友列表中选择用户创建群聊
 * 数据源：好友列表
 */
export function useCreateGroup(_routeParams?: any): UserPickerHookResult {
  // ======================== 数据源 ========================
  const { friendList, destroyStore } = useContactState()
  
  // ======================== 响应式状态 ========================
  
  /** 用户列表：好友列表 */
  const userList = computed<User[]>(() => {
    return (friendList.value || []).map((contact: ContactInfo) => ({
      userID: contact.userID,
      nickname: contact?.remark || contact?.nickname || contact.userID,
      avatarURL: contact.avatarURL || ''  // 确保 avatarURL 有默认值
    }))
  })

  /** 锁定项 */
  const lockedItems = computed<string[]>(() => [])

  /** 是否有更多数据（好友列表不分页） */
  const hasMore = computed(() => false)

  // ======================== 方法 ========================

  /** 确认选择，跳转到创建群聊页面 */
  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    if (selectedUsers.length === 0) {
      uni.showToast({
        title: '请至少选择一个群成员',
        icon: 'none'
      })
      return
    }

    // 提取用户ID数组并序列化为JSON字符串传递给创建群聊页面
    const selectedUserIDs = selectedUsers.map(user => user.userID)
    const selectedUserData = JSON.stringify(selectedUserIDs)
    uni.$selectedUserData = selectedUserData
    
    uni.navigateTo({
      url: `/pages/scenes/chat/createGroup/createGroup`
    })
  }

  /** 处理取消操作 */
  const handleCancel = async (): Promise<void> => {
    try {
      await destroyStore()
    } catch (error) {
      console.error('[useCreateGroup] handleCancel failed:', error)
    }
  }

  // ======================== 返回 ========================
  return {
    userList,
    lockedItems,
    maxCount: 500,            // 群聊最多可选择 500 人
    title: '选择群成员',       // 页面标题
    hasMore,
    handleConfirm,
    handleCancel,
    // 创建群聊不需要 onReachEnd
  }
}