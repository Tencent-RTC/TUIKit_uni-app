import { MessageInfo } from "./message";
import { GroupType } from "./group";

// ==================== 枚举类型定义 ====================

/**
 * 会话类型
 */
export enum ConversationType {
  UNKNOWN = 0,  // 未知类型 (V2TIM_CONVERSATION_TYPE_INVALID)
  C2C = 1,      // 单聊 (V2TIM_C2C)
  GROUP = 2,    // 群聊 (V2TIM_GROUP)
}

/**
 * 会话消息接收选项
 */
export enum ConversationReceiveOption {
  RECEIVE = 0,                      // 正常接收消息 (V2TIM_RECEIVE_MESSAGE)
  NOT_RECEIVE = 1,                  // 不接收消息 (V2TIM_NOT_RECEIVE_MESSAGE)
  NOT_NOTIFY = 2,                   // 接收消息但不提醒 (V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE)
  NOT_NOTIFY_EXCEPT_MENTION = 3,    // 接收消息但不提醒,除了@消息 (V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE_EXCEPT_AT)
  NOT_RECEIVE_EXCEPT_MENTION = 4,   // 不接收消息,除了@消息 (V2TIM_NOT_RECEIVE_MESSAGE_EXCEPT_AT)
}

/**
 * 会话标记类型
 */
export enum ConversationMarkType {
  STAR = 1,    // 标星 (V2TIM_CONVERSATION_MARK_TYPE_STAR)
  UNREAD = 2,  // 标记未读 (V2TIM_CONVERSATION_MARK_TYPE_UNREAD)
  FOLD = 3,    // 折叠 (V2TIM_CONVERSATION_MARK_TYPE_FOLD)
  HIDE = 4,    // 隐藏 (V2TIM_CONVERSATION_MARK_TYPE_HIDE)
}

/**
 * 群@类型
 */
export enum GroupAtType {
  AT_ME = 1,         // @我 (TIM_AT_ME)
  AT_ALL = 2,        // @所有人 (TIM_AT_ALL)
  AT_ALL_AT_ME = 3,  // @所有人并且@我 (TIM_AT_ALL_AT_ME)
}

// ==================== 基础类型定义 ====================

/**
 * 群@信息
 */
export interface GroupAtInfo {
  msgSeq: number;      // 消息序列号
  atType: GroupAtType; // @类型
}

/**
 * 会话信息
 */
export interface ConversationInfo {
  conversationID: string;                           // 会话唯一ID
  type?: ConversationType;                          // 会话类型
  groupType?: GroupType;                            // 群组类型(仅群聊有效)
  avatarURL?: string;                               // 会话头像URL
  title?: string;                                   // 会话标题
  lastMessage?: MessageInfo;                        // 最后一条消息
  draft?: string;                                   // 草稿
  timestamp: number;                                // 最后消息时间戳
  unreadCount: number;                              // 未读消息数
  isPinned: boolean;                                // 是否置顶
  orderKey: number;                                 // 排序字段
  receiveOption: ConversationReceiveOption;         // 消息接收选项
  groupAtInfoList?: GroupAtInfo[];                  // 群@信息列表
  conversationGroupList: string[];                  // 会话分组列表
  markList: ConversationMarkType[];                 // 会话标记列表
  rawConversation?: any;                            // 原始会话对象
}

/**
 * 会话列表过滤器
 */
export interface ConversationListFilter {
  type: ConversationType;               // 会话类型过滤
  conversationGroup?: string;           // 会话分组过滤
  markType?: ConversationMarkType;      // 标记类型过滤
  hasUnreadCount?: boolean;             // 是否有未读消息
  hasGroupAtInfo?: boolean;             // 是否有群@信息
}

/**
 * 会话获取选项
 */
export interface ConversationFetchOption {
  filter?: ConversationListFilter;  // 过滤器
  count: number;                    // 获取数量
}

/**
 * 会话列表状态
 */
export interface ConversationListState {
  conversationList: ConversationInfo[];  // 会话列表
  hasMoreConversation: boolean;          // 是否有更多会话
  totalUnreadCount: number;              // 总未读数
}

// 重新导出 GroupType
export { GroupType };
