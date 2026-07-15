/**
 * 搜索相关类型定义
 * @module types/search
 *
 * 对齐底层 atomicxcore.api.search.SearchStore.kt
 */
import type { Component } from 'vue'
import type { MessageInfo, MessageType } from './message'
import type { UserProfile, Gender } from './userProfile'
import type {
  GroupType,
  GroupJoinOption,
  GroupInviteOption,
  GroupMember,
  GroupSearchInfo,
} from './group'
import type { ConversationInfo } from './conversation'

// ==================== 枚举类型 ====================

/**
 * 关键词列表匹配模式（对齐 KeywordListMatchMode）
 *
 * 注：底层名 KeywordListMatchMode（不是 KeywordListMatchType）
 */
export enum KeywordListMatchMode {
  OR = 0,
  AND = 1,
}

/**
 * @deprecated 使用 KeywordListMatchMode
 */
export const KeywordListMatchType = KeywordListMatchMode;
export type KeywordListMatchType = KeywordListMatchMode;

/**
 * 搜索类型（对齐 SearchType，**整数枚举**，4 值）
 *
 * 注意：
 * - 底层无 USER 类型；
 * - 旧版 class SearchType（位掩码 1<<0..4）已删除，改为普通整数枚举 0..3
 */
export enum SearchType {
  FRIEND = 0,
  GROUP = 1,
  GROUP_MEMBER = 2,
  MESSAGE = 3,
}

// ==================== 过滤器类型 ====================

/**
 * 用户搜索过滤器（对齐 UserSearchFilter）
 */
export interface UserSearchFilter {
  gender?: Gender
  minBirthday?: number
  maxBirthday?: number
}

/**
 * 群成员搜索过滤器（对齐 GroupMemberSearchFilter）
 */
export interface GroupMemberSearchFilter {
  groupIDList?: string[]
}

/**
 * 消息搜索过滤器（对齐 MessageSearchFilter）
 */
export interface MessageSearchFilter {
  conversationID?: string
  searchTimePosition?: number
  searchTimePeriod?: number
  senderUserIDList?: string[]
  /** 消息类型列表（注：底层是 MessageType[]，前端可传枚举或数值） */
  messageTypeList?: (MessageType | number)[]
}

/**
 * 搜索选项（对齐 SearchOption）
 *
 * **字段重大调整：**
 * - 旧 `keywordListMatchType` → **新 `keywordListMatchMode`**
 * - 旧 `searchType: SearchType（位掩码）` → **新 `searchScope: SearchType[]`（数组）**
 * - 旧 `searchCount` → **新 `pageSize`**
 * - 旧 `isCloudSearch` → **底层已删除**（云搜索由后台统一处理）
 */
export interface SearchOption {
  keywordListMatchMode?: KeywordListMatchMode
  /** 搜索范围（多选） */
  searchScope?: SearchType[]
  /** 单页数量（默认 20） */
  pageSize?: number
  userFilter?: UserSearchFilter
  groupMemberFilter?: GroupMemberSearchFilter
  messageFilter?: MessageSearchFilter
}

// ==================== 搜索结果类型 ====================

/**
 * 好友搜索信息（对齐 FriendSearchInfo）
 */
export interface FriendSearchInfo {
  userID: string
  friendRemark?: string
  friendAddTime?: number
  /** 自定义信息（底层是 Map<String, ByteArray>，前端按 string 处理） */
  friendCustomInfo?: Record<string, string>
  userInfo?: UserProfile
}

/**
 * 消息搜索结果项（对齐 MessageSearchResultItem）
 */
export interface MessageSearchResultItem {
  conversationID: string
  conversationShowName: string
  conversationAvatarURL?: string
  messageCount: number
  messageList: MessageInfo[]
}

/**
 * 搜索状态（对齐 SearchState）
 */
export interface SearchStateData {
  userList: UserProfile[]
  userTotalCount: number
  hasMoreUsers: boolean

  friendList: FriendSearchInfo[]
  friendTotalCount: number
  hasMoreFriends: boolean

  groupList: GroupSearchInfo[]
  groupTotalCount: number
  hasMoreGroups: boolean

  /** 群成员搜索结果按 groupID 分组 */
  groupMemberList: Record<string, GroupMember[]>
  groupMemberTotalCount: number
  hasMoreGroupMembers: boolean

  messageResults: MessageSearchResultItem[]
  messageResultTotalCount: number
  hasMoreMessageResults: boolean
}

// ==================== 兼容重导出 ====================

export type {
  GroupType,
  GroupJoinOption,
  GroupInviteOption,
  GroupMember,
  GroupSearchInfo,
}

// ==================== 搜索 Tab 相关类型（UI 用）====================

/**
 * 搜索 Tab 值枚举
 */
export enum SearchTabValue {
  All = 'all',
  Message = 'message',
  Friend = 'friend',
  Group = 'group',
}

export interface SearchTabItem {
  label: string
  value: SearchTabValue
}

export interface SearchTabProps {
  modelValue?: SearchTabValue
  tabs?: SearchTabItem[]
}

export interface SearchTabEmits {
  'update:modelValue': [value: SearchTabValue]
  change: [value: SearchTabValue]
}

// ==================== 搜索栏（UI）====================

export interface SearchBarProps {
  placeholder?: string
  modelValue?: string
  autoFocus?: boolean
  showCancel?: boolean
  cancelText?: string
  debounceTime?: number
  disabled?: boolean
}

export interface SearchBarEmits {
  'update:modelValue': [value: string]
  input: [value: string]
  search: [keyword: string]
  cancel: []
  focus: []
  blur: []
  clear: []
}

// ==================== 搜索结果（UI）====================

/**
 * 搜索结果类型（UI 显示分类）
 *
 * 注：保留 'user' 兼容旧 UI；实际 SearchType 不含 USER
 */
export type SearchResultType = 'user' | 'friend' | 'group' | 'groupMember' | 'message'

/**
 * SearchResultType 到 SearchType 的映射（仅 UI 内部用）
 *
 * user 是 UI 概念，没有底层对应；映射为 FRIEND（最接近）
 */
export const SearchResultTypeMap: Record<SearchResultType, SearchType> = {
  user: SearchType.FRIEND,
  friend: SearchType.FRIEND,
  group: SearchType.GROUP,
  groupMember: SearchType.GROUP_MEMBER,
  message: SearchType.MESSAGE,
}

export interface SearchResultsProps {
  keyword?: string
  conversationID?: string
  currentTab?: SearchTabValue
  searchType?: SearchType | SearchType[]
  isLoading?: boolean
  showPresearch?: boolean
  userList?: UserProfile[]
  friendList?: FriendSearchInfo[]
  groupList?: GroupSearchInfo[]
  groupMemberList?: Record<string, GroupMember[]>
  messageResults?: MessageSearchResultItem[]
  conversationList?: ConversationInfo[]
  hasMoreUser?: boolean
  hasMoreFriend?: boolean
  hasMoreGroup?: boolean
  hasMoreGroupMember?: boolean
  hasMoreMessage?: boolean
  searchHistory?: string[]
  showCloudSearch?: boolean
  SearchResultItem?: Component
  PlaceholderEmpty?: Component
  PlaceholderLoading?: Component
  PlaceholderPresearch?: Component
  Avatar?: Component
}

export interface SearchResultsEmits {
  resultItemClick: [
    type: SearchResultType | 'conversation',
    data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem
  ]
  viewMore: [type: SearchResultType]
  historyClick: [keyword: string]
  clearHistory: []
  cloudSearchClick: []
}

export interface SearchResultItemUserProps {
  type: 'user' | 'friend' | 'groupMember'
  user: UserProfile | FriendSearchInfo | GroupMember
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemFriendProps {
  friend: FriendSearchInfo
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemGroupProps {
  group: GroupSearchInfo
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemGroupMemberProps {
  member: GroupMember
  groupID?: string
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemMessageProps {
  messageResult: MessageSearchResultItem
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemConversationProps {
  conversation: ConversationInfo
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemProps {
  type: SearchResultType | 'conversation'
  data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem
  keyword?: string
  Avatar?: Component
}

export interface SearchResultItemEmits {
  click: [
    type: SearchResultType | 'conversation',
    data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem
  ]
}

// ==================== 高级搜索（UI）====================

export interface MessageAdvancedProps {
  startDate?: string
  endDate?: string
}

export interface MessageAdvancedEmits {
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  change: [startDate: string, endDate: string]
}

export interface UserAdvancedProps {
  minBirthday?: number
  maxBirthday?: number
  gender?: Gender
}

export interface UserAdvancedEmits {
  'update:minBirthday': [value: number | undefined]
  'update:maxBirthday': [value: number | undefined]
  'update:gender': [value: Gender]
  change: [minBirthday: number | undefined, maxBirthday: number | undefined, gender: Gender]
  click: []
}

export interface SearchAdvancedProps {
  currentTab?: SearchTabValue
  conversationID?: string
  isCloudSearch?: boolean
}

export interface SearchAdvancedEmits {
  messageFilterChange: [filter: MessageSearchFilter]
  userFilterChange: [filter: UserSearchFilter]
}

// ==================== 日期范围选择器（UI）====================

export interface DateRangePickerProps {
  label?: string
  startDate?: string
  endDate?: string
  startPlaceholder?: string
  endPlaceholder?: string
  minYear?: number
  maxYear?: number
}

export interface DateRangePickerEmits {
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  change: [startDate: string, endDate: string]
}

// ==================== 滑块（UI）====================

export interface SliderProps {
  label?: string
  min?: number
  max?: number
  minValue?: number
  maxValue?: number
  step?: number
  unit?: string
  formatValue?: (value: number) => string
}

export interface SliderEmits {
  'update:minValue': [value: number]
  'update:maxValue': [value: number]
  change: [minValue: number, maxValue: number]
}

// ==================== 主搜索组件（UI）====================

export interface SearchProps {
  conversationID?: string
  initialKeyword?: string
  initialOption?: SearchOption
  placeholder?: string
  isCloud?: boolean
  autoFocus?: boolean
  showAdvanced?: boolean
  showCancel?: boolean
  debounceTime?: number
  SearchBar?: Component
  SearchResults?: Component
  SearchAdvanced?: Component
  SearchTab?: Component
  PlaceholderPresearch?: Component
  PlaceholderLoading?: Component
  PlaceholderEmpty?: Component
  SearchResultItem?: Component
  Avatar?: Component
}

export interface SearchEmits {
  search: [keyword: string, option: SearchOption]
  cancel: []
  tabChange: [tab: SearchTabValue]
  resultItemClick: [
    type: SearchResultType | 'conversation',
    data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem
  ]
}

// ==================== 占位组件（UI）====================

export interface PresearchPlaceholderProps {
  searchHistory?: string[]
  keyword?: string
  showCloudSearch?: boolean
}

export interface PresearchPlaceholderEmits {
  historyClick: [keyword: string]
  clearHistory: []
  cloudSearchClick: []
}

export interface EmptyPlaceholderProps {
  keyword?: string
}

export interface LoadingPlaceholderProps {
  text?: string
}
