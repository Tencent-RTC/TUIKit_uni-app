/**
 * @module LoginState
 * @module_description
 * 用户身份认证与登录管理模块
 * 核心功能：负责用户身份验证、登录状态管理、用户信息维护等基础认证服务。
 * 技术特点：支持多种认证方式、会话管理、权限验证等高级功能，确保用户身份的安全和有效。
 * 业务价值：为直播平台提供基础的用户认证能力，是所有其他业务模块的前置条件。
 * 应用场景：用户登录、身份验证、会话管理、权限控制等基础认证场景。
 */
import { ref, type Ref } from "vue";
import { UserProfileParam, LoginOptions, LogoutOptions, SetSelfInfoOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { addListener, callAPI, removeListener } from "@/uni_modules/tuikit-atomic-x";

declare const uni: any;

// 全局状态存储 key
const LOGIN_STATE_KEY = '__TUIKIT_LOGIN_STATE__';

// 初始化全局状态存储
function getGlobalState() {
  if (!uni[LOGIN_STATE_KEY]) {
    uni[LOGIN_STATE_KEY] = {
      loginUserInfo: ref<UserProfileParam>(),
      loginStatus: ref<string>(),
      bindEventDone: false
    };
  }
  return uni[LOGIN_STATE_KEY];
}

/**
 * 当前登录用户信息
 * @type {Ref<UserProfileParam>}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { loginUserInfo } = useLoginState();
 * 
 * // 监听用户信息变化
 * watch(loginUserInfo, (newUserInfo) => {
 *   if (newUserInfo) {
 *     console.log('用户信息更新:', newUserInfo);
 *     console.log('用户ID:', newUserInfo.userID);
 *     console.log('用户昵称:', newUserInfo.nickname);
 *     console.log('用户头像:', newUserInfo.avatarURL);
 *   }
 * });
 * 
 * // 获取当前用户信息
 * const currentUser = loginUserInfo.value;
 * if (currentUser) {
 *   console.log('当前登录用户:', currentUser.nickname);
 * }
 */
const loginUserInfo: Ref<UserProfileParam | undefined> = getGlobalState().loginUserInfo;

/**
 * 当前登录状态
 * @type {Ref<string>}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { logout } = useLoginState();
 * logout({
 *   onSuccess: () => console.log('登出成功'),
 *   onError: (error) => console.error('登出失败:', error)
 * });
 */
const loginStatus: Ref<string | undefined> = getGlobalState().loginStatus;

const createStoreParams = JSON.stringify({
  storeName: "login",
  id: ''
})

/**
 * 登录方法
 * @param {LoginOptions} params - 登录参数
 * @returns {void}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { login } = useLoginState();
 * login({
 *   sdkAppID: 1400000000,
 *   userID: 'user123',
 *   userSig: 'eJx1kF1PwzAMhv9KlG...',
 *   onSuccess: () => console.log('登录成功'),
 *   onError: (error) => console.error('登录失败:', error)
 * });
 */
function login(params: LoginOptions): void {
    callAPI({
        api: "login",
        params: {
          createStoreParams: createStoreParams,
          sdkAppID: params.sdkAppID,
          userID: params.userID,
          userSig: params.userSig
        }
    }, (res: string) =>{
        try {
          const data = safeJsonParse(res, {}) as any;
          console.warn('--> ', data)
          
          if (data?.code === 0) {
              params?.success();
          } else {
              params?.fail(data.code, data.message);
          }
        } catch (error) {
          params?.fail(-1, error.message);
        }

    });
}

/**
 * 登出方法
 * @param {LogoutOptions} [params] - 登出参数（可选）
 * @returns {void}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { logout } = useLoginState();
 * logout({
 *   onSuccess: () => console.log('登出成功'),
 *   onError: (error) => console.error('登出失败:', error)
 * });
 */
function logout(params?: LogoutOptions): void {
    callAPI({
        api: "logout",
        params: {
            createStoreParams: createStoreParams,
        }
    }, (res: string) =>{
        try {
            const data = safeJsonParse(res, {}) as any;
			console.warn('logout data', data)
            if (data?.code === 0) {
                // 清除登录状态数据
                clearLoginState();
                params?.success();
            } else {
                params?.fail(data.code, data.message);
            }
        } catch (error) {
            params?.fail(-1, error.message);
        }
    });
}

/**
 * 清除登录状态数据
 * @returns {void}
 * @memberof module:LoginState
 */
function clearLoginState(): void {
    // 解除事件绑定
    unbindEvent();
    
    const globalState = getGlobalState();
    // 清除用户信息
    globalState.loginUserInfo.value = undefined;
    globalState.loginStatus.value = undefined;
    // 重置绑定标志，允许下次登录重新绑定
    globalState.bindEventDone = false;
}

/**
 * 解除事件监听
 * @returns {void}
 * @memberof module:LoginState
 */
function unbindEvent(): void {
    const dataNames = ["loginStatus", "loginUserInfo"];
    
    dataNames.forEach(name => {
      removeListener({
		    type: "",
        store: "LoginState",
        name,
        params: {
          createStoreParams: createStoreParams
        }
      });
    });
}

/**
 * 设置用户信息
 * @param {SetSelfInfoOptions} userInfo - 用户信息
 * @returns {void}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { setSelfInfo } = useLoginState();
 * setSelfInfo(
 *  userProfile: {
 *   userID: 'user123',
 *   nickname: '张三',
 *   avatarURL: 'https://example.com/avatar.jpg',
 *   onSuccess: () => console.log('用户信息设置成功'),
 *   onError: (error) => console.error('用户信息设置失败:', error)
 * });
 */
function setSelfInfo(params: SetSelfInfoOptions): void {
    const { onSuccess, onError, ...userProfile} = params;
    callAPI({
        api: "setSelfInfo",
        params: userProfile,
    }, (res: string) =>{
        try {
            const data = safeJsonParse(res, {}) as any;
            if (data?.code === 0) {
                onSuccess?.(data);
            } else {
                onError?.(data);
            }
        } catch (error) {
            
        }

    });
}

function getLoginUserInfo(): UserProfileParam | undefined {
    return loginUserInfo.value;
}

function bindEvent(): void {
    const globalState = getGlobalState();
    // 防止重复绑定事件
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
    }, (data) => {
      console.warn('====> 登录结果', data)
      try {
        const result = safeJsonParse<any>(data, {});
        loginStatus.value = result.loginStatus;
        console.log(`[loginStatus listener] Data:`, result);
      } catch (error) {
        console.error(`[loginStatus listener] Error:`, error);
      }
    })


    addListener({
      type: '',
      store: "LoginStore",
      name: "loginUserInfo",
      listenerID: "login",
      params: {
        createStoreParams: createStoreParams
      }
    }, (data) => {
      try {
        const result = safeJsonParse<any>(data, {});
        loginUserInfo.value = safeJsonParse<any>(result.loginUserInfo, {}); 
        console.log(`[loginUserInfo listener] Data:`, loginUserInfo.value);
      } catch (error) {
        console.error(`[loginUserInfo listener] Error:`, error);
      }
    })
}

export function useLoginState() {
    bindEvent();
    return {
        loginUserInfo,     // 当前登录用户信息
        loginStatus,       // 当前登录状态

        login,             // 登录方法
        logout,            // 登出方法
        setSelfInfo,       // 设置用户信息
        getLoginUserInfo,  // 获取登录用户信息
    };
}

export default useLoginState;