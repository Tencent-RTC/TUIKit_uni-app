/**
 * 群组相关类型定义
 * @module types/group
 */

// ==================== 枚举类型 ====================

/**
 * 群组类型
 */
export enum GroupType {
  /** 工作群 */
  Work = "Work",
  /** 公开群 */
  Public = "Public",
  /** 会议群 */
  Meeting = "Meeting",
  /** 直播群 */
  AVChatRoom = "AVChatRoom",
  /** 社群 */
  Community = "Community",
}

/**
 * 群组加入审批类型
 */
export enum GroupJoinOption {
  /** 禁止加入 */
  Forbid = 0,
  /** 需要审批 */
  Auth = 1,
  /** 自由加入 */
  Any = 2,
  /** 未知 */
  Unknown = 100
}

/**
 * 群成员角色
 */
export enum GroupMemberRole {
  /** 所有成员（用于筛选） */
  All = 0,
  /** 普通成员 */
  Member = 200,
  /** 管理员 */
  Admin = 300,
  /** 群主 */
  Owner = 400,
}

/**
 * 消息接收选项枚举
 */
export enum ReceiveMessageOpt {
  /** 正常接收消息 */
  Receive = 0,
  /** 不接收消息 */
  NotReceive = 1,
  /** 接收但不通知 */
  NotNotify = 2,
  /** 接收但不通知（除了@消息） */
  NotNotifyExceptMention = 3,
  /** 不接收（除了@消息） */
  NotReceiveExceptMention = 4,
}

// ==================== 接口类型 ====================

/**
 * 群成员信息
 */
export interface GroupMember {
  /** 用户 ID */
  userID: string;
  /** 昵称 */
  nickname?: string;
  /** 头像 URL */
  avatarURL?: string;
  /** 群名片 */
  nameCard?: string;
  /** 成员角色 */
  role: GroupMemberRole;
  /** 禁言截止时间戳（秒） */
  muteUntil: number;
  /** 备注 */
  remark?: string;
}

/**
 * 群组搜索信息
 */
export interface GroupSearchInfo {
  groupID: string;
  groupType?: GroupType;
  groupName: string;
  memberCount?: number;
  groupAvatarURL?: string;
  introduction?: string;
  joinGroupApprovalType?: GroupJoinOption;
  inviteToGroupApprovalType?: GroupJoinOption;
}

/**
 * 群组信息
 */
export interface GroupInfo {
  /** 群组 ID */
  groupID: string;
  /** 群组类型 */
  groupType?: GroupType;
  /** 群名称 */
  groupName?: string;
  /** 群头像 URL */
  avatarURL?: string;
  /** 群公告 */
  notice?: string;
  /** 成员数量 */
  memberCount?: number;
  /** 加群审批方式 */
  joinOption?: GroupJoinOption;
  /** 邀请入群审批方式 */
  inviteOption?: GroupJoinOption;
  /** 群主 ID */
  groupOwner?: string;
  /** 全员禁言状态 */
  isAllMuted?: boolean;
  /** 我的角色 */
  selfRole?: GroupMemberRole;
  /** 消息接收选项 */
  receiveMessageOpt?: ReceiveMessageOpt;
}

/**
 * 入群申请信息
 */
export interface GroupApplicationInfo {
  /** 申请 ID */
  applicationID: string;
  /** 群组 ID */
  groupID: string;
  /** 申请人 ID */
  fromUserID: string;
  /** 申请人昵称 */
  fromUserNickname?: string;
  /** 申请人头像 */
  fromUserAvatarURL?: string;
  /** 申请理由 */
  requestMessage?: string;
  /** 申请时间 */
  addTime?: number;
  /** 处理状态 */
  handleStatus?: number;
  /** 处理结果 */
  handleResult?: number;
}

/**
 * 创建群组参数
 */
export interface CreateGroupParams {
  /** 群组类型 */
  groupType: string;
  /** 群名称 */
  groupName: string;
  /** 成员列表（可选） */
  memberList?: string[];
  /** 群组 ID（可选） */
  groupID?: string;
  /** 群头像 URL（可选） */
  avatarURL?: string;
}
