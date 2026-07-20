import { ref } from 'vue';
import type { LoginParams, LoginUserInfo, SetSelfInfoParams } from '../types/login';
import TencentCloudChat from '@tencentcloud/lite-chat/basic';
import conversationPlugin from '@tencentcloud/lite-chat/plugins/conversation';
import messageEnhancerPlugin from '@tencentcloud/lite-chat/plugins/message-enhancer';
import richMediaMessagePlugin from '@tencentcloud/lite-chat/plugins/rich-media-message';
import groupPlugin from '@tencentcloud/lite-chat/plugins/group';
import TUIChatEngine from './chat-uikit-engine-lite';
import { UI_PLATFORM } from '../constants/chat';
import { EVENT } from "../constants/event";
import { TUIBridge } from '../TUIBridge/index';

const loginUserInfo = ref<LoginUserInfo | null>(null);
let chat: ReturnType<typeof TencentCloudChat.create> | null = null;
async function login(options: LoginParams) {
  console.log('[loginState login] options', options)

  if (!options.userId || !options.userSig || !options.sdkAppId) {
    throw new Error('[loginState login] params error');
  }

  const { userId, userSig, sdkAppId } = options;

  try {
    chat = TencentCloudChat.create({
      SDKAppID: sdkAppId,
      scene: UI_PLATFORM.UNI_MINI_APP,
    })

    chat.use(conversationPlugin);
    chat.use(messageEnhancerPlugin);
    chat.use(richMediaMessagePlugin);
    chat.use(groupPlugin);

    await TUIChatEngine.login({
      SDKAppID: sdkAppId,
      userID: userId,
      userSig,
      chat
    })

    const params = {
      chat: chat,
      userID: userId,
      userSig,
      SDKAppID: sdkAppId,
    };

    TUIBridge.notifyEvent({ eventName: EVENT.LOGIN_SUCCESS, params });

    await getMyProfile(userId);
  } catch (error) {
    console.error('[loginState login] error', error);
    throw error;
  }
}

async function getMyProfile(userID) {
  const result = await chat?.getUserProfile({ userIDList: [userID] });
  const localUserInfo = result.data[0];
  if (!localUserInfo.value) {
    loginUserInfo.value = {
      userId: localUserInfo.userID,
      userName: localUserInfo.nick,
      avatarUrl: localUserInfo.avatar,
      customInfo: localUserInfo.profileCustomField,
    };
  }
}

async function setSelfInfo(options: SetSelfInfoParams): Promise<void> {
  const currentLoginUserInfo = loginUserInfo.value || {} as LoginUserInfo;
  if (!chat) {
    throw Error('[loginState setSelfInfo] not login');
  } else {
    const profileCustomField: any[] = [];
    if (options.customInfo) {
      Object.keys(options.customInfo).forEach((key) => {
        let customKey = key;
        if (!key.includes('Tag_Profile_Custom')) {
          customKey = `Tag_Profile_Custom_${key}`;
        }
        profileCustomField.push({
          key: customKey,
          value: options.customInfo?.[key],
        });
      });
    }
    try {
      const res = await chat.updateMyProfile({
        nick: options.userName,
        avatar: options.avatarUrl,
        profileCustomField,
      });
      loginUserInfo.value = {
        ...currentLoginUserInfo,
        ...options,
      };
      return res;
    } catch (error) {
      console.error('[loginState setSelfInfo] error', error);
      throw error;
    }
  }
}

async function logout() {
  try {
    console.log('[loginState logout]')
    await chat?.logout();
    await chat?.destroy();
    TUIBridge.notifyEvent({ eventName: EVENT.LOGOUT_SUCCESS, params: {} });
    chat = null;
  } catch (error) {
    console.error('[loginState logout] error', error);
  }
}

export function useLoginState() {
  return {
    loginUserInfo,
    login,
    logout,
    setSelfInfo
  };
}

export default useLoginState;