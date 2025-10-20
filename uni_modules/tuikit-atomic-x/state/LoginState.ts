/**
 * 登录状态管理
 * @module LoginState
 */
import { ref } from "vue";
import { UserProfileParam, LoginOptions, LogoutOptions, SetSelfInfoOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 当前登录用户信息
 * @type {Ref<UserProfileParam>}
 * @memberof module:LoginState
 */
const loginUserInfo = ref<UserProfileParam>();

/**
 * 当前登录状态
 * @type {Ref<string>}
 * @memberof module:LoginState
 */
const loginStatus = ref<string>();

/**
 * SDK应用ID
 * @type {Ref<number>}
 * @memberof module:LoginState
 */
const sdkAppID = ref<number>();

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
        sdkAppID,          // SDK应用ID

        login,             // 登录方法
        logout,            // 登出方法
        setSelfInfo,       // 设置用户信息
        getLoginUserInfo,  // 获取登录用户信息
    };
}

export default useLoginState;