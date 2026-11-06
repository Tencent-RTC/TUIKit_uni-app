/**
 * 本模块封装了Android、iOS的应用权限判断、打开应用权限设置界面、以及位置系统服务是否开启
 */
declare const plus: any;
declare const uni: any;
// #ifdef APP-PLUS
const isIos = plus.os.name === 'iOS';
// #endif

// 运行时平台判断:plus.os.name 在模块加载早期可能尚未就绪,若误判为非 iOS,
// 会把 iOS 带进 getAppAuthorizeSetting / requestPermissions 分支,
// 在"相机已授权、麦克风被拒"的混合状态下误拦相机。
function isIosPlatform(): boolean {
  try {
    return String(uni.getSystemInfoSync()?.platform || '').toLowerCase() === 'ios';
  } catch (e) {
    return false;
  }
}

// 判断推送权限是否开启
function judgeIosPermissionPush() {
  let result = false;
  const UIApplication = plus.ios.import('UIApplication');
  const app = UIApplication.sharedApplication();
  let enabledTypes = 0;
  if (app.currentUserNotificationSettings) {
    const settings = app.currentUserNotificationSettings();
    enabledTypes = settings.plusGetAttribute('types');
    console.log(`enabledTypes1:${enabledTypes}`);
    if (enabledTypes == 0) {
      console.log('推送权限没有开启');
    } else {
      result = true;
      console.log('已经开启推送功能!');
    }
    plus.ios.deleteObject(settings);
  } else {
    enabledTypes = app.enabledRemoteNotificationTypes();
    if (enabledTypes == 0) {
      console.log('推送权限没有开启!');
    } else {
      result = true;
      console.log('已经开启推送功能!');
    }
    console.log(`enabledTypes2:${enabledTypes}`);
  }
  plus.ios.deleteObject(app);
  plus.ios.deleteObject(UIApplication);
  return result;
}

// 判断定位权限是否开启
function judgeIosPermissionLocation() {
  let result = false;
  const cllocationManger = plus.ios.import('CLLocationManager');
  const status = cllocationManger.authorizationStatus();
  result = status != 2;
  console.log(`定位权限开启：${result}`);
  // 以下代码判断了手机设备的定位是否关闭，推荐另行使用方法 checkSystemEnableLocation
  /* var enable = cllocationManger.locationServicesEnabled();
  var status = cllocationManger.authorizationStatus();
  console.log("enable:" + enable);
  console.log("status:" + status);
  if (enable && status != 2) {
    result = true;
    console.log("手机定位服务已开启且已授予定位权限");
  } else {
    console.log("手机系统的定位没有打开或未给予定位权限");
  } */
  plus.ios.deleteObject(cllocationManger);
  return result;
}
// 判断麦克风权限是否开启
function judgeIosPermissionRecord() {
  let result = false;
  const avaudiosession = plus.ios.import('AVAudioSession');
  const avaudio = avaudiosession.sharedInstance();
  const permissionStatus = avaudio.recordPermission();
  console.log(`permissionStatus:${permissionStatus}`);
  if (permissionStatus == 1684369017 || permissionStatus == 1970168948) {
    console.log('麦克风权限没有开启');
  } else {
    result = true;
    console.log('麦克风权限已经开启');
  }
  plus.ios.deleteObject(avaudiosession);
  return result;
}

// 判断相机权限是否开启
function judgeIosPermissionCamera() {
  let result = false;
  const AVCaptureDevice = plus.ios.import('AVCaptureDevice');
  const authStatus = AVCaptureDevice.authorizationStatusForMediaType('vide');
  console.log(`authStatus:${authStatus}`);
  if (authStatus == 3) {
    result = true;
    console.log('相机权限已经开启');
  } else {
    console.log('相机权限没有开启');
  }
  plus.ios.deleteObject(AVCaptureDevice);
  return result;
}

// 判断相册权限是否开启
function judgeIosPermissionPhotoLibrary() {
  let result = false;
  const PHPhotoLibrary = plus.ios.import('PHPhotoLibrary');
  const authStatus = PHPhotoLibrary.authorizationStatus();
  console.log(`authStatus:${authStatus}`);
  if (authStatus == 3) {
    result = true;
    console.log('相册权限已经开启');
  } else {
    console.log('相册权限没有开启');
  }
  plus.ios.deleteObject(PHPhotoLibrary);
  return result;
}

// 判断通讯录权限是否开启
function judgeIosPermissionContact() {
  let result = false;
  const CNContactStore = plus.ios.import('CNContactStore');
  const cnAuthStatus = CNContactStore.authorizationStatusForEntityType(0);
  if (cnAuthStatus == 3) {
    result = true;
    console.log('通讯录权限已经开启');
  } else {
    console.log('通讯录权限没有开启');
  }
  plus.ios.deleteObject(CNContactStore);
  return result;
}

// 判断日历权限是否开启
function judgeIosPermissionCalendar() {
  let result = false;
  const EKEventStore = plus.ios.import('EKEventStore');
  const ekAuthStatus = EKEventStore.authorizationStatusForEntityType(0);
  if (ekAuthStatus == 3) {
    result = true;
    console.log('日历权限已经开启');
  } else {
    console.log('日历权限没有开启');
  }
  plus.ios.deleteObject(EKEventStore);
  return result;
}

// 判断备忘录权限是否开启
function judgeIosPermissionMemo() {
  let result = false;
  const EKEventStore = plus.ios.import('EKEventStore');
  const ekAuthStatus = EKEventStore.authorizationStatusForEntityType(1);
  if (ekAuthStatus == 3) {
    result = true;
    console.log('备忘录权限已经开启');
  } else {
    console.log('备忘录权限没有开启');
  }
  plus.ios.deleteObject(EKEventStore);
  return result;
}

// Android权限查询
function requestAndroidPermission(permissionID: string) {
  // Android 系统权限框会让应用短暂触发 App Hide(假后台)。期间打标记,避免被当成
  // "用户切后台"而关掉刚打开的摄像头 / 静音麦克风。用计数兼容并发的多个权限请求。
  const uniRef = uni as any;
  uniRef.$permissionPromptCount = (Number(uniRef.$permissionPromptCount) || 0) + 1;
  const finishPrompt = () => {
    uniRef.$permissionPromptCount = Math.max(0, (Number(uniRef.$permissionPromptCount) || 0) - 1);
  };
  return new Promise((resolve, reject) => {
    plus.android.requestPermissions(
      [permissionID], // 理论上支持多个权限同时查询，但实际上本函数封装只处理了一个权限的情况。有需要的可自行扩展封装
      (resultObj: any) => {
        let result = 0;
        for (let i = 0; i < resultObj.granted.length; i++) {
          const grantedPermission = resultObj.granted[i];
          console.log(`已获取的权限：${grantedPermission}`);
          result = 1;
        }
        for (let i = 0; i < resultObj.deniedPresent.length; i++) {
          const deniedPresentPermission = resultObj.deniedPresent[i];
          console.log(`拒绝本次申请的权限：${deniedPresentPermission}`);
          result = 0;
        }
        for (let i = 0; i < resultObj.deniedAlways.length; i++) {
          const deniedAlwaysPermission = resultObj.deniedAlways[i];
          console.log(`永久拒绝申请的权限：${deniedAlwaysPermission}`);
          result = -1;
        }
        finishPrompt();
        resolve(result);
        // 若所需权限被拒绝,则打开APP设置界面,可以在APP设置界面打开相应权限
        // if (result != 1) {
        // gotoAppPermissionSetting()
        // }
      },
      (error: any) => {
        finishPrompt();
        console.log(`申请权限错误：${error.code} = ${error.message}`);
        resolve({
          code: error.code,
          message: error.message,
        });
      }
    );
  });
}

// 是否正在等待系统权限框结果(此时应用可能处于"假后台")。
function isPermissionPrompting(): boolean {
  return Number((uni as any).$permissionPromptCount || 0) > 0;
}

// 使用一个方法，根据参数判断权限
function judgeIosPermission(permissionID: string) {
  if (permissionID == 'location') {
    return judgeIosPermissionLocation();
  }
  if (permissionID == 'camera') {
    return judgeIosPermissionCamera();
  }
  if (permissionID == 'photoLibrary') {
    return judgeIosPermissionPhotoLibrary();
  }
  if (permissionID == 'record') {
    return judgeIosPermissionRecord();
  }
  if (permissionID == 'push') {
    return judgeIosPermissionPush();
  }
  if (permissionID == 'contact') {
    return judgeIosPermissionContact();
  }
  if (permissionID == 'calendar') {
    return judgeIosPermissionCalendar();
  }
  if (permissionID == 'memo') {
    return judgeIosPermissionMemo();
  }
  return false;
}

// iOS 原生兜底：openURL: 自 iOS 10 起废弃、iOS 18 上不再生效，优先用 openURL:options:completionHandler:
function openIosAppSettingByNative() {
  const UIApplication = plus.ios.import('UIApplication');
  const application = UIApplication.sharedApplication();
  const NSURL = plus.ios.import('NSURL');
  const settingURL = NSURL.URLWithString('app-settings:');
  if (application.respondsToSelector('openURL:options:completionHandler:')) {
    const NSDictionary = plus.ios.import('NSDictionary');
    const emptyOptions = new NSDictionary();
    application.openURL_options_completionHandler(settingURL, emptyOptions, null);
    plus.ios.deleteObject(emptyOptions);
    plus.ios.deleteObject(NSDictionary);
  } else {
    application.openURL(settingURL);
  }
  plus.ios.deleteObject(settingURL);
  plus.ios.deleteObject(NSURL);
  plus.ios.deleteObject(application);
}

// 跳转到**应用**的权限页面
function gotoAppPermissionSetting() {
  if (isIos) {
    // 优先用官方 API（HBuilderX 3.5.3+），失败再走原生兜底
    uni.openAppAuthorizeSetting({
      fail: (err: any) => {
        console.warn('[permission] openAppAuthorizeSetting failed, fallback to native:', err);
        try {
          openIosAppSettingByNative();
        } catch (e) {
          console.error('[permission] openIosAppSettingByNative failed:', e);
        }
      },
    });
  } else {
    // console.log(plus.device.vendor);
    const Intent = plus.android.importClass('android.content.Intent');
    const Settings = plus.android.importClass('android.provider.Settings');
    const Uri = plus.android.importClass('android.net.Uri');
    const mainActivity = plus.android.runtimeMainActivity();
    const intent = new Intent();
    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    const uri = Uri.fromParts('package', mainActivity.getPackageName(), null);
    intent.setData(uri);
    mainActivity.startActivity(intent);
  }
}

// 检查系统的设备服务是否开启
// var checkSystemEnableLocation = async function () {
function checkSystemEnableLocation() {
  if (isIos) {
    let result = false as any;
    const cllocationManger = plus.ios.import('CLLocationManager');
    result = cllocationManger.locationServicesEnabled();
    console.log(`系统定位开启:${result}`);
    plus.ios.deleteObject(cllocationManger);
    return result;
  }
  const context = plus.android.importClass('android.content.Context');
  const locationManager = plus.android.importClass(
    'android.location.LocationManager'
  );
  const main = plus.android.runtimeMainActivity();
  const mainSvr = main.getSystemService(context.LOCATION_SERVICE);
  const result = mainSvr.isProviderEnabled(locationManager.GPS_PROVIDER);
  console.log(`系统定位开启:${result}`);
  return result;
}

function isAppPermissionDenied(kind: 'camera' | 'microphone') {
  try {
    const setting = uni.getAppAuthorizeSetting?.() || {};
    const value = kind === 'camera' ? setting.cameraAuthorized : setting.microphoneAuthorized;
    return value === 'denied';
  } catch (e) {
    return false;
  }
}

type MediaPermissionKind = 'camera' | 'microphone';

// iOS:相机与麦克风各自读系统原生授权状态,互不牵连。
// 只把"明确拒绝/restricted"当作拒绝;notDetermined(首次使用)必须放行让 SDK 触发系统授权框;
// 原生取值异常也放行,由 openLocalCamera/openLocalMicrophone 的 fail 回调兜底,避免误拦已授权的设备。
function getIosMediaPermissionDenied(kind: MediaPermissionKind): boolean | null {
  try {
    if (kind === 'camera') {
      const AVCaptureDevice = plus.ios.import('AVCaptureDevice');
      const status = AVCaptureDevice.authorizationStatusForMediaType('vide');
      plus.ios.deleteObject(AVCaptureDevice);
      // AVAuthorizationStatus: 0 notDetermined / 1 restricted / 2 denied / 3 authorized
      return status === 1 || status === 2;
    }
    const AVAudioSession = plus.ios.import('AVAudioSession');
    const session = AVAudioSession.sharedInstance();
    const status = session.recordPermission();
    plus.ios.deleteObject(AVAudioSession);
    // 1684369017 = 'deny'(已拒绝);'unde'/'undt' 为未决定,'grant' 为已授权。
    return status === 1684369017 || status === 'deny' || status === 'denied';
  } catch (e) {
    return null;
  }
}

function isMediaPermissionDenied(kind: MediaPermissionKind): boolean {
  // #ifdef APP-PLUS
  if (isIosPlatform()) {
    // 仅原生明确拒绝时才拦;异常(null)放行,不回退 getAppAuthorizeSetting 以免混合状态下误报。
    return getIosMediaPermissionDenied(kind) === true;
  }
  // #endif
  return isAppPermissionDenied(kind);
}

// 开设备前确认【单个】媒体权限:iOS 读原生授权状态,Android 主动 requestPermissions 取系统权威结果。
// 相机与麦克风各自独立调用,互不受对方授权状态影响 —— 避免"一个开一个关"的混合状态下,
// 只读的 getAppAuthorizeSetting 误报把另一个设备也拦掉。
// 返回 1 可用 / 0 本次拒绝 / -1 明确拒绝(需去系统设置开启)。
function ensureMediaPermission(kind: MediaPermissionKind): Promise<number> {
  // #ifdef APP-PLUS
  if (isIosPlatform()) {
    // 对齐 iOS CoGuestIcon.requestMediaAccess:系统授权框只在 notDetermined 时由
    // SDK 调用设备(openLocalCamera/Microphone)触发,结果由 success/fail 回调驱动,
    // 前置状态预检(getAppAuthorizeSetting/plus.ios 桥接)在混合授权状态下会误报,
    // 把"相机已授权、麦克风被拒"里的相机也拦掉。故 iOS 一律放行,失败交给 SDK 回调兜底。
    return Promise.resolve(1);
  }
  const permissionID = kind === 'camera'
    ? 'android.permission.CAMERA'
    : 'android.permission.RECORD_AUDIO';
  return Promise.resolve(ensureAndroidPermission(permissionID)).then((result: any) =>
    typeof result === 'number' ? result : 0
  );
  // #endif
  // #ifndef APP-PLUS
  return Promise.resolve(1);
  // #endif
}

function isAndroidPermissionGranted(permissionID: string): boolean {
  try {
    const setting = uni.getAppAuthorizeSetting?.() || {};
    if (permissionID === 'android.permission.CAMERA') return setting.cameraAuthorized === 'authorized';
    if (permissionID === 'android.permission.RECORD_AUDIO') return setting.microphoneAuthorized === 'authorized';
  } catch (e) { /* ignore */ }
  return false;
}

function ensureAndroidPermission(permissionID: string): Promise<any> {
  if (isAndroidPermissionGranted(permissionID)) {
    return Promise.resolve(1);
  }
  return requestAndroidPermission(permissionID);
}

export default {
  judgeIosPermission,
  requestAndroidPermission,
  ensureAndroidPermission,
  checkSystemEnableLocation,
  gotoAppPermissionSetting,
  isAppPermissionDenied,
  isMediaPermissionDenied,
  ensureMediaPermission,
  isPermissionPrompting,
};
