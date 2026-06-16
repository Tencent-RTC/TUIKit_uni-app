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
  /** 单选模式：点击立即返回（默认 false） */
  singleSelect?: boolean
  /** 置顶特殊项（如 @所有人） */
  pinnedTopItems?: { value: User[] }
  /** 搜索关键词变化回调（hook 自行实现服务端搜索） */
  onSearchChange?: (keyword: string) => void
  /** 是否渲染搜索框（默认 true；false 时隐藏搜索栏，强制浏览模式） */
  enableSearch?: boolean
}

/**
 * UserPicker Hook 工厂函数类型
 */
export type UserPickerHook = (routeParams?: any) => UserPickerHookResult
