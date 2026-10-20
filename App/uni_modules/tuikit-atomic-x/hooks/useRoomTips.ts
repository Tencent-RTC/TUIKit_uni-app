import { ref, onMounted, onUnmounted } from 'vue';
import {
  useRoomState, RoomEvent,
  useRoomParticipantState, RoomParticipantEvent, DeviceType,
  useDeviceState,
  RecordingStopReason,
} from '@/uni_modules/tuikit-atomic-x/state';
import type {
  DeviceRequestInfo,
  RoomUser,
} from '@/uni_modules/tuikit-atomic-x/types';
import {
  KickedOutOfRoomReason,
} from '@/uni_modules/tuikit-atomic-x/types';
import { showToast } from '@/uni_modules/tuikit-atomic-x/utils/toast';
import { showErrorToast } from '@/uni_modules/tuikit-atomic-x/utils/roomErrorHandler';
import { t } from '@/uni_modules/tuikit-atomic-x/components/locales';

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
  closeOnClickMask: boolean;
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
    confirmButton: t('RoomCommon.GotIt'),
    cancelButton: '',
    onConfirm: () => {},
    onCancel: () => {},
    key: '',
    closeOnClickMask: true,
  });

  type NoticeItem = { key: string; present: () => void };
  const noticeStack: NoticeItem[] = [];

  function showDialog(opts: {
    key: string;
    title: string;
    content?: string;
    confirmButton?: string;
    cancelButton?: string;
    closeOnClickMask?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) {
    dialogState.value = {
      visible: true,
      title: opts.title,
      content: opts.content || '',
      confirmButton: opts.confirmButton || t('RoomCommon.GotIt'),
      cancelButton: opts.cancelButton || '',
      key: opts.key,
      closeOnClickMask: opts.closeOnClickMask !== false,
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
      title: t('RoomNotifications.Title'),
      content: t('Room.RoomEnded'),
      closeOnClickMask: false,
      onConfirm: () => { options?.onExitConfirmed?.(); },
      onCancel: () => { options?.onExitConfirmed?.(); },
    });
  }

  function resolveKickedMessage(reason: KickedOutOfRoomReason): string {
    switch (reason) {
      case KickedOutOfRoomReason.KickedByAdmin:
        return t('RoomNotifications.KickedByAdmin');
      case KickedOutOfRoomReason.ReplacedByAnotherDevice:
        return t('RoomNotifications.ReplacedByAnotherDevice');
      case KickedOutOfRoomReason.KickedByServer:
        return t('RoomNotifications.KickedByServer');
      case KickedOutOfRoomReason.ConnectionTimeout:
        return t('RoomNotifications.ConnectionTimeout');
      case KickedOutOfRoomReason.InvalidStatusOnReconnect:
        return t('RoomNotifications.InvalidStatusOnReconnect');
      case KickedOutOfRoomReason.RoomLimitExceeded:
        return t('RoomNotifications.RoomLimitExceeded');
      default:
        return t('RoomNotifications.DefaultKickedOut');
    }
  }

  function onKickedFromRoom(data: { reason: KickedOutOfRoomReason; message: string }) {
    showDialog({
      key: DIALOG_KEY_KICKED_FROM_ROOM,
      title: t('RoomNotifications.Title'),
      content: resolveKickedMessage(data.reason),
      closeOnClickMask: false,
      onConfirm: () => { options?.onExitConfirmed?.(); },
      onCancel: () => { options?.onExitConfirmed?.(); },
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
    const title = t(isMic ? 'RoomTips.DeviceInvite.Microphone' : 'RoomTips.DeviceInvite.Camera', { name });
    const key = dialogKeyDeviceInvite(invitation.device);

    showDialog({
      key,
      title,
      confirmButton: t('RoomTips.DeviceInvite.AcceptButton'),
      cancelButton: t('RoomTips.DeviceInvite.DeclineButton'),
      onConfirm: async () => {
        removeNotice(key);
        try {
          await roomParticipantState.acceptOpenDeviceInvitation({
            userID: invitation.senderUserID,
            device: invitation.device,
          });
        } catch (e) {
          showErrorToast(e, t(isMic ? 'Device.ToggleMicFailed' : 'Device.ToggleCameraFailed'));
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
      title: t('RoomTips.Recording.StartedTitle'),
      content: t('RoomTips.Recording.StartedMessage', { name }),
      confirmButton: t('RoomCommon.GotIt'),
      cancelButton: t('RoomTips.Recording.LeaveRoom'),
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
    const opName = payload?.operator?.userName || t('RoomTips.DefaultOperatorName');
    switch (payload?.device) {
      case DeviceType.Microphone:
        showToast(t('RoomTips.DeviceClosedByHost.Microphone', { name: opName }));
        break;
      case DeviceType.Camera:
        showToast(t('RoomTips.DeviceClosedByHost.Camera', { name: opName }));
        break;
      default:
        break;
    }
  }

  function onAllDevicesDisabled(payload: { device: DeviceType; disable: boolean }) {
    if (payload.device === DeviceType.Microphone) {
      showToast(t(payload.disable ? 'RoomTips.AllMicrophoneDisabled' : 'RoomTips.AllMicrophoneEnabled'));
    } else if (payload.device === DeviceType.Camera) {
      showToast(t(payload.disable ? 'RoomTips.AllCameraDisabled' : 'RoomTips.AllCameraEnabled'));
    }
  }

  function onOwnerChanged(payload: { newOwner: any; oldOwner: any }) {
    if (isSelf(payload?.newOwner)) {
      showToast(t('RoomTips.BecameOwner'));
    }
    options?.onOwnerChanged?.();
  }

  function onAdminSet(payload: { userInfo: any }) {
    if (isSelf(payload?.userInfo)) showToast(t('RoomTips.BecameAdmin'));
  }

  function onAdminRevoked(payload: { userInfo: any }) {
    if (isSelf(payload?.userInfo)) showToast(t('RoomTips.AdminRevoked'));
  }

  function onUserMessageDisabled(payload: { disable: boolean; operator: any }) {
    showToast(t(payload?.disable ? 'RoomTips.MessageDisabled' : 'RoomTips.MessageEnabled'));
  }

  function onAudiencePromotedToParticipant(payload: { userInfo: any }) {
    const u = payload?.userInfo;
    if (!u) return;
    if (isSelf(u)) {
      showToast(t('RoomTips.SelfPromotedToParticipant'));
    } else {
      const name = u.userName || u.userID || '';
      showToast(t('RoomTips.OtherPromotedToParticipant', { name }));
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
      showToast(t('RoomTips.Recording.Interrupted'));
      return;
    }
    if (payload?.reason === RecordingStopReason.StoppedByUser && isSelf(payload?.operator)) return;
    showToast(t('RoomTips.Recording.Stopped'));
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

  return { dialogState, showDialog };
}
