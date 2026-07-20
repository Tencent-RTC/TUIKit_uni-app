declare const wx: any;
declare const qq: any;
declare const tt: any;
declare const swan: any;
declare const my: any;
declare const jd: any;
declare const uni: any;
declare const window: any;

export const IN_WX_MINI_APP_DESK = (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function' && (wx.getSystemInfoSync().platform === 'mac' || wx.getSystemInfoSync().platform === 'windows'));
export const IN_WX_MINI_APP = (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function' && Boolean(wx.getSystemInfoSync().fontSizeSetting)) || IN_WX_MINI_APP_DESK;
export const IN_QQ_MINI_APP = (typeof qq !== 'undefined' && typeof qq.getSystemInfoSync === 'function' && Boolean(qq.getSystemInfoSync().fontSizeSetting));
export const IN_TT_MINI_APP = (typeof tt !== 'undefined' && typeof tt.getSystemInfoSync === 'function' && Boolean(tt.getSystemInfoSync().fontSizeSetting));
export const IN_BAIDU_MINI_APP = (typeof swan !== 'undefined' && typeof swan.getSystemInfoSync === 'function' && Boolean(swan.getSystemInfoSync().fontSizeSetting));
export const IN_ALIPAY_MINI_APP = (typeof my !== 'undefined' && typeof my.getSystemInfoSync === 'function' && Boolean(my.getSystemInfoSync().fontSizeSetting));
export const IN_JD_MINI_APP = (typeof jd !== 'undefined' && typeof jd.getSystemInfoSync === 'function');
export const IN_UNI_NATIVE_APP = (typeof uni !== 'undefined' && typeof window === 'undefined');
// eslint-disable-next-line @stylistic/max-len
export const IN_MINI_APP = IN_WX_MINI_APP || IN_QQ_MINI_APP || IN_TT_MINI_APP || IN_BAIDU_MINI_APP || IN_ALIPAY_MINI_APP || IN_JD_MINI_APP || IN_UNI_NATIVE_APP;
export const IN_UNI_APP = (typeof uni !== 'undefined');
export const IN_BROWSER = (function () {
  if (typeof uni !== 'undefined') {
    return !IN_MINI_APP;
  }
  return (typeof window !== 'undefined') && !IN_MINI_APP;
})();

// runtime env
export const APP_NAMESPACE = (() => {
  if (IN_QQ_MINI_APP) {
    return qq;
  }
  if (IN_TT_MINI_APP) {
    return tt;
  }
  if (IN_BAIDU_MINI_APP) {
    return swan;
  }
  if (IN_ALIPAY_MINI_APP) {
    return my;
  }
  if (IN_WX_MINI_APP) {
    return wx;
  }
  if (IN_UNI_NATIVE_APP) {
    return uni;
  }
  if (IN_JD_MINI_APP) {
    return jd;
  }
  if (IN_BROWSER) {
    return window;
  }
  return {};
})();

const USER_AGENT = (IN_BROWSER && window && window.navigator && window.navigator.userAgent) || '';
const IS_ANDROID = /Android/i.test(USER_AGENT);
const IS_WIN_PHONE = /(?:Windows Phone)/.test(USER_AGENT);
const IS_SYMBIAN = /(?:SymbianOS)/.test(USER_AGENT);
const IS_IOS = /iPad/i.test(USER_AGENT) || /iPhone/i.test(USER_AGENT) || /iPod/i.test(USER_AGENT);

export const IS_H5 = IS_ANDROID || IS_WIN_PHONE || IS_SYMBIAN || IS_IOS;

export const IS_PC = IN_BROWSER && !IS_H5;
