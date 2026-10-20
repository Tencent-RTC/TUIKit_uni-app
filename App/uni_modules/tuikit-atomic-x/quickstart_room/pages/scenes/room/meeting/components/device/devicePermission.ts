import { computed, type ComputedRef } from 'vue';
import {
  useRoomState,
  RoomType,
  useRoomParticipantState,
  RoomParticipantRole,
  useLoginState,
  type RoomParticipant,
} from '@/uni_modules/tuikit-atomic-x/state';

export function useIsLocalParticipantReady(): ComputedRef<boolean> {
  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();

  return computed(() => {
    const roomInfo = currentRoom.value;
    if (!roomInfo) return false;
    const localUserID = loginUserInfo.value?.userID ?? '';
    if (localUserID.length === 0) return false;
    if (roomInfo.roomOwner.userID === localUserID) return true;
    const members: RoomParticipant[] = participantList.value;
    for (let i = 0; i < members.length; i++) {
      if (members[i].userID === localUserID) return true;
    }
    return false;
  });
}

function isLocalRoomOwner(): boolean {
  const { currentRoom } = useRoomState();
  const roomInfo = currentRoom.value;
  if (!roomInfo) return false;
  const { loginUserInfo } = useLoginState();
  const localUserID = loginUserInfo.value?.userID ?? '';
  return localUserID.length > 0 && roomInfo.roomOwner.userID === localUserID;
}

export function canOpenCamera(): boolean {
  const { currentRoom } = useRoomState();
  const roomInfo = currentRoom.value;
  if (!roomInfo) return false;
  if (isLocalRoomOwner()) return true;
  const { localParticipant } = useRoomParticipantState();
  if (roomInfo.roomType === RoomType.Standard && localParticipant.value?.role === RoomParticipantRole.Admin) {
    return true;
  }
  return !roomInfo.isAllCameraDisabled;
}

export function canOpenMicrophone(): boolean {
  const { currentRoom } = useRoomState();
  const roomInfo = currentRoom.value;
  if (!roomInfo) return false;
  if (isLocalRoomOwner()) return true;
  const { localParticipant } = useRoomParticipantState();
  if (localParticipant.value?.role === RoomParticipantRole.Admin) return true;
  return !roomInfo.isAllMicrophoneDisabled;
}
