import { type ComputedRef, type Ref } from 'vue'

export interface User {
  userID: string
  nickname?: string
  avatarURL?: string
}

/**
 * UserPicker Hook 返回结果
 */
export interface UserPickerHookResult {
  /** 用户列表（响应式） */
  userList: ComputedRef<User[]>
  /** 锁定项列表（响应式） */
  lockedItems: ComputedRef<string[]>
  /** 最大选择数量 */
  maxCount: number
  /** 页面标题 */
  title: string
  /** 是否有更多数据 */
  hasMore: ComputedRef<boolean>
  /** 处理确认选择 */
  handleConfirm: (selectedUsers: User[]) => Promise<void>
  /** 处理取消操作（可选） */
  handleCancel?: () => Promise<void>
  /** 触底加载更多（可选） */
  onReachEnd?: () => Promise<void>
}

/**
 * UserPicker Hook 工厂函数类型
 */
export type UserPickerHook = (routeParams?: any) => UserPickerHookResult
