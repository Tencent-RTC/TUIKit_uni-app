/**
 * 消息相关类型定义
 * @module message
 *
 * 对齐底层 atomicxcore.api.message.MessageListStore.kt / MessageInputStore.kt / MessageActionStore.kt
 */
import type { UserProfile } from "./userProfile";
import type { ConversationType } from "./conversation";
import type { GroupMember, GroupJoinOption, GroupInviteOption } from "./group";

// ==================== 枚举类型 ====================

/**
 * 消息状态（对齐 MessageStatus）
 *
 * 注：旧值 RECALLED 改名 REVOKED（与底层 enum REVOKED 对齐）
 */
export enum MessageStatus {
  INIT = 0,
  SENDING = 1,
  SEND_SUCCESS = 2,
  SEND_FAIL = 3,
  /** 已撤回（旧值 RECALLED 改名为 REVOKED） */
  REVOKED = 4,
  DELETED = 5,
  LOCAL_IMPORTED = 6,
  VIOLATION = 7,
}

/**
 * @deprecated 使用 MessageStatus.REVOKED
 */
export const RECALLED = MessageStatus.REVOKED;

/**
 * 消息类型（对齐 MessageType）
 *
 * 字段调整：
 * - 旧 SOUND=4 → 新 AUDIO=4（对齐底层）
 * - 旧 SYSTEM=7 → 新 TIPS=7（对齐底层）
 * - 新增 STREAM=10（流式消息，AI 场景）
 */
export enum MessageType {
  UNKNOWN = 0,
  TEXT = 1,
  IMAGE = 2,
  VIDEO = 3,
  /** 语音消息（旧名 SOUND） */
  AUDIO = 4,
  FILE = 5,
  FACE = 6,
  /** 群提示消息（旧名 SYSTEM） */
  TIPS = 7,
  CUSTOM = 8,
  MERGED = 9,
  /** 流式消息（AI 场景） */
  STREAM = 10,
}

/**
 * 消息列表类型（对齐 MessageListType）
 *
 * 注：底层只有 HISTORY/PINNED 两值；旧版 REPLIED/MERGED 已删除
 */
export enum MessageListType {
  HISTORY = 0,
  PINNED = 1,
}

/**
 * 消息加载方向（对齐 MessageLoadDirection）
 *
 * 注：旧名 MessageFetchDirection；新名 MessageLoadDirection（保留旧 alias）
 * 数值差异：旧 OLDER=1/NEWER=2/BOTH=3 → 新 OLDER=0/NEWER=1/BOTH=2
 */
export enum MessageLoadDirection {
  OLDER = 0,
  NEWER = 1,
  BOTH = 2,
}

/**
 * @deprecated 使用 MessageLoadDirection
 */
export const MessageFetchDirection = MessageLoadDirection;
export type MessageFetchDirection = MessageLoadDirection;

/**
 * 媒体下载画质（对齐 MediaQuality）
 *
 * 用于 MessageActionStore.downloadMedia 参数
 * 替代旧 MessageMediaFileType（已删除）
 */
export enum MediaQuality {
  THUMBNAIL = 0,
  STANDARD = 1,
  ORIGINAL = 2,
}

/**
 * @deprecated MessageMediaFileType 已删除；使用 MediaQuality
 *
 * 旧 7 值枚举（thumb/large/original/videoSnapshot/video/audio/file）
 * 在新版 atomicxcore 不复存在。下载哪种媒体由 MessageActionStore 绑定的 message 决定。
 */
export enum MessageMediaFileType {
  THUMB_IMAGE = 0,
  LARGE_IMAGE = 1,
  ORIGINAL_IMAGE = 2,
  VIDEO_SNAPSHOT = 3,
  VIDEO = 4,
  SOUND = 5,
  FILE = 6,
}

/**
 * 消息转发类型（对齐 MessageForwardType）
 */
export enum MessageForwardType {
  SEPARATE = 0,
  MERGED = 1,
}

// ==================== 消息发送方信息 ====================

/**
 * 消息发送者信息（对齐 MessageSenderInfo）
 */
export interface MessageSenderInfo {
  userID: string;
  avatarURL?: string;
  nickname?: string;
  /** 好友备注 */
  friendRemark?: string;
  /** 群名片 */
  nameCard?: string;
}

// ==================== Payload sealed class（核心多态结构）====================

/**
 * Payload 鉴别字段
 *
 * 底层为 Kotlin sealed class（TextMessagePayload / ImageMessagePayload / ...），
 * 通过 Gson 序列化携带类名信息；前端用 messageType 枚举鉴别即可。
 */
export type MessagePayloadBase = {
  /** 仅 TS 类型推断使用，运行时不一定存在；优先用 messageType 字段判断 */
  _type?: string;
};

/** 文本消息 payload */
export interface TextMessagePayload extends MessagePayloadBase {
  text: string;
  /** 翻译目标语言 */
  translateLanguage?: string;
  /** 已翻译文本（语言 → 译文） */
  translatedText?: Record<string, string>;
}

/** 图片消息 payload */
export interface ImageMessagePayload extends MessagePayloadBase {
  originalImageWidth: number;
  originalImageHeight: number;
  originalImageSize: number;
  originalImagePath?: string;
  originalImageURL?: string;
  largeImagePath?: string;
  largeImageURL?: string;
  thumbImagePath?: string;
  thumbImageURL?: string;
}

/** 视频消息 payload */
export interface VideoMessagePayload extends MessagePayloadBase {
  videoSnapshotWidth: number;
  videoSnapshotHeight: number;
  videoSnapshotPath?: string;
  videoSnapshotURL?: string;
  videoType?: string;
  videoSize: number;
  videoDuration: number;
  videoPath?: string;
  videoURL?: string;
}

/** 语音消息 payload */
export interface AudioMessagePayload extends MessagePayloadBase {
  audioSize: number;
  audioDuration: number;
  audioPath?: string;
  audioURL?: string;
  /** ASR 语言 */
  asrLanguage?: string;
  /** ASR 识别文本 */
  asrText?: string;
}

/** 文件消息 payload */
export interface FileMessagePayload extends MessagePayloadBase {
  fileName?: string;
  fileSize: number;
  filePath?: string;
  fileURL?: string;
}

/** 表情消息 payload */
export interface FaceMessagePayload extends MessagePayloadBase {
  faceIndex: number;
  faceData?: string;
}

/** 群提示消息 payload（对齐 TipsMessagePayload） */
export interface TipsMessagePayload extends MessagePayloadBase {
  /** 群提示信息列表（sealed class GroupTipsInfo） */
  groupTips?: GroupTipsInfo[];
}

/** 自定义消息 payload（对齐底层 CustomMessagePayload，customData 必填） */
export interface CustomMessagePayload extends MessagePayloadBase {
  customData: string;
  description?: string;
  extensionInfo?: string;
}

/** 合并消息 payload */
export interface MergedMessagePayload extends MessagePayloadBase {
  title: string;
  abstractList?: string[];
}

/** 流式消息 payload */
export interface StreamMessagePayload extends MessagePayloadBase {
  markdown: string;
  data: string;
  isStreamEnded: boolean;
}

/**
 * 消息 payload 联合类型（discriminated by messageType）
 *
 * 用法：
 * ```ts
 * if (msg.messageType === MessageType.TEXT) {
 *   const text = (msg.messagePayload as TextMessagePayload).text;
 * }
 * ```
 */
export type MessagePayload =
  | TextMessagePayload
  | ImageMessagePayload
  | VideoMessagePayload
  | AudioMessagePayload
  | FileMessagePayload
  | FaceMessagePayload
  | TipsMessagePayload
  | CustomMessagePayload
  | MergedMessagePayload
  | StreamMessagePayload;

// ==================== GroupTipsInfo（群提示子类型）====================

/**
 * 群提示信息（对齐 GroupTipsInfo sealed class）
 *
 * 注意：每个子类型由 `type` 字段鉴别（Hybrid 序列化 sealed class 时使用 "type" 作为 discriminator，
 * 值为大驼峰类名如 "JoinGroup"）。
 */
export type GroupTipsInfo =
  | { type: 'Unknown' }
  | { type: 'JoinGroup'; joinMember: GroupMember }
  | { type: 'InviteToGroup'; inviter: GroupMember; invitees: GroupMember[] }
  | { type: 'QuitGroup'; quitMember: GroupMember }
  | { type: 'KickedFromGroup'; opUser: GroupMember; kickedMembers: GroupMember[] }
  | { type: 'SetGroupAdmin'; opUser: GroupMember; setAdminMembers: GroupMember[] }
  | { type: 'CancelGroupAdmin'; opUser: GroupMember; cancelAdminMembers: GroupMember[] }
  | { type: 'ChangeGroupName'; opUser: GroupMember; groupName: string }
  | { type: 'ChangeGroupAvatar'; opUser: GroupMember; groupAvatar: string }
  | { type: 'ChangeGroupNotification'; opUser: GroupMember; groupNotification: string }
  | { type: 'ChangeGroupIntroduction'; opUser: GroupMember; groupIntroduction: string }
  | { type: 'ChangeGroupOwner'; opUser: GroupMember; groupOwner: string }
  | { type: 'ChangeGroupMuteAll'; opUser: GroupMember; isMuteAll: boolean }
  | { type: 'ChangeJoinGroupApproval'; opUser: GroupMember; groupJoinOption: GroupJoinOption }
  | { type: 'ChangeInviteToGroupApproval'; opUser: GroupMember; groupInviteOption: GroupInviteOption }
  | { type: 'MuteGroupMember'; opUser: GroupMember; isSelfMuted: boolean; mutedGroupMembers: GroupMember[]; muteTime: number }
  | { type: 'PinGroupMessage'; opUser: GroupMember }
  | { type: 'UnpinGroupMessage'; opUser: GroupMember };

/**
 * @deprecated SystemMessageInfo 已重命名为 GroupTipsInfo，且字段结构已变更
 *
 * 旧版用 type:'JoinGroup' / 'InviteToGroup' 等字符串字面量；
 * 新版底层用 sealed class，每子类有自己的字段（如 joinMember: GroupMember）。
 */
export type SystemMessageInfo = GroupTipsInfo;

// ==================== 引用消息 / 回执 / Reaction / Extension ====================

/**
 * 消息引用信息（对齐 MessageQuoteInfo）
 *
 * 注：旧名 ReplyMessageInfo；新名 MessageQuoteInfo
 */
export interface MessageQuoteInfo {
  msgID: string;
  status: MessageStatus;
  timestamp: number;
  sequence: number;
  /** 发送者（对齐底层字段名 sender，注意主消息字段叫 from） */
  sender: MessageSenderInfo;
  messageType: MessageType;
  messagePayload?: MessagePayload;
}

/**
 * @deprecated 使用 MessageQuoteInfo
 */
export type ReplyMessageInfo = MessageQuoteInfo;

/**
 * 消息已读回执（对齐 MessageReceipt）
 */
export interface MessageReceipt {
  isPeerRead: boolean;
  readCount: number;
  unreadCount: number;
}

/**
 * 消息表情回应（对齐 MessageReaction）
 */
export interface MessageReaction {
  reactionID: string;
  totalUserCount: number;
  partialUserList: UserProfile[];
  reactedByMyself: boolean;
}

/**
 * 消息扩展（对齐 MessageExtension）
 */
export interface MessageExtension {
  extensionKey?: string;
  extensionValue?: string;
}

// ==================== 离线推送 ====================

/**
 * 离线推送 extensionInfo
 */
export interface OfflinePushExtensionInfo {
  ext?: string;
  disablePush?: boolean;

  iOSSound?: string;
  iOSInterruptionLevel?: string;
  iOSImage?: string;
  iOSPushType?: number;
  ignoreIOSBadge?: boolean;
  enableIOSBackgroundNotification?: boolean;

  AndroidSound?: string;
  AndroidOPPOChannelID?: string;
  AndroidFCMChannelID?: string;
  AndroidXiaoMiChannelID?: string;
  AndroidVIVOCategory?: string;
  AndroidHuaWeiCategory?: string;
  AndroidOPPOCategory?: string;
  AndroidHonorImportance?: string;
  AndroidHuaWeiImage?: string;
  AndroidHonorImage?: string;
  AndroidFCMImage?: string;
  AndroidVIVOClassification?: number;
  AndroidOPPONotifyLevel?: number;
  AndroidMeizuNotifyType?: number;

  HarmonyImage?: string;
  HarmonyCategory?: string;
  ignoreHarmonyBadge?: boolean;
}

/**
 * 离线推送信息（对齐 OfflinePushInfo）
 */
export interface OfflinePushInfo {
  title?: string;
  description?: string;
  /** 底层是 Map<String, Any>；前端约束为业务侧扩展字段对象 */
  extensionInfo?: OfflinePushExtensionInfo | Record<string, any>;
}

/**
 * 离线推送计算上下文
 *
 * 由 MessageInput / ToolsPanel 在每次发送消息前构造
 */
export interface OfflinePushContext {
  messageType: MessageType;
  /** 已构造完毕的 payload，业务方可读取字段做决策 */
  messagePayload: MessagePayload | any;
  conversationID: string;
}

/**
 * 离线推送信息解析器
 */
export type OfflinePushInfoResolver = (
  ctx: OfflinePushContext
) => OfflinePushInfo | null | undefined;

// ==================== 主消息类型（核心改造点）====================

/**
 * 消息信息（对齐 MessageInfo）
 *
 * **本次升级关键字段调整：**
 * - 旧 `sender: MessageSenderInfo` → **新 `from: MessageSenderInfo`**
 * - 旧 `receiver?: string` → **新 `to: string`**
 * - 旧 `isSelf: boolean` → **新 `isSentBySelf: boolean`**
 * - 旧 `messageBody?: MessageBody`（扁平 union）→ **新 `messagePayload?: MessagePayload`（sealed 多态）**
 * - 旧 `progress: number` 拆分为 `uploadMediaProgress` + `downloadMediaProgress`
 * - 旧 `supportExtension` → 新 `isExtensionEnabled`
 * - 旧 `receipt` → 新 `readReceiptInfo`
 * - 删除 `replyMessageInfo` / `repliedMessageCount`（合并到 quoteInfo）
 * - 改名 `quoteMessageInfo` → `quoteInfo`
 * - 新增 `sequence` / `revokerInfo` / `revokeReason`
 * - 删除 `groupID`（信息从 conversationType + to 推导）
 */
export interface MessageInfo {
  msgID?: string;
  status: MessageStatus;
  timestamp?: number;
  /** 消息序号（新增） */
  sequence?: number;
  /** 发送者信息（旧名 sender） */
  from: MessageSenderInfo;
  /** 接收方（C2C 是对方 userID，群聊是 groupID）；旧名 receiver */
  to: string;
  /** 是否本人发送（旧名 isSelf） */
  isSentBySelf: boolean;
  /** 会话类型 */
  conversationType: ConversationType;
  /** 消息类型 */
  messageType: MessageType;
  /** 消息 payload（多态；按 messageType 决定具体子类型） */
  messagePayload?: MessagePayload;

  /** 上传进度（0-100） */
  uploadMediaProgress: number;
  /** 下载进度（0-100） */
  downloadMediaProgress: number;

  /** @ 用户列表 */
  atUserList: string[];
  /** 引用消息信息（旧名 quoteMessageInfo / replyMessageInfo） */
  quoteInfo?: MessageQuoteInfo;
  /** 是否被置顶 */
  isPinned: boolean;

  /** 是否需要已读回执 */
  needReadReceipt: boolean;
  /** 已读回执信息（旧名 receipt） */
  readReceiptInfo?: MessageReceipt;

  /** 是否启用扩展（旧名 supportExtension） */
  isExtensionEnabled: boolean;
  /** 扩展信息列表 */
  extensionList: MessageExtension[];

  /** 表情回应列表 */
  reactionList: MessageReaction[];

  /** 撤回者信息（仅当 status === REVOKED） */
  revokerInfo?: UserProfile;
  /** 撤回原因 */
  revokeReason?: string;

  /** 离线推送信息 */
  offlinePushInfo?: OfflinePushInfo;

  /** 原生侧 V2TIMMessage 引用，前端不直接使用 */
  rawMessage?: any;
}

// ==================== Send Payload（用于 sendMessage）====================

/**
 * 发送消息 payload（对齐 SendMessagePayload sealed class）
 *
 * 用法：在 messageInputState.sendMessage 时按此结构构造
 *
 * **注**：底层 HybridAPI（MessageInputAPI.parseSendMessagePayload）通过
 * 字段 `type`（小写枚举值）做 discriminator，不是 `_type`/类全名。
 */
export type SendMessagePayload =
  | { type: 'text'; text: string }
  | { type: 'custom'; customData: string; description?: string; extensionInfo?: string }
  | { type: 'image'; imagePath: string; imageWidth?: number; imageHeight?: number }
  | { type: 'audio'; audioFilePath: string; duration: number }
  | {
      type: 'video';
      videoFilePath: string;
      videoType?: string;
      duration?: number;
      snapshotPath: string;
      snapshotWidth?: number;
      snapshotHeight?: number;
    }
  | { type: 'file'; filePath: string; fileName: string; fileSize?: number }
  | { type: 'face'; index: number; data: string };

/**
 * 发送消息选项（对齐 SendMessageOption）
 */
export interface SendMessageOption {
  atUserList?: string[];
  quotedMessage?: MessageInfo;
  needReadReceipt?: boolean;
  isExtensionEnabled?: boolean;
  onlineUserOnly?: boolean;
  offlinePushInfo?: OfflinePushInfo;
}

// ==================== 加载 / 转发 选项 ====================

/**
 * 消息加载选项（对齐 MessageLoadOption）
 *
 * 注：旧名 MessageFetchOption；新名 MessageLoadOption
 */
export interface MessageLoadOption {
  messageListType?: MessageListType;
  /** 游标消息（基于该消息加载更早/更新的消息） */
  cursor?: MessageInfo;
  direction?: MessageLoadDirection;
  pageCount?: number;
  /** 消息类型过滤列表 */
  messageTypeList?: MessageType[];
}

/**
 * @deprecated 使用 MessageLoadOption
 */
export type MessageFetchOption = MessageLoadOption;

/**
 * 合并转发信息（对齐 MergedForwardInfo）
 */
export interface MergedForwardInfo {
  title: string;
  abstractList?: string[];
  compatibleText: string;
}

/**
 * 消息转发选项（对齐 ForwardMessageOption）
 *
 * 注：参数从 conversationIDList 改为 conversationID（单个），如需多会话调用多次
 */
export interface ForwardMessageOption {
  forwardType: MessageForwardType;
  mergedForwardInfo?: MergedForwardInfo;
  sendMessageOption?: SendMessageOption;
}

/**
 * @deprecated 使用 ForwardMessageOption（保留旧名 MessageForwardOption）
 */
export type MessageForwardOption = ForwardMessageOption;

// ==================== 消息事件流 ====================

/**
 * 消息事件（对齐 MessageEvent sealed class）
 *
 * 通过 addListener({ name: 'messageEvent' }) 推送
 */
export type MessageEvent =
  | { eventType: 'OnReceiveNewMessage'; data: { message: MessageInfo } };

// ==================== 消息列表状态 ====================

/**
 * 消息列表状态（对齐 MessageListState）
 *
 * 字段差异：
 * - 旧 messageList → 新 historyMessageList（在原生层）；前端 state 暴露时仍用 messageList 作为 alias
 * - 旧 hasMoreOlderMessage → 新 hasOlderMessages
 * - 旧 hasMoreNewerMessage → 新 hasNewerMessages
 * - 新增 pinnedMessageList
 */
export interface MessageListStateData {
  messageList: MessageInfo[];
  hasOlderMessages: boolean;
  hasNewerMessages: boolean;
  pinnedMessageList: MessageInfo[];
}

/**
 * @deprecated 使用 MessageListStateData
 */
export type MessageListState = MessageListStateData;

// ==================== 消息过滤器（保留：组件级使用）====================

/**
 * 消息过滤器（前端 UI 层使用，不直接对应底层）
 *
 * 注：底层 messageTypeList 直接使用 MessageType[]，无需此 helper class；
 * 但旧版组件（如 ImagePreview）依赖此 union helper，保留向后兼容
 */
export class MessageFilterType {
  static readonly All = new MessageFilterType(0x1);
  static readonly Image = new MessageFilterType(0x1 << 1);
  static readonly Video = new MessageFilterType(0x1 << 2);

  constructor(public readonly value: number) {}

  or(other: MessageFilterType): MessageFilterType {
    return new MessageFilterType(this.value | other.value);
  }

  contains(other: MessageFilterType): boolean {
    return (this.value & other.value) !== 0;
  }
}

// ==================== 旧名 MessageBody（已删除，提示用 messagePayload）====================

/**
 * @deprecated MessageBody 在新版底层已删除，使用 MessagePayload + messageType 鉴别
 *
 * 字段结构变化：
 * - 文件消息：fileUrl → fileURL（注意大小写）
 * - 图片消息：originalImageUrl → originalImageURL
 * - 视频消息：videoUrl → videoURL，videoSnapshotUrl → videoSnapshotURL
 * - 音频消息：soundPath/soundSize/soundDuration → audioPath/audioSize/audioDuration（前缀变化）
 *
 * 旧代码：`msg.messageBody?.text`
 * 新代码：`(msg.messagePayload as TextMessagePayload)?.text`
 */
export interface MessageBody {
  // 兼容字段（与 union 平铺，仅供旧调用点不报错；新代码不应使用）
  text?: string;
  translateLanguage?: string;
  translatedText?: Record<string, string>;

  originalImagePath?: string;
  originalImageURL?: string;
  originalImageWidth?: number;
  originalImageHeight?: number;
  originalImageSize?: number;
  thumbImagePath?: string;
  thumbImageURL?: string;
  largeImagePath?: string;
  largeImageURL?: string;

  videoPath?: string;
  videoURL?: string;
  videoType?: string;
  videoSize?: number;
  videoDuration?: number;
  videoSnapshotPath?: string;
  videoSnapshotURL?: string;
  videoSnapshotWidth?: number;
  videoSnapshotHeight?: number;
  videoSnapshotSize?: number;

  audioPath?: string;
  audioURL?: string;
  audioSize?: number;
  audioDuration?: number;
  asrLanguage?: string;
  asrText?: string;
  /** @deprecated 使用 audioPath */
  soundPath?: string;
  /** @deprecated 使用 audioSize */
  soundSize?: number;
  /** @deprecated 使用 audioDuration */
  soundDuration?: number;
  isSoundPlayed?: boolean;

  filePath?: string;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;

  faceIndex?: number;
  faceData?: string;
  faceName?: string;

  /** 旧名 systemMessage，迁移到 messagePayload as TipsMessagePayload */
  systemMessage?: GroupTipsInfo[];
  groupTips?: GroupTipsInfo[];

  /** 自定义消息（旧名嵌入 customMessage 子对象，新版直接平铺到 CustomMessagePayload） */
  customMessage?: { data?: string; description?: string; extensionInfo?: string };
  customData?: string;
  description?: string;
  extensionInfo?: string;

  /** 合并消息 */
  mergedMessage?: { title?: string; abstractList?: string[] };
  title?: string;
  abstractList?: string[];
}

// ==================== 兼容重导出 ====================

export { GroupJoinOption };
