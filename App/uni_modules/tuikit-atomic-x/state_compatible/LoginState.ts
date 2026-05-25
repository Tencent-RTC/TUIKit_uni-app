/**
 * @module LoginState (Vue2 适配版)
 * @module_description
 * 用户身份认证与登录管理模块
 */
import { safeJsonParse } from "../utils/utsUtils";
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore — uni-app 编译器会正确解析 UTS 插件路径，TS 类型检查可忽略
import { addListener, callAPI, removeListener, reportUIPlatform } from "../utils/tuikitBridge";

/**
 * 用户权限类型
 */
export enum AllowType {
  ALLOW_ANY = 0,
  NEED_CONFIRM = 1,
  DENY_ANY = 2,
}

/**
 * 性别类型
 */
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

/**
 * 用户资料参数
 */
export type UserProfileParam = {
  userID?: string;
  nickname?: string;
  avatarURL?: string;
  selfSignature?: string;
  gender?: Gender;
  role?: number;
  level?: number;
  birthday?: number;
  allowType?: AllowType;
};

/**
 * 登录参数
 */
export type LoginOptions = {
  sdkAppID: number;
  userID: string;
  userSig: string;
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
};

/**
 * 登出参数
 */
export type LogoutOptions = {
  success?: () => void;
  fail?: (errCode: number, errMsg: string) => void;
};

/**
 * 设置用户信息参数
 */
export type SetSelfInfoOptions = {
  userProfile: UserProfileParam;
  success?: (data?: any) => void;
  fail?: (errCode: number, errMsg: string) => void;
};

declare const uni: any;

// Vue2 响应式状态接口
interface LoginReactiveState {
  loginUserInfo: UserProfileParam | undefined;
  loginStatus: string | undefined;
}

// 全局状态存储 key
const LOGIN_STATE_KEY = '__TUIKIT_LOGIN_STATE__';

// 初始化全局状态存储 (Vue2 使用 Vue.observable)
function getGlobalState(): { state: LoginReactiveState; bindEventDone: boolean } {
  if (!uni[LOGIN_STATE_KEY]) {
    uni[LOGIN_STATE_KEY] = {
      state: makeReactive<LoginReactiveState>({
        loginUserInfo: undefined,
        loginStatus: undefined,
      }),
      bindEventDone: false
    };
  }
  return uni[LOGIN_STATE_KEY];
}

const createStoreParams = JSON.stringify({
  storeName: "login",
  id: ''
});

/**
 * 登录方法
 */
function login(params: LoginOptions): void {
  reportUIPlatform();
  callAPI(JSON.stringify({
    api: "login",
    params: {
      createStoreParams: createStoreParams,
      sdkAppID: params.sdkAppID,
      userID: params.userID,
      userSig: params.userSig
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.warn('--> ', data);

      if (data && data.code === 0) {
        if (params && params.success) { params.success(); }
      } else {
        if (params && params.fail) { params.fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (params && params.fail) { params.fail(-1, error.message); }
    }
  });
}

/**
 * 登出方法
 */
function logout(params?: LogoutOptions): void {
  callAPI(JSON.stringify({
    api: "logout",
    params: {
      createStoreParams: createStoreParams,
    }
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.warn('logout data', data);
      if (data && data.code === 0) {
        clearLoginState();
        if (params && params.success) { params.success(); }
      } else {
        if (params && params.fail) { params.fail(data.code, data.message); }
      }
    } catch (error: any) {
      if (params && params.fail) { params.fail(-1, error.message); }
    }
  });
}

/**
 * 清除登录状态数据
 */
function clearLoginState(): void {
  unbindEvent();
  const globalState = getGlobalState();
  globalState.state.loginUserInfo = undefined;
  globalState.state.loginStatus = undefined;
  globalState.bindEventDone = false;
}

/**
 * 解除事件监听
 */
function unbindEvent(): void {
  const dataNames = ["loginStatus", "loginUserInfo"];

  dataNames.forEach(name => {
    removeListener({
      type: "",
      store: "LoginStore",
      name,
      params: {
        createStoreParams: createStoreParams
      }
    });
  });
}

/**
 * 设置用户信息
 */
function setSelfInfo(params: SetSelfInfoOptions): void {
  const { success, fail, ...userProfile } = params;
  callAPI(JSON.stringify({
    api: "setSelfInfo",
    params: userProfile
  }), (res: string) => {
    try {
      const data = safeJsonParse(res, {}) as any;
      console.warn('setSelfInfo data', data);
      if (data && data.code === 0) {
        if (success) { success(data); }
      } else {
        if (fail) { fail(data.code, data.message); }
      }
    } catch (error: any) {
      console.warn('setSelfInfo error', error);
      if (fail) { fail(error.code, error.message); }
    }
  });
}

function getLoginUserInfo(): UserProfileParam | undefined {
  return getGlobalState().state.loginUserInfo;
}

function bindEvent(): void {
  const globalState = getGlobalState();
  if (globalState.bindEventDone) {
    return;
  }
  globalState.bindEventDone = true;

  addListener({
    type: '',
    store: "LoginStore",
    name: "loginStatus",
    listenerID: "login",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data: any) => {
    console.warn('====> 登录结果', data);
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.loginStatus = result.loginStatus;
      console.log(`[loginStatus listener] Data:`, result);
    } catch (error: any) {
      console.error(`[loginStatus listener] Error:`, error);
    }
  });

  addListener({
    type: '',
    store: "LoginStore",
    name: "loginUserInfo",
    listenerID: "login",
    params: {
      createStoreParams: createStoreParams
    }
  }, (data: any) => {
    try {
      const result = safeJsonParse<any>(data, {});
      globalState.state.loginUserInfo = safeJsonParse<any>(result.loginUserInfo, {});
      console.log(`[loginUserInfo listener] Data:`, globalState.state.loginUserInfo);
    } catch (error: any) {
      console.error(`[loginUserInfo listener] Error:`, error);
    }
  });
}

export function useLoginState() {
  bindEvent();
  const globalState = getGlobalState();
  return {
    /** 响应式状态对象 (Vue2 直接访问属性即可) */
    state: globalState.state,

    login,
    logout,
    setSelfInfo,
    getLoginUserInfo,
  };
}

export default useLoginState;
