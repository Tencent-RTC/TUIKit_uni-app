import { ref, onMounted, onUnmounted } from 'vue';
import {
  useRoomState, RoomEvent,
  useRoomParticipantState, RoomParticipantEvent, DeviceType,
  useDeviceState,
  RecordingStopReason,
} from '@/uni_modules/tuikit-atomic-x/state';
import type { DeviceRequestInfo, RoomUser } from '@/uni_modules/tuikit-atomic-x/types';
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
  content: string;
  confirmButton: string;
  cancelButton: string;
  onConfirm: () => void;
  onCancel: () => void;
  key: string;
}

const DIALOG_KEY_ROOM_ENDED = 'room-ended';
const DIALOG_KEY_KICKED_FROM_ROOM = 'kicked-from-room';
const DIALOG_KEY_RECORDING_STARTED = 'recording-started-notice';
const dialogKeyDeviceInvite = (device: DeviceType) => `device-invite-${device}`;

export function useRoomTips(options?: UseRoomTipsOptions) {
  const roomState = useRoomState();
  const roomParticipantState = useRoomParticipantState();
  const { localParticipant } = roomParticipantState;
  const { openLocalCamera, openLocalMicrophone } = useDeviceState();

  const dialogState = ref<RoomDialogState>({
    visible: false,
    title: '',
    content: '',
    confirmButton: '确定',
    cancelButton: '',
    onConfirm: () => {},
    onCancel: () => {},
    key: '',
  });

  type NoticeItem = { key: string; present: () => void };
  const noticeStack: NoticeItem[] = [];

  function showDialog(opts: {
    key: string;
    title: string;
    content?: string;
    confirmButton?: string;
    cancelButton?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) {
    dialogState.value = {
      visible: true,
      title: opts.title,
      content: opts.content || '',
      confirmButton: opts.confirmButton || '确定',
      cancelButton: opts.cancelButton || '',
      key: opts.key,
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
      key: DIALOG_KEY_ROOM_ENDED,
      title: '房间已被销毁',
      onConfirm: () => { options?.onExitConfirmed?.(); },
    });
  }

  function onKickedFromRoom() {
    showDialog({
      key: DIALOG_KEY_KICKED_FROM_ROOM,
      title: '您已被主持人移出房间',
      onConfirm: () => { options?.onExitConfirmed?.(); },
    });
  }

  function removeNotice(key: string) {
    const idx = noticeStack.findIndex(n => n.key === key);
    if (idx >= 0) noticeStack.splice(idx, 1);
  }

  function presentNextNotice() {
    if (noticeStack.length === 0) return;
    setTimeout(() => {
      if (noticeStack.length === 0) return;
      noticeStack[noticeStack.length - 1].present();
    }, 0);
  }

  function dismissIfCurrent(key: string) {
    if (dialogState.value.visible && dialogState.value.key === key) {
      dialogState.value.visible = false;
      presentNextNotice();
    }
  }

  function presentInvite(invitation: DeviceRequestInfo) {
    const isMic = invitation.device === DeviceType.Microphone;
    const name = invitation.senderNameCard || invitation.senderUserName || invitation.senderUserID;
    const title = isMic ? `${name}邀请您开启语音` : `${name}邀请您开启视频画面`;
    const key = dialogKeyDeviceInvite(invitation.device);

    showDialog({
      key,
      title,
      confirmButton: '同意',
      cancelButton: '拒绝',
      onConfirm: async () => {
        removeNotice(key);
        try {
          await roomParticipantState.acceptOpenDeviceInvitation({
            userID: invitation.senderUserID,
            device: invitation.device,
          });
        } catch (e) {
          showErrorToast(e);
          presentNextNotice();
          return;
        }
        presentNextNotice();
      },
      onCancel: async () => {
        removeNotice(key);
        try {
          await roomParticipantState.declineOpenDeviceInvitation({
            userID: invitation.senderUserID,
            device: invitation.device,
          });
        } catch (e) {
          console.warn('[useRoomTips] declineOpenDeviceInvitation fail:', e);
        }
        presentNextNotice();
      },
    });
  }

  function presentRecordingStartedNotice(operator: RoomUser) {
    const name = operator.userName || operator.userID || '';
    showDialog({
      key: DIALOG_KEY_RECORDING_STARTED,
      title: '云端录制中',
      content: `${name}开启了云端录制，房间中的音视频画面、共享屏幕内容将会被录制。如果留在房间中，表示您同意录制。`,
      confirmButton: '我知道了',
      cancelButton: '离开房间',
      onConfirm: () => {
        removeNotice(DIALOG_KEY_RECORDING_STARTED);
        presentNextNotice();
      },
      onCancel: () => {
        removeNotice(DIALOG_KEY_RECORDING_STARTED);
        roomState.leaveRoom().catch(() => {});
        options?.onExitConfirmed?.();
      },
    });
  }

  function onDeviceInvitationReceived(payload: { invitation: DeviceRequestInfo }) {
    const invitation = payload?.invitation;
    if (!invitation) return;

    const isMic = invitation.device === DeviceType.Microphone;
    const isCamera = invitation.device === DeviceType.Camera;
    if (!isMic && !isCamera) return;

    const key = dialogKeyDeviceInvite(invitation.device);
    removeNotice(key);
    noticeStack.push({ key, present: () => presentInvite(invitation) });
    presentInvite(invitation);
  }

  function onDeviceInvitationCancelled(payload: { invitation: DeviceRequestInfo }) {
    const device = payload?.invitation?.device;
    if (device == null) return;
    const key = dialogKeyDeviceInvite(device);
    removeNotice(key);
    dismissIfCurrent(key);
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

  function onRecordingStopped(payload: { operator: RoomUser; reason: RecordingStopReason }) {
    removeNotice(DIALOG_KEY_RECORDING_STARTED);
    dismissIfCurrent(DIALOG_KEY_RECORDING_STARTED);
    if (payload?.reason === RecordingStopReason.RecorderLeftRoom) {
      showToast('云端录制异常中断');
      return;
    }
    if (payload?.reason === RecordingStopReason.StoppedByUser && isSelf(payload?.operator)) return;
    showToast('云端录制已结束');
  }

  function onRecordingStarted(payload: { operator: RoomUser }) {
    const operator = payload?.operator;
    if (!operator || !operator.userID || isSelf(operator)) return;
    removeNotice(DIALOG_KEY_RECORDING_STARTED);
    noticeStack.push({ key: DIALOG_KEY_RECORDING_STARTED, present: () => presentRecordingStartedNotice(operator) });
    presentRecordingStartedNotice(operator);
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
    roomState.subscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted as any);
    roomState.subscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped as any);
  });

  onUnmounted(() => {
    roomState.unsubscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted as any);
    roomState.unsubscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped as any);
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
