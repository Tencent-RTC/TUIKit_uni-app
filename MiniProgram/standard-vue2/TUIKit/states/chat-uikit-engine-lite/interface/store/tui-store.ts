import type { StoreName } from '../../const';
import type { IConversationModel, IMessageModel } from '../model';

// 此处 Map 的 value = 1 为占位作用
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Task = Record<StoreName, Record<string, Map<(data?: unknown) => void, 1>>>;

export interface IOptions {
  [key: string]: (newData?: any) => void;
}
// 自定义 store 暂不支持
// @property {ICustomStore} customStore 自定义 store，可根据业务需要通过以下 API 进行数据操作。
/**
 * @class TUIStore
*/
export interface ITUIStore {
  task: Task;
  /**
   * UI 组件注册监听
   * @function
   * @param {StoreName} storeName store 名称
   * @param {IOptions} options UI 组件注册的监听信息
   * @example
   * // UI 层监听会话列表更新通知
   * let onConversationListUpdated = function(conversationList) {
   *   console.warn(conversationList);
   * }
   * TUIStore.watch(StoreName.CONV, {
   *   conversationList: onConversationListUpdated,
   * })
   */
  watch(storeName: StoreName, options: IOptions): void;

  /**
   * UI 组件取消监听回调
   * 注意：取消监听时传入的回调函数和注册监听的回调函数是同一个
   * @function
   * @param {StoreName} storeName store 名称
   * @param {IOptions} options 监听信息，包含需要取消的回调等
   * @example
   * // UI 层取消监听会话列表更新通知
   * TUIStore.unwatch(StoreName.CONV, {
   *   conversationList: onConversationListUpdated,
   * })
   */
  unwatch(storeName: StoreName, options: IOptions): void;

  /**
   * 更新 store
   * - 使用自定义 store 时，可以用此 API 更新自定义数据
   * @function
   * @param {StoreName} storeName store 名称
   * @param {String} key 需要更新的 key
   * @param {any} data 待更新的数据
   * @example
   * // UI 层更新自定义 Store 数据
   * const data: string = '自定义数据'
   * TUIStore.update(StoreName.CUSTOM, 'customKey', data)
   */
  update(storeName: StoreName, key: string, data: any): void;

  /**
   * 获取 store 中的数据
   * @function
   * @param {StoreName} storeName store 名称
   * @param {String} key 需要获取的 key
   * @private
   */
  getData(storeName: StoreName, key: string): any;

  /**
   * 获取 conversationModel
   * @function
   * @param {string} conversationID 会话 ID
   * @example
   * // 获取 conversationModel
   * const conversationID = 'C2C9241'
   * const conversationModel = TUIStore.getConversationModel(conversationID);
  */
  getConversationModel(conversationID: string): IConversationModel;

  /**
   * 获取 messageModel
   * @function
   * @param {string} messageID 消息 ID
   * @example
   * // 获取 messageModel
   * const messageID = '144115225790497300-1686557023-31267600'
   * const messageModel = TUIStore.getMessageModel(messageID);
  */
  getMessageModel(messageID: string): IMessageModel;

  /**
   * 重置 store 内数据
   * @function
   * @param {StoreName} storeName store 名称
   * @param {Array<string>} keyList 需要 reset 的 keyList
   * @param {boolean} isNotificationNeeded 是否需要触发更新
   * @private
   */
  reset(storeName: StoreName, keyList?: string[], isNotificationNeeded?: boolean): void;
}
