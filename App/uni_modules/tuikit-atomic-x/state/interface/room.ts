/**
 * 房间类型与契约模块。
 *
 * 提供 Room 模块的全部类型 / 接口 / 事件定义。
 *
 * @example
 * import type { IRoomState } from 'tuikit-atomic-x';
 */
import { Ref } from 'vue';
import type {
  RoomInfo,
  RoomUser,
  RoomCall,
  RoomType,
  ScheduleRoomOptions,
  CreateRoomOptions,
  UpdateRoomOptions,
  RoomCallResult,
  RoomEvent,
  RoomEventHandlers,
} from '../../types/room';

/**
 * 房间状态接口。
 *
 * 管理房间状态和操作的主接口，提供响应式状态属性和房间管理方法。
 */
export interface IRoomState {
  /**
   * 预约房间列表（响应式）
   */
  scheduledRoomList: Ref<RoomInfo[]>;

  /**
   * 预约房间列表分页游标
   */
  scheduledRoomListCursor: Ref<string>;

  /**
   * 当前活跃房间信息
   */
  currentRoom: Ref<RoomInfo | null>;

  /**
   * 获取预约房间列表
   * @param options.cursor - 分页游标，首次拉取传 ''
   * @returns 房间列表与下一页游标
   */
  getScheduledRoomList(options: { cursor: string }): Promise<{ scheduledRoomList: RoomInfo[]; cursor: string }>;

  /**
   * 获取预约房间的参会人员
   * @param options.roomID - 房间 ID
   * @param options.cursor - 分页游标，首次拉取传 ''
   * @returns 参会人员、下一页游标、参会人员总数
   */
  getScheduledAttendees(options: { roomID: string; cursor: string }): Promise<{ attendees: RoomUser[]; cursor: string; totalAttendeesCount: number }>;

  /**
   * 预约新房间
   * @param options.roomID - 房间 ID
   * @param options.options - 房间预约配置
   */
  scheduleRoom(options: { roomID: string; options: ScheduleRoomOptions }): Promise<void>;

  /**
   * 更新预约房间
   * @param options.roomID - 房间 ID
   * @param options.options - 更新的房间配置
   */
  updateScheduledRoom(options: { roomID: string; options: ScheduleRoomOptions }): Promise<void>;

  /**
   * 向预约房间添加参会人员
   * @param options.roomID - 房间 ID
   * @param options.userIDList - 要添加的用户 ID 列表
   */
  addScheduledAttendees(options: { roomID: string; userIDList: string[] }): Promise<void>;

  /**
   * 从预约房间移除参会人员
   * @param options.roomID - 房间 ID
   * @param options.userIDList - 要移除的用户 ID 列表
   */
  removeScheduledAttendees(options: { roomID: string; userIDList: string[] }): Promise<void>;

  /**
   * 取消预约房间
   * @param options.roomID - 要取消的房间 ID
   */
  cancelScheduledRoom(options: { roomID: string }): Promise<void>;

  /**
   * 创建并立即加入新房间
   * @param options.roomID - 房间 ID
   * @param options.roomType - 房间类型，默认 RoomType.Standard
   * @param options.options - 房间创建配置
   */
  createAndJoinRoom(options: { roomID: string; roomType?: RoomType; options: CreateRoomOptions }): Promise<void>;

  /**
   * 加入现有房间
   * @param options.roomID - 房间 ID
   * @param options.roomType - 房间类型，默认 RoomType.Standard
   * @param options.password - 房间密码（如需要）
   */
  joinRoom(options: { roomID: string; roomType?: RoomType; password?: string }): Promise<void>;

  /**
   * 离开当前房间
   */
  leaveRoom(): Promise<void>;

  /**
   * 结束当前房间（仅房主可用）
   */
  endRoom(): Promise<void>;

  /**
   * 更新房间信息（仅传需要更新的字段）
   * @param options.roomID - 房间 ID
   * @param options.options - 更新的房间信息
   */
  updateRoomInfo(options: { roomID: string; options: UpdateRoomOptions }): Promise<void>;

  /**
   * 获取房间信息
   * @param options.roomID - 房间 ID
   * @returns 房间信息
   */
  getRoomInfo(options: { roomID: string }): Promise<RoomInfo>;

  /**
   * 获取房间的待处理呼叫
   * @param options.roomID - 房间 ID
   * @param options.cursor - 分页游标，首次拉取传 ''
   * @returns 呼叫列表与下一页游标
   */
  getPendingCalls(options: { roomID: string; cursor: string }): Promise<{ calls: RoomCall[]; cursor: string }>;

  /**
   * 呼叫用户加入房间
   * @param options.roomID - 房间 ID
   * @param options.userIDList - 要呼叫的用户 ID 列表
   * @param options.timeout - 呼叫超时时间（秒）
   * @param options.extensionInfo - 附加信息
   * @returns 每个被叫用户对应的呼叫结果
   */
  callUserToRoom(options: { roomID: string; userIDList: string[]; timeout?: number; extensionInfo?: string }): Promise<Map<string, RoomCallResult>>;

  /**
   * 取消待处理的呼叫
   * @param options.roomID - 房间 ID
   * @param options.userIDList - 要取消呼叫的用户 ID 列表
   */
  cancelCall(options: { roomID: string; userIDList: string[] }): Promise<void>;

  /**
   * 接受来电
   * @param options.roomID - 房间 ID
   */
  acceptCall(options: { roomID: string }): Promise<void>;

  /**
   * 拒绝来电
   * @param options.roomID - 房间 ID
   * @param options.extensionInfo - 拒绝原因或附加信息
   */
  rejectCall(options: { roomID: string; extensionInfo?: string }): Promise<void>;

  /**
   * 订阅房间事件
   * @param event - 要订阅的事件名称
   * @param handler - 事件处理函数
   */
  subscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;

  /**
   * 取消订阅房间事件
   * @param event - 要取消订阅的事件名称
   * @param handler - 要移除的事件处理函数（需与订阅时为同一引用）
   */
  unsubscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;
}
