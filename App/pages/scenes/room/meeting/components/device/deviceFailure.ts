/**
 * 「开启麦克风 / 摄像头失败」底部面板的状态与流程。
 * 麦克风、摄像头按钮开启失败时调用 showDeviceFailure；面板组件 DeviceFailurePanel 读取状态并渲染。
 */
import { reactive } from 'vue';
import {
  resolveDeviceFault,
  showErrorToast,
  type DeviceFault,
  type FaultDevice,
  type DeviceFaultKind,
} from '@/uni_modules/tuikit-atomic-x/utils/roomErrorHandler';
import permission from '@/uni_modules/tuikit-atomic-x/utils/permission';
import { t } from '../../../locales';

declare const plus: any;

const RESTART_HINT_FAIL_COUNT = 2;

export interface DeviceFailurePanelState {
  visible: boolean;
  kind: DeviceFaultKind;
  device: FaultDevice;
  isRestartHint: boolean;
  isRetrying: boolean;
}

export const deviceFailurePanelState = reactive<DeviceFailurePanelState>({
  visible: false,
  kind: 'system',
  device: 'microphone',
  isRestartHint: false,
  isRetrying: false,
});

type OpenDeviceAction = () => Promise<void>;

let currentOpenAction: OpenDeviceAction | null = null;
let currentFailedActionText = '';
let pendingRetryAfterSettings: { device: FaultDevice; retry: OpenDeviceAction; failedAction: string } | null = null;
const startFailedCountByDevice: Record<FaultDevice, number> = { microphone: 0, camera: 0 };

function resolveDeviceDisplayName(device: FaultDevice): string {
  return t(device === 'microphone' ? 'Device.Name.Microphone' : 'Device.Name.Camera');
}

export function buildDeviceFailureTitle(kind: DeviceFaultKind, device: FaultDevice): string {
  const params = { device: resolveDeviceDisplayName(device) };
  switch (kind) {
    case 'system':
      return t('Device.Fault.MobileSystemTitle', params);
    case 'busy':
      return t('Device.Fault.MobileBusyTitle', params);
    case 'noDevice':
      return t('Device.Fault.NoDeviceTitle', params);
    default:
      return t('Device.Fault.StartFailedTitle', params);
  }
}

export function buildDeviceFailureBody(kind: DeviceFaultKind, device: FaultDevice, isRestartHint: boolean): string {
  const params = { device: resolveDeviceDisplayName(device) };
  switch (kind) {
    case 'system':
      return t('Device.Fault.MobileSystemBody', params);
    case 'busy':
      return t('Device.Fault.MobileBusyBody', params);
    case 'noDevice':
      return t('Device.Fault.NoDeviceBody', params);
    default:
      return t(isRestartHint ? 'Device.Fault.MobileFailRestartBody' : 'Device.Fault.MobileFailBody');
  }
}

function showPanelForFault(fault: DeviceFault): void {
  if (fault.kind === 'startFailed') {
    startFailedCountByDevice[fault.device] += 1;
  }
  deviceFailurePanelState.kind = fault.kind;
  deviceFailurePanelState.device = fault.device;
  deviceFailurePanelState.isRestartHint =
    fault.kind === 'startFailed' && startFailedCountByDevice[fault.device] >= RESTART_HINT_FAIL_COUNT;
  deviceFailurePanelState.visible = true;
}

export function resetDeviceStartFailCount(device: FaultDevice): void {
  startFailedCountByDevice[device] = 0;
}

export function closeDeviceFailurePanel(): void {
  deviceFailurePanelState.visible = false;
}

export function showDeviceFailure(
  e: any,
  device: FaultDevice,
  retry: OpenDeviceAction,
  failedAction: string,
): void {
  const fault = resolveDeviceFault(e, device);
  if (fault === null) {
    showErrorToast(e, failedAction);
    return;
  }
  if (deviceFailurePanelState.visible) return;
  currentOpenAction = retry;
  currentFailedActionText = failedAction;
  showPanelForFault(fault);
}

function showPanelOrToastAfterRetryFailure(e: any, device: FaultDevice, failedAction: string): void {
  const fault = resolveDeviceFault(e, device);
  if (fault === null) {
    closeDeviceFailurePanel();
    showErrorToast(e, failedAction);
    return;
  }
  showPanelForFault(fault);
}

export async function retryOpenDevice(): Promise<void> {
  const retry = currentOpenAction;
  if (retry === null || deviceFailurePanelState.isRetrying) return;
  const device = deviceFailurePanelState.device;
  deviceFailurePanelState.isRetrying = true;
  try {
    await retry();
    resetDeviceStartFailCount(device);
    closeDeviceFailurePanel();
  } catch (e) {
    showPanelOrToastAfterRetryFailure(e, device, currentFailedActionText);
  } finally {
    deviceFailurePanelState.isRetrying = false;
  }
}

export function openSystemSettingsThenRetry(): void {
  const retry = currentOpenAction;
  if (retry !== null) {
    pendingRetryAfterSettings = {
      device: deviceFailurePanelState.device,
      retry,
      failedAction: currentFailedActionText,
    };
  }
  closeDeviceFailurePanel();
  permission.gotoAppPermissionSetting();
}

const SYSTEM_DENIED_ERROR_CODE: Record<FaultDevice, number> = {
  microphone: -1105,
  camera: -1101,
};

function isIosPermissionDenied(device: FaultDevice): boolean {
  try {
    if (device === 'microphone') {
      const avaudiosession = plus.ios.import('AVAudioSession');
      const status = avaudiosession.sharedInstance().recordPermission();
      plus.ios.deleteObject(avaudiosession);
      // 'deny' = 1684369017
      return status === 1684369017;
    }
    const AVCaptureDevice = plus.ios.import('AVCaptureDevice');
    const status = AVCaptureDevice.authorizationStatusForMediaType('vide');
    plus.ios.deleteObject(AVCaptureDevice);
    // 1 = restricted, 2 = denied
    return status === 1 || status === 2;
  } catch (e) {
    return false;
  }
}

export async function assertSystemPermissionGranted(device: FaultDevice): Promise<void> {
  let isDenied = false;
  if (plus.os.name === 'iOS') {
    isDenied = isIosPermissionDenied(device);
  } else {
    const permissionID = device === 'microphone' ? 'android.permission.RECORD_AUDIO' : 'android.permission.CAMERA';
    const result: any = await permission.requestAndroidPermission(permissionID);
    // 1 已授权；0 本次拒绝；-1 拒绝且不再询问；对象表示申请本身出错，无法判断，放行交给 SDK
    isDenied = result === 0 || result === -1;
  }
  if (isDenied) {
    const err: any = new Error(`${device} permission denied by system`);
    err.code = SYSTEM_DENIED_ERROR_CODE[device];
    throw err;
  }
}

export function retryOpenDeviceAfterSettings(): void {
  const pending = pendingRetryAfterSettings;
  if (pending === null) return;
  pendingRetryAfterSettings = null;
  currentOpenAction = pending.retry;
  currentFailedActionText = pending.failedAction;

  pending
    .retry()
    .then(() => {
      resetDeviceStartFailCount(pending.device);
    })
    .catch((e: any) => {
      showPanelOrToastAfterRetryFailure(e, pending.device, pending.failedAction);
    });
}
