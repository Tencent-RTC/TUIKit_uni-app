import type TUIBase from '../../tui-base';
import type { SwitchUserStatusParams, UserIDListParams, UpdateMyProfileParams } from '../../type';

/**
 * @interface TUIUserService
*/
export interface ITUIUserService extends TUIBase {

  /**
   * 初始化 Service
   * @function
   * @private
   */
  init(): void;

  /**
   * 获取用户资料
   * @function
   * @param {UserIDListParams} options [options = undefined] 用户 ID 列表，不传 options 默认查询自己的资料
   * @example
   * // 查询自己的资料
   * let promise = TUIUserService.getUserProfile();
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   * @example
   * // 查询其他用户的资料
   * let promise = TUIUserService.getUserProfile({ userIDList: ['user1', 'user2'] });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getUserProfile(options?: UserIDListParams): Promise<any>;

  /**
   * 更新自己的资料信息
   * @function
   * @param {UpdateMyProfileParams} options 参数选项
   * @example
   * // 更新自己的昵称
   * let promise = TUIUserService.updateMyProfile({
   *  nick: 'newNick'
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  updateMyProfile(options: UpdateMyProfileParams): Promise<any>;
}
