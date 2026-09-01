import { useRoomState, RoomEvent } from '../state';

declare const uni: any;
declare function getCurrentPages(): any[];

export const ROOM_INVITE_PAGE = '/pages/scenes/room/roomInvite/index';

export const ROOM_MAIN_PAGE = '/pages/scenes/room/main/index';

export const ROOM_INVITE_CLOSE_EVENT = 'roomInviteClosed';


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
  uni.$emit(ROOM_INVITE_CLOSE_EVENT, { roomID });
}

export function initRoomCallService(): void {
  if (getInitialized()) return;
  setInitialized();

  const roomState = useRoomState();

  /**
   * 忙线自动拒绝：当前已在会议中 / 已有另一个邀请待处理时，直接替用户拒掉新邀请，
   * 让主叫端立刻收到 onCallRejected，而不是让呼叫一直挂到超时。
   */
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

    // 已在会中 → 自动拒绝（不打断当前会议）
    if (currentRoute() === ROOM_MAIN_PAGE) {
      autoReject(roomID, 'already in room');
      return;
    }

    const pending = getPendingInviteRoomID();
    if (pending.length > 0) {
      // 同一房间的重复推送：邀请页已在展示，静默忽略，不能把自己的邀请拒掉
      if (pending === roomID) return;
      // 另一个房间的新邀请 → 自动拒绝（当前只支持同时处理一个邀请）
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
      url: `${ROOM_INVITE_PAGE}?${q}`,
      fail: (err: any) => {
        console.error('[RoomCallService] navigateTo invite page failed:', err);
        setPendingInviteRoomID('');
        // 邀请页打不开，用户无从选择 → 拒掉，避免主叫端一直挂到超时
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
}
