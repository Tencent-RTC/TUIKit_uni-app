import type { Component } from 'vue'
import type { ConversationInfo } from './conversation'

// ==================== 枚举类型 ====================

/**
 * 操作类型枚举
 */
export enum ConversationActionType {
  /** 置顶/取消置顶 */
  PIN = 'pin',
  /** 免打扰/取消免打扰 */
  MUTE = 'mute',
  /** 删除会话 */
  DELETE = 'delete'
}

// ==================== 操作按钮相关类型 ====================

/**
 * 操作按钮项
 */
export interface ActionItem {
  /** 操作唯一标识 */
  key: string
  /** 显示文本 */
  text?: string
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 点击回调 */
  onClick?: (conversationID: string) => void
}

/**
 * 操作按钮配置
 */
export interface ActionsConfig {
  /** 自定义操作列表（优先级最高） */
  actions?: ActionItem[]
  /** 是否支持置顶功能 */
  isSupportPin?: boolean
  /** 是否支持免打扰功能 */
  isSupportMute?: boolean
  /** 是否支持删除功能 */
  isSupportDelete?: boolean
}

// ==================== 组件 Props 类型 ====================

/**
 * ConversationList 组件 Props
 */
export interface ConversationListProps {
  /** 操作按钮配置 */
  actionsConfig?: ActionsConfig
  /** 自定义预览组件 */
  Preview?: Component
  /** 自定义操作按钮组件 */
  ConversationActions?: Component
  /** 自定义头像组件 */
  Avatar?: Component
  /** 空列表占位组件 */
  PlaceholderEmptyList?: Component
  /** 加载中占位组件 */
  PlaceholderLoading?: Component
  /** 加载错误占位组件 */
  PlaceholderLoadError?: Component
  /** 会话列表过滤函数 */
  filter?: (conversation: ConversationInfo) => boolean
  /** 会话列表排序函数 */
  sort?: (a: ConversationInfo, b: ConversationInfo) => number
}

/**
 * ConversationActions 组件 Props
 */
export interface ConversationActionsProps {
  /** 会话信息 */
  conversation: ConversationInfo
  /** 自定义操作列表（优先级高于 isSupportXxx） */
  actions?: ActionItem[]
  /** 是否支持置顶功能 */
  isSupportPin?: boolean
  /** 是否支持免打扰功能 */
  isSupportMute?: boolean
  /** 是否支持删除功能 */
  isSupportDelete?: boolean
}

/**
 * ConversationPreview 组件 Props
 */
export interface ConversationPreviewProps {
  /** 会话信息 */
  conversation: ConversationInfo
  /** 自定义头像组件 */
  Avatar?: Component
}

// ==================== 占位组件 Props 类型 ====================

/**
 * 空列表占位组件 Props
 */
export interface EmptyListPlaceholderProps {
  // 当前不需要任何 props，预留接口以便未来扩展
}

/**
 * 加载中占位组件 Props
 */
export interface LoadingPlaceholderProps {
  // 当前不需要任何 props，预留接口以便未来扩展
}

/**
 * 加载错误占位组件 Props
 */
export interface LoadErrorPlaceholderProps {
  /** 错误对象 */
  error?: Error | null
}

// ==================== 事件类型 ====================

/**
 * ConversationList 组件事件
 */
export interface ConversationListEmits {
  /** 选择会话事件 */
  conversationSelect: [conversation: ConversationInfo]
  /** 置顶操作事件 */
  conversationPin: [conversationID: string, isPinned: boolean]
  /** 免打扰操作事件 */
  conversationMute: [conversationID: string, isMuted: boolean]
  /** 删除操作事件 */
  conversationDelete: [conversationID: string]
}

/**
 * ConversationActions 组件事件
 */
export interface ConversationActionsEmits {
  /** 置顶操作事件 */
  conversationPin: [conversationID: string, isPinned: boolean]
  /** 免打扰操作事件 */
  conversationMute: [conversationID: string, isMuted: boolean]
  /** 删除操作事件 */
  conversationDelete: [conversationID: string]
}
