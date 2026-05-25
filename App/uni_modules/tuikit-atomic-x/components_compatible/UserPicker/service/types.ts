export interface User {
  userID: string
  nickname?: string
  avatarURL?: string
}

/**
 * UserPicker Hook 返回结果
 * Vue2 兼容版：不使用 ComputedRef，改为 getter 函数或 { value: T }
 */
export interface UserPickerHookResult {
  /** 用户列表 */
  userList: { value: User[] }
  /** 锁定项列表 */
  lockedItems: { value: string[] }
  /** 最大选择数量 */
  maxCount: number
  /** 页面标题 */
  title: string
  /** 是否有更多数据 */
  hasMore: { value: boolean }
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
