// 公共类型定义

/**
 * 登录信息接口
 */
export interface LoginInfo {
  sdkAppId: number;
  userId: string;
  userSig: string;
  apaasUserId?: string;
  token?: string;
  nickname?: string;
  avatarURL?: string;
  appKey?: string;
}

/**
 * 存储的用户信息接口
 */
export interface StorageUserInfo {
  apaasUserId: string;
  token: string;
  userId?: string;
}

/**
 * API 响应接口
 */
export interface ApiResponse {
  errorCode: number;
  data: LoginInfo;
}

/**
 * 通知渠道信息接口
 */
export interface NotificationChannelInfo {
  channelID: string;
  channelName: string;
  channelDesc: string;
  channelSound: string;
}

/**
 * 进入聊天配置接口
 */
export interface IEnterChatConfig {
  isLoginChat?: boolean;
  conversationID?: string;
}
