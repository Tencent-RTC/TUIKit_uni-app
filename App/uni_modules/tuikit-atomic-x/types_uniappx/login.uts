/**
 * 登录相关类型定义
 * @module login
 *
 * 对齐底层 atomicxcore.api.login.LoginStore.kt
 */
import type { UserProfile } from './userProfile';

/**
 * 登录状态（对齐 LoginStatus，整数枚举）
 *
 * 注：底层只有 UNLOGIN / LOGINED 两值；旧版 LOGING（登录中）保留为前端 UI 状态
 */
export enum LoginStatus {
  /** 未登录（V2TIM_STATUS_LOGOUT） */
  UNLOGIN = 0,
  /** 已登录（V2TIM_STATUS_LOGINED） */
  LOGINED = 1,
  /**
   * 登录中（前端 UI 状态，底层无对应值）
   * @deprecated 业务侧用 isLoading 标志位表达，避免依赖此值
   */
  LOGING = 2,
}

/**
 * 登录监听器（对齐 LoginListener）
 *
 * 用于监听被踢下线 / Token 过期事件
 */
export interface LoginListener {
  /** 当前用户被踢下线 */
  onKickedOffline?: () => void;
  /** 登录票据过期 */
  onLoginExpired?: () => void;
}

/**
 * 登录状态数据（对齐 LoginState）
 */
export interface LoginStateData {
  loginStatus: LoginStatus;
  loginUserInfo?: UserProfile;
}

// ==================== 登录参数 ====================

/**
 * 登录参数
 */
export interface LoginParams {
  sdkAppID: number;
  userID: string;
  userSig: string;
}

/**
 * 离线推送证书配置（对齐 setCertificateID 入参 keys）
 */
export interface PushCertificateConfig {
  huaweiCertificateId?: string;
  xiaomiCertificateId?: string;
  xiaomiAppId?: string;
  xiaomiAppKey?: string;
  oppoCertificateId?: string;
  oppoAppKey?: string;
  oppoAppSecret?: string;
  vivoCertificateId?: string;
  honorCertificateId?: string;
  meizuCertificateId?: string;
  meizuAppId?: string;
  meizuAppKey?: string;
  fcmCertificateId?: string;
}
