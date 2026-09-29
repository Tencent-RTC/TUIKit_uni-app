import { watch } from 'vue';
import { useRoomState, RoomEvent, useDeviceState, DeviceStatus } from '../state';
import { startForegroundService, stopForegroundService } from "@/uni_modules/tuikit-atomic-x";

declare const uni: any;
declare function getCurrentPages(): any[];

export const INVITATION_PAGE = '/pages/scenes/room/join/invitation/index';

export const ROOM_MAIN_PAGE = '/pages/scenes/room/meeting/index';

export const INVITATION_CLOSE_EVENT = 'invitationClosed';


function getInitialized(): boolean {
  return (uni as any).$roomCallServiceInitialized === true;
}

function setInitialized(): void {
  (uni as any).$roomCallServiceInitialized = true;
}

export function getPendingInviteRoomID(): string {
  return ((uni as any).$roomPendingInviteRoomID as string | undefined) ?? '';
}

function setPendingInviteRoomID(roomID: string): void {
  (uni as any).$roomPendingInviteRoomID = roomID;
}

export function clearPendingInvite(): void {
  setPendingInviteRoomID('');
}

function currentRoute(): string {
  const pages = getCurrentPages();
  if (!pages || pages.length === 0) return '';
  return '/' + (pages[pages.length - 1] as any).route;
}

function notifyInviteClose(roomID: string): void {
  const pending = getPendingInviteRoomID();
  if (pending.length === 0 || pending !== roomID) return;
  setPendingInviteRoomID('');
  uni.$emit(INVITATION_CLOSE_EVENT, { roomID });
}

export function initRoomCallService(): void {
  if (getInitialized()) return;
  setInitialized();

  const roomState = useRoomState();
  const { microphoneStatus } = useDeviceState();

  const startForegroundServiceSafely = (): void => {
    try {
      startForegroundService();
    } catch (e) {
      console.warn('[RoomCallService] startForegroundService error:', e);
    }
  };

  let _isForeground = true;
  let _pendingStart = false;

  uni.onAppHide?.(() => {
    _isForeground = false;
  });

  uni.onAppShow?.(() => {
    _isForeground = true;
    if (!_pendingStart) return;
    _pendingStart = false;
    if (!roomState.currentRoom.value?.roomID) return;
    if (microphoneStatus.value !== DeviceStatus.ON) return;
    console.log('[RoomCallService] app foreground, start deferred foreground service');
    stopForegroundService();
    startForegroundServiceSafely();
  });

  const autoReject = (roomID: string, reason: string): void => {
    console.warn(`[RoomCallService] auto reject invite (${reason}):`, roomID);
    roomState.rejectCall({ roomID }).catch((e: any) => {
      console.warn('[RoomCallService] auto reject failed:', e);
    });
  };

  roomState.subscribeEvent(RoomEvent.onCallReceived, ((opt: any): void => {
    const roomInfo = opt?.roomInfo;
    const call = opt?.call;
    const roomID = roomInfo?.roomID;
    if (typeof roomID !== 'string' || roomID.length === 0) return;

    if (currentRoute() === ROOM_MAIN_PAGE) {
      autoReject(roomID, 'already in room');
      return;
    }

    const pending = getPendingInviteRoomID();
    if (pending.length > 0) {
      if (pending === roomID) return;
      autoReject(roomID, `busy with pending invite ${pending}`);
      return;
    }

    setPendingInviteRoomID(roomID);

    const caller = call?.caller;
    const owner = roomInfo?.roomOwner;
    const count = typeof roomInfo?.participantCount === 'number' ? roomInfo.participantCount : 0;
    const q = [
      `roomID=${encodeURIComponent(roomID)}`,
      `roomName=${encodeURIComponent(roomInfo?.roomName ?? '')}`,
      `callerName=${encodeURIComponent(caller?.userName ?? caller?.userID ?? '')}`,
      `callerAvatar=${encodeURIComponent(caller?.avatarURL ?? '')}`,
      `ownerName=${encodeURIComponent(owner?.userName ?? owner?.userID ?? '')}`,
      `participantCount=${count}`,
    ].join('&');

    uni.navigateTo({
      url: `${INVITATION_PAGE}?${q}`,
      fail: (err: any) => {
        console.error('[RoomCallService] navigateTo invite page failed:', err);
        setPendingInviteRoomID('');
        autoReject(roomID, 'navigateTo invite page failed');
      },
    });
  }) as any);

  roomState.subscribeEvent(RoomEvent.onCallCancelled, ((opt: any): void => {
    notifyInviteClose(opt?.roomInfo?.roomID);
  }) as any);

  roomState.subscribeEvent(RoomEvent.onCallTimeout, ((opt: any): void => {
    notifyInviteClose(opt?.roomInfo?.roomID);
  }) as any);

  roomState.subscribeEvent(RoomEvent.onCallRevokedByAdmin, ((opt: any): void => {
    notifyInviteClose(opt?.roomInfo?.roomID);
  }) as any);

  roomState.subscribeEvent(RoomEvent.onCallHandledByOtherDevice, ((opt: any): void => {
    notifyInviteClose(opt?.roomInfo?.roomID);
  }) as any);

  watch(
    () => roomState.currentRoom.value?.roomID ?? '',
    (newRoomID: string, oldRoomID: string) => {
      if (!newRoomID && oldRoomID) {
        console.log('[RoomCallService] leave room, stopForegroundService, prevRoomID:', oldRoomID);
        stopForegroundService();
      } else if (newRoomID && oldRoomID && newRoomID !== oldRoomID) {
        console.log('[RoomCallService] switch room, stopForegroundService:', oldRoomID, '->', newRoomID);
        stopForegroundService();
      }
    }
  );

  watch(
    () => microphoneStatus.value,
    (status: DeviceStatus) => {
      if (status !== DeviceStatus.ON) return;
      if (!roomState.currentRoom.value?.roomID) return;
      if (!_isForeground) {
        console.log('[RoomCallService] microphone ON but app in background, defer foreground service');
        _pendingStart = true;
        return;
      }
      console.log('[RoomCallService] microphone ON, restart foreground service');
      stopForegroundService();
      startForegroundServiceSafely();
    }
  );
}
