import { TUILogin } from '@tencentcloud/tui-core-lite';
import { useLoginState } from "@/uni_modules/tuikit-atomic-x/state/LoginState";
import { pushService } from "./pushService";
import { genTestUserSig } from "@/debug/GenerateTestUserSig.js";
import { DEFAULT_USER_NAMES, DEFAULT_AVATAR } from "./constants";
import { ref } from "vue";

import type { LoginInfo, StorageUserInfo } from "./types";

const {
  loginUserInfo: loginAtomicxUserInfo,
  login,
  logout: logoutAtomicx,
  setSelfInfo
} = useLoginState();

const loginUserInfo = ref<StorageUserInfo | null>(null);

// 初始化时从 storage 读取用户信息
const initLoginUserInfo = (): void => {
  uni?.getStorage({
    key: 'userInfo',
    success: (res: { data: StorageUserInfo }) => {
      if (res.data) {
        loginUserInfo.value = res.data;
      }
    },
  });
};

// 模块加载时立即初始化
initLoginUserInfo();

export { loginUserInfo, initLoginUserInfo };

let vueVersion: number = 2;
// #ifdef VUE3
vueVersion = 3;
// #endif

const loginChat = (loginInfo: LoginInfo): Promise<any> => {
  return TUILogin.login({
    SDKAppID: loginInfo.sdkAppId,
    userID: loginInfo.userId,
    userSig: loginInfo.userSig,
    framework: `vue${vueVersion}`
  });
};

const loginCall = (loginInfo: LoginInfo): Promise<Record<string, never>> => {
  return new Promise((resolve, reject) => {
    uni.$TUICallKit.login({
      SDKAppID: loginInfo.sdkAppId,
      userID: loginInfo.userId,
      userSig: loginInfo.userSig,
      success: () => {
        uni.$TUICallKit.enableMultiDeviceAbility()
        resolve({});
      },
      fail: (errCode: number, errMsg: string) => {
        reject({
          code: errCode,
          msg: errMsg
        });
      },
    });
  })
};

const loginAtomicx = (loginInfo: LoginInfo): Promise<Record<string, never>> => {
  return new Promise((resolve, reject) => {
    uni.$userID = loginInfo.userId;
    uni.$liveID = `live_${loginInfo.userId}`;
    login({
      sdkAppID: loginInfo.sdkAppId,
      userID: loginInfo.userId,
      userSig: loginInfo.userSig,
      success: () => {
        if (!loginAtomicxUserInfo?.value?.nickname) {
          setSelfInfo({
            userProfile: {
              userID: loginInfo.userId,
              nickname: DEFAULT_USER_NAMES[Math.floor(Math.random() * DEFAULT_USER_NAMES.length)],
              avatarURL: DEFAULT_AVATAR,
            },
          });
        }
        resolve({});
      },
      fail: (errCode: number, errMsg: string) => {
        reject({
          code: errCode,
          msg: errMsg
        });
      },
    });
  })
};

/**
 * 使用 userID 登录（通过 debug 生成 userSig）
 * @param params 包含 userId 的参数对象
 */
export const loginKit = async (params: { userId: string }): Promise<void> => {
  const { userId } = params;
  
  if (!userId) {
    throw new Error('userId is required');
  }
  
  const { SDKAppID, userSig } = genTestUserSig(userId);
  
  const loginInfo: LoginInfo = {
    sdkAppId: SDKAppID,
    userId: userId,
    userSig: userSig,
  };
  
  try {
    await loginChat(loginInfo);
    await loginCall(loginInfo);
    await loginAtomicx(loginInfo);
    pushService.login(loginInfo);
    
    loginUserInfo.value = {
      apaasUserId: userId,
      token: userSig,
      userId: userId,
    };
    
    uni?.setStorage({
      key: 'userInfo',
      data: loginUserInfo.value,
    });
    
    uni.reLaunch({
      url: '/pages/index/index',
      complete: () => {
        uni?.hideLoading();
      }
    });
  } catch (error) {
    console.error('loginKit error', error);
    throw error;
  }
};

/**
 * 从 storage 恢复登录
 */
export const loginFromStorage = (): void => {
  uni?.getStorage({
    key: 'userInfo',
    success: (res: { data: StorageUserInfo }) => {
      if (res.data && res.data.userId) {
        uni.showLoading({ title: '登录中...' });
        loginKit({ userId: res.data.userId })
          .catch(() => {
            uni.showToast({
              title: '登录失败，请重新登录',
              icon: 'none'
            });
            uni?.removeStorage({ key: 'userInfo' });
            loginUserInfo.value = null;
          });
      }
    },
  });
};

const logoutChat = (): Promise<void> => {
  return TUILogin.logout();
};

const logoutTRTC = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    logoutAtomicx({
      success: () => {
        console.warn('logout success');
        resolve();
      },
      fail: (code: number, message: string) => {
        reject({ code, message });
      }
    });
  });
};

export const logoutKit = async (): Promise<void> => {
  try {
    await logoutChat();
    await logoutTRTC();
    loginUserInfo.value = null;
    uni?.removeStorage({ key: 'userInfo' });
  } catch (error) {
    console.error('logoutKit error', error);
    throw error;
  }
};
