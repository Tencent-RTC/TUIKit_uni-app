import { useCallState } from '../state/CallState';
import { useDeviceState } from '../state/DeviceState';
import { requestCallPermissions } from '../utils/callPermission';

declare const uni: any;
declare const plus: any;

var callStateInstance = useCallState();
var addCallListener = callStateInstance.addCallListener;
var addFloatWindowListener = callStateInstance.addFloatWindowListener;
var callState = callStateInstance.state;
var stopVibrate = callStateInstance.stopVibrate;
var stopFloatWindow = callStateInstance.stopFloatWindow;
var startForegroundService = callStateInstance.startForegroundService;
var stopForegroundService = callStateInstance.stopForegroundService;
var enableVirtualBackground = callStateInstance.enableVirtualBackground;

var deviceStateInstance = useDeviceState();
var openLocalCamera = deviceStateInstance.openLocalCamera;
var openLocalMicrophone = deviceStateInstance.openLocalMicrophone;
var closeLocalCamera = deviceStateInstance.closeLocalCamera;
var closeLocalMicrophone = deviceStateInstance.closeLocalMicrophone;

// 导航状态锁，防止频繁 navigateTo/navigateBack 导致 iOS 页面栈异常崩溃
var _isNavigating = false;
// 呼叫流程锁，防止频繁呼叫忙线对方时资源竞争
var _isCallEnding = false;

var TOAST_OPTION = {
  align: 'center' as const,
  verticalAlign: 'center' as const
};

var CALL_END_REASON_TOAST_MAP: Record<number, string> = {
  1: '对方已挂断，通话结束',
  2: '对方拒绝了你的通话请求',
  3: '对方未接听，请稍后再试',
  4: '对方不在线',
  5: '对方正在通话中，请稍后再试',
  6: '对方已取消通话',
  7: '其他设备已接听',
  8: '其他设备已拒绝',
  9: '服务端拒绝',
};

// 默认兜底页面
var DEFAULT_PAGE = '/pages/index/index';

// 通话页面路由
var CALL_PAGE = '/uni_modules/tuikit-atomic-x/pages/call';

// 需要特殊处理回退的直播页面路由，这些页面包含原生组件，通话结束后需要通知页面恢复状态
var REENTER_PAGES = ['/pages/scenes/live/anchor/index', '/pages/scenes/live/audience/index'];

/**
 * 判断通话结束后是否会返回到需要特殊处理的直播页面（如主播直播间、观众直播间）
 * 这些页面需要保持设备状态或恢复直播连接
 */
function isReturningToReenterPage(): boolean {
  var pages = getCurrentPages();
  var currentRoute = pages.length > 0 ? '/' + (pages[pages.length - 1] as any).route : '';

  // 场景1: 当前在 call 页面，检查页面栈中上一页是否是需要重新进入的页面
  if (currentRoute === CALL_PAGE && pages.length > 1) {
    var prevPage = pages[pages.length - 2] as any;
    var prevRoute = '/' + prevPage.route;
    if (REENTER_PAGES.indexOf(prevRoute) !== -1) {
      return true;
    }
  }

  // 场景2: 悬浮窗模式下用户已经不在 call 页，检查当前页是否是需要保持设备状态的页面
  if (REENTER_PAGES.indexOf(currentRoute) !== -1) {
    return true;
  }

  // 场景3: 检查 $lastPage 是否指向需要重新进入的页面
  if (uni.$lastPage) {
    var lastPageRoute = uni.$lastPage.split('?')[0];
    if (REENTER_PAGES.indexOf(lastPageRoute) !== -1) {
      return true;
    }
  }

  return false;
}

function navigateBack() {
  if (_isNavigating) {
    console.warn('[CallService] navigateBack skipped: navigation already in progress');
    return;
  }
  var pages = getCurrentPages();
  var currentRoute = pages.length > 0 ? '/' + (pages[pages.length - 1] as any).route : 'empty';
  console.log('[CallService] navigateBack, currentRoute:', currentRoute, 'uni.$lastPage:', uni.$lastPage, 'uni.$callSource:', uni.$callSource, 'pageStackLen:', pages.length);
  uni.$callSource = '';
  // 只有当栈顶是 call 页面时才执行回退，避免悬浮窗模式下通话结束时误回退用户当前页面
  if (currentRoute !== CALL_PAGE) {
    console.log('[CallService] navigateBack skipped: current page is not call page');
    return;
  }
  _isNavigating = true;
  var unlockNavigation = function () {
    // 延迟释放导航锁，确保页面切换动画完成后才允许下一次导航
    setTimeout(function () { _isNavigating = false; }, 500);
  };
  // 检查上一页是否是需要重新进入的页面（如直播间 anchor）
  if (pages.length > 1) {
    var prevPage = pages[pages.length - 2] as any;
    var prevRoute = '/' + prevPage.route;
    if (REENTER_PAGES.indexOf(prevRoute) !== -1) {
      console.log('[CallService] navigateBack: prev page is', prevRoute, ', navigateBack and emit callEndedBackToLive');
      uni.$emit('callEndedBackToLive');
      uni.navigateBack({
        delta: 1,
        success: unlockNavigation,
        fail: function () {
          uni.redirectTo({
            url: prevRoute + '?isLiving=true',
            complete: unlockNavigation
          });
        }
      });
      return;
    }
    uni.navigateBack({
      delta: 1,
      success: unlockNavigation,
      fail: function () {
        uni.redirectTo({
          url: uni.$lastPage || DEFAULT_PAGE,
          complete: unlockNavigation
        });
      }
    });
  } else {
    uni.redirectTo({
      url: uni.$lastPage || DEFAULT_PAGE,
      complete: unlockNavigation
    });
  }
}

function ensureAudioContext() {
  if (!uni.$innerAudioContext) {
    var ctx = uni.createInnerAudioContext();
    ctx.onError(function (err: any) {
      var errCode = err && err.errCode;
      var errMsg = (err && err.errMsg) || err;
      console.error('[CallService] innerAudioContext onError:', errCode, errMsg);
    });
    uni.$innerAudioContext = ctx;
  }
  return uni.$innerAudioContext;
}

/**
 * 可靠播放铃声
 * 复用单例模式下，stop 后的实例仅靠 autoplay+src 赋值在部分平台/时序下不会自动播放，
 * 因此必须：先 stop 残留状态 → 设置 src/loop/autoplay → 显式调用 play() 兜底
 */
function playRingtone(src: string) {
  var ctx = ensureAudioContext();
  try {
    ctx.stop();
  } catch (_e) {
    // 忽略 stop 错误（可能本来就没在播放）
  }
  ctx.src = src;
  ctx.loop = true;
  ctx.autoplay = true;
  // 显式调用 play()，autoplay 在 iOS 复用实例时偶现不生效
  setTimeout(function () {
    try {
      ctx.play();
      console.log('[CallService] playRingtone started:', src);
    } catch (e) {
      console.warn('[CallService] playRingtone play() error:', e);
    }
  }, 50);
}

function stopAndResetAudio() {
  if (uni.$innerAudioContext) {
    try {
      uni.$innerAudioContext.loop = false;
      uni.$innerAudioContext.stop();
      // 不 destroy，复用单例，避免 iOS 上频繁 create/destroy AVAudioSession 导致资源竞争崩溃
    } catch (e) {
      console.warn('[CallService] stopAndResetAudio error:', e);
    }
  }
}

export { ensureAudioContext, stopAndResetAudio, playRingtone, CALL_PAGE };

/**
 * 获取当前是否正在导航中（防止频繁呼叫时页面栈溢出）
 */
export function isNavigating(): boolean {
  return _isNavigating;
}

/**
 * 获取当前是否正在处理通话结束流程
 */
export function isCallEnding(): boolean {
  return _isCallEnding;
}

/**
 * 获取当前页面的完整路径（含 query 参数）
 */
export function getCurrentPageFullPath(): string {
  var pages = getCurrentPages();
  if (!pages || pages.length === 0) return DEFAULT_PAGE;
  var currentPage = pages[pages.length - 1] as any;
  var route = '/' + currentPage.route;
  // 优先使用 $page.fullPath（含 query），其次拼接 options
  if (currentPage.$page && currentPage.$page.fullPath) {
    console.log('[CallService] currentPage.$page.fullPath:', currentPage.$page.fullPath);
    return currentPage.$page.fullPath;
  }
  if (currentPage.options && Object.keys(currentPage.options).length > 0) {
    var keys = Object.keys(currentPage.options);
    var queryParts: string[] = [];
    for (var i = 0; i < keys.length; i++) {
      queryParts.push(keys[i] + '=' + currentPage.options[keys[i]]);
    }
    var query = queryParts.join('&');
    return route + '?' + query;
  }
  return route;
}

// selfInfo 变化轮询检测，替代 vue 的 watch
var _lastSelfInfoStatus: number | null = null;
var _selfInfoPollTimer: any = null;

function _pollSelfInfoStatus() {
  var newVal = callState.selfInfo;
  var newStatus = (newVal && typeof newVal.status === 'number') ? newVal.status : null;
  if (newStatus !== _lastSelfInfoStatus) {
    _lastSelfInfoStatus = newStatus;
    if (newStatus === 2) {
      stopVibrate();
      stopAndResetAudio();
    } else if (newStatus === 0) {
      stopVibrate();
      stopFloatWindow();
      stopAndResetAudio();
    }
    console.log('[CallService] selfInfo changed:', JSON.stringify(newVal));
  }
}

export function initCallService() {
  // 在 App 级别初始化 innerAudioContext
  ensureAudioContext();

  // 初始化默认值
  if (!uni.$lastPage) {
    uni.$lastPage = DEFAULT_PAGE;
  }
  // callSource: 'caller' 主叫 | 'callee' 被叫
  uni.$callSource = '';

  // 用轮询替代 watch(() => selfInfo.value, ...)，兼容 Vue2
  _lastSelfInfoStatus = (callState.selfInfo && typeof callState.selfInfo.status === 'number') ? callState.selfInfo.status : null;
  if (_selfInfoPollTimer) {
    clearInterval(_selfInfoPollTimer);
  }
  _selfInfoPollTimer = setInterval(_pollSelfInfoStatus, 200);

  var isFloatWindowClicking = false;
  addFloatWindowListener(function () {
    if (isFloatWindowClicking) {
      console.warn('[CallService] floatWindow click throttled, ignoring');
      return;
    }
    isFloatWindowClicking = true;
    setTimeout(function () { isFloatWindowClicking = false; }, 500);

    // 点击悬浮窗回到通话页之前，记录当前页为 $lastPage
    uni.$lastPage = getCurrentPageFullPath();
    uni.$callSource = 'float';
    // 延迟等待 App 回到前台后再执行页面导航，避免后台状态下 navigateTo 失效
    setTimeout(function () {
      stopFloatWindow();
      var pages = getCurrentPages();
      var currentRoute = pages.length > 0 ? '/' + (pages[pages.length - 1] as any).route : '';
      if (currentRoute === CALL_PAGE) {
        console.log('[CallService] floatWindow: already on call page, skip navigation');
        return;
      }
      uni.navigateTo({
        url: CALL_PAGE,
        fail: function (err: any) {
          console.error('[CallService] floatWindow navigateTo failed:', err);
          // 降级：使用 redirectTo 强制跳转
          uni.redirectTo({
            url: CALL_PAGE
          });
        }
      });
    }, 500);
  });

  addCallListener('onCallStarted', function () {
    startForegroundService();
  });

  addCallListener('onCallReceived', function (event?: unknown) {
    var res: any;
    try {
      res = JSON.parse(event as string);
    } catch (error) {
      console.error('[CallService] onCallReceived parse error:', error, 'event:', event);
      return;
    }
    requestCallPermissions(res.mediaType);
    if (res.mediaType === 1) {
      openLocalCamera({ isFront: true });
    }
    startForegroundService();
    uni.$lastPage = getCurrentPageFullPath();
    uni.$callSource = 'callee';
    uni.navigateTo({
      url: CALL_PAGE
    });
  });

  addCallListener('onCallEnded', function (event?: unknown) {
    if (_isCallEnding) {
      console.warn('[CallService] onCallEnded skipped: previous call end still processing');
      return;
    }
    _isCallEnding = true;

    var res: any;
    try {
      res = JSON.parse(event as string);
    } catch (error) {
      console.error('[CallService] onCallEnded parse error:', error, 'event:', event);
      _isCallEnding = false;
      return;
    }

    console.log('[CallService] onCallEnded, reason:', res.reason, 'data:', res);

    // 忙线(reason=5)、不在线(reason=4) 等快速结束的场景，跳过设备关闭，避免频繁开关硬件导致 iOS 资源竞争
    var QUICK_END_REASONS = [4, 5];
    var isQuickEnd = QUICK_END_REASONS.indexOf(res.reason) !== -1;

    // 判断是否需要返回到需要重新进入的页面（如主播直播间），这些页面需要保持摄像头和麦克风状态
    var shouldKeepDevice = isReturningToReenterPage();
    if (!shouldKeepDevice && !isQuickEnd) {
      closeLocalCamera();
      closeLocalMicrophone();
    } else {
      console.log('[CallService] onCallEnded: skip closeLocalCamera/closeLocalMicrophone, shouldKeepDevice:', shouldKeepDevice, 'isQuickEnd:', isQuickEnd);
    }
    stopForegroundService();
    stopAndResetAudio();
    enableVirtualBackground(false);

    var endPages = getCurrentPages();
    var endCurrentRoute = endPages.length > 0 ? '/' + (endPages[endPages.length - 1] as any).route : 'empty';
    console.log('[CallService] onCallEnded currentRoute:', endCurrentRoute, 'uni.$lastPage:', uni.$lastPage, 'pageStackLen:', endPages.length);

    // 群通话不弹任何 toast，直接返回
    var callInfo = callState.activeCall;
    var isGroupCall = callInfo && ((callInfo as any).chatGroupId !== '' || ((callInfo as any).inviteeIds && (callInfo as any).inviteeIds.length > 1));

    var doNavigateBack = function () {
      navigateBack();
      // 延迟释放呼叫结束锁，确保导航完成后才允许下一次呼叫
      setTimeout(function () { _isCallEnding = false; }, 600);
    };

    // 忙线等快速结束场景添加短暂延迟，等待页面栈稳定后再执行导航
    var navigationDelay = isQuickEnd ? 300 : 0;

    if (isGroupCall) {
      console.log('[CallService] Group call ended, skip toast');
      setTimeout(doNavigateBack, navigationDelay);
      return;
    }

    // 自己触发的挂断(1)/拒绝(2)/超时(3)/取消(6)，不弹 toast 直接返回
    var SELF_SILENT_REASONS = [1, 2, 3, 6];
    var selfInfoVal = callState.selfInfo;
    console.log('[CallService] onCallEnded selfInfo:', JSON.stringify(selfInfoVal));
    // 优先使用 uni.$userID（稳定），selfInfo 可能在 onCallEnded 触发前已被异步清空
    var selfUserId = uni.$userID || (selfInfoVal && selfInfoVal.id) || '';
    if (SELF_SILENT_REASONS.indexOf(res.reason) !== -1 && selfUserId && res.userId === selfUserId) {
      console.log('[CallService] Reason', res.reason, 'with self userId, skip toast');
      setTimeout(doNavigateBack, navigationDelay);
      return;
    }

    // 其他 reason，弹窗并返回
    var toastMsg = CALL_END_REASON_TOAST_MAP[res.reason];
    if (toastMsg) {
      setTimeout(doNavigateBack, navigationDelay);
      plus.nativeUI.toast(toastMsg, TOAST_OPTION);
    } else {
      setTimeout(doNavigateBack, navigationDelay);
    }
  });
}