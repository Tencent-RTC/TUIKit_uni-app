// 公共常量定义

/**
 * 推送服务 AppKey
 */
export const PUSH_APP_KEY = 'dKx5LDagSFaeZVq1dNk0u0u9CLoWkF9yzPGPqkdKRSsDwG3d7hpgvPL2QfsxpYsL';

/**
 * APaaS 应用 ID
 */
export const APAAS_APPID = '1017658747';

/**
 * 腾讯云验证码 AppID
 */
export const CAPTCHA_APPID = '2079625916';

/**
 * 错误码消息映射
 */
export const ERROR_CODE_MESSAGES: Record<number, string> = {
  98: '验证用户操作或参数错误',
  99: '后端未知的系统错误',
  100: '后端依赖的服务不可用',
  101: '后端服务返回的结果不符合规范',
  102: 'SMS发送短信服务失败',
  103: '操作失败',
  104: '邮件发送失败',
  200: '用户登录失败，错误的验证码。',
  201: '验证码过期（5分钟内有效）',
  202: '验证码已经使用多次（最多3次）',
  203: '用户信息已失效，请重新登录',
  204: '用户信息已失效，请重新登录',
  205: '用户的信息为空',
  206: '用户不存在',
  207: '给用户发送邮件时参数错误',
  208: '用户查询时参数错误',
  209: '用户查询数据过多，触发限流',
  210: '用户OAuth参数异常',
};

/**
 * API 接口地址
 */
export const API_URLS = {
  /** 图片验证码验证接口 */
  USER_VERIFY_BY_PICTURE: 'https://demos.trtc.tencent-cloud.com/prod/base/v1/auth_users/user_verify_by_picture',
  /** 验证码登录接口 */
  USER_LOGIN_CODE: 'https://demos.trtc.tencent-cloud.com/prod/base/v1/auth_users/user_login_code',
  /** Token 登录接口 */
  USER_LOGIN_TOKEN: 'https://demos.trtc.tencent-cloud.com/prod/base/v1/auth_users/user_login_token',
  /** 腾讯验证码脚本 */
  CAPTCHA_SCRIPT: 'https://turing.captcha.qcloud.com/TCaptcha.js',
};