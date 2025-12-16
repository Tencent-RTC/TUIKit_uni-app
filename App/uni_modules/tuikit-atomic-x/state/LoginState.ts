/**
 * @module LoginState
 * @module_description
 * 用户身份认证与登录管理模块
 * 核心功能：负责用户身份验证、登录状态管理、用户信息维护等基础认证服务。
 * 技术特点：支持多种认证方式、会话管理、权限验证等高级功能，确保用户身份的安全和有效。
 * 业务价值：为直播平台提供基础的用户认证能力，是所有其他业务模块的前置条件。
 * 应用场景：用户登录、身份验证、会话管理、权限控制等基础认证场景。
 */
import { ref } from "vue";
import { UserProfileParam, LoginOptions, LogoutOptions, SetSelfInfoOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

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
const loginUserInfo = ref<UserProfileParam>();

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
const loginStatus = ref<string>();

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
    callUTSFunction("login", params);
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
    callUTSFunction("logout", params || {});
}

/**
 * 设置用户信息
 * @param {SetSelfInfoOptions} userInfo - 用户信息
 * @returns {void}
 * @memberof module:LoginState
 * @example
 * import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState';
 * const { setSelfInfo } = useLoginState();
 * setSelfInfo({
 *   userID: 'user123',
 *   nickname: '张三',
 *   avatarURL: 'https://example.com/avatar.jpg',
 *   onSuccess: () => console.log('用户信息设置成功'),
 *   onError: (error) => console.error('用户信息设置失败:', error)
 * });
 */
function setSelfInfo(userInfo: SetSelfInfoOptions): void {
    callUTSFunction("setSelfInfo", userInfo);
}

function getLoginUserInfo(): UserProfileParam | undefined {
    return loginUserInfo.value;
}

const onLoginStoreChanged = (eventName: string, res: string): void => {
    try {
        if (eventName === "loginUserInfo") {
            const data = safeJsonParse<UserProfileParam>(res, {});
            loginUserInfo.value = data;
        } else if (eventName === "loginStatus") {
            loginStatus.value = safeJsonParse<string>(res, "");
        }
    } catch (error) {
        console.error("onLoginStoreChanged error:", error);
    }
};

function bindEvent(): void {
    getRTCRoomEngineManager().on("loginStoreChanged", onLoginStoreChanged, '');
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