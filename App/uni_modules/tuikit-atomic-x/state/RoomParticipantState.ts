/**
 * 房间参与者状态管理。
 *
 * 提供参与者列表、角色管理、设备控制、设备申请/邀请等能力的统一入口，
 * 并通过响应式状态与事件订阅暴露给业务层使用。
 *
 * @example
 * import { useRoomParticipantState, RoomParticipantEvent, DeviceType } from 'tuikit-atomic-x';
 *
 * const ps = useRoomParticipantState();
 * ps.subscribeEvent(RoomParticipantEvent.onParticipantJoined, ({ participant }) => {
 *   console.log(`${participant.userName} 加入房间`);
 * });
 * await ps.muteMicrophone();
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
// @ts-ignore - UTS module
import { invokeEngineBridgeApi, addEngineBridgeObserver, removeEngineBridgeObserver, reportMetrics } from '@/uni_modules/tuikit-atomic-x';
import type { IRoomParticipantState } from './interface/roomParticipant';
import {
  DeviceRequestInfo,
  DeviceStatus,
  DeviceType,
  KickedOutOfRoomReason,
  NetworkInfo,
  RoomParticipant,
  RoomParticipantEvent,
  RoomParticipantEventHandlers,
  RoomParticipantRole,
  RoomParticipantStatus,
} from '../types/roomParticipant';
import type { RoomInfo, RoomUser } from '../types/room';
import { RoomType } from '../types/room';
import { registerRoomLifecycle, type RoomLifecycleHooks } from './internal/roomLifecycle';
import { KeyMetricsKey, reportKeyMetrics } from './internal/keyMetrics';

/** 列表更新类型 */
enum ListModifyType {
  NONE = 0,
  FULL = 1,
  ADD = 2,
  REMOVE = 3,
  REPLACE = 4,
}

const ApiKeys = {
  GET_PARTICIPANT_LIST: 'roomParticipantStore.getParticipantList',
  GET_AUDIENCE_LIST: 'roomParticipantStore.getAudienceList',
  SEARCH_USER: 'roomParticipantStore.searchUser',
  PROMOTE_TO_PARTICIPANT: 'roomParticipantStore.promoteToParticipant',
  DEMOTE_TO_AUDIENCE: 'roomParticipantStore.demoteToAudience',

  TRANSFER_OWNER: 'roomParticipantStore.transferOwner',
  SET_ADMIN: 'roomParticipantStore.setAdmin',
  REVOKE_ADMIN: 'roomParticipantStore.revokeAdmin',
  KICK_USER: 'roomParticipantStore.kickUser',
  UPDATE_PARTICIPANT_NAME_CARD: 'roomParticipantStore.updateParticipantNameCard',
  UPDATE_PARTICIPANT_META_DATA: 'roomParticipantStore.updateParticipantMetaData',
  CLOSE_PARTICIPANT_DEVICE: 'roomParticipantStore.closeParticipantDevice',
  DISABLE_USER_MESSAGE: 'roomParticipantStore.disableUserMessage',
  DISABLE_ALL_DEVICES: 'roomParticipantStore.disableAllDevices',
  DISABLE_ALL_MESSAGES: 'roomParticipantStore.disableAllMessages',
  MUTE_MICROPHONE: 'roomParticipantStore.muteMicrophone',
  UNMUTE_MICROPHONE: 'roomParticipantStore.unmuteMicrophone',
  REQUEST_TO_OPEN_DEVICE: 'roomParticipantStore.requestToOpenDevice',
  CANCEL_OPEN_DEVICE_REQUEST: 'roomParticipantStore.cancelOpenDeviceRequest',
  APPROVE_OPEN_DEVICE_REQUEST: 'roomParticipantStore.approveOpenDeviceRequest',
  REJECT_OPEN_DEVICE_REQUEST: 'roomParticipantStore.rejectOpenDeviceRequest',
  INVITE_TO_OPEN_DEVICE: 'roomParticipantStore.inviteToOpenDevice',
  CANCEL_OPEN_DEVICE_INVITATION: 'roomParticipantStore.cancelOpenDeviceInvitation',
  ACCEPT_OPEN_DEVICE_INVITATION: 'roomParticipantStore.acceptOpenDeviceInvitation',
  DECLINE_OPEN_DEVICE_INVITATION: 'roomParticipantStore.declineOpenDeviceInvitation',

  QUERY_ADMIN_LIST: 'roomParticipantState.queryAdminList',
  QUERY_MESSAGE_DISABLED_USERLIST: 'roomParticipantState.queryMessageDisabledUserList',

  GET_PENDING_CALLS: 'roomStore.getPendingCalls',
  GET_SCHEDULED_ATTENDEES: 'roomStore.getScheduledAttendees',
} as const;

const EventKeys = {
  ON_LOCAL_PARTICIPANT_CHANGED: 'roomParticipantState.onLocalParticipantChanged',
  ON_PARTICIPANT_LIST_CHANGED: 'roomParticipantState.onParticipantListChanged',
  ON_PARTICIPANT_LIST_CURSOR_CHANGED: 'roomParticipantState.onParticipantListCursorChanged',
  ON_AUDIENCE_LIST_CHANGED: 'roomParticipantState.onAudienceListChanged',
  ON_AUDIENCE_LIST_CURSOR_CHANGED: 'roomParticipantState.onAudienceListCursorChanged',
  ON_ADMINISTRATOR_LIST_CHANGED: 'roomParticipantState.onAdministratorListChanged',
  ON_MESSAGE_DISABLED_USER_LIST_CHANGED: 'roomParticipantState.onMessageDisabledUserListChanged',

  ON_PARTICIPANT_JOINED: 'roomParticipantListener.onParticipantJoined',
  ON_PARTICIPANT_LEFT: 'roomParticipantListener.onParticipantLeft',
  ON_AUDIENCE_PROMOTED_TO_PARTICIPANT: 'roomParticipantListener.onAudiencePromotedToParticipant',
  ON_PARTICIPANT_DEMOTED_TO_AUDIENCE: 'roomParticipantListener.onParticipantDemotedToAudience',
  ON_OWNER_CHANGED: 'roomParticipantListener.onOwnerChanged',
  ON_ADMIN_SET: 'roomParticipantListener.onAdminSet',
  ON_ADMIN_REVOKED: 'roomParticipantListener.onAdminRevoked',
  ON_KICKED_FROM_ROOM: 'roomParticipantListener.onKickedFromRoom',
  ON_USER_MESSAGE_DISABLED: 'roomParticipantListener.onUserMessageDisabled',
  ON_ALL_DEVICES_DISABLED: 'roomParticipantListener.onAllDevicesDisabled',
  ON_ALL_MESSAGES_DISABLED: 'roomParticipantListener.onAllMessagesDisabled',
  ON_PARTICIPANT_DEVICE_CLOSED: 'roomParticipantListener.onParticipantDeviceClosed',

  ON_DEVICE_REQUEST_RECEIVED: 'roomParticipantListener.onDeviceRequestReceived',
  ON_DEVICE_REQUEST_CANCELLED: 'roomParticipantListener.onDeviceRequestCancelled',
  ON_DEVICE_REQUEST_TIMEOUT: 'roomParticipantListener.onDeviceRequestTimeout',
  ON_DEVICE_REQUEST_APPROVED: 'roomParticipantListener.onDeviceRequestApproved',
  ON_DEVICE_REQUEST_REJECTED: 'roomParticipantListener.onDeviceRequestRejected',
  ON_DEVICE_REQUEST_PROCESSED: 'roomParticipantListener.onDeviceRequestProcessed',
  ON_DEVICE_INVITATION_RECEIVED: 'roomParticipantListener.onDeviceInvitationReceived',
  ON_DEVICE_INVITATION_CANCELLED: 'roomParticipantListener.onDeviceInvitationCancelled',
  ON_DEVICE_INVITATION_TIMEOUT: 'roomParticipantListener.onDeviceInvitationTimeout',
  ON_DEVICE_INVITATION_ACCEPTED: 'roomParticipantListener.onDeviceInvitationAccepted',
  ON_DEVICE_INVITATION_DECLINED: 'roomParticipantListener.onDeviceInvitationDeclined',

  ON_USER_VOICE_VOLUME_CHANGED: 'roomParticipantState.onUserVoiceVolumeChanged',
  ON_USER_NETWORK_QUALITY_CHANGED: 'roomParticipantState.onUserNetworkQualityChanged',

  ON_INVITATION_ADDED: 'roomParticipantState.onInvitationAdded',
  ON_INVITATION_REMOVED: 'roomParticipantState.onInvitationRemoved',
  ON_INVITATION_STATUS_CHANGED: 'roomParticipantState.onInvitationStatusChanged',

  ON_SCHEDULE_ATTENDEES_UPDATED: 'roomParticipantState.onScheduleAttendeesUpdated',
} as const;

function safeParse<T = any>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * 调用底层 API 并包装为 Promise，约定 code === 0 表示成功、data 为 JSON 字符串。
 */
function invokeApi<T = any>(api: string, params: Record<string, any> | string = {}): Promise<T | null> {
  const paramsStr = typeof params === 'string' ? params : JSON.stringify(params);
  return new Promise((resolve, reject) => {
    // @ts-ignore
    invokeEngineBridgeApi(api, paramsStr, (code: number, message: string, data: string) => {
      if (code === 0) {
        resolve(safeParse<T>(data));
      } else {
        reject(new Error(`[RoomParticipantState] ${api} failed: code=${code}, message=${message}`));
      }
    });
  });
}

/** 按 modifyType 应用列表更新。 */
function applyListUpdate<T>(
  modifyType: ListModifyType,
  incoming: T[],
  current: T[],
  keyOf: (v: T) => string,
): T[] {
  switch (modifyType) {
    case ListModifyType.FULL: {
      const map = new Map<string, T>();
      incoming.forEach((it) => map.set(keyOf(it), it));
      return Array.from(map.values());
    }
    case ListModifyType.ADD:
    case ListModifyType.REPLACE: {
      const map = new Map<string, T>();
      current.forEach((it) => map.set(keyOf(it), it));
      incoming.forEach((it) => map.set(keyOf(it), it));
      return Array.from(map.values());
    }
    case ListModifyType.REMOVE: {
      const removeKeys = new Set(incoming.map(keyOf));
      return current.filter((it) => !removeKeys.has(keyOf(it)));
    }
    case ListModifyType.NONE:
    default:
      return current;
  }
}

class RoomParticipantStateImpl implements IRoomParticipantState, RoomLifecycleHooks {
  // 响应式状态
  readonly participantList: Ref<RoomParticipant[]> = ref<RoomParticipant[]>([]);
  readonly participantListCursor: Ref<string> = ref<string>('');
  readonly audienceList: Ref<RoomUser[]> = ref<RoomUser[]>([]);
  readonly audienceListCursor: Ref<string> = ref<string>('');
  readonly adminList: Ref<RoomUser[]> = ref<RoomUser[]>([]);
  readonly messageDisabledUserList: Ref<RoomUser[]> = ref<RoomUser[]>([]);
  readonly participantListWithVideo: Ref<RoomParticipant[]> = ref<RoomParticipant[]>([]);
  readonly participantWithScreen: Ref<RoomParticipant | null> = ref<RoomParticipant | null>(null);
  readonly pendingDeviceApplications: Ref<DeviceRequestInfo[]> = ref<DeviceRequestInfo[]>([]);
  readonly pendingDeviceInvitations: Ref<DeviceRequestInfo[]> = ref<DeviceRequestInfo[]>([]);
  readonly speakingUsers: Ref<Map<string, number>> = ref<Map<string, number>>(new Map());
  readonly networkQualities: Ref<Map<string, NetworkInfo>> = ref<Map<string, NetworkInfo>>(new Map());
  readonly pendingParticipantList: Ref<RoomParticipant[]> = ref<RoomParticipant[]>([]);
  readonly localParticipant: Ref<RoomParticipant | null> = ref<RoomParticipant | null>(null);

  // 内部维护的成员索引：
  //  - participantMap：当前已加入房间的成员
  //  - invitationMap：已邀请但尚未加入的成员
  //  - attendeeMap：  预约会议的待加入成员
  private participantMap: Map<string, RoomParticipant> = new Map();
  private invitationMap: Map<string, RoomParticipant> = new Map();
  private attendeeMap: Map<string, RoomParticipant> = new Map();

  // 内部事件总线
  private readonly listeners = new Map<RoomParticipantEvent, Set<Function>>();

  // observer 随 beforeEnterRoom / didLeaveRoom 装卸，nativeEventHandler 提到字段以便 add/remove 用同一引用
  private currentRoomID: string = '';
  private currentRoomType: RoomType | null = null;
  private observerRegistered = false;
  private isInitParticipantList = false;
  private readonly nativeEventHandler = (eventName: string, jsonData: string): void => {
    this.handleNativeEvent(eventName, jsonData);
  };

  constructor() {
    // 自注册到房间生命周期广播器，进/退房编排由 RoomState 统一驱动。
    registerRoomLifecycle(this);
  }

  /**
   * 进房前回调：绑定 roomID 并向 EngineBridge 注册 observer。
   * 由 {@link roomLifecycle} 在 RoomState 进房路径上广播触发，业务侧不应直接调用。
   */
  beforeEnterRoom(roomID: string): void {
    this.currentRoomID = roomID;
    if (this.observerRegistered) return;
    this.observerRegistered = true;
    // @ts-ignore
    addEngineBridgeObserver('RoomParticipantState', this.nativeEventHandler);
  }

  /**
   * 进房后回调：主动触发一次管理员 / 禁言用户全量拉取。
   *
   * 底层 query 是 fire-and-forget，结果以 ON_ADMINISTRATOR_LIST_CHANGED /
   * ON_MESSAGE_DISABLED_USER_LIST_CHANGED 事件推回。失败仅记日志，不抛出。
   *
   * `info` 为 `any` 以兼容不同业务场景的传入对象，此处仅识别 `RoomInfo` 形状。
   */
  afterEnterRoom(info: any): void {
    const roomInfo = info as RoomInfo | null | undefined;
    if (!roomInfo || typeof roomInfo.roomID !== 'string') return;
    this.currentRoomType = (roomInfo.roomType ?? null) as RoomType | null;
    invokeApi(ApiKeys.QUERY_ADMIN_LIST, '').catch((e) => {
      console.warn('[RoomParticipantState] queryAdminList failed:', e);
    });
    invokeApi(ApiKeys.QUERY_MESSAGE_DISABLED_USERLIST, '').catch((e) => {
      console.warn('[RoomParticipantState] queryMessageDisabledUserList failed:', e);
    });
  }

  /**
   * 退房后回调：解绑 observer 并清空所有房间相关状态。
   * 由 {@link roomLifecycle} 在 RoomState 退房路径（主动 / 被踢 / 房间结束）上广播触发。
   *
   * @param _roomID 离开的房间 ID，参数保留以便后续多房间扩展。
   */
  didLeaveRoom(_roomID: string): void {
    if (this.observerRegistered) {
      this.observerRegistered = false;
      // @ts-ignore
      removeEngineBridgeObserver('RoomParticipantState');
    }
    this.currentRoomID = '';
    this.currentRoomType = null;
    this.resetState();
  }

  /** 清空所有房间相关状态。 */
  private resetState(): void {
    this.participantList.value = [];
    this.participantListCursor.value = '';
    this.audienceList.value = [];
    this.audienceListCursor.value = '';
    this.adminList.value = [];
    this.messageDisabledUserList.value = [];
    this.participantListWithVideo.value = [];
    this.participantWithScreen.value = null;
    this.pendingDeviceApplications.value = [];
    this.pendingDeviceInvitations.value = [];
    this.speakingUsers.value = new Map();
    this.networkQualities.value = new Map();
    this.pendingParticipantList.value = [];
    this.localParticipant.value = null;
    this.participantMap.clear();
    this.invitationMap.clear();
    this.attendeeMap.clear();
    this.isInitParticipantList = false;
  }

  private handleNativeEvent(key: string, jsonData: string): void {
    const payload = safeParse<Record<string, any>>(jsonData) || {};

    // 与 currentRoomID 不一致的事件丢弃（不带 roomID 的事件不受影响）。
    const eventRoomID = payload.roomID as string | undefined;
    if (eventRoomID && this.currentRoomID && eventRoomID !== this.currentRoomID) {
      return;
    }

    switch (key) {
      case EventKeys.ON_LOCAL_PARTICIPANT_CHANGED: {
        this.localParticipant.value = payload.localParticipant as RoomParticipant;
        break;
      }
      case EventKeys.ON_PARTICIPANT_LIST_CHANGED: {
        const modifyType = payload.listModifyType as ListModifyType;
        const list = payload.participantList as RoomParticipant[];
        const next = applyListUpdate(modifyType, list, this.participantList.value, (p: RoomParticipant) => p.userID);
        this.participantList.value = next;
        this.syncParticipantMap(modifyType, list);
        // 派生：摄像头开启 / 屏幕共享中
        this.participantListWithVideo.value = next.filter((p: RoomParticipant) => p.cameraStatus === DeviceStatus.ON);
        this.participantWithScreen.value = next.find((p: RoomParticipant) => p.screenShareStatus === DeviceStatus.ON) ?? null;
        // FULL 时重建 pending；ADD 时从 invitation/attendee 中剔除已加入用户
        this.updatePendingParticipantList(modifyType, list);
        break;
      }
      case EventKeys.ON_PARTICIPANT_LIST_CURSOR_CHANGED: {
        this.participantListCursor.value = payload.cursor as string;
        break;
      }
      case EventKeys.ON_AUDIENCE_LIST_CHANGED: {
        const modifyType = payload.listModifyType as ListModifyType;
        const list = payload.audienceList as RoomUser[];
        this.audienceList.value = applyListUpdate(modifyType, list, this.audienceList.value, (u) => u.userID);
        break;
      }
      case EventKeys.ON_AUDIENCE_LIST_CURSOR_CHANGED: {
        this.audienceListCursor.value = payload.cursor as string;
        break;
      }
      case EventKeys.ON_ADMINISTRATOR_LIST_CHANGED: {
        const modifyType = payload.listModifyType as ListModifyType;
        const list = payload.adminList as RoomUser[];
        this.adminList.value = applyListUpdate(modifyType, list, this.adminList.value, (u) => u.userID);
        break;
      }
      case EventKeys.ON_MESSAGE_DISABLED_USER_LIST_CHANGED: {
        const modifyType = payload.listModifyType as ListModifyType;
        const list = payload.messageDisabledUserList as RoomUser[];
        this.messageDisabledUserList.value = applyListUpdate(
          modifyType,
          list,
          this.messageDisabledUserList.value,
          (u) => u.userID,
        );
        break;
      }
      case EventKeys.ON_USER_VOICE_VOLUME_CHANGED: {
        const map = new Map<string, number>();
        const raw = payload.volumeMap as Record<string, number>;
        Object.keys(raw).forEach((k) => map.set(k, raw[k]));
        this.speakingUsers.value = map;
        break;
      }
      case EventKeys.ON_USER_NETWORK_QUALITY_CHANGED: {
        const map = new Map<string, NetworkInfo>();
        const raw = payload.networkMap as Record<string, NetworkInfo>;
        Object.keys(raw).forEach((k) => map.set(k, raw[k]));
        this.networkQualities.value = map;
        break;
      }

      /* ---------------- 参与者 ---------------- */
      case EventKeys.ON_PARTICIPANT_JOINED: {
        this.emit(RoomParticipantEvent.onParticipantJoined, { participant: payload.participant as RoomUser });
        break;
      }
      case EventKeys.ON_PARTICIPANT_LEFT: {
        this.emit(RoomParticipantEvent.onParticipantLeft, { participant: payload.participant as RoomUser });
        break;
      }
      case EventKeys.ON_AUDIENCE_PROMOTED_TO_PARTICIPANT: {
        this.emit(RoomParticipantEvent.onAudiencePromotedToParticipant, { userInfo: payload.userInfo as RoomUser });
        break;
      }
      case EventKeys.ON_PARTICIPANT_DEMOTED_TO_AUDIENCE: {
        this.emit(RoomParticipantEvent.onParticipantDemotedToAudience, { userInfo: payload.userInfo as RoomUser });
        break;
      }
      case EventKeys.ON_OWNER_CHANGED: {
        this.emit(RoomParticipantEvent.onOwnerChanged, {
          newOwner: payload.newOwner as RoomUser,
          oldOwner: payload.oldOwner as RoomUser,
        });
        break;
      }
      case EventKeys.ON_ADMIN_SET: {
        this.emit(RoomParticipantEvent.onAdminSet, { userInfo: payload.userInfo as RoomUser });
        break;
      }
      case EventKeys.ON_ADMIN_REVOKED: {
        this.emit(RoomParticipantEvent.onAdminRevoked, { userInfo: payload.userInfo as RoomUser });
        break;
      }
      case EventKeys.ON_KICKED_FROM_ROOM: {
        this.emit(RoomParticipantEvent.onKickedFromRoom, {
          reason: payload.reason as KickedOutOfRoomReason,
          message: payload.message as string,
        });
        break;
      }
      case EventKeys.ON_USER_MESSAGE_DISABLED: {
        this.emit(RoomParticipantEvent.onUserMessageDisabled, {
          disable: payload.disable as boolean,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_ALL_DEVICES_DISABLED: {
        this.emit(RoomParticipantEvent.onAllDevicesDisabled, {
          device: payload.device as DeviceType,
          disable: payload.disable as boolean,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_ALL_MESSAGES_DISABLED: {
        this.emit(RoomParticipantEvent.onAllMessagesDisabled, {
          disable: payload.disable as boolean,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_PARTICIPANT_DEVICE_CLOSED: {
        this.emit(RoomParticipantEvent.onParticipantDeviceClosed, {
          device: payload.device as DeviceType,
          operator: payload.operator as RoomUser,
        });
        break;
      }

      /* ---------------- 设备申请/邀请 ---------------- */
      case EventKeys.ON_DEVICE_REQUEST_RECEIVED: {
        this.emit(RoomParticipantEvent.onDeviceRequestReceived, { request: payload.request as DeviceRequestInfo });
        break;
      }
      case EventKeys.ON_DEVICE_REQUEST_CANCELLED: {
        this.emit(RoomParticipantEvent.onDeviceRequestCancelled, { request: payload.request as DeviceRequestInfo });
        break;
      }
      case EventKeys.ON_DEVICE_REQUEST_TIMEOUT: {
        this.emit(RoomParticipantEvent.onDeviceRequestTimeout, { request: payload.request as DeviceRequestInfo });
        break;
      }
      case EventKeys.ON_DEVICE_REQUEST_APPROVED: {
        this.emit(RoomParticipantEvent.onDeviceRequestApproved, {
          request: payload.request as DeviceRequestInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_DEVICE_REQUEST_REJECTED: {
        this.emit(RoomParticipantEvent.onDeviceRequestRejected, {
          request: payload.request as DeviceRequestInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_DEVICE_REQUEST_PROCESSED: {
        this.emit(RoomParticipantEvent.onDeviceRequestProcessed, {
          request: payload.request as DeviceRequestInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_DEVICE_INVITATION_RECEIVED: {
        this.emit(RoomParticipantEvent.onDeviceInvitationReceived, {
          invitation: payload.invitation as DeviceRequestInfo,
        });
        break;
      }
      case EventKeys.ON_DEVICE_INVITATION_CANCELLED: {
        this.emit(RoomParticipantEvent.onDeviceInvitationCancelled, {
          invitation: payload.invitation as DeviceRequestInfo,
        });
        break;
      }
      case EventKeys.ON_DEVICE_INVITATION_TIMEOUT: {
        this.emit(RoomParticipantEvent.onDeviceInvitationTimeout, {
          invitation: payload.invitation as DeviceRequestInfo,
        });
        break;
      }
      case EventKeys.ON_DEVICE_INVITATION_ACCEPTED: {
        this.emit(RoomParticipantEvent.onDeviceInvitationAccepted, {
          invitation: payload.invitation as DeviceRequestInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_DEVICE_INVITATION_DECLINED: {
        this.emit(RoomParticipantEvent.onDeviceInvitationDeclined, {
          invitation: payload.invitation as DeviceRequestInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }

      /* ---------------- 会议邀请 / 预约参会者 ---------------- */
      case EventKeys.ON_INVITATION_ADDED:
      case EventKeys.ON_INVITATION_STATUS_CHANGED: {
        this.addInvitationUser((payload.participant ?? payload.invitee) as RoomParticipant);
        break;
      }
      case EventKeys.ON_INVITATION_REMOVED: {
        this.removeInvitationUser((payload.userID ?? payload.invitee?.userID) as string);
        break;
      }
      case EventKeys.ON_SCHEDULE_ATTENDEES_UPDATED: {
        const leftUsers = payload.leftUsers as RoomUser[];
        const joinedUsers = payload.joinedUsers as RoomParticipant[];
        leftUsers.forEach((u) => this.removeAttendeeUser(u.userID));
        joinedUsers.forEach((u) => this.addAttendeeUser(u));
        break;
      }

      default:
        break;
    }
  }

  /* ============== pendingParticipantList 维护 ==============
   * pendingParticipantList = (invitationMap ∪ attendeeMap) - participantMap
   * 即：已邀请/已预约、但尚未实际加入的成员合集。
   */

  /** 同步 participantMap（参与者列表变更时调用） */
  private syncParticipantMap(modifyType: ListModifyType, list: RoomParticipant[]): void {
    switch (modifyType) {
      case ListModifyType.FULL: {
        this.participantMap.clear();
        list.forEach((p) => this.participantMap.set(p.userID, p));
        break;
      }
      case ListModifyType.ADD:
      case ListModifyType.REPLACE: {
        list.forEach((p) => this.participantMap.set(p.userID, p));
        break;
      }
      case ListModifyType.REMOVE: {
        list.forEach((p) => this.participantMap.delete(p.userID));
        break;
      }
      default:
        break;
    }
  }

  /** 重建 pendingParticipantList：invitation ∪ attendee（剔除已加入者） */
  private mergePendingParticipants(): void {
    const seen = new Set<string>();
    const pending: RoomParticipant[] = [];
    this.participantMap.forEach((_, userID) => seen.add(userID));
    this.invitationMap.forEach((v, userID) => {
      if (!seen.has(userID)) {
        seen.add(userID);
        pending.push(v);
      }
    });
    this.attendeeMap.forEach((v, userID) => {
      if (!seen.has(userID)) {
        seen.add(userID);
        pending.push(v);
      }
    });
    this.pendingParticipantList.value = pending;
  }

  private makeParticipant(user: RoomUser | null | undefined, status: RoomParticipantStatus): RoomParticipant {
    return {
      userID: user?.userID ?? '',
      userName: user?.userName ?? '',
      avatarURL: user?.avatarURL ?? '',
      nameCard: '',
      role: RoomParticipantRole.GeneralUser,
      roomStatus: status,
      microphoneStatus: DeviceStatus.OFF,
      cameraStatus: DeviceStatus.OFF,
      screenShareStatus: DeviceStatus.OFF,
      isMessageDisabled: false,
      metaData: {},
    };
  }

  private async fetchInvitationList(roomID: string): Promise<void> {
    if (this.currentRoomType !== RoomType.Standard) return;
    let cursor = '';
    this.invitationMap.clear();
    do {
      const data = await invokeApi<{ calls?: Array<{ callee?: RoomUser; status?: number }>; cursor?: string }>(
        ApiKeys.GET_PENDING_CALLS,
        { roomID, cursor },
      );
      const calls = data?.calls ?? [];
      calls.forEach((call) => {
        const callee = call.callee;
        if (!callee || !callee.userID) return;
        const status = this.roomCallStatusToParticipantStatus(call.status ?? 0);
        this.invitationMap.set(callee.userID, this.makeParticipant(callee, status));
      });
      cursor = data?.cursor ?? '';
    } while (cursor);
  }

  private async fetchAttendeeList(roomID: string): Promise<void> {
    if (this.currentRoomType !== RoomType.Standard) return;
    let cursor = '';
    this.attendeeMap.clear();
    do {
      const data = await invokeApi<{ attendees?: RoomUser[]; cursor?: string }>(
        ApiKeys.GET_SCHEDULED_ATTENDEES,
        { roomID, cursor },
      );
      const attendees = data?.attendees ?? [];
      attendees.forEach((u) => {
        if (!u.userID) return;
        this.attendeeMap.set(u.userID, this.makeParticipant(u, RoomParticipantStatus.Scheduled));
      });
      cursor = data?.cursor ?? '';
    } while (cursor);
  }

  private roomCallStatusToParticipantStatus(callStatus: number): RoomParticipantStatus {
    switch (callStatus) {
      case 1: return RoomParticipantStatus.InCalling;   // Calling  → InCalling
      case 2: return RoomParticipantStatus.CallTimeout; // Timeout  → CallTimeout
      case 3: return RoomParticipantStatus.CallRejected;// Rejected → CallRejected
      default: return RoomParticipantStatus.InCalling;  // None / 未知 → 兜底 InCalling
    }
  }

  /** 参与者列表变更后维护 pending 列表 */
  private updatePendingParticipantList(modifyType: ListModifyType, list: RoomParticipant[]): void {
    switch (modifyType) {
      case ListModifyType.FULL: {
        this.mergePendingParticipants();
        break;
      }
      case ListModifyType.ADD: {
        // 实际加入的成员从 invitation/attendee 中移除
        list.forEach((p) => {
          this.removeInvitationUser(p.userID);
          this.removeAttendeeUser(p.userID);
        });
        break;
      }
      default:
        break;
    }
  }

  /** 添加被邀请成员到 pending（已加入的不重复） */
  private addInvitationUser(participant: RoomParticipant): void {
    if (this.participantMap.has(participant.userID)) return;
    this.invitationMap.set(participant.userID, participant);
    const current = this.pendingParticipantList.value;
    const idx = current.findIndex((p: RoomParticipant) => p.userID === participant.userID);
    if (idx >= 0) {
      const next = current.slice();
      next[idx] = participant;
      this.pendingParticipantList.value = next;
    } else {
      this.pendingParticipantList.value = [...current, participant];
    }
  }

  private removeInvitationUser(userID: string): void {
    if (!this.invitationMap.has(userID)) return;
    this.invitationMap.delete(userID);
    this.pendingParticipantList.value = this.pendingParticipantList.value.filter(
      (p: RoomParticipant) => p.userID !== userID,
    );
  }

  /** 添加预约参会者到 pending（已加入 / 已邀请的不重复） */
  private addAttendeeUser(participant: RoomParticipant): void {
    if (this.participantMap.has(participant.userID)) return;
    if (this.invitationMap.has(participant.userID)) return;
    this.attendeeMap.set(participant.userID, participant);
    const current = this.pendingParticipantList.value;
    const idx = current.findIndex((p: RoomParticipant) => p.userID === participant.userID);
    if (idx >= 0) {
      const next = current.slice();
      next[idx] = participant;
      this.pendingParticipantList.value = next;
    } else {
      this.pendingParticipantList.value = [...current, participant];
    }
  }

  private removeAttendeeUser(userID: string): void {
    if (!this.attendeeMap.has(userID)) return;
    this.attendeeMap.delete(userID);
    this.pendingParticipantList.value = this.pendingParticipantList.value.filter(
      (p: RoomParticipant) => p.userID !== userID,
    );
  }

  /* ============== 参与者列表查询 ============== */
  getParticipantList = async (options: { cursor?: string }): Promise<{
    participantList: RoomParticipant[];
    cursor: string;
  }> => {
    const cursor = options.cursor ?? '';
    const data = await invokeApi<{ participantList?: RoomParticipant[]; cursor?: string }>(
      ApiKeys.GET_PARTICIPANT_LIST,
      { cursor },
    );
    const list = data?.participantList ?? [];
    const nextCursor = data?.cursor ?? '';
    // cursor 为空 → 全量替换；否则增量合并。同步 participantMap 以保持 pending 列表准确
    if (!cursor) {
      this.participantList.value = list;
      this.syncParticipantMap(ListModifyType.FULL, list);
    } else {
      const map = new Map<string, RoomParticipant>();
      this.participantList.value.forEach((p: RoomParticipant) => map.set(p.userID, p));
      list.forEach((p: RoomParticipant) => map.set(p.userID, p));
      this.participantList.value = Array.from(map.values());
      this.syncParticipantMap(ListModifyType.ADD, list);
    }
    this.participantListCursor.value = nextCursor;
    this.participantListWithVideo.value = this.participantList.value.filter(
      (p: RoomParticipant) => p.cameraStatus === DeviceStatus.ON,
    );
    this.participantWithScreen.value =
      this.participantList.value.find((p: RoomParticipant) => p.screenShareStatus === DeviceStatus.ON) ?? null;

    if (!this.isInitParticipantList) {
      const roomID = this.currentRoomID;
      if (roomID) {
        this.isInitParticipantList = true;
        await Promise.all([this.fetchInvitationList(roomID), this.fetchAttendeeList(roomID)]);
      }
    }

    this.mergePendingParticipants();
    return { participantList: list, cursor: nextCursor };
  };

  getAudienceList = async (options: { cursor?: string }): Promise<{ audienceList: RoomUser[]; cursor: string }> => {
    const cursor = options.cursor ?? '';
    const data = await invokeApi<{ audienceList?: RoomUser[]; cursor?: string }>(
      ApiKeys.GET_AUDIENCE_LIST,
      { cursor },
    );
    const list = data?.audienceList ?? [];
    const nextCursor = data?.cursor ?? '';
    this.audienceList.value = list;
    this.audienceListCursor.value = nextCursor;
    return { audienceList: list, cursor: nextCursor };
  };

  searchUsers = async (options: { keyword: string }): Promise<RoomUser[]> => {
    const data = await invokeApi<{ userList?: RoomUser[]; cursor?: string }>(ApiKeys.SEARCH_USER, {
      keyword: options.keyword,
    });
    return data?.userList ?? [];
  };

  /* ============== 角色管理 ============== */
  promoteToParticipant = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.PROMOTE_TO_PARTICIPANT, { userID: options.userID });
  };

  demoteToAudience = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.DEMOTE_TO_AUDIENCE, { userID: options.userID });
  };

  transferOwner = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.TRANSFER_OWNER, { userID: options.userID });
  };

  setAdmin = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.SET_ADMIN, { userID: options.userID });
  };

  revokeAdmin = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.REVOKE_ADMIN, { userID: options.userID });
  };

  kickUser = async (options: { userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.KICK_USER, { userID: options.userID });
  };

  /* ============== 信息更新 ============== */
  updateParticipantNameCard = async (options: { userID: string; nameCard: string }): Promise<void> => {
    await invokeApi(ApiKeys.UPDATE_PARTICIPANT_NAME_CARD, {
      userID: options.userID,
      nameCard: options.nameCard,
    });
  };

  updateParticipantMetaData = async (options: {
    userID: string;
    metaData: Record<string, string>;
  }): Promise<void> => {
    await invokeApi(ApiKeys.UPDATE_PARTICIPANT_META_DATA, {
      userID: options.userID,
      metaData: options.metaData,
    });
  };

  /* ============== 麦克风 ============== */
  muteMicrophone = async (): Promise<void> => {
    await invokeApi(ApiKeys.MUTE_MICROPHONE, '');
  };

  unmuteMicrophone = async (): Promise<void> => {
    await invokeApi(ApiKeys.UNMUTE_MICROPHONE, '');
  };

  /* ============== 远端设备控制 ============== */
  closeParticipantDevice = async (options: { userID: string; device: DeviceType }): Promise<void> => {
    await invokeApi(ApiKeys.CLOSE_PARTICIPANT_DEVICE, {
      userID: options.userID,
      device: options.device,
    });
  };

  disableUserMessage = async (options: { userID: string; disable: boolean }): Promise<void> => {
    await invokeApi(ApiKeys.DISABLE_USER_MESSAGE, {
      userID: options.userID,
      disable: options.disable,
    });
  };

  disableAllDevices = async (options: { device: DeviceType; disable: boolean }): Promise<void> => {
    await invokeApi(ApiKeys.DISABLE_ALL_DEVICES, {
      device: options.device,
      disable: options.disable,
    });
  };

  disableAllMessages = async (options: { disable: boolean }): Promise<void> => {
    await invokeApi(ApiKeys.DISABLE_ALL_MESSAGES, { disable: options.disable });
  };

  /* ============== 设备开启申请 ============== */
  requestToOpenDevice = async (options: { device: DeviceType; timeout?: number }): Promise<void> => {
    await invokeApi(ApiKeys.REQUEST_TO_OPEN_DEVICE, {
      device: options.device,
      timeout: options.timeout ?? 0,
    });
  };

  cancelOpenDeviceRequest = async (options: { device: DeviceType }): Promise<void> => {
    await invokeApi(ApiKeys.CANCEL_OPEN_DEVICE_REQUEST, { device: options.device });
  };

  approveOpenDeviceRequest = async (options: { device: DeviceType; userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.APPROVE_OPEN_DEVICE_REQUEST, {
      device: options.device,
      userID: options.userID,
    });
  };

  rejectOpenDeviceRequest = async (options: { device: DeviceType; userID: string }): Promise<void> => {
    await invokeApi(ApiKeys.REJECT_OPEN_DEVICE_REQUEST, {
      device: options.device,
      userID: options.userID,
    });
  };

  /* ============== 设备开启邀请 ============== */
  inviteToOpenDevice = async (options: {
    userID: string;
    device: DeviceType;
    timeout?: number;
  }): Promise<void> => {
    await invokeApi(ApiKeys.INVITE_TO_OPEN_DEVICE, {
      userID: options.userID,
      device: options.device,
      timeout: options.timeout ?? 0,
    });
  };

  cancelOpenDeviceInvitation = async (options: { userID: string; device: DeviceType }): Promise<void> => {
    await invokeApi(ApiKeys.CANCEL_OPEN_DEVICE_INVITATION, {
      userID: options.userID,
      device: options.device,
    });
  };

  acceptOpenDeviceInvitation = async (options: { userID: string; device: DeviceType }): Promise<void> => {
    await invokeApi(ApiKeys.ACCEPT_OPEN_DEVICE_INVITATION, {
      userID: options.userID,
      device: options.device,
    });
  };

  declineOpenDeviceInvitation = async (options: { userID: string; device: DeviceType }): Promise<void> => {
    await invokeApi(ApiKeys.DECLINE_OPEN_DEVICE_INVITATION, {
      userID: options.userID,
      device: options.device,
    });
  };

  /* ============== 事件订阅 ============== */
  subscribeEvent = <T extends RoomParticipantEvent>(
    event: T | `${T}`,
    handler: RoomParticipantEventHandlers[T],
  ): void => {
    const key = event as RoomParticipantEvent;
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(handler as unknown as Function);
  };

  unsubscribeEvent = <T extends RoomParticipantEvent>(
    event: T | `${T}`,
    handler: RoomParticipantEventHandlers[T],
  ): void => {
    const key = event as RoomParticipantEvent;
    const set = this.listeners.get(key);
    if (!set) return;
    set.delete(handler as unknown as Function);
    if (set.size === 0) this.listeners.delete(key);
  };

  private emit<T extends RoomParticipantEvent>(
    event: T,
    payload: Parameters<RoomParticipantEventHandlers[T]>[0],
  ): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    set.forEach((handler) => {
      try {
        (handler as (p: any) => void)(payload);
      } catch (e) {
        console.error(`[RoomParticipantState] event handler error: ${event}`, e);
      }
    });
  }
}


function ensureSharedInstance(): RoomParticipantStateImpl {
  // @ts-ignore — uni 在 UTS 编译期是 typed class，$roomParticipantState 是运行时挂的字段
  const shared = (uni as any).$roomParticipantState as RoomParticipantStateImpl | undefined;
  if (shared) return shared;
  const created = new RoomParticipantStateImpl();
  // @ts-ignore
  (uni as any).$roomParticipantState = created;
  return created;
}

ensureSharedInstance();

/**
 * 获取 RoomParticipant 状态管理单例。
 *
 * @example
 * import { useRoomParticipantState, RoomParticipantEvent } from 'tuikit-atomic-x';
 *
 * const ps = useRoomParticipantState();
 * ps.subscribeEvent(RoomParticipantEvent.onParticipantJoined, ({ participant }) => {
 *   console.log(`${participant.userName} 加入房间`);
 * });
 */
export function useRoomParticipantState(): IRoomParticipantState {
  reportMetrics('ROOM_PARTICIPANT_STATE');
  reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_ROOM_PARTICIPANT_STATE_COUNT);
  return ensureSharedInstance();
}

export default useRoomParticipantState;
