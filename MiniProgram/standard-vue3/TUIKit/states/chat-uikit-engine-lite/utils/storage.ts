import { IN_MINI_APP, APP_NAMESPACE } from './env';

/**
 * storage 中写入一条数据。若key已存在，则会覆盖已有数据。
 * @param {String} key - 缓存的key
 * @param {*} value - 任何可JSON序列化的数据
 * @param {Boolean} withPrefix 是否需要拼接 prefix 和 key，默认为 true，即需要拼接。
 */
export function setStorageItem(key: string, value: any, withPrefix = true) {
  const realKey = withPrefix ? _getKey(key) : key;
  _setStorageSync(realKey, value);
}

/**
 * 获取storage中的一条数据
 * @param {String} key - 缓存的key
 * @param {Boolean} withPrefix 是否需要拼接 prefix 和 key，默认为 true，即需要拼接。
 * @returns {any} 返回指定key的数据
 */
export function getStorageItem(key: string, withPrefix = true): any {
  try {
    const realKey: string = withPrefix ? _getKey(key) : key;
    return _getStorageSync(realKey);
  } catch (error) {
    console.warn('Storage.getStorageItem error:', error);
    return undefined;
  }
}

/**
 * 删除指定key的数据
 * @param {String} key - 缓存的key
 * @param {Boolean} withPrefix 是否需要拼接 prefix 和 key，默认为 true，即需要拼接。
 */
export function removeStorageItem(key: string, withPrefix = true) {
  try {
    const realKey = withPrefix ? _getKey(key) : key;
    _removeStorageSync(realKey);
  } catch (error) {
    console.warn('Storage.removeStorageItem error:', error);
  }
}

function _setStorageSync(key: string, data: string) {
  if (IN_MINI_APP) {
    APP_NAMESPACE.setStorageSync(key, data);
  } else if (_canIUseCookies()) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function _getStorageSync(key: string): any {
  if (IN_MINI_APP) {
    return APP_NAMESPACE.getStorageSync(key);
  }
  if (_canIUseCookies()) {
    const data: any = localStorage.getItem(key);
    if (data !== 'undefined') {
      return JSON.parse(data);
    }
  }
  return undefined;
}

function _removeStorageSync(key: string) {
  if (IN_MINI_APP) {
    APP_NAMESPACE.removeStorageSync(key);
  } else if (_canIUseCookies()) {
    localStorage.removeItem(key);
  }
}

function _getKey(key: string) {
  return `chat_engine_${key}`;
}

// 如果用户选择 block cookies，此时访问 localStorage 浏览器会抛错
// Uncaught SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document
// 通过 navigator.cookieEnabled 短路逻辑规避
function _canIUseCookies() {
  // When the browser is configured to block third-party cookies, and navigator.cookieEnabled is invoked inside a third-party iframe,
  // it returns true in Safari, Edge Spartan and IE (while trying to set a cookie in such scenario would fail).
  // It returns false in Firefox and Chromium-based browsers.
  return navigator && navigator.cookieEnabled && localStorage;
}
