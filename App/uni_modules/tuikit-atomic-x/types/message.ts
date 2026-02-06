// ==================== 基础类型定义 ====================

import { UserProfile } from "./userProfile";
import { GroupJoinOption } from "./group";

/**
 * 回复消息信息
 */
export interface ReplyMessageInfo {
  msgID?: string;
  msgSender?: string;
  msgAbstract?: string;
  msgStatus?: MessageStatus;
  messageType?: MessageType;
  messageBody?: MessageBody;
}

/**
 * 自定义消息信息
 */
export interface CustomMessageInfo {
  data?: String;
  description?: string;
  extensionInfo?: string;
}

/**
 * 消息已读回执
 */
export interface MessageReceipt {
  isPeerRead: boolean;
  readCount: number;
  unreadCount: number;
}

/**
 * 消息表情回应
 */
export interface MessageReaction {
  reactionID: string;
  totalUserCount: number;
  partialUserList: UserProfile[];
  reactedByMyself: boolean;
}

/**
 * 消息扩展信息
 */
export interface MessageExtension {
  extensionKey?: string;
  extensionValue?: string;
}

/**
 * 合并消息信息
 */
export interface MergedMessageInfo {
  title: string;
  abstractList?: string[];
}

/**
 * 离线推送信息
 */
export interface OfflinePushInfo {
  title: string;
  description: string;
  extensionInfo: Record<string, any>;
}

/**
 * 合并转发信息
 */
export interface MergedForwardInfo {
  title: string;
  abstractList?: string[];
  compatibleText: string;
  needReadReceipt: boolean;
  supportExtension: boolean;
  offlinePushInfo?: OfflinePushInfo;
}

/**
 * 消息转发选项
 */
export interface MessageForwardOption {
  forwardType: MessageForwardType;
  mergedForwardInfo?: MergedForwardInfo;
}

/**
 * 消息发送者信息
 */
export interface MessageSenderInfo {
  userID: string;
  avatarURL?: string;
  nickname?: string;
  friendRemark?: string;
  nameCard?: string;
}

// ==================== 主消息类型定义 ====================

/**
 * 消息信息
 */
export interface MessageInfo {
  msgID?: string;
  sender: MessageSenderInfo;
  isSelf: boolean;
  receiver?: string;
  groupID?: string;
  timestamp?: number;
  status: MessageStatus;
  progress: number;
  atUserList: string[];
  isPinned: boolean;

  // Message Type
  messageType: MessageType;
  // Message Body
  messageBody?: MessageBody;

  // Message read receipt
  needReadReceipt: boolean;
  receipt?: MessageReceipt;

  // Message extension
  supportExtension: boolean;
  extensionList: MessageExtension[];

  // Message emoji
  reactionList: MessageReaction[];

  // Reply Message
  replyMessageInfo?: ReplyMessageInfo;
  repliedMessageCount: number;

  // Quote Message
  quoteMessageInfo?: ReplyMessageInfo;

  // Offline Push Info
  offlinePushInfo?: OfflinePushInfo;

  // IM Message
  rawMessage?: any;
}

/**
 * 消息体
 */
export interface MessageBody {
  // Text Message - 文本消息
  text?: string;
  translateLanguage?: string;
  translatedText?: Record<string, string>;

  // Image Message - 图片消息
  originalImagePath?: string;
  originalImageWidth: number;
  originalImageHeight: number;
  originalImageSize: number;
  thumbImagePath?: string;
  largeImagePath?: string;

  // Video Message - 视频消息
  videoPath?: string;
  videoType?: string;
  videoSize: number;
  videoDuration: number;
  videoSnapshotPath?: string;
  videoSnapshotWidth: number;
  videoSnapshotHeight: number;
  videoSnapshotSize: number;

  // Sound Message - 语音消息
  soundPath?: string;
  soundSize: number;
  soundDuration: number;
  isSoundPlayed?: boolean;
  asrLanguage?: string;
  asrText?: string;

  // File Message - 文件消息
  filePath?: string;
  fileName?: string;
  fileSize: number;

  // Face Message - 表情消息
  faceIndex: number;
  faceName?: string;

  // System Message - 系统消息
  systemMessage?: SystemMessageInfo[];

  // Custom Message - 自定义消息
  customMessage?: CustomMessageInfo;

  // Merged Message - 合并消息
  mergedMessage?: MergedMessageInfo;
}

// ==================== 系统消息类型定义 ====================

/**
 * 系统消息联合类型
 * 使用 TypeScript 的 Discriminated Union 模式
 */
export type SystemMessageInfo =
  | { type: 'Unknown' }
  | { type: 'JoinGroup'; groupID: string; joinMember: string }
  | { type: 'InviteToGroup'; groupID: string; inviter: string; inviteesShowName: string }
  | { type: 'QuitGroup'; groupID: string; quitMember: string }
  | { type: 'KickedFromGroup'; groupID: string; kickOperator: string; kickedMembersShowName: string }
  | { type: 'SetGroupAdmin'; groupID: string; setAdminOperator: string; setAdminMembersShowName: string }
  | { type: 'CancelGroupAdmin'; groupID: string; cancelAdminOperator: string; cancelAdminMembersShowName: string }
  | { type: 'ChangeGroupName'; groupID: string; groupNameOperator: string; groupName: string }
  | { type: 'ChangeGroupAvatar'; groupID: string; groupAvatarOperator: string; groupAvatar: string }
  | { type: 'ChangeGroupNotification'; groupID: string; groupNotificationOperator: string; groupNotification: string }
  | { type: 'ChangeGroupIntroduction'; groupID: string; groupIntroductionOperator: string; groupIntroduction: string }
  | { type: 'ChangeGroupOwner'; groupID: string; groupOwnerOperator: string; groupOwner: string }
  | { type: 'ChangeGroupMuteAll'; groupID: string; groupMuteAllOperator: string; isMuteAll: boolean }
  | { type: 'ChangeJoinGroupApproval'; groupID: string; groupJoinApprovalOperator: string; groupJoinOption: GroupJoinOption }
  | { type: 'ChangeInviteToGroupApproval'; groupID: string; groupInviteApprovalOperator: string; groupInviteOption: GroupJoinOption }
  | { type: 'MuteGroupMember'; groupID: string; muteGroupMemberOperator: string; isSelfMuted: boolean; mutedGroupMembersShowName: string; muteTime: number }
  | { type: 'PinGroupMessage'; groupID: string; pinGroupMessageOperator: string }
  | { type: 'UnpinGroupMessage'; groupID: string; unpinGroupMessageOperator: string }
  | { type: 'RecallMessage'; groupID: string; recallMessageOperator: string; isRecalledBySelf: boolean; isInGroup: boolean; recallReason: string };

// ==================== 枚举类型定义 ====================

/**
 * 消息状态
 */
export enum MessageStatus {
  INIT = 0,           // 初始状态
  SENDING = 1,        // 发送中
  SEND_SUCCESS = 2,   // 发送成功
  SEND_FAIL = 3,      // 发送失败
  RECALLED = 4,       // 已撤回
  DELETED = 5,        // 已删除
  LOCAL_IMPORTED = 6, // 本地导入
  VIOLATION = 7,      // 违规
}

/**
 * 消息类型
 */
export enum MessageType {
  UNKNOWN = 0,  // 未知类型
  TEXT = 1,     // 文本消息
  IMAGE = 2,    // 图片消息
  VIDEO = 3,    // 视频消息
  SOUND = 4,    // 语音消息
  FILE = 5,     // 文件消息
  FACE = 6,     // 表情消息
  SYSTEM = 7,   // 系统消息
  CUSTOM = 8,   // 自定义消息
  MERGED = 9,   // 合并消息
}

/**
 * 消息媒体文件类型
 */
export enum MessageMediaFileType {
  THUMB_IMAGE = 0,     // 缩略图
  LARGE_IMAGE = 1,     // 大图
  ORIGINAL_IMAGE = 2,  // 原图
  VIDEO_SNAPSHOT = 3,  // 视频封面
  VIDEO = 4,           // 视频
  SOUND = 5,           // 音频
  FILE = 6,            // 文件
}

/**
 * 消息列表类型
 */
export enum MessageListType {
  HISTORY = 0,  // 历史消息
  PINNED = 1,   // 置顶消息
  REPLIED = 2,  // 回复消息
  MERGED = 3,   // 合并消息
}

/**
 * 消息获取方向
 */
export enum MessageFetchDirection {
  OLDER = 1,  // 获取更早的消息
  NEWER = 2,  // 获取更新的消息
  BOTH = 3,   // 双向获取
}

/**
 * 消息转发类型
 */
export enum MessageForwardType {
  SEPARATE = 0,  // 逐条转发
  MERGED = 1,    // 合并转发
}

// ==================== 消息过滤器类型 ====================

/**
 * 消息过滤器类型
 * 支持位运算组合多种过滤条件
 */
export class MessageFilterType {
  static readonly All = new MessageFilterType(0x1);
  static readonly Image = new MessageFilterType(0x1 << 1);
  static readonly Video = new MessageFilterType(0x1 << 2);

  constructor(public readonly value: number) {}

  /**
   * 组合多个过滤器
   * @param other 另一个过滤器
   * @returns 组合后的过滤器
   */
  or(other: MessageFilterType): MessageFilterType {
    return new MessageFilterType(this.value | other.value);
  }

  /**
   * 检查是否包含指定过滤器
   * @param other 要检查的过滤器
   * @returns 是否包含
   */
  contains(other: MessageFilterType): boolean {
    return (this.value & other.value) !== 0;
  }
}

// ==================== 消息事件类型定义 ====================

/**
 * 消息事件联合类型
 */
export type MessageEvent =
  | { type: 'FetchMessages'; messageList: MessageInfo[]; direction: MessageFetchDirection }
  | { type: 'FetchMoreMessages'; messageList: MessageInfo[] }
  | { type: 'SendMessage'; message: MessageInfo }
  | { type: 'RecvMessage'; message: MessageInfo }
  | { type: 'DeleteMessages'; messageList: MessageInfo[] };

// ==================== 消息获取选项 ====================

/**
 * 消息获取选项
 */
export interface MessageFetchOption {
  message?: MessageInfo;
  messageSeq?: number;
  direction?: MessageFetchDirection;
  filterType?: MessageFilterType;
  pageCount: number;
}

// ==================== 消息列表状态 ====================

/**
 * 消息列表状态
 */
export interface MessageListState {
  messageList: MessageInfo[];
  hasMoreOlderMessage: boolean;
  hasMoreNewerMessage: boolean;
}

// 重新导出 GroupJoinOption
export { GroupJoinOption };
