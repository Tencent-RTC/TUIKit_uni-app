/**
 * 房间参与者类型与契约模块。
 *
 * 提供 RoomParticipant 模块的全部类型 / 接口 / 事件定义。
 *
 * @example
 * import type { IRoomParticipantState } from 'tuikit-atomic-x';
 */
import { Ref } from 'vue';
import type { RoomUser } from '../../types/room';
import { DeviceType, type NetworkInfo } from '../DeviceState';
import type {
  RoomParticipant,
  DeviceRequestInfo,
  RoomParticipantEvent,
  RoomParticipantEventHandlers,
} from '../../types/roomParticipant';

/**
 * 房间参与者状态接口。
 *
 * 管理房间参与者状态和操作的主接口，提供响应式状态属性和参与者管理方法。
 */
export interface IRoomParticipantState {
  /**
   * 参与者列表（响应式）
   */
  participantList: Ref<RoomParticipant[]>;

  /**
   * 参与者列表分页游标
   */
  participantListCursor: Ref<string>;

  /**
   * 观众列表（仅 Webinar 房间）
   */
  audienceList: Ref<RoomUser[]>;

  /**
   * 观众列表分页游标
   */
  audienceListCursor: Ref<string>;

  /**
   * 管理员列表（响应式）
   */
  adminList: Ref<RoomUser[]>;

  /**
   * 已禁言用户列表（响应式）
   */
  messageDisabledUserList: Ref<RoomUser[]>;

  /**
   * 已开启视频（摄像头）的参与者列表
   */
  participantListWithVideo: Ref<RoomParticipant[]>;

  /**
   * 正在进行屏幕共享的参与者，无人共享时为 null
   */
  participantWithScreen: Ref<RoomParticipant | null>;

  /**
   * 待处理的设备开启申请列表（房主/管理员可见）
   */
  pendingDeviceApplications: Ref<DeviceRequestInfo[]>;

  /**
   * 待处理的设备开启邀请列表（被邀请者可见）
   */
  pendingDeviceInvitations: Ref<DeviceRequestInfo[]>;

  /**
   * 正在说话的用户及其音量（userID -> volume，0~100）
   */
  speakingUsers: Ref<Map<string, number>>;

  /**
   * 用户网络质量信息（userID -> NetworkInfo）
   */
  networkQualities: Ref<Map<string, NetworkInfo>>;

  /**
   * 待加入的参与者列表（受邀但未加入）
   */
  pendingParticipantList: Ref<RoomParticipant[]>;

  /**
   * 本地参与者信息（响应式，只读）
   */
  readonly localParticipant: Ref<RoomParticipant | null>;

  /**
   * 获取参与者列表
   * @param options.cursor - 分页游标，首次拉取传 ''
   * @returns 参与者列表与下一页游标
   */
  getParticipantList(options: { cursor?: string }): Promise<{ participantList: RoomParticipant[]; cursor: string }>;

  /**
   * 获取观众列表（仅 Webinar 房间）
   * @param options.cursor - 分页游标，首次拉取传 ''
   * @returns 观众列表与下一页游标
   */
  getAudienceList(options: { cursor?: string }): Promise<{ audienceList: RoomUser[]; cursor: string }>;

  /**
   * 按关键字搜索房间内用户
   * @param options.keyword - 搜索关键字（用户 ID 或名称）
   * @returns 匹配的用户列表
   */
  searchUsers(options: { keyword: string }): Promise<RoomUser[]>;

  /**
   * 将观众提升为参与者（仅 Webinar 房间，房主/管理员可调用）
   * @param options.userID - 目标用户 ID
   */
  promoteToParticipant(options: { userID: string }): Promise<void>;

  /**
   * 将参与者降级为观众（仅 Webinar 房间，房主/管理员可调用）
   * @param options.userID - 目标用户 ID
   */
  demoteToAudience(options: { userID: string }): Promise<void>;

  /**
   * 转让房主（仅原房主可调用）
   * @param options.userID - 新房主用户 ID
   */
  transferOwner(options: { userID: string }): Promise<void>;

  /**
   * 设置管理员（仅房主可调用）
   * @param options.userID - 目标用户 ID
   */
  setAdmin(options: { userID: string }): Promise<void>;

  /**
   * 撤销管理员（仅房主可调用）
   * @param options.userID - 目标用户 ID
   */
  revokeAdmin(options: { userID: string }): Promise<void>;

  /**
   * 踢出用户（房主/管理员可调用）
   * @param options.userID - 目标用户 ID
   */
  kickUser(options: { userID: string }): Promise<void>;

  /**
   * 更新参与者名片
   * @param options.userID - 目标用户 ID
   * @param options.nameCard - 新名片
   */
  updateParticipantNameCard(options: { userID: string; nameCard: string }): Promise<void>;

  /**
   * 更新参与者元数据
   * @param options.userID - 目标用户 ID
   * @param options.metaData - 元数据键值对
   */
  updateParticipantMetaData(options: { userID: string; metaData: Record<string, string> }): Promise<void>;

  /**
   * 关闭本地麦克风（静音）
   */
  muteMicrophone(): Promise<void>;

  /**
   * 打开本地麦克风（取消静音）
   */
  unmuteMicrophone(): Promise<void>;

  /**
   * 关闭指定参与者的设备（房主/管理员可调用）
   * @param options.userID - 目标用户 ID
   * @param options.device - 设备类型
   */
  closeParticipantDevice(options: { userID: string; device: DeviceType }): Promise<void>;

  /**
   * 禁言/解禁单个用户（房主/管理员可调用）
   * @param options.userID - 目标用户 ID
   * @param options.disable - true 表示禁言，false 表示解禁
   */
  disableUserMessage(options: { userID: string; disable: boolean }): Promise<void>;

  /**
   * 全员禁用/启用指定设备（房主/管理员可调用）
   * @param options.device - 设备类型
   * @param options.disable - true 表示禁用，false 表示启用
   */
  disableAllDevices(options: { device: DeviceType; disable: boolean }): Promise<void>;

  /**
   * 全员禁言/解禁（房主/管理员可调用）
   * @param options.disable - true 表示禁言，false 表示解禁
   */
  disableAllMessages(options: { disable: boolean }): Promise<void>;

  /**
   * 申请开启设备（参与者向房主/管理员发起）
   * @param options.device - 设备类型
   * @param options.timeout - 申请超时时间（秒），0 表示不超时
   */
  requestToOpenDevice(options: { device: DeviceType; timeout?: number }): Promise<void>;

  /**
   * 取消已发出的设备开启申请
   * @param options.device - 设备类型
   */
  cancelOpenDeviceRequest(options: { device: DeviceType }): Promise<void>;

  /**
   * 同意指定用户的设备开启申请（房主/管理员可调用）
   * @param options.device - 设备类型
   * @param options.userID - 申请者用户 ID
   */
  approveOpenDeviceRequest(options: { device: DeviceType; userID: string }): Promise<void>;

  /**
   * 拒绝指定用户的设备开启申请（房主/管理员可调用）
   * @param options.device - 设备类型
   * @param options.userID - 申请者用户 ID
   */
  rejectOpenDeviceRequest(options: { device: DeviceType; userID: string }): Promise<void>;

  /**
   * 邀请指定用户开启设备（房主/管理员可调用）
   * @param options.userID - 被邀请用户 ID
   * @param options.device - 设备类型
   * @param options.timeout - 邀请超时时间（秒），0 表示不超时
   */
  inviteToOpenDevice(options: { userID: string; device: DeviceType; timeout?: number }): Promise<void>;

  /**
   * 取消对指定用户的设备开启邀请
   * @param options.userID - 被邀请用户 ID
   * @param options.device - 设备类型
   */
  cancelOpenDeviceInvitation(options: { userID: string; device: DeviceType }): Promise<void>;

  /**
   * 接受房主/管理员的设备开启邀请
   * @param options.userID - 邀请发起者用户 ID
   * @param options.device - 设备类型
   */
  acceptOpenDeviceInvitation(options: { userID: string; device: DeviceType }): Promise<void>;

  /**
   * 拒绝房主/管理员的设备开启邀请
   * @param options.userID - 邀请发起者用户 ID
   * @param options.device - 设备类型
   */
  declineOpenDeviceInvitation(options: { userID: string; device: DeviceType }): Promise<void>;

  /**
   * 订阅参与者事件
   * @param event - 要订阅的事件名称
   * @param handler - 事件处理函数
   */
  subscribeEvent<T extends RoomParticipantEvent>(event: T | `${T}`, handler: RoomParticipantEventHandlers[T]): void;

  /**
   * 取消订阅参与者事件
   * @param event - 要取消订阅的事件名称
   * @param handler - 要移除的事件处理函数（需与订阅时为同一引用）
   */
  unsubscribeEvent<T extends RoomParticipantEvent>(event: T | `${T}`, handler: RoomParticipantEventHandlers[T]): void;
}
