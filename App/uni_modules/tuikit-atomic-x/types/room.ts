/**
 * 房间类型与契约模块。
 *
 * 提供 Room 模块的全部类型 / 接口 / 事件定义。
 *
 * @example
 * import { useRoomState, RoomType, RoomEvent } from 'tuikit-atomic-x';
 * const roomState = useRoomState();
 *
 * // 监听被邀请加入房间
 * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call }) => {
 *   console.log(`${call.caller.userName} 邀请您加入 ${roomInfo.roomName}`);
 * });
 *
 * // 创建并加入新房间
 * await roomState.createAndJoinRoom({
 *   roomID: '123456',
 *   roomType: RoomType.Standard,
 *   options: { roomName: '我的会议' },
 * });
 */


/** 房间类型 */
export enum RoomType {
  /** 会议类型 */
  Standard = 1,
  /** 网络研讨会类型 */
  Webinar = 2,
}

/** 房间状态 */
export enum RoomStatus {
  /** 房间已预约但未开始 */
  Scheduled = 1,
  /** 房间正在进行中 */
  Running = 2,
}

/** 房间用户信息 */
export interface RoomUser {
  /** 用户唯一标识 */
  userID: string;
  /** 用户显示名称 */
  userName: string;
  /** 用户头像 URL */
  avatarURL: string;
}

/** 房间信息 */
export interface RoomInfo {
  /** 房间唯一标识 */
  readonly roomID: string;
  /** 房间类型 */
  roomType: RoomType;
  /** 房间显示名称 */
  roomName: string;
  /** 房间所有者/创建者 */
  roomOwner: RoomUser;
  /** 房间嘉宾数量 */
  readonly participantCount?: number;
  /** 房间观众数量 */
  readonly audienceCount?: number;
  /** 房间创建时间戳（毫秒） */
  readonly createTime?: number;
  /** 房间当前状态 */
  readonly roomStatus?: RoomStatus;
  /** 预约开始时间（毫秒时间戳） */
  scheduledStartTime?: number;
  /** 预约结束时间（毫秒时间戳） */
  scheduledEndTime?: number;
  /** 开始前多少秒发送提醒通知 */
  startReminderInSeconds?: number;
  /** 预约参会用户列表 */
  scheduleAttendees?: RoomUser[];
  /** 加入房间的密码 */
  password?: string;
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
}

/** 预约房间选项 */
export type ScheduleRoomOptions = {
  /** 房间显示名称 */
  roomName?: string;
  /** 加入房间的密码 */
  password?: string;
  /** 预约开始时间（毫秒时间戳） */
  scheduleStartTime: number;
  /** 预约结束时间（毫秒时间戳） */
  scheduleEndTime: number;
  /** 开始前多少秒发送提醒通知 */
  reminderSecondsBeforeStart?: number;
  /** 邀请的用户 ID 列表 */
  scheduleAttendees?: string[];
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
};

/** 创建房间选项 */
export type CreateRoomOptions = {
  /** 房间显示名称 */
  roomName?: string;
  /** 加入房间的密码 */
  password?: string;
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
};

/** 更新房间选项 */
export type UpdateRoomOptions = {
  /** 新的房间显示名称 */
  roomName?: string;
  /** 新的房间密码 */
  password?: string;
};

/** 房间呼叫状态 */
export enum RoomCallStatus {
  /** 无活跃呼叫 */
  None = 0,
  /** 呼叫进行中，等待响应 */
  Calling = 1,
  /** 呼叫超时无响应 */
  Timeout = 2,
  /** 呼叫被被叫方拒绝 */
  Rejected = 3,
}

/** 房间呼叫结果 */
export enum RoomCallResult {
  /** 呼叫发起成功 */
  Success = 0,
  /** 用户已在呼叫中 */
  AlreadyInCalling = 1,
  /** 用户已在房间中 */
  AlreadyInRoom = 2,
}

/** 呼叫拒绝原因 */
export enum CallRejectReason {
  /** 用户拒绝呼叫 */
  Rejected = 0,
  /** 用户已在其他房间中 */
  InOtherRoom = 1,
}

/** 房间呼叫信息 */
export interface RoomCall {
  /** 发起呼叫的用户 */
  caller: RoomUser;
  /** 被呼叫的用户 */
  callee: RoomUser;
  /** 呼叫的当前状态 */
  status?: RoomCallStatus;
}

/**
 * 房间事件列表。
 *
 * 通过 `roomState.subscribeEvent(RoomEvent.XXX, handler)` 监听指定事件。
 * 建议在加入房间前完成事件监听，确保不会漏掉事件通知。
 *
 * @example
 * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
 * const roomState = useRoomState();
 * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call }) => {
 *   console.log(`${call.caller.userName} 邀请您加入 ${roomInfo.roomName}`);
 * });
 */
export enum RoomEvent {
  /**
   * 当您被添加到预约房间作为参与者时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 预约房间信息，包含房间 ID、名称、房主等详细信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onAddedToScheduledRoom, ({ roomInfo }) => {
   *   console.log('被添加到预约房间:', roomInfo.roomName);
   * });
   */
  onAddedToScheduledRoom = 'onAddedToScheduledRoom',

  /**
   * 当您被从预约房间中移除时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 预约房间信息
   * @param {RoomUser} options.operator - 执行移除操作的用户信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onRemovedFromScheduledRoom, ({ roomInfo, operator }) => {
   *   console.log(`被 ${operator.userName} 从 ${roomInfo.roomName} 移除`);
   * });
   */
  onRemovedFromScheduledRoom = 'onRemovedFromScheduledRoom',

  /**
   * 当您参与的预约房间被取消时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 被取消的房间信息
   * @param {RoomUser} options.operator - 取消房间的用户信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onScheduledRoomCancelled, ({ roomInfo, operator }) => {
   *   console.log(`房间 ${roomInfo.roomName} 被 ${operator.userName} 取消`);
   * });
   */
  onScheduledRoomCancelled = 'onScheduledRoomCancelled',

  /**
   * 当预约房间即将开始时触发（提醒通知）。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 即将开始的房间信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onScheduledRoomStartingSoon, ({ roomInfo }) => {
   *   console.log(`房间 ${roomInfo.roomName} 即将开始！`);
   * });
   */
  onScheduledRoomStartingSoon = 'onScheduledRoomStartingSoon',

  /**
   * 当当前房间已结束时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 已结束的房间信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onRoomEnded, ({ roomInfo }) => {
   *   console.log(`房间 ${roomInfo.roomName} 已结束`);
   * });
   */
  onRoomEnded = 'onRoomEnded',

  /**
   * 当您收到加入房间的呼叫/邀请时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息，包含呼叫者和被呼叫者信息
   * @param {string} options.extensionInfo - 呼叫者附加的扩展信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call, extensionInfo }) => {
   *   console.log(`${call.caller.userName} 邀请您加入 ${roomInfo.roomName}`);
   *   // 显示接受或拒绝呼叫的 UI
   * });
   */
  onCallReceived = 'onCallReceived',

  /**
   * 当来电被呼叫者取消时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallCancelled, ({ roomInfo, call }) => {
   *   console.log(`来自 ${call.caller.userName} 的呼叫已取消`);
   * });
   */
  onCallCancelled = 'onCallCancelled',

  /**
   * 当来电超时未响应时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallTimeout, ({ roomInfo, call }) => {
   *   console.log(`来自 ${call.caller.userName} 的呼叫已超时`);
   * });
   */
  onCallTimeout = 'onCallTimeout',

  /**
   * 当您发出的呼叫被被叫方接受时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallAccepted, ({ roomInfo, call }) => {
   *   console.log(`${call.callee.userName} 接受了您的呼叫`);
   * });
   */
  onCallAccepted = 'onCallAccepted',

  /**
   * 当您发出的呼叫被被叫方拒绝时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @param {CallRejectReason} options.reason - 拒绝原因
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallRejected, ({ roomInfo, call, reason }) => {
   *   console.log(`${call.callee.userName} 拒绝了您的呼叫: ${reason}`);
   * });
   */
  onCallRejected = 'onCallRejected',

  /**
   * 当来电在其他设备上被处理（接受/拒绝）时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {boolean} options.isAccepted - 呼叫是否在其他设备上被接受，true 表示接受，false 表示拒绝
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallHandledByOtherDevice, ({ roomInfo, isAccepted }) => {
   *   console.log(`呼叫已在其他设备上${isAccepted ? '接受' : '拒绝'}`);
   * });
   */
  onCallHandledByOtherDevice = 'onCallHandledByOtherDevice',

  /**
   * 当呼叫被管理员撤销/取消时触发。
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @param {RoomUser} options.operator - 撤销呼叫的管理员信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallRevokedByAdmin, ({ roomInfo, call, operator }) => {
   *   console.log(`呼叫被管理员 ${operator.userName} 撤销`);
   * });
   */
  onCallRevokedByAdmin = 'onCallRevokedByAdmin',
}

/** 房间事件处理函数类型定义。 */
export interface RoomEventHandlers {
  /**
   * onAddedToScheduledRoom 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 预约房间信息
   */
  onAddedToScheduledRoom: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onRemovedFromScheduledRoom 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 预约房间信息
   * @param options.operator - 执行移除操作的用户
   */
  onRemovedFromScheduledRoom: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;

  /**
   * onScheduledRoomCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 被取消的房间信息
   * @param options.operator - 取消房间的用户
   */
  onScheduledRoomCancelled: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;

  /**
   * onScheduledRoomStartingSoon 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 即将开始的房间信息
   */
  onScheduledRoomStartingSoon: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onRoomEnded 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 已结束的房间信息
   */
  onRoomEnded: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onCallReceived 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.extensionInfo - 呼叫者附加信息
   */
  onCallReceived: (options: { roomInfo: RoomInfo; call: RoomCall; extensionInfo: string }) => void;

  /**
   * onCallCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallCancelled: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallTimeout 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallTimeout: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallAccepted 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallAccepted: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallRejected 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.reason - 被叫方拒绝原因
   */
  onCallRejected: (options: { roomInfo: RoomInfo; call: RoomCall; reason: CallRejectReason }) => void;

  /**
   * onCallHandledByOtherDevice 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.isAccepted - 呼叫是否在其他设备上被接受
   */
  onCallHandledByOtherDevice: (options: { roomInfo: RoomInfo; isAccepted: boolean }) => void;

  /**
   * onCallRevokedByAdmin 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.operator - 撤销呼叫的管理员
   */
  onCallRevokedByAdmin: (options: { roomInfo: RoomInfo; call: RoomCall; operator: RoomUser }) => void;
}
