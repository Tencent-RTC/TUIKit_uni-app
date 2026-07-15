/**
 * 会话相关类型定义
 * @module conversation
 *
 * 对齐底层 atomicxcore.api.conversation.ConversationListStore.kt
 */
import type { MessageInfo } from "./message";
import type { GroupType } from "./group";
import { ReceiveMessageOpt } from "./contact";

// ==================== 枚举类型 ====================

/**
 * 会话类型（对齐 ConversationType，整数枚举）
 */
export enum ConversationType {
  /** 未知（V2TIM_CONVERSATION_TYPE_INVALID） */
  UNKNOWN = 0,
  /** 单聊（V2TIM_C2C） */
  C2C = 1,
  /** 群聊（V2TIM_GROUP） */
  GROUP = 2,
}

/**
 * 群@类型（对齐 GroupAtType）
 */
export enum GroupAtType {
  AT_ME = 1,
  AT_ALL = 2,
  AT_ALL_AT_ME = 3,
}

// ==================== 会话标记（位掩码）====================

/**
 * 会话标记类型（对齐 ConversationMarkType，**位掩码组合**）
 *
 * 注意：底层是 OptionSet（rawValue: Long），可组合。
 * 前端用 const 对象 + number 联合，区别于普通 enum。
 *
 * 用法：
 * ```ts
 * const markType: ConversationMarkTypeValue = ConversationMarkType.STAR | ConversationMarkType.UNREAD;
 * ```
 */
export const ConversationMarkType = {
  /** 标星 */
  STAR: 0x1,
  /** 标记未读 */
  UNREAD: 0x1 << 1,
  /** 折叠 */
  FOLD: 0x1 << 2,
  /** 隐藏 */
  HIDE: 0x1 << 3,
} as const;

/** ConversationMarkType 的值类型（即 number） */
export type ConversationMarkTypeValue = number;

// ==================== 接口类型 ====================

/**
 * 群@信息
 */
export interface GroupAtInfo {
  /** 消息序列号 */
  msgSeq: number;
  /** @类型 */
  atType: GroupAtType;
}

/**
 * 会话信息（对齐 ConversationInfo）
 *
 * 字段差异：
 * - 删除：`timestamp`、`orderKey`（底层无此字段，排序由 lastMessage.timestamp 决定）
 * - 改名：`receiveOption: ConversationReceiveOption` → `receiveOption: ReceiveMessageOpt`
 * - 改名：`markList` → `conversationMarkList`（对齐底层字段名），元素类型由枚举改为 ConversationMarkTypeValue（位掩码）
 */
export interface ConversationInfo {
  conversationID: string;
  type?: ConversationType;
  /** 群组类型（仅群聊有效） */
  groupType?: GroupType;
  avatarURL?: string;
  title?: string;
  lastMessage?: MessageInfo;
  draft?: string;
  /** 未读消息数 */
  unreadCount: number;
  /** 是否置顶 */
  isPinned: boolean;
  /** 消息接收选项（与 ContactStore 共用 ReceiveMessageOpt 枚举） */
  receiveOption: ReceiveMessageOpt;
  /** 群@信息列表 */
  groupAtInfoList?: GroupAtInfo[];
  /** 会话所属分组列表 */
  conversationGroupList: string[];
  /**
   * 会话标记列表（位掩码值数组）
   *
   * 底层每个值对应 ConversationMarkType.STAR/UNREAD/FOLD/HIDE，
   * 数组中可同时包含多个值（每个值代表一个独立标记）
   */
  conversationMarkList: ConversationMarkTypeValue[];
  /** 原生侧引用，前端不直接使用 */
  rawConversation?: any;
}

/**
 * 会话加载选项（对齐 ConversationLoadOption）
 */
export interface ConversationLoadOption {
  /** 单次拉取数量（默认 100） */
  count?: number;
  /** 标记类型过滤（可选，位掩码值） */
  markType?: ConversationMarkTypeValue;
}

/**
 * @deprecated 使用 ConversationLoadOption；保留 ConversationFetchOption 旧名做兼容
 */
export type ConversationFetchOption = ConversationLoadOption;

/**
 * @deprecated 使用 ConversationListFilter 已不再用于 SDK 调用，仅保留组件内过滤
 */
export interface ConversationListFilter {
  type?: ConversationType;
  conversationGroup?: string;
  markType?: ConversationMarkTypeValue;
  hasUnreadCount?: boolean;
  hasGroupAtInfo?: boolean;
}

/**
 * 会话列表状态（对齐 ConversationState）
 *
 * 字段差异：
 * - `hasMoreConversation` → `hasMoreConversations`（多 s）
 */
export interface ConversationListStateData {
  conversationList: ConversationInfo[];
  hasMoreConversations: boolean;
  totalUnreadCount: number;
}

/**
 * @deprecated 使用 ConversationListStateData；保留旧名以兼容
 */
export type ConversationListState = ConversationListStateData;

// ==================== 兼容重导出 ====================

/**
 * @deprecated 使用 ReceiveMessageOpt（来自 ./contact）
 *
 * 旧 ConversationReceiveOption 与 ReceiveMessageOpt 数值完全一致；
 * 保留 alias 以兼容现有调用点
 */
export const ConversationReceiveOption = ReceiveMessageOpt;
export type ConversationReceiveOption = ReceiveMessageOpt;

// 重新导出
export { GroupType, ReceiveMessageOpt };
