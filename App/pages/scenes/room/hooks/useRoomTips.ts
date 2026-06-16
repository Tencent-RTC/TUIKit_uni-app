import { ref, onMounted, onUnmounted } from 'vue';
import {
  useRoomState, RoomEvent,
  useRoomParticipantState, RoomParticipantEvent, DeviceType,
  useDeviceState,
} from '@/uni_modules/tuikit-atomic-x/state';
import type { DeviceRequestInfo } from '@/uni_modules/tuikit-atomic-x/types';
import { showToast } from '@/uni_modules/tuikit-atomic-x/utils/toast';
import { showErrorToast } from '../utils/errorHandler';

export interface UseRoomTipsOptions {
  onExitConfirmed?: () => void;
  onOwnerChanged?: () => void;
  onDemotedToAudience?: () => void;
}

export interface RoomDialogState {
  visible: boolean;
  title: string;
  confirmButton: string;
  cancelButton: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useRoomTips(options?: UseRoomTipsOptions) {
  const roomState = useRoomState();
  const roomParticipantState = useRoomParticipantState();
  const { localParticipant } = roomParticipantState;
  const { openLocalCamera, openLocalMicrophone } = useDeviceState();

  const dialogState = ref<RoomDialogState>({
    visible: false,
    title: '',
    confirmButton: '确定',
    cancelButton: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const inviteStack: DeviceRequestInfo[] = [];

  function showDialog(opts: {
    title: string;
    confirmButton?: string;
    cancelButton?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) {
    dialogState.value = {
      visible: true,
      title: opts.title,
      confirmButton: opts.confirmButton || '确定',
      cancelButton: opts.cancelButton || '',
      onConfirm: () => {
        dialogState.value.visible = false;
        opts.onConfirm?.();
      },
      onCancel: () => {
        dialogState.value.visible = false;
        opts.onCancel?.();
      },
    };
  }

  function isSelf(u: { userID?: string } | null | undefined): boolean {
    if (!u || !u.userID) return false;
    return u.userID === localParticipant.value?.userID;
  }

  function onRoomEnded() {
    showDialog({
      title: '房间已被销毁',
      onConfirm: () => { options?.onExitConfirmed?.(); },
    });
  }

  function onKickedFromRoom() {
    showDialog({
      title: '您已被主持人移出房间',
      onConfirm: () => { options?.onExitConfirmed?.(); },
    });
  }

  function presentInvite(invitation: DeviceRequestInfo) {
    const isMic = invitation.device === DeviceType.Microphone;
    const name = invitation.senderNameCard || invitation.senderUserName || invitation.senderUserID;
    const title = isMic ? `${name}邀请您开启语音` : `${name}邀请您开启视频画面`;

    showDialog({
      title,
      confirmButton: '同意',
      cancelButton: '拒绝',
      onConfirm: async () => {
        removeInvite(invitation.device);
        try {
          await roomParticipantState.acceptOpenDeviceInvitation({
            userID: invitation.senderUserID,
            device: invitation.device,
          });
        } catch (e) {
          showErrorToast(e);
          presentNextInvite();
          return;
        }
        presentNextInvite();
      },
      onCancel: async () => {
        removeInvite(invitation.device);
        try {
          await roomParticipantState.declineOpenDeviceInvitation({
            userID: invitation.senderUserID,
            device: invitation.device,
          });
        } catch (e) {
          // 静默：用户主动拒绝，失败也无需提示
          console.warn('[useRoomTips] declineOpenDeviceInvitation fail:', e);
        }
        presentNextInvite();
      },
    });
  }

  function removeInvite(device: DeviceType) {
    const idx = inviteStack.findIndex(it => it.device === device);
    if (idx >= 0) inviteStack.splice(idx, 1);
  }

  function presentNextInvite() {
    if (inviteStack.length === 0) return;
    setTimeout(() => {
      if (inviteStack.length === 0) return;
      presentInvite(inviteStack[inviteStack.length - 1]);
    }, 0);
  }

  function onDeviceInvitationReceived(payload: { invitation: DeviceRequestInfo }) {
    const invitation = payload?.invitation;
    if (!invitation) return;

    const isMic = invitation.device === DeviceType.Microphone;
    const isCamera = invitation.device === DeviceType.Camera;
    if (!isMic && !isCamera) return;

    removeInvite(invitation.device);
    inviteStack.push(invitation);
    presentInvite(invitation);
  }

  function onDeviceInvitationCancelled(payload: { invitation: DeviceRequestInfo }) {
    const device = payload?.invitation?.device;
    if (device == null) return;
    const top = inviteStack[inviteStack.length - 1];
    if (top && top.device === device) {
      dialogState.value.visible = false;
      inviteStack.pop();
      presentNextInvite();
    } else {
      removeInvite(device);
    }
  }

  function onDeviceInvitationTimeout(payload: { invitation: DeviceRequestInfo }) {
    onDeviceInvitationCancelled(payload);
  }

  function onParticipantDeviceClosed(payload: { device: DeviceType; operator: { userName?: string } }) {
    const opName = payload?.operator?.userName || '管理员';
    switch (payload?.device) {
      case DeviceType.Microphone:
        showToast(`${opName}已关闭您的麦克风`);
        break;
      case DeviceType.Camera:
        showToast(`${opName}已关闭您的摄像头`);
        break;
      default:
        break;
    }
  }

  function onAllDevicesDisabled(payload: { device: DeviceType; disable: boolean }) {
    if (payload.device === DeviceType.Microphone) {
      if (payload.disable) {
        showToast('已静音所有成员，麦克风已禁用');
      } else {
        showToast('已允许成员开启麦克风');
      }
    } else if (payload.device === DeviceType.Camera) {
      if (payload.disable) {
        showToast('已关闭所有成员视频，摄像头已禁用');
      } else {
        showToast('已允许成员开启视频');
      }
    }
  }

  function onOwnerChanged(payload: { newOwner: any; oldOwner: any }) {
    if (isSelf(payload?.newOwner)) {
      showToast('您已成为房主');
    }
    options?.onOwnerChanged?.();
  }

  function onAdminSet(payload: { userInfo: any }) {
    if (isSelf(payload?.userInfo)) showToast('您已成为管理员');
  }

  function onAdminRevoked(payload: { userInfo: any }) {
    if (isSelf(payload?.userInfo)) showToast('您的管理员身份被收回');
  }

  function onUserMessageDisabled(payload: { disable: boolean; operator: any }) {
    showToast(payload?.disable ? '您已被禁止文字聊天' : '您已被允许文字聊天');
  }

  function onAudiencePromotedToParticipant(payload: { userInfo: any }) {
    const u = payload?.userInfo;
    if (!u) return;
    if (isSelf(u)) {
      showToast('您已被设为嘉宾');
    } else {
      const name = u.userName || u.userID || '';
      showToast(`${name}已被设为嘉宾`);
    }
  }

  function onParticipantDemotedToAudience(payload: { userInfo: any }) {
    if (isSelf(payload?.userInfo)) {
      options?.onDemotedToAudience?.();
    }
  }

  onMounted(() => {
    roomState.subscribeEvent(RoomEvent.onRoomEnded, onRoomEnded);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onUserMessageDisabled, onUserMessageDisabled as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant as any);
    roomParticipantState.subscribeEvent(RoomParticipantEvent.onParticipantDemotedToAudience, onParticipantDemotedToAudience as any);
  });

  onUnmounted(() => {
    roomState.unsubscribeEvent(RoomEvent.onRoomEnded, onRoomEnded);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onUserMessageDisabled, onUserMessageDisabled as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant as any);
    roomParticipantState.unsubscribeEvent(RoomParticipantEvent.onParticipantDemotedToAudience, onParticipantDemotedToAudience as any);
  });

  return { dialogState };
}
