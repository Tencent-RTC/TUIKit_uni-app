/**
 * 联系人相关类型定义
 * @module contact
 */

/** 联系人在线状态 */
export enum ContactOnlineStatus {
  UNKNOWN = 'UNKNOWN',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

/** 联系人类型 */
export enum ContactType {
  UNKNOWN = 'UNKNOWN',
  USER = 'USER',
  GROUP = 'GROUP'
}

/** 好友申请类型 */
export enum FriendApplicationType {
  /** 收到的申请 */
  RECEIVED = 'RECEIVED',
  /** 发出的申请 */
  SENT = 'SENT',
  /** 双向申请 */
  BOTH = 'BOTH'
}

/** 群申请类型 */
export enum GroupApplicationType {
  /** 需要管理员审批的入群申请 */
  JOIN_APPROVED_BY_ADMIN = 'JOIN_APPROVED_BY_ADMIN',
  /** 需要被邀请人同意的邀请 */
  INVITE_APPROVED_BY_INVITEE = 'INVITE_APPROVED_BY_INVITEE',
  /** 需要管理员审批的邀请 */
  INVITE_APPROVED_BY_ADMIN = 'INVITE_APPROVED_BY_ADMIN'
}

/** 群申请处理状态 */
export enum GroupApplicationHandledStatus {
  /** 未处理 */
  UNHANDLED = 'UNHANDLED',
  /** 被其他人处理 */
  BY_OTHER = 'BY_OTHER',
  /** 被自己处理 */
  BY_MYSELF = 'BY_MYSELF'
}

/** 群申请处理结果 */
export enum GroupApplicationHandledResult {
  /** 拒绝 */
  REFUSED = 'REFUSED',
  /** 同意 */
  AGREED = 'AGREED'
}

/** 联系人信息 */
export interface ContactInfo {
  /** 联系人ID */
  contactID: string
  /** 联系人类型 */
  type?: ContactType
  /** 头像URL */
  avatarURL?: string
  /** 标题/名称 */
  title?: string
  /** 是否是联系人 */
  isFriend?: boolean
  /** 是否在群内 */
  isInGroup?: boolean
  /** 在线状态 */
  onlineStatus?: ContactOnlineStatus
}

/** 好友申请信息 */
export interface FriendApplicationInfo {
  /** 申请ID */
  applicationID: string
  /** 头像URL */
  avatarURL?: string
  /** 标题/名称 */
  title?: string
  /** 来源 */
  source?: string
  /** 申请类型 */
  type: FriendApplicationType
  /** 添加附言 */
  addWording?: string
}

/** 群申请信息 */
export interface GroupApplicationInfo {
  /** 申请ID */
  applicationID: string
  /** 群ID */
  groupID: string
  /** 申请人ID */
  fromUser?: string
  /** 申请人昵称 */
  fromUserNickname?: string
  /** 申请人头像URL */
  fromUserAvatarURL?: string
  /** 目标用户ID */
  toUser?: string
  /** 添加时间 */
  addTime?: number
  /** 申请消息 */
  requestMsg?: string
  /** 处理消息 */
  handledMsg?: string
  /** 处理状态 */
  handledStatus?: GroupApplicationHandledStatus
  /** 处理结果 */
  handledResult?: GroupApplicationHandledResult
  /** 申请类型 */
  type: GroupApplicationType
}
