/**
 * 房间状态管理。
 *
 * 提供房间生命周期、预约房间、呼叫等能力的统一入口，并通过响应式状态与事件订阅
 * 暴露给业务层使用。
 *
 * @example
 * import { useRoomState, RoomEvent, RoomType } from 'tuikit-atomic-x';
 *
 * const roomState = useRoomState();
 * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call }) => {
 *   console.log(`${call.caller.userName} 邀请加入 ${roomInfo.roomName}`);
 * });
 *
 * await roomState.joinRoom({ roomID: '123456', roomType: RoomType.Standard });
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
// @ts-ignore - UTS module
import { invokeEngineBridgeApi, addEngineBridgeObserver, setFramework, reportMetrics } from '@/uni_modules/tuikit-atomic-x';
import type { IRoomState } from './interface/room';
import {
  CallRejectReason,
  CreateRoomOptions,
  RecordingInfo,
  RecordingStatus,
  RecordingStopReason,
  RoomCall,
  RoomCallResult,
  RoomEvent,
  RoomEventHandlers,
  RoomInfo,
  RoomType,
  RoomUser,
  ScheduleRoomOptions,
  StartRecordingOptions,
  UpdateRoomOptions,
} from '../types/room';
import { roomLifecycle } from './internal/roomLifecycle';
import { KeyMetricsKey, reportKeyMetrics } from './internal/keyMetrics';
// 触发 RoomParticipantState 模块加载，确保其在进/退房广播前完成生命周期自注册。
import './RoomParticipantState';

const COMPONENT_ROOM = 18;
const ApiKeys = {
  // 房间生命周期
  CREATE_AND_JOIN_ROOM: 'roomStore.createAndJoinRoom',
  JOIN_ROOM: 'roomStore.joinRoom',
  LEAVE_ROOM: 'roomStore.leaveRoom',
  END_ROOM: 'roomStore.endRoom',
  UPDATE_ROOM_INFO: 'roomStore.updateRoomInfo',
  GET_ROOM_INFO: 'roomStore.getRoomInfo',

  // 云端录制
  START_RECORDING: 'roomStore.startRecording',
  STOP_RECORDING: 'roomStore.stopRecording',

  // 预约房间
  GET_SCHEDULED_ROOM_LIST: 'roomStore.getScheduledRoomList',
  GET_SCHEDULED_ATTENDEES: 'roomStore.getScheduledAttendees',
  SCHEDULE_ROOM: 'roomStore.scheduleRoom',
  UPDATE_SCHEDULED_ROOM: 'roomStore.updateScheduledRoom',
  ADD_SCHEDULED_ATTENDEES: 'roomStore.addScheduledAttendees',
  REMOVE_SCHEDULED_ATTENDEES: 'roomStore.removeScheduledAttendees',
  CANCEL_SCHEDULED_ROOM: 'roomStore.cancelScheduledRoom',

  // 呼叫
  GET_PENDING_CALLS: 'roomStore.getPendingCalls',
  CALL_USER_TO_ROOM: 'roomStore.callUserToRoom',
  CANCEL_CALL: 'roomStore.cancelCall',
  ACCEPT_CALL: 'roomStore.acceptCall',
  REJECT_CALL: 'roomStore.rejectCall',
} as const;

const EventKeys = {
  ON_CURRENT_ROOM_CHANGED: 'roomState.onCurrentRoomChanged',

  ON_ROOM_ENDED: 'roomListener.onRoomEnded',
  ON_KICKED_FROM_ROOM: 'roomParticipantListener.onKickedFromRoom',
  ON_ADDED_TO_SCHEDULED_ROOM: 'roomListener.onAddedToScheduledRoom',
  ON_REMOVED_FROM_SCHEDULED_ROOM: 'roomListener.onRemovedFromScheduledRoom',
  ON_SCHEDULED_ROOM_CANCELLED: 'roomListener.onScheduledRoomCancelled',
  ON_SCHEDULED_ROOM_STARTING_SOON: 'roomListener.onScheduledRoomStartingSoon',
  ON_CALL_RECEIVED: 'roomListener.onCallReceived',
  ON_CALL_CANCELLED: 'roomListener.onCallCancelled',
  ON_CALL_TIMEOUT: 'roomListener.onCallTimeout',
  ON_CALL_ACCEPTED: 'roomListener.onCallAccepted',
  ON_CALL_REJECTED: 'roomListener.onCallRejected',
  ON_CALL_HANDLED_BY_OTHER_DEVICE: 'roomListener.onCallHandledByOtherDevice',
  ON_CALL_REVOKED_BY_ADMIN: 'roomListener.onCallRevokedByAdmin',
  ON_RECORDING_STARTED: 'roomListener.onRecordingStarted',
  ON_RECORDING_STOPPED: 'roomListener.onRecordingStopped',
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
        reject(new Error(`[RoomState] ${api} failed: code=${code}, message=${message}`));
      }
    });
  });
}

class RoomStateImpl implements IRoomState {
  // 响应式状态
  readonly scheduledRoomList: Ref<RoomInfo[]> = ref<RoomInfo[]>([]);
  readonly scheduledRoomListCursor: Ref<string> = ref<string>('');
  readonly currentRoom: Ref<RoomInfo | null> = ref<RoomInfo | null>(null);

  // 内部事件总线
  private readonly listeners = new Map<RoomEvent, Set<Function>>();
  private observerRegistered = false;

  constructor() {
    this.ensureObserver();
  }

  private ensureObserver(): void {
    if (this.observerRegistered) return;
    this.observerRegistered = true;
    const dispatch = (key: string, jsonData: string) => {
      this.handleEvent(key, jsonData);
    };
    // @ts-ignore
    addEngineBridgeObserver('RoomState', dispatch);
  }

  private handleEvent(key: string, jsonData: string): void {
    const payload = safeParse<Record<string, any>>(jsonData) || {};

    switch (key) {
      case EventKeys.ON_CURRENT_ROOM_CHANGED: {
        // 仅同步当前房间到响应式状态，不参与进/退房编排（进/退房广播由主动调用路径触发）。
        const next = payload.currentRoom as RoomInfo | null;
        this.currentRoom.value = next ? this.mergeCurrentRoom(next) : null;
        break;
      }
      case EventKeys.ON_ROOM_ENDED: {
        // 被动离房：派发业务事件后广播 didLeaveRoom，触发子 state 清理。
        const roomInfo = payload.roomInfo as RoomInfo;
        this.emit(RoomEvent.onRoomEnded, { roomInfo });
        const prevRoomID = (payload.roomID as string | undefined) ?? this.currentRoom.value?.roomID ?? '';
        this.currentRoom.value = null;
        roomLifecycle.didLeaveRoom(prevRoomID);
        break;
      }
      case EventKeys.ON_KICKED_FROM_ROOM: {
        const roomInfo = payload.roomInfo as RoomInfo;
        const prevRoomID = (payload.roomID as string | undefined) ?? this.currentRoom.value?.roomID ?? '';
        this.currentRoom.value = null;
        roomLifecycle.didLeaveRoom(prevRoomID);
        break;
      }
      case EventKeys.ON_ADDED_TO_SCHEDULED_ROOM: {
        this.emit(RoomEvent.onAddedToScheduledRoom, { roomInfo: payload.roomInfo as RoomInfo });
        break;
      }
      case EventKeys.ON_REMOVED_FROM_SCHEDULED_ROOM: {
        this.emit(RoomEvent.onRemovedFromScheduledRoom, {
          roomInfo: payload.roomInfo as RoomInfo,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_SCHEDULED_ROOM_CANCELLED: {
        const roomInfo = payload.roomInfo as RoomInfo;
        // 当前已加入的房间被取消时吞掉事件，离房由 onRoomEnded 触发。
        if (this.currentRoom.value?.roomID !== roomInfo.roomID) {
          this.emit(RoomEvent.onScheduledRoomCancelled, {
            roomInfo,
            operator: payload.operator as RoomUser,
          });
        }
        break;
      }
      case EventKeys.ON_SCHEDULED_ROOM_STARTING_SOON: {
        this.emit(RoomEvent.onScheduledRoomStartingSoon, { roomInfo: payload.roomInfo as RoomInfo });
        break;
      }
      case EventKeys.ON_CALL_RECEIVED: {
        this.emit(RoomEvent.onCallReceived, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
          extensionInfo: payload.extensionInfo as string,
        });
        break;
      }
      case EventKeys.ON_CALL_CANCELLED: {
        this.emit(RoomEvent.onCallCancelled, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
        });
        break;
      }
      case EventKeys.ON_CALL_TIMEOUT: {
        this.emit(RoomEvent.onCallTimeout, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
        });
        break;
      }
      case EventKeys.ON_CALL_ACCEPTED: {
        this.emit(RoomEvent.onCallAccepted, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
        });
        break;
      }
      case EventKeys.ON_CALL_REJECTED: {
        this.emit(RoomEvent.onCallRejected, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
          reason: payload.reason as CallRejectReason,
        });
        break;
      }
      case EventKeys.ON_CALL_HANDLED_BY_OTHER_DEVICE: {
        this.emit(RoomEvent.onCallHandledByOtherDevice, {
          roomInfo: payload.roomInfo as RoomInfo,
          isAccepted: payload.isAccepted as boolean,
        });
        break;
      }
      case EventKeys.ON_CALL_REVOKED_BY_ADMIN: {
        this.emit(RoomEvent.onCallRevokedByAdmin, {
          roomInfo: payload.roomInfo as RoomInfo,
          call: payload.call as RoomCall,
          operator: payload.operator as RoomUser,
        });
        break;
      }
      case EventKeys.ON_RECORDING_STARTED: {
        const roomInfo = payload.roomInfo as RoomInfo;
        const operator = payload.operator as RoomUser;
        const cur = this.currentRoom.value;
        if (cur && cur.roomID === roomInfo.roomID) {
          this.currentRoom.value = { ...cur, recordingInfo: roomInfo.recordingInfo };
        }
        this.emit(RoomEvent.onRecordingStarted, { roomInfo, operator });
        break;
      }
      case EventKeys.ON_RECORDING_STOPPED: {
        const roomInfo = payload.roomInfo as RoomInfo;
        const operator = payload.operator as RoomUser;
        const reason = payload.reason as RecordingStopReason;
        const cur = this.currentRoom.value;
        if (cur && cur.roomID === roomInfo.roomID) {
          this.currentRoom.value = { ...cur, recordingInfo: roomInfo.recordingInfo };
        }
        this.emit(RoomEvent.onRecordingStopped, { roomInfo, operator, reason });
        break;
      }
      default:
        break;
    }
  }

  /** 合并新的 roomInfo 到 currentRoom，保留旧的预约相关字段。 */
  private mergeCurrentRoom(source: RoomInfo): RoomInfo {
    const old = this.currentRoom.value;
    if (!old) return source;
    return {
      ...source,
      scheduledStartTime: old.scheduledStartTime,
      scheduledEndTime: old.scheduledEndTime,
      scheduleAttendees: old.scheduleAttendees,
    };
  }

  /* ============== 预约房间 ============== */
  getScheduledRoomList = async (options: { cursor: string }): Promise<{ scheduledRoomList: RoomInfo[]; cursor: string }> => {
    const data = await invokeApi<{ scheduledRoomList?: RoomInfo[]; cursor?: string }>(
      ApiKeys.GET_SCHEDULED_ROOM_LIST,
      { cursor: options.cursor },
    );
    const list = data?.scheduledRoomList ?? [];
    const cursor = data?.cursor ?? '';
    if (!options.cursor) {
      this.scheduledRoomList.value = list;
    } else {
      const existing = new Set(this.scheduledRoomList.value.map((r: RoomInfo) => r.roomID));
      this.scheduledRoomList.value = [
        ...this.scheduledRoomList.value,
        ...list.filter((r: RoomInfo) => !existing.has(r.roomID)),
      ];
    }
    this.scheduledRoomListCursor.value = cursor;
    return { scheduledRoomList: list, cursor };
  };

  getScheduledAttendees = async (options: { roomID: string; cursor: string }): Promise<{
    attendees: RoomUser[];
    cursor: string;
    totalAttendeesCount: number;
  }> => {
    const data = await invokeApi<{ attendees?: RoomUser[]; cursor?: string; totalAttendeesCount?: number }>(
      ApiKeys.GET_SCHEDULED_ATTENDEES,
      { roomID: options.roomID, cursor: options.cursor },
    );
    return {
      attendees: data?.attendees ?? [],
      cursor: data?.cursor ?? '',
      totalAttendeesCount: data?.totalAttendeesCount ?? 0,
    };
  };

  scheduleRoom = async (options: { roomID: string; options: ScheduleRoomOptions }): Promise<void> => {
    await invokeApi(ApiKeys.SCHEDULE_ROOM, { roomID: options.roomID, options: options.options });
  };

  updateScheduledRoom = async (options: { roomID: string; options: ScheduleRoomOptions }): Promise<void> => {
    await invokeApi(ApiKeys.UPDATE_SCHEDULED_ROOM, { roomID: options.roomID, options: options.options });
  };

  addScheduledAttendees = async (options: { roomID: string; userIDList: string[] }): Promise<void> => {
    await invokeApi(ApiKeys.ADD_SCHEDULED_ATTENDEES, {
      roomID: options.roomID,
      userIDList: options.userIDList,
    });
  };

  removeScheduledAttendees = async (options: { roomID: string; userIDList: string[] }): Promise<void> => {
    await invokeApi(ApiKeys.REMOVE_SCHEDULED_ATTENDEES, {
      roomID: options.roomID,
      userIDList: options.userIDList,
    });
  };

  cancelScheduledRoom = async (options: { roomID: string }): Promise<void> => {
    await invokeApi(ApiKeys.CANCEL_SCHEDULED_ROOM, { roomID: options.roomID });
  };

  /* ============== 房间生命周期 ============== */
  createAndJoinRoom = async (options: {
    roomID: string;
    roomType?: RoomType;
    options: CreateRoomOptions;
  }): Promise<void> => {
    setFramework(COMPONENT_ROOM);
    reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_API_CREATE_ROOM_COUNT);
    // 进房前广播 beforeEnterRoom：子 state 据此绑定 roomID 并注册底层 observer。
    // 进房失败不广播 didLeaveRoom：未真正进入房间，无需触发子 state 清理。
    roomLifecycle.beforeEnterRoom(options.roomID);
    const data = await invokeApi<{ roomInfo: RoomInfo }>(ApiKeys.CREATE_AND_JOIN_ROOM, {
      roomID: options.roomID,
      roomType: options.roomType ?? RoomType.Standard,
      options: options.options,
    });
    // 先落地 currentRoom，再广播 afterEnterRoom，让子 state 拿到最新 currentRoom。
    this.currentRoom.value = this.mergeCurrentRoom(data!.roomInfo);
    roomLifecycle.afterEnterRoom(this.currentRoom.value!);
  };

  joinRoom = async (options: { roomID: string; roomType?: RoomType; password?: string }): Promise<void> => {
    setFramework(COMPONENT_ROOM);
    reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_API_JOIN_ROOM_COUNT);
    roomLifecycle.beforeEnterRoom(options.roomID);
    const innerOptions: Record<string, any> = {};
    if (options.password) innerOptions.password = options.password;
    const data = await invokeApi<{ roomInfo: RoomInfo }>(ApiKeys.JOIN_ROOM, {
      roomID: options.roomID,
      roomType: options.roomType ?? RoomType.Standard,
      options: innerOptions,
    });
    this.currentRoom.value = this.mergeCurrentRoom(data!.roomInfo);
    roomLifecycle.afterEnterRoom(this.currentRoom.value!);
  };

  leaveRoom = async (): Promise<void> => {
    const prevRoomID = this.currentRoom.value?.roomID ?? '';
    await invokeApi(ApiKeys.LEAVE_ROOM, '');
    this.currentRoom.value = null;
    roomLifecycle.didLeaveRoom(prevRoomID);
  };

  endRoom = async (): Promise<void> => {
    const prevRoomID = this.currentRoom.value?.roomID ?? '';
    await invokeApi(ApiKeys.END_ROOM, '');
    this.currentRoom.value = null;
    roomLifecycle.didLeaveRoom(prevRoomID);
  };

  updateRoomInfo = async (options: { roomID: string; options: UpdateRoomOptions }): Promise<void> => {
    const KEY_TO_FLAG: Record<keyof UpdateRoomOptions, number> = {
      roomName: 1 << 3,
      password: 1 << 13,
    };
    let modifyFlag = 0;
    for (const key of Object.keys(options.options) as (keyof UpdateRoomOptions)[]) {
      if (options.options[key] !== undefined) {
        modifyFlag |= KEY_TO_FLAG[key];
      }
    }
    if (modifyFlag === 0) return;
    await invokeApi(ApiKeys.UPDATE_ROOM_INFO, {
      roomID: options.roomID,
      options: options.options,
      modifyFlag,
    });
  };

  getRoomInfo = async (options: { roomID: string }): Promise<RoomInfo> => {
    const data = await invokeApi<{ roomInfo: RoomInfo }>(ApiKeys.GET_ROOM_INFO, { roomID: options.roomID });
    return data!.roomInfo;
  };

  startRecording = async (options?: { options?: StartRecordingOptions }): Promise<void> => {
    reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_API_START_RECORDING_COUNT);
    await invokeApi(ApiKeys.START_RECORDING, { options: options?.options ?? {} });
  };

  stopRecording = async (): Promise<void> => {
    reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_API_STOP_RECORDING_COUNT);
    await invokeApi(ApiKeys.STOP_RECORDING, '');
  };

  /* ============== 呼叫 ============== */
  getPendingCalls = async (options: { roomID: string; cursor: string }): Promise<{
    calls: RoomCall[];
    cursor: string;
  }> => {
    const data = await invokeApi<{ calls?: RoomCall[]; cursor?: string }>(ApiKeys.GET_PENDING_CALLS, {
      roomID: options.roomID,
      cursor: options.cursor,
    });
    return {
      calls: data?.calls ?? [],
      cursor: data?.cursor ?? '',
    };
  };

  callUserToRoom = async (options: {
    roomID: string;
    userIDList: string[];
    timeout?: number;
    extensionInfo?: string;
  }): Promise<Map<string, RoomCallResult>> => {
    const data = await invokeApi<{ results?: Record<string, RoomCallResult> }>(ApiKeys.CALL_USER_TO_ROOM, {
      roomID: options.roomID,
      userIDList: options.userIDList,
      timeout: options.timeout ?? 30,
      extensionInfo: options.extensionInfo ?? '',
    });
    const result = new Map<string, RoomCallResult>();
    const raw = data?.results ?? {};
    Object.keys(raw).forEach((userID) => {
      result.set(userID, raw[userID]);
    });
    return result;
  };

  cancelCall = async (options: { roomID: string; userIDList: string[] }): Promise<void> => {
    await invokeApi(ApiKeys.CANCEL_CALL, {
      roomID: options.roomID,
      userIDList: options.userIDList,
    });
  };

  acceptCall = async (options: { roomID: string }): Promise<void> => {
    // 仅透传底层接受呼叫；底层进房后通过 ON_CURRENT_ROOM_CHANGED 同步 currentRoom。
    await invokeApi(ApiKeys.ACCEPT_CALL, { roomID: options.roomID });
  };

  rejectCall = async (options: { roomID: string; extensionInfo?: string }): Promise<void> => {
    await invokeApi(ApiKeys.REJECT_CALL, {
      roomID: options.roomID,
      extensionInfo: options.extensionInfo ?? '',
    });
  };

  /* ============== 事件订阅 ============== */
  subscribeEvent = <T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void => {
    const key = event as RoomEvent;
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(handler as unknown as Function);
  };

  unsubscribeEvent = <T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void => {
    const key = event as RoomEvent;
    const set = this.listeners.get(key);
    if (!set) return;
    set.delete(handler as unknown as Function);
    if (set.size === 0) this.listeners.delete(key);
  };

  private emit<T extends RoomEvent>(event: T, payload: Parameters<RoomEventHandlers[T]>[0]): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    set.forEach((handler) => {
      try {
        (handler as (p: any) => void)(payload);
      } catch (e) {
        console.error(`[RoomState] event handler error: ${event}`, e);
      }
    });
  }
}

let _instance: IRoomState | null = null;

/**
 * 获取 Room 状态管理单例。
 *
 * @example
 * import { useRoomState, RoomEvent } from 'tuikit-atomic-x';
 *
 * const roomState = useRoomState();
 * roomState.subscribeEvent(RoomEvent.onRoomEnded, ({ roomInfo }) => {
 *   console.log('房间已结束', roomInfo.roomID);
 * });
 */
export function useRoomState(): IRoomState {
  if (!_instance) {
    _instance = new RoomStateImpl();
  }
  reportMetrics('ROOM_STATE');
  reportKeyMetrics(KeyMetricsKey.T_METRICS_STATE_ROOM_STATE_COUNT);
  return _instance;
}

export default useRoomState;


