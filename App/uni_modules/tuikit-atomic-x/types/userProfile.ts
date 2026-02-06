// ==================== 用户信息类型 ====================

/**
 * 性别枚举
 */
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

/**
 * 好友验证方式
 */
export enum AllowType {
  ALLOW_ANY = 0, // 允许任何人
  NEED_CONFIRM = 1, // 需要验证
  DENY_ANY = 2, // 拒绝任何人
}

/**
 * 用户资料
 */
export interface UserProfile {
  /**
   * User ID - 用户ID
   */
  userID: string;
  /**
   * Nickname - 昵称
   */
  nickname?: string;
  /**
   * Avatar URL - 头像URL
   */
  avatarURL?: string;
  /**
   * Personal signature - 个性签名
   */
  selfSignature?: string;
  /**
   * Gender - 性别
   */
  gender?: Gender;
  /**
   * Role - 角色
   */
  role?: number;
  /**
   * Level - 等级
   */
  level?: number;
  /**
   * Birthday - 生日时间戳
   */
  birthday?: number;
  /**
   * Friend verification type - 好友验证方式
   */
  allowType?: AllowType;
  /**
   * Custom information - 自定义信息
   */
  customInfo?: Record<string, Uint8Array>;
}