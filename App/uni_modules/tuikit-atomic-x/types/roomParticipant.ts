/**
 * 房间参与者类型与契约模块。
 *
 * 提供 RoomParticipant 模块的全部类型 / 接口 / 事件定义。
 *
 * @example
 * import { useRoomParticipantState, RoomParticipantEvent, DeviceType } from 'tuikit-atomic-x';
 * const roomParticipantState = useRoomParticipantState();
 *
 * // 监听参与者加入
 * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantJoined, ({ participant }) => {
 *   console.log(`${participant.userName} 加入了房间`);
 * });
 *
 * // 关闭某个参与者的麦克风
 * await roomParticipantState.closeParticipantDevice({
 *   userID: 'user_1',
 *   device: DeviceType.Microphone,
 * });
 */

import type { RoomUser } from './room';

import {
  DeviceStatus,
  DeviceType,
  type NetworkInfo,
} from '../state/DeviceState';

export { DeviceStatus, DeviceType };
export type { NetworkInfo };

/** 房间参与者角色 */
export enum RoomParticipantRole {
  /** 房主 */
  Owner = 0,
  /** 管理员 */
  Admin = 1,
  /** 普通用户 */
  GeneralUser = 2,
}

/** 房间参与者状态 */
export enum RoomParticipantStatus {
  /** 预约房间状态 */
  Scheduled = 1,
  /** 呼叫中 */
  InCalling = 2,
  /** 呼叫超时 */
  CallTimeout = 3,
  /** 呼叫被拒绝 */
  CallRejected = 4,
  /** 已在房间内 */
  InRoom = 5,
}

/** 被踢出房间原因 */
export enum KickedOutOfRoomReason {
  /** 被管理员踢出房间 */
  KickedByAdmin = 0,
  /** 被其他设备替换（同账号在其他端登录） */
  ReplacedByAnotherDevice = 1,
  /** 被服务端踢出 */
  KickedByServer = 2,
  /** 连接超时 */
  ConnectionTimeout = 3,
  /** 离线期间进房状态发生变化（被踢出房间或者房间已解散） */
  InvalidStatusOnReconnect = 4,
  /** 房间人数超过限制 */
  RoomLimitExceeded = 5,
}

/** 房间参与者信息 */
export interface RoomParticipant extends RoomUser {
  /** 用户名片 */
  nameCard: string;
  /** 用户角色 */
  role: RoomParticipantRole;
  /** 用户在房间内的状态 */
  roomStatus: RoomParticipantStatus;
  /** 麦克风状态 */
  microphoneStatus: DeviceStatus;
  /** 摄像头状态 */
  cameraStatus: DeviceStatus;
  /** 屏幕共享状态 */
  screenShareStatus: DeviceStatus;
  /** 是否已被禁言 */
  isMessageDisabled: boolean;
  /** 用户自定义元数据 */
  metaData: Record<string, string>;
}

/**
 * 设备申请/邀请信息。
 *
 * 表示一次设备申请（参与者向房主/管理员申请开启设备）或设备邀请
 * （房主/管理员邀请参与者开启设备）的信息。
 */
export interface DeviceRequestInfo {
  /** 申请/邀请发起的时间戳（毫秒） */
  timestamp: number;
  /** 发起者用户 ID */
  senderUserID: string;
  /** 发起者用户名 */
  senderUserName: string;
  /** 发起者名片 */
  senderNameCard: string;
  /** 发起者头像 URL */
  senderAvatarURL: string;
  /** 申请/邀请的附加内容 */
  content: string;
  /** 设备类型 */
  device: DeviceType;
}

/**
 * 房间参与者事件列表。
 *
 * 通过 `roomParticipantState.subscribeEvent(RoomParticipantEvent.XXX, handler)` 监听指定事件。
 * 建议在加入房间前完成事件监听，确保不会漏掉事件通知。
 *
 * @example
 * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
 * const roomParticipantState = useRoomParticipantState();
 * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantJoined, ({ participant }) => {
 *   console.log(`${participant.userName} 加入了房间`);
 * });
 */
export enum RoomParticipantEvent {
  /**
   * 当其他参与者加入房间时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.participant - 加入房间的参与者信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantJoined, ({ participant }) => {
   *   console.log(`${participant.userName} 加入了房间`);
   * });
   */
  onParticipantJoined = 'onParticipantJoined',

  /**
   * 当其他参与者离开房间时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.participant - 离开房间的参与者信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantLeft, ({ participant }) => {
   *   console.log(`${participant.userName} 离开了房间`);
   * });
   */
  onParticipantLeft = 'onParticipantLeft',

  /**
   * 当观众被提升为参与者时触发（仅 Webinar 房间）。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.userInfo - 被提升的用户信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, ({ userInfo }) => {
   *   console.log(`${userInfo.userName} 被提升为参与者`);
   * });
   */
  onAudiencePromotedToParticipant = 'onAudiencePromotedToParticipant',

  /**
   * 当参与者被降级为观众时触发（仅 Webinar 房间）。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.userInfo - 被降级的用户信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantDemotedToAudience, ({ userInfo }) => {
   *   console.log(`${userInfo.userName} 被降级为观众`);
   * });
   */
  onParticipantDemotedToAudience = 'onParticipantDemotedToAudience',

  /**
   * 当房主变更时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.newOwner - 新房主信息
   * @param {RoomUser} options.oldOwner - 原房主信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onOwnerChanged, ({ newOwner, oldOwner }) => {
   *   console.log(`房主由 ${oldOwner.userName} 变更为 ${newOwner.userName}`);
   * });
   */
  onOwnerChanged = 'onOwnerChanged',

  /**
   * 当用户被设为管理员时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.userInfo - 被设为管理员的用户信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onAdminSet, ({ userInfo }) => {
   *   console.log(`${userInfo.userName} 被设为管理员`);
   * });
   */
  onAdminSet = 'onAdminSet',

  /**
   * 当用户的管理员权限被撤销时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomUser} options.userInfo - 被撤销管理员权限的用户信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onAdminRevoked, ({ userInfo }) => {
   *   console.log(`${userInfo.userName} 的管理员权限被撤销`);
   * });
   */
  onAdminRevoked = 'onAdminRevoked',

  /**
   * 当本地用户被踢出房间时触发。
   * @param {object} options - 事件参数对象
   * @param {KickedOutOfRoomReason} options.reason - 被踢出的原因枚举
   * @param {string} options.message - 附加说明信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onKickedFromRoom, ({ reason, message }) => {
   *   console.log('被踢出房间，原因:', reason, message);
   * });
   */
  onKickedFromRoom = 'onKickedFromRoom',

  /**
   * 当本地参与者的设备被房主/管理员关闭时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceType} options.device - 被关闭的设备类型
   * @param {RoomUser} options.operator - 执行关闭操作的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, ({ device, operator }) => {
   *   console.log(`${operator.userName} 关闭了你的 ${device}`);
   * });
   */
  onParticipantDeviceClosed = 'onParticipantDeviceClosed',

  /**
   * 当指定用户被禁言/解禁时触发。
   * @param {object} options - 事件参数对象
   * @param {boolean} options.disable - 是否禁言（true 表示禁言，false 表示解禁）
   * @param {RoomUser} options.operator - 执行操作的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onUserMessageDisabled, ({ disable, operator }) => {
   *   console.log(disable ? `${operator.userName} 禁言了你` : `${operator.userName} 解除了禁言`);
   * });
   */
  onUserMessageDisabled = 'onUserMessageDisabled',

  /**
   * 当全员设备被禁用/启用时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceType} options.device - 被禁用/启用的设备类型
   * @param {boolean} options.disable - 是否禁用（true 表示禁用，false 表示启用）
   * @param {RoomUser} options.operator - 执行操作的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, ({ device, disable, operator }) => {
   *   console.log(`${operator.userName} ${disable ? '禁用' : '启用'} 了全员 ${device}`);
   * });
   */
  onAllDevicesDisabled = 'onAllDevicesDisabled',

  /**
   * 当全员被禁言/解禁时触发。
   * @param {object} options - 事件参数对象
   * @param {boolean} options.disable - 是否禁言（true 表示禁言，false 表示解禁）
   * @param {RoomUser} options.operator - 执行操作的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, ({ disable, operator }) => {
   *   console.log(`${operator.userName} ${disable ? '开启' : '关闭'} 了全员禁言`);
   * });
   */
  onAllMessagesDisabled = 'onAllMessagesDisabled',

  /**
   * 房主/管理员收到参与者开启设备的申请时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 设备开启申请信息，包含申请者和设备类型
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestReceived, ({ request }) => {
   *   console.log(`${request.senderUserName} 申请开启 ${request.device}`);
   * });
   */
  onDeviceRequestReceived = 'onDeviceRequestReceived',

  /**
   * 设备开启申请被申请者取消时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 被取消的设备开启申请信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestCancelled, ({ request }) => {
   *   console.log(`${request.senderUserName} 取消了开启 ${request.device} 的申请`);
   * });
   */
  onDeviceRequestCancelled = 'onDeviceRequestCancelled',

  /**
   * 设备开启申请超时时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 超时的设备开启申请信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestTimeout, ({ request }) => {
   *   console.log('设备开启申请超时:', request.senderUserName, request.device);
   * });
   */
  onDeviceRequestTimeout = 'onDeviceRequestTimeout',

  /**
   * 参与者发出的设备开启申请被批准时触发（参与者收到回执）。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 被批准的设备开启申请信息
   * @param {RoomUser} options.operator - 批准申请的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestApproved, ({ request, operator }) => {
   *   console.log(`${operator.userName} 批准了你开启 ${request.device} 的申请`);
   * });
   */
  onDeviceRequestApproved = 'onDeviceRequestApproved',

  /**
   * 参与者发出的设备开启申请被拒绝时触发（参与者收到回执）。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 被拒绝的设备开启申请信息
   * @param {RoomUser} options.operator - 拒绝申请的用户（房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, ({ request, operator }) => {
   *   console.log(`${operator.userName} 拒绝了你开启 ${request.device} 的申请`);
   * });
   */
  onDeviceRequestRejected = 'onDeviceRequestRejected',

  /**
   * 设备开启申请被其他房主/管理员处理时触发（同步给未处理的管理员）。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.request - 已被处理的设备开启申请信息
   * @param {RoomUser} options.operator - 处理申请的用户（其他房主/管理员）
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceRequestProcessed, ({ request, operator }) => {
   *   console.log(`${operator.userName} 已处理 ${request.senderUserName} 的申请`);
   * });
   */
  onDeviceRequestProcessed = 'onDeviceRequestProcessed',

  /**
   * 本地参与者收到房主/管理员的设备开启邀请时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.invitation - 设备开启邀请信息，包含邀请者和设备类型
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, ({ invitation }) => {
   *   console.log(`${invitation.senderUserName} 邀请你开启 ${invitation.device}`);
   * });
   */
  onDeviceInvitationReceived = 'onDeviceInvitationReceived',

  /**
   * 设备开启邀请被邀请者取消时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.invitation - 被取消的设备开启邀请信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, ({ invitation }) => {
   *   console.log(`${invitation.senderUserName} 取消了开启 ${invitation.device} 的邀请`);
   * });
   */
  onDeviceInvitationCancelled = 'onDeviceInvitationCancelled',

  /**
   * 设备开启邀请超时时触发。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.invitation - 超时的设备开启邀请信息
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, ({ invitation }) => {
   *   console.log('设备开启邀请超时:', invitation.senderUserName, invitation.device);
   * });
   */
  onDeviceInvitationTimeout = 'onDeviceInvitationTimeout',

  /**
   * 设备开启邀请被参与者接受时触发（邀请者收到回执）。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.invitation - 被接受的设备开启邀请信息
   * @param {RoomUser} options.operator - 接受邀请的参与者
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationAccepted, ({ invitation, operator }) => {
   *   console.log(`${operator.userName} 接受了开启 ${invitation.device} 的邀请`);
   * });
   */
  onDeviceInvitationAccepted = 'onDeviceInvitationAccepted',

  /**
   * 设备开启邀请被参与者拒绝时触发（邀请者收到回执）。
   * @param {object} options - 事件参数对象
   * @param {DeviceRequestInfo} options.invitation - 被拒绝的设备开启邀请信息
   * @param {RoomUser} options.operator - 拒绝邀请的参与者
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
   *
   * const roomParticipantState = useRoomParticipantState();
   * roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationDeclined, ({ invitation, operator }) => {
   *   console.log(`${operator.userName} 拒绝了开启 ${invitation.device} 的邀请`);
   * });
   */
  onDeviceInvitationDeclined = 'onDeviceInvitationDeclined',
}

/** 房间参与者事件处理函数类型定义。 */
export interface RoomParticipantEventHandlers {
  /**
   * onParticipantJoined 事件处理函数
   * @param options - 事件数据
   * @param options.participant - 加入房间的参与者信息
   */
  onParticipantJoined: (options: { participant: RoomUser }) => void;

  /**
   * onParticipantLeft 事件处理函数
   * @param options - 事件数据
   * @param options.participant - 离开房间的参与者信息
   */
  onParticipantLeft: (options: { participant: RoomUser }) => void;

  /**
   * onAudiencePromotedToParticipant 事件处理函数
   * @param options - 事件数据
   * @param options.userInfo - 被提升的用户信息
   */
  onAudiencePromotedToParticipant: (options: { userInfo: RoomUser }) => void;

  /**
   * onParticipantDemotedToAudience 事件处理函数
   * @param options - 事件数据
   * @param options.userInfo - 被降级的用户信息
   */
  onParticipantDemotedToAudience: (options: { userInfo: RoomUser }) => void;

  /**
   * onOwnerChanged 事件处理函数
   * @param options - 事件数据
   * @param options.newOwner - 新房主信息
   * @param options.oldOwner - 原房主信息
   */
  onOwnerChanged: (options: { newOwner: RoomUser; oldOwner: RoomUser }) => void;

  /**
   * onAdminSet 事件处理函数
   * @param options - 事件数据
   * @param options.userInfo - 被设为管理员的用户信息
   */
  onAdminSet: (options: { userInfo: RoomUser }) => void;

  /**
   * onAdminRevoked 事件处理函数
   * @param options - 事件数据
   * @param options.userInfo - 被撤销管理员权限的用户信息
   */
  onAdminRevoked: (options: { userInfo: RoomUser }) => void;

  /**
   * onKickedFromRoom 事件处理函数
   * @param options - 事件数据
   * @param options.reason - 被踢出的原因枚举
   * @param options.message - 附加说明信息
   */
  onKickedFromRoom: (options: { reason: KickedOutOfRoomReason; message: string }) => void;

  /**
   * onParticipantDeviceClosed 事件处理函数
   * @param options - 事件数据
   * @param options.device - 被关闭的设备类型
   * @param options.operator - 执行关闭操作的用户
   */
  onParticipantDeviceClosed: (options: { device: DeviceType; operator: RoomUser }) => void;

  /**
   * onUserMessageDisabled 事件处理函数
   * @param options - 事件数据
   * @param options.disable - 是否禁言
   * @param options.operator - 执行操作的用户
   */
  onUserMessageDisabled: (options: { disable: boolean; operator: RoomUser }) => void;

  /**
   * onAllDevicesDisabled 事件处理函数
   * @param options - 事件数据
   * @param options.device - 被禁用/启用的设备类型
   * @param options.disable - 是否禁用
   * @param options.operator - 执行操作的用户
   */
  onAllDevicesDisabled: (options: { device: DeviceType; disable: boolean; operator: RoomUser }) => void;

  /**
   * onAllMessagesDisabled 事件处理函数
   * @param options - 事件数据
   * @param options.disable - 是否禁言
   * @param options.operator - 执行操作的用户
   */
  onAllMessagesDisabled: (options: { disable: boolean; operator: RoomUser }) => void;

  /**
   * onDeviceRequestReceived 事件处理函数
   * @param options - 事件数据
   * @param options.request - 设备开启申请信息
   */
  onDeviceRequestReceived: (options: { request: DeviceRequestInfo }) => void;

  /**
   * onDeviceRequestCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.request - 被取消的设备开启申请信息
   */
  onDeviceRequestCancelled: (options: { request: DeviceRequestInfo }) => void;

  /**
   * onDeviceRequestTimeout 事件处理函数
   * @param options - 事件数据
   * @param options.request - 超时的设备开启申请信息
   */
  onDeviceRequestTimeout: (options: { request: DeviceRequestInfo }) => void;

  /**
   * onDeviceRequestApproved 事件处理函数
   * @param options - 事件数据
   * @param options.request - 被批准的设备开启申请信息
   * @param options.operator - 批准申请的用户
   */
  onDeviceRequestApproved: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;

  /**
   * onDeviceRequestRejected 事件处理函数
   * @param options - 事件数据
   * @param options.request - 被拒绝的设备开启申请信息
   * @param options.operator - 拒绝申请的用户
   */
  onDeviceRequestRejected: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;

  /**
   * onDeviceRequestProcessed 事件处理函数
   * @param options - 事件数据
   * @param options.request - 已被处理的设备开启申请信息
   * @param options.operator - 处理申请的用户
   */
  onDeviceRequestProcessed: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;

  /**
   * onDeviceInvitationReceived 事件处理函数
   * @param options - 事件数据
   * @param options.invitation - 设备开启邀请信息
   */
  onDeviceInvitationReceived: (options: { invitation: DeviceRequestInfo }) => void;

  /**
   * onDeviceInvitationCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.invitation - 被取消的设备开启邀请信息
   */
  onDeviceInvitationCancelled: (options: { invitation: DeviceRequestInfo }) => void;

  /**
   * onDeviceInvitationTimeout 事件处理函数
   * @param options - 事件数据
   * @param options.invitation - 超时的设备开启邀请信息
   */
  onDeviceInvitationTimeout: (options: { invitation: DeviceRequestInfo }) => void;

  /**
   * onDeviceInvitationAccepted 事件处理函数
   * @param options - 事件数据
   * @param options.invitation - 被接受的设备开启邀请信息
   * @param options.operator - 接受邀请的参与者
   */
  onDeviceInvitationAccepted: (options: { invitation: DeviceRequestInfo; operator: RoomUser }) => void;

  /**
   * onDeviceInvitationDeclined 事件处理函数
   * @param options - 事件数据
   * @param options.invitation - 被拒绝的设备开启邀请信息
   * @param options.operator - 拒绝邀请的参与者
   */
  onDeviceInvitationDeclined: (options: { invitation: DeviceRequestInfo; operator: RoomUser }) => void;
}
