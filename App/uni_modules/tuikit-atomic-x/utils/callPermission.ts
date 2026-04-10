/**
 * 通话权限检查模块
 * 封装麦克风、摄像头权限检查及无权限时的弹窗引导逻辑
 *
 * iOS 权限策略：
 * - Undetermined（从未请求过）：放行，让系统在使用设备时自动弹出原生授权弹窗
 * - Denied（用户已明确拒绝）：阻断，弹出"去设置"引导弹窗
 * - Granted（已授权）：放行
 */
import permission from './permission';

declare const plus: any;
declare const uni: any;

const isIos = uni.getSystemInfoSync().platform === 'ios';

// iOS 麦克风权限状态码 (AVAudioSession recordPermission)
const RecordPermissionUndetermined = 1970168948;
const RecordPermissionDenied = 1684369017;

// iOS 摄像头权限状态码 (AVCaptureDevice authorizationStatus)
const CameraStatusNotDetermined = 0;
const CameraStatusDenied = 2;

// 权限状态缓存，避免频繁呼叫时反复 plus.ios.import/deleteObject 导致 OC 桥接对象泄漏
let _cachedMicStatus: number | null = null;
let _cachedCameraStatus: number | null = null;
let _lastPermissionCheckTime = 0;
// 缓存有效期 3 秒，在频繁呼叫场景下足以避免重复 import，同时保证状态更新及时
const PERMISSION_CACHE_TTL = 3000;

/**
 * 获取 iOS 麦克风权限原始状态
 */
function getIosMicPermissionStatus(): number {
  const now = Date.now();
  if (_cachedMicStatus !== null && now - _lastPermissionCheckTime < PERMISSION_CACHE_TTL) {
    return _cachedMicStatus;
  }
  const avaudiosession = plus.ios.import('AVAudioSession');
  const avaudio = avaudiosession.sharedInstance();
  const status = avaudio.recordPermission();
  // 必须 deleteObject 所有通过 plus.ios.import 创建的引用，包括 sharedInstance 返回的对象
  plus.ios.deleteObject(avaudio);
  plus.ios.deleteObject(avaudiosession);
  _cachedMicStatus = status;
  _lastPermissionCheckTime = now;
  return status;
}

/**
 * 获取 iOS 摄像头权限原始状态
 */
function getIosCameraPermissionStatus(): number {
  const now = Date.now();
  if (_cachedCameraStatus !== null && now - _lastPermissionCheckTime < PERMISSION_CACHE_TTL) {
    return _cachedCameraStatus;
  }
  const AVCaptureDevice = plus.ios.import('AVCaptureDevice');
  const status = AVCaptureDevice.authorizationStatusForMediaType('vide');
  plus.ios.deleteObject(AVCaptureDevice);
  _cachedCameraStatus = status;
  _lastPermissionCheckTime = now;
  return status;
}

/**
 * 清除权限缓存（在权限变更后调用，如用户从设置页返回时）
 */
export function clearPermissionCache(): void {
  _cachedMicStatus = null;
  _cachedCameraStatus = null;
  _lastPermissionCheckTime = 0;
}

/**
 * 检查通话所需权限
 *
 * iOS 端只拦截"已明确拒绝(denied)"的情况：
 * - Undetermined（从未请求）→ 放行，系统会在实际使用时自动弹出原生授权弹窗
 * - Denied（已拒绝）→ 返回缺失权限，由调用方弹"去设置"弹窗
 * - Granted（已授权）→ 放行
 *
 * Android 端保持原有逻辑，由系统弹窗请求权限。
 *
 * @param mediaType 通话类型: 0=语音通话(仅麦克风), 1=视频通话(麦克风+摄像头)
 * @returns 缺失的权限名称数组，空数组表示可以继续
 */
export async function checkCallPermissions(mediaType: number): Promise<string[]> {
  const missingPermissions: string[] = [];

  if (isIos) {
    // 麦克风：只有明确拒绝时才阻断
    const micStatus = getIosMicPermissionStatus();
    if (micStatus === RecordPermissionDenied) {
      missingPermissions.push('麦克风');
    }
    // undetermined 和 granted 都放行

    // 摄像头：只有明确拒绝时才阻断（仅视频通话）
    if (mediaType === 1) {
      const cameraStatus = getIosCameraPermissionStatus();
      if (cameraStatus === CameraStatusDenied) {
        missingPermissions.push('摄像头');
      }
      // notDetermined 和 authorized 都放行
    }
  } else {
    const micResult = await permission.requestAndroidPermission('android.permission.RECORD_AUDIO');
    if (micResult !== 1) {
      missingPermissions.push('麦克风');
    }
    if (mediaType === 1) {
      const cameraResult = await permission.requestAndroidPermission('android.permission.CAMERA');
      if (cameraResult !== 1) {
        missingPermissions.push('摄像头');
      }
    }
  }

  return missingPermissions;
}

/**
 * 显示权限缺失弹窗，支持跳转到系统设置页
 * @param missingPermissions 缺失的权限名称数组
 * @returns Promise，用户点击弹窗按钮后才 resolve（'settings' 表示去设置，'cancel' 表示取消）
 */
export function showPermissionDialog(missingPermissions: string[]): Promise<string> {
  return new Promise((resolve) => {
    const permissionText = missingPermissions.join('和');
    plus.nativeUI.confirm(
      `通话需要${permissionText}权限，请在系统设置中开启`,
      (event: any) => {
        if (event.index === 0) {
          uni.openAppAuthorizeSetting();
          // 用户跳转到设置页后，清除权限缓存，确保返回时重新检查
          clearPermissionCache();
          resolve('settings');
        } else {
          resolve('cancel');
        }
      },
      '权限提示',
      ['去开启', '以后再说']
    );
  });
}

/**
 * 检查通话权限并在权限不足时弹窗引导
 * @param mediaType 通话类型: 0=语音通话, 1=视频通话
 * @returns true=权限齐全可继续, false=权限不足已弹窗（等待用户操作完弹窗后才返回）
 */
export async function checkCallPermissionWithDialog(mediaType: number): Promise<boolean> {
  const missingPermissions = await checkCallPermissions(mediaType);
  if (missingPermissions.length > 0) {
    await showPermissionDialog(missingPermissions);
    return false;
  }
  return true;
}

/**
 * iOS 端主动请求麦克风权限（触发系统原生弹窗）
 * @returns Promise<boolean> true=用户授权, false=用户拒绝
 */
function requestIosMicPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    const AVAudioSession = plus.ios.import('AVAudioSession');
    const session = AVAudioSession.sharedInstance();
    session.requestRecordPermission((granted: boolean) => {
      // 授权结果变更后清除缓存
      clearPermissionCache();
      resolve(granted);
    });
    plus.ios.deleteObject(session);
    plus.ios.deleteObject(AVAudioSession);
  });
}

/**
 * iOS 端主动请求摄像头权限（触发系统原生弹窗）
 * @returns Promise<boolean> true=用户授权, false=用户拒绝
 */
function requestIosCameraPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    const AVCaptureDevice = plus.ios.import('AVCaptureDevice');
    AVCaptureDevice.requestAccessForMediaTypeCompletionHandler('vide', (granted: boolean) => {
      // 授权结果变更后清除缓存
      clearPermissionCache();
      resolve(granted);
    });
    plus.ios.deleteObject(AVCaptureDevice);
  });
}

/**
 * 主动请求通话所需权限（业务侧触发原生授权弹窗）
 *
 * 只负责弹出系统原生授权弹窗，等待用户操作后返回结果，不会额外弹"去设置"引导弹窗，
 * 保证不阻塞后续业务流程（如页面跳转）。
 *
 * - iOS: Undetermined → 弹系统原生弹窗; Denied → 直接返回 false; Granted → 返回 true
 * - Android: 调用系统权限请求弹框
 *
 * @param mediaType 通话类型: 0=语音通话(仅麦克风), 1=视频通话(麦克风+摄像头)
 * @returns true=权限齐全, false=有权限未授予
 */
export async function requestCallPermissions(mediaType: number): Promise<boolean> {
  let allGranted = true;

  if (isIos) {
    // 麦克风权限
    const micStatus = getIosMicPermissionStatus();
    if (micStatus === RecordPermissionUndetermined) {
      // 从未请求过 → 主动弹出系统原生授权弹窗
      const granted = await requestIosMicPermission();
      if (!granted) allGranted = false;
    } else if (micStatus === RecordPermissionDenied) {
      allGranted = false;
    }

    // 摄像头权限（仅视频通话）
    if (mediaType === 1) {
      const cameraStatus = getIosCameraPermissionStatus();
      if (cameraStatus === CameraStatusNotDetermined) {
        // 从未请求过 → 主动弹出系统原生授权弹窗
        const granted = await requestIosCameraPermission();
        if (!granted) allGranted = false;
      } else if (cameraStatus === CameraStatusDenied) {
        allGranted = false;
      }
    }
  } else {
    // Android 端：系统弹窗请求权限
    const micResult = await permission.requestAndroidPermission('android.permission.RECORD_AUDIO');
    if (micResult !== 1) {
      allGranted = false;
    }
    if (mediaType === 1) {
      const cameraResult = await permission.requestAndroidPermission('android.permission.CAMERA');
      if (cameraResult !== 1) {
        allGranted = false;
      }
    }
  }

  return allGranted;
}
