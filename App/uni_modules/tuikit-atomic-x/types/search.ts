/**
 * 搜索相关类型定义
 * @module types/search
 */
import type { Component } from 'vue'
import type { MessageInfo } from './message'
import type { UserProfile, Gender } from './userProfile'
import type { GroupType, GroupJoinOption, GroupMember, GroupSearchInfo } from './group'
import type { ConversationInfo } from './conversation'

// ==================== 枚举类型 ====================

/**
 * 关键词列表匹配类型
 */
export enum KeywordListMatchType {
  /** 或匹配 */
  OR = 0,
  /** 与匹配 */
  AND = 1
}

// ==================== 搜索类型 ====================

/**
 * 搜索类型
 */
export class SearchType {
  public readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /** 搜索用户 */
  static readonly User = new SearchType(1 << 0);
  /** 搜索好友 */
  static readonly Friend = new SearchType(1 << 1);
  /** 搜索群组 */
  static readonly Group = new SearchType(1 << 2);
  /** 搜索群成员 */
  static readonly GroupMember = new SearchType(1 << 3);
  /** 搜索消息 */
  static readonly Message = new SearchType(1 << 4);

  /**
   * 组合搜索类型
   */
  or(other: SearchType): SearchType {
    return new SearchType(this.value | other.value);
  }

  /**
   * 检查是否包含某搜索类型
   */
  contains(other: SearchType): boolean {
    return (this.value & other.value) !== 0;
  }
}

// ==================== 过滤器类型 ====================

/**
 * 用户搜索过滤器
 */
export interface UserSearchFilter {
  gender?: Gender;
  minBirthday?: number;
  maxBirthday?: number;
}

/**
 * 群成员搜索过滤器
 */
export interface GroupMemberSearchFilter {
  groupIDList?: string[];
}

/**
 * 消息搜索过滤器
 */
export interface MessageSearchFilter {
  conversationID?: string;
  searchTimePosition?: number;
  searchTimePeriod?: number;
  senderUserIDList?: string[];
  messageTypeList?: number[];
}

/**
 * 搜索选项
 */
export interface SearchOption {
  keywordListMatchType?: KeywordListMatchType;
  isCloudSearch?: boolean;
  searchType?: SearchType;
  searchCount?: number;
  userFilter?: UserSearchFilter;
  groupMemberFilter?: GroupMemberSearchFilter;
  messageFilter?: MessageSearchFilter;
}

// ==================== 搜索结果类型 ====================

/**
 * 好友搜索信息
 */
export interface FriendSearchInfo {
  userID: string;
  friendRemark?: string;
  friendAddTime?: number;
  friendCustomInfo?: Record<string, string>;
  userInfo: UserProfile;
}

/**
 * 消息搜索结果项
 */
export interface MessageSearchResultItem {
  conversationID: string;
  conversationShowName: string;
  conversationAvatarURL: string;
  messageCount: number;
  messageList: MessageInfo[];
}

// 重新导出 group 相关类型
export type { GroupType, GroupJoinOption, GroupMember, GroupSearchInfo }

// ==================== 搜索 Tab 相关类型 ====================

/**
 * 搜索 Tab 值枚举
 */
export enum SearchTabValue {
  /** 全部 */
  All = 'all',
  /** 消息 */
  Message = 'message',
  /** 用户/好友 */
  Friend = 'friend',
  /** 群组 */
  Group = 'group'
}

/**
 * Tab 项
 */
export interface SearchTabItem {
  label: string
  value: SearchTabValue
}

/**
 * SearchTab 组件 Props
 */
export interface SearchTabProps {
  /** 当前选中的 Tab */
  modelValue?: SearchTabValue
  /** Tab 列表 */
  tabs?: SearchTabItem[]
}

/**
 * SearchTab 组件事件
 */
export interface SearchTabEmits {
  /** 更新选中值 */
  'update:modelValue': [value: SearchTabValue]
  /** Tab 切换 */
  change: [value: SearchTabValue]
}

// ==================== 搜索栏相关类型 ====================

/**
 * SearchBar 组件 Props
 */
export interface SearchBarProps {
  /** 占位文本 */
  placeholder?: string
  /** 搜索关键词 */
  modelValue?: string
  /** 是否自动聚焦 */
  autoFocus?: boolean
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 取消按钮文本 */
  cancelText?: string
  /** 搜索延迟时间(ms) */
  debounceTime?: number
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * SearchBar 组件事件
 */
export interface SearchBarEmits {
  /** 输入值变化 */
  'update:modelValue': [value: string]
  /** 输入事件（实时触发） */
  input: [value: string]
  /** 搜索事件（点击键盘搜索按钮触发） */
  search: [keyword: string]
  /** 取消事件 */
  cancel: []
  /** 聚焦事件 */
  focus: []
  /** 失焦事件 */
  blur: []
  /** 清空事件 */
  clear: []
}

// ==================== 搜索结果组件相关类型 ====================

/**
 * 搜索结果类型
 */
export type SearchResultType = 'user' | 'friend' | 'group' | 'groupMember' | 'message'

/**
 * SearchResultType 到 SearchType 的映射
 */
export const SearchResultTypeMap: Record<SearchResultType, SearchType> = {
  user: SearchType.User,
  friend: SearchType.Friend,
  group: SearchType.Group,
  groupMember: SearchType.GroupMember,
  message: SearchType.Message
}

/**
 * SearchResults 组件 Props
 */
export interface SearchResultsProps {
  /** 搜索关键词 */
  keyword?: string
  /** 会话ID，传入后只显示会话内消息搜索结果 */
  conversationID?: string
  /** 当前 Tab */
  currentTab?: SearchTabValue
  /** 搜索类型 */
  searchType?: SearchType
  /** 是否正在加载 */
  isLoading?: boolean
  /** 是否显示预搜索状态 */
  showPresearch?: boolean
  /** 用户列表 */
  userList?: UserProfile[]
  /** 好友列表 */
  friendList?: FriendSearchInfo[]
  /** 群组列表 */
  groupList?: GroupSearchInfo[]
  /** 群成员列表 */
  groupMemberList?: Record<string, GroupMember[]>
  /** 消息搜索结果 */
  messageResults?: MessageSearchResultItem[]
  /** 会话列表 */
  conversationList?: ConversationInfo[]
  /** 是否有更多用户 */
  hasMoreUser?: boolean
  /** 是否有更多好友 */
  hasMoreFriend?: boolean
  /** 是否有更多群组 */
  hasMoreGroup?: boolean
  /** 是否有更多群成员 */
  hasMoreGroupMember?: boolean
  /** 是否有更多消息 */
  hasMoreMessage?: boolean
  /** 搜索历史记录 */
  searchHistory?: string[]
  /** 是否显示进入全局搜索入口 */
  showCloudSearch?: boolean
  /** 自定义搜索结果项组件 */
  SearchResultItem?: Component
  /** 自定义空结果组件 */
  PlaceholderEmpty?: Component
  /** 自定义加载中组件 */
  PlaceholderLoading?: Component
  /** 自定义预搜索组件 */
  PlaceholderPresearch?: Component
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResults 组件事件
 */
export interface SearchResultsEmits {
  /** 搜索结果项点击 */
  resultItemClick: [type: SearchResultType | 'conversation', data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem]
  /** 查看更多 */
  viewMore: [type: SearchResultType]
  /** 点击历史记录 */
  historyClick: [keyword: string]
  /** 清除历史记录 */
  clearHistory: []
  /** 点击进入全局搜索 */
  cloudSearchClick: []
}

// ==================== 搜索结果项相关类型 ====================

/**
 * SearchResultItem 用户 Props
 */
export interface SearchResultItemUserProps {
  type: 'user' | 'friend' | 'groupMember'
  /** 用户信息 */
  user: UserProfile | FriendSearchInfo | GroupMember
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 好友 Props
 */
export interface SearchResultItemFriendProps {
  /** 好友信息 */
  friend: FriendSearchInfo
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 群组 Props
 */
export interface SearchResultItemGroupProps {
  /** 群组信息 */
  group: GroupSearchInfo
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 群成员 Props
 */
export interface SearchResultItemGroupMemberProps {
  /** 群成员信息 */
  member: GroupMember
  /** 群组ID */
  groupID?: string
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 消息 Props
 */
export interface SearchResultItemMessageProps {
  /** 消息搜索结果 */
  messageResult: MessageSearchResultItem
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 会话 Props
 */
export interface SearchResultItemConversationProps {
  /** 会话信息 */
  conversation: ConversationInfo
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 组件 Props（根据 type 渲染不同子组件）
 */
export interface SearchResultItemProps {
  /** 结果类型 */
  type: SearchResultType | 'conversation'
  /** 数据 */
  data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem
  /** 搜索关键词（用于高亮） */
  keyword?: string
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * SearchResultItem 组件事件
 */
export interface SearchResultItemEmits {
  /** 点击事件 */
  click: [type: SearchResultType | 'conversation', data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem]
}

// ==================== 高级搜索相关类型 ====================

/**
 * MessageAdvanced 组件 Props
 */
export interface MessageAdvancedProps {
  startDate?: string
  endDate?: string
}

/**
 * MessageAdvanced 组件事件
 */
export interface MessageAdvancedEmits {
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  change: [startDate: string, endDate: string]
}

/**
 * UserAdvanced 组件 Props
 */
export interface UserAdvancedProps {
  minBirthday?: number  // YYYYMMDD 格式，如 19700101
  maxBirthday?: number  // YYYYMMDD 格式，如 20080107
  gender?: Gender
}

/**
 * UserAdvanced 组件事件
 */
export interface UserAdvancedEmits {
  'update:minBirthday': [value: number | undefined]
  'update:maxBirthday': [value: number | undefined]
  'update:gender': [value: Gender]
  change: [minBirthday: number | undefined, maxBirthday: number | undefined, gender: Gender]
  click: []
}

/**
 * SearchAdvanced 组件 Props
 */
export interface SearchAdvancedProps {
  currentTab?: SearchTabValue,
  conversationID?: string,
  isCloudSearch?: boolean,
}

/**
 * SearchAdvanced 组件事件
 */
export interface SearchAdvancedEmits {
  messageFilterChange: [filter: MessageSearchFilter]
  userFilterChange: [filter: UserSearchFilter]
}

// ==================== 日期范围选择器相关类型 ====================

/**
 * DateRangePicker 组件 Props
 */
export interface DateRangePickerProps {
  /** 标签 */
  label?: string
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
  /** 开始日期占位文本 */
  startPlaceholder?: string
  /** 结束日期占位文本 */
  endPlaceholder?: string
  /** 最小年份 */
  minYear?: number
  /** 最大年份 */
  maxYear?: number
}

/**
 * DateRangePicker 组件事件
 */
export interface DateRangePickerEmits {
  /** 更新开始日期 */
  'update:startDate': [value: string]
  /** 更新结束日期 */
  'update:endDate': [value: string]
  /** 日期变化 */
  change: [startDate: string, endDate: string]
}

// ==================== 滑块相关类型 ====================

/**
 * Slider 组件 Props
 */
export interface SliderProps {
  /** 标签 */
  label?: string
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 当前最小值 */
  minValue?: number
  /** 当前最大值 */
  maxValue?: number
  /** 步长 */
  step?: number
  /** 单位 */
  unit?: string
  /** 格式化显示值 */
  formatValue?: (value: number) => string
}

/**
 * Slider 组件事件
 */
export interface SliderEmits {
  /** 更新最小值 */
  'update:minValue': [value: number]
  /** 更新最大值 */
  'update:maxValue': [value: number]
  /** 值变化 */
  change: [minValue: number, maxValue: number]
}

// ==================== 主搜索组件相关类型 ====================

/**
 * Search 组件 Props
 */
export interface SearchProps {
  /** 会话ID，传入后只搜索该会话内的消息 */
  conversationID?: string
  /** 初始搜索关键词，传入后自动触发搜索 */
  initialKeyword?: string
  /** 初始搜索选项，传入后用于初始搜索 */
  initialOption?: SearchOption
  /** 搜索栏占位文本 */
  placeholder?: string
  /** 是否云端搜索 */
  isCloud?: boolean
  /** 是否自动聚焦 */
  autoFocus?: boolean
  /** 是否显示高级搜索 */
  showAdvanced?: boolean
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 搜索延迟时间(ms) */
  debounceTime?: number
  /** 自定义搜索栏组件 */
  SearchBar?: Component
  /** 自定义搜索结果组件 */
  SearchResults?: Component
  /** 自定义高级搜索组件 */
  SearchAdvanced?: Component
  /** 自定义搜索 Tab 组件 */
  SearchTab?: Component
  /** 自定义预搜索组件 */
  PlaceholderPresearch?: Component
  /** 自定义加载中组件 */
  PlaceholderLoading?: Component
  /** 自定义空结果组件 */
  PlaceholderEmpty?: Component
  /** 自定义搜索结果项组件 */
  SearchResultItem?: Component
  /** 自定义头像组件 */
  Avatar?: Component
}

/**
 * Search 组件事件
 */
export interface SearchEmits {
  /** 搜索事件 */
  search: [keyword: string, option: SearchOption]
  /** 取消事件 */
  cancel: []
  /** Tab 切换 */
  tabChange: [tab: SearchTabValue]
  /** 搜索结果项点击 */
  resultItemClick: [type: SearchResultType | 'conversation', data: FriendSearchInfo | UserProfile | GroupSearchInfo | GroupMember | MessageSearchResultItem]
}

// ==================== 占位组件 Props 类型 ====================

/**
 * 预搜索占位组件 Props
 */
export interface PresearchPlaceholderProps {
  /** 搜索历史 */
  searchHistory?: string[]
  /** 当前输入的关键词（用于过滤和高亮） */
  keyword?: string
  /** 是否显示进入全局搜索入口 */
  showCloudSearch?: boolean
}

/**
 * 预搜索占位组件事件
 */
export interface PresearchPlaceholderEmits {
  /** 点击历史记录 */
  historyClick: [keyword: string]
  /** 清除历史记录 */
  clearHistory: []
  /** 点击进入全局搜索 */
  cloudSearchClick: []
}

/**
 * 空结果占位组件 Props
 */
export interface EmptyPlaceholderProps {
  /** 搜索关键词 */
  keyword?: string
}

/**
 * 加载中占位组件 Props
 */
export interface LoadingPlaceholderProps {
  /** 加载提示文本 */
  text?: string
}