import { ref } from "vue";
import {
  LoginUserInfoParam,
  LoginOptions,
  SetSelfInfoOptions,
  LogoutOptions,
} from "@/uni_modules/ui-component";

import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";

// ============== 导出的枚举类型定义 ==============

/**
 * 登录状态码枚举
 * 对应底层SDK返回的数字状态码
 */
export const LoginStatusCode = {
  LOGGED_IN: 0,
  LOGGED_OUT: 1,
  USER_SIG_EXPIRED: 2,
  KICKED_OFFLINE: 3,
} as const;

/**
 * 登录状态枚举常量
 * 对应登录状态的字符串值
 */
export const LoginStatus = {
  LOGGED_IN: 'LOGGED_IN',
  LOGGED_OUT: 'LOGGED_OUT',
  USER_SIG_EXPIRED: 'USER_SIG_EXPIRED',
  KICKED_OFFLINE: 'KICKED_OFFLINE',
} as const;

/**
 * 登录状态类型
 * 对应登录状态的字符串联合类型
 */
export type LoginStatusType = typeof LoginStatus[keyof typeof LoginStatus];

/**
 * 登录状态码类型
 * 对应底层SDK返回的数字状态码
 */
export type LoginStatusCodeType = typeof LoginStatusCode[keyof typeof LoginStatusCode];

/**
 * 状态码到状态字符串的映射
 */
const LOGIN_STATUS_MAP: Record<LoginStatusCodeType, LoginStatusType> = {
  [LoginStatusCode.LOGGED_IN]: LoginStatus.LOGGED_IN,
  [LoginStatusCode.LOGGED_OUT]: LoginStatus.LOGGED_OUT,
  [LoginStatusCode.USER_SIG_EXPIRED]: LoginStatus.USER_SIG_EXPIRED,
  [LoginStatusCode.KICKED_OFFLINE]: LoginStatus.KICKED_OFFLINE,
} as const;

// ============== 响应式状态定义 ==============

const loginUserInfo = ref<LoginUserInfoParam>();
const loginState = ref<LoginStatusType>();

// ============== 工具函数 ==============

/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
function callUTSFunction(funcName: string, args?: any): void {
  // 创建默认的日志callback
  const defaultCallback = {
    success: (res?: string) => {
      console.log(`[${funcName}] Success:`, {
        funcName,
        args: JSON.stringify(args),
        result: res,
      });
    },
    fail: (errCode?: number, errMsg?: string) => {
      console.error(`[${funcName}] Failed:`, {
        funcName,
        args: JSON.stringify(args),
        errCode,
        errMsg,
      });
    },
  };

  // 准备最终的参数对象
  let finalArgs = args || {};

  // 如果args中没有callback，则添加默认callback
  if (!finalArgs.success && !finalArgs.fail) {
    finalArgs = {
      ...finalArgs,
      ...defaultCallback,
    };
  }

  // 直接调用UTS层
  try {
    console.log(`[${funcName}] Calling with args:`, finalArgs);

    // 直接传递对象给UTS层
    getV2RTCRoomEngineManager()[funcName](finalArgs);
  } catch (error) {
    console.error(`[${funcName}] Error calling UTS function:`, error);
    // 如果有失败回调，调用它
    if (finalArgs.fail) {
      finalArgs.fail(-1, `Failed to call ${funcName}: ${error}`);
    }
  }
}

/**
 * 安全的JSON解析函数
 * @param jsonString JSON字符串
 * @param defaultValue 解析失败时的默认值
 */
function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}

/**
 * 将状态码转换为状态字符串
 * @param statusCode 状态码
 */
function mapStatusCodeToLoginStatus(statusCode: number): LoginStatusType | null {
  const mappedStatus = LOGIN_STATUS_MAP[statusCode as LoginStatusCodeType];
  if (!mappedStatus) {
    console.warn(`Unknown login status code: ${statusCode}`);
    return null;
  }
  return mappedStatus;
}

// ============== 业务方法封装 ==============

/**
 * 登录方法
 * @param params 登录参数
 */
function login(params: LoginOptions): void {
  callUTSFunction("login", params);
}

/**
 * 登出方法
 * @param params 登出参数
 */
function logout(params?: LogoutOptions): void {
  callUTSFunction("logout", params || {});
}

/**
 * 设置用户信息
 * @param userInfo 用户信息
 */
function setSelfInfo(userInfo: SetSelfInfoOptions): void {
  callUTSFunction("setSelfInfo", userInfo);
}

// ============== 事件处理 ==============

/**
 * 登录状态变化事件处理
 * @param eventName 事件名称
 * @param res 响应数据
 */
const onLoginStoreChanged = (eventName: string, res: string): void => {
  try {
    if (eventName === "loginUserInfo") {
      const data = safeJsonParse<LoginUserInfoParam>(res, {});
      loginUserInfo.value = data;
    } else if (eventName === "loginStatus") {
      const statusCode = safeJsonParse<number>(res, -1);
      const status = mapStatusCodeToLoginStatus(statusCode);

      if (status) {
        loginState.value = status;
      } else {
        console.error(`Invalid login status code received: ${statusCode}`);
      }
    }
  } catch (error) {
    console.error("onLoginStoreChanged error:", error);
  }
};

/**
 * 绑定事件监听
 */
function bindEvent(): void {
  getV2RTCRoomEngineManager().on("loginStoreChanged", onLoginStoreChanged, '');
}

// ============== Composition API 导出 ==============

/**
 * 登录状态管理的Composition API
 */
export function useLoginState() {
  bindEvent();

  return {
    // 响应式状态
    loginUserInfo,
    loginState,

    // 操作方法
    login,
    logout,
    setSelfInfo,

    // 工具方法
    callUTSFunction,
  };
}

export default useLoginState;
