/**
 * 会话分组相关类型定义
 * @module conversationGroup
 *
 * 对齐底层 atomicxcore.api.conversation.ConversationGroupStore.kt
 *
 * **重要：Android / iOS 实现差异**
 *
 * | 端 | state.groupList |
 * |---|---|
 * | Android | `List<String>` —— 仅分组名数组（当前实现） |
 * | iOS | `[ConversationGroupInfo]` —— 富对象（含 conversationList / unreadCount 等） |
 *
 * 本类型按 **Android 实际推送（字符串数组）** 落地；
 * iOS 推送的富对象在前端统一只读取 groupName。
 * 等 Android 对齐到富对象后再升级 types。
 */

// ==================== 内置分组常量 ====================

/**
 * 内置分组名（对齐 BuiltInGroup 常量）
 *
 * 这些是底层预置的虚拟分组，由 SDK 自动管理：
 * - hasUnreadCount：所有有未读的会话
 * - hasGroupAtInfo：所有有@消息的会话
 */
export const BuiltInGroup = {
  hasUnreadCount: 'hasUnreadCount',
  hasGroupAtInfo: 'hasGroupAtInfo',
} as const;

// ==================== 状态数据 ====================

/**
 * 会话分组状态（对齐 ConversationGroupState）
 *
 * 注：Android 实际推送 `List<String>`；前端按 string[] 处理
 */
export interface ConversationGroupStateData {
  /** 分组名列表 */
  groupList: string[];
}

/**
 * 会话分组富信息（对齐 iOS ConversationGroupInfo；**Android 暂未实现**）
 *
 * @experimental Android 未对齐前不要在生产代码中依赖该字段
 *
 * 用法（待 Android 对齐后）：
 * ```ts
 * if (Array.isArray(state.groupList) && typeof state.groupList[0] === 'object') {
 *   // iOS / 未来 Android：富对象
 *   const info = state.groupList[0] as ConversationGroupInfo;
 *   const name = info.groupName;
 * } else {
 *   // 当前 Android：字符串
 *   const name = state.groupList[0] as string;
 * }
 * ```
 */
export interface ConversationGroupInfo {
  groupName: string;
  totalUnreadCount: number;
  /** iOS 端会一起带回；Android 当前仅在二次拉取时获取 */
  conversationList?: any[];
  hasMoreConversations?: boolean;
}
