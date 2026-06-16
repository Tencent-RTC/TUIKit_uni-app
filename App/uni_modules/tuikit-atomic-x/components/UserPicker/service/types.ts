import { type ComputedRef } from 'vue'

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
  /** 单选模式：点击立即返回，无 checkbox 与底部确定按钮（默认 false） */
  singleSelect?: boolean
  /** 置顶特殊项（如 @所有人）；搜索时不展示 */
  pinnedTopItems?: ComputedRef<User[]>
  /** 搜索关键词变化回调（hook 自行实现服务端搜索；不实现则走本地过滤） */
  onSearchChange?: (keyword: string) => void
  /** 是否渲染搜索框（默认 true；false 时隐藏搜索栏，强制浏览模式） */
  enableSearch?: boolean
}

/**
 * UserPicker Hook 工厂函数类型
 */
export type UserPickerHook = (routeParams?: any) => UserPickerHookResult
