import type { PinConversationParams, MuteConversationParams, SetConversationDraftParams, MarkConversationParams, DeleteConversationParams } from '../../type';

/**
 * @interface TUIConversationService
*/
export interface ITUIConversationService {

  /**
   * 初始化 Service
   * @private
   */
  init(): void;

  /**
   * 切换会话
   * @function
   * @param {String} conversationID 会话 ID，conversationID 生成规则：单聊（`C2C${userID}`），群聊（`GROUP${groupID}`）。
   * @example
   * // 切换到 public001 群会话
   * let promise = TUIConversationService.switchConversation('GROUPpublic001');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  switchConversation(conversationID: string): Promise<any>;

  /**
   * 获取会话列表
   * @function
   * @private
   */
  getConversationList(): Promise<any>;

  /**
   * 获取会话资料
   * 注意：Service API 主要用于跨组件时调用
   * @function
   * @param {String} conversationID 会话 ID
   * @example
   * // 获取 public001 群会话资料
   * let promise = TUIConversationService.getConversationProfile('GROUPpublic001');
   * promise.then((chatResponse) => {
   *  console.log(chatResponse.data.conversation); // 会话资料
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getConversationProfile(conversationID: string): Promise<any>;

  /**
   * 设置会话已读上报
   * @function
   * @param {String} conversationID 会话 ID
   * @example
   * let promise = TUIConversationService.setMessageRead('GROUPpublic001');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setMessageRead(conversationID: string): Promise<any>;

  /**
   * 一键清空历史消息
   * @function
   * @param {String} conversationID 会话 ID
   * @example
   * @private
   */
  clearHistoryMessage(conversationID: string): Promise<any>;
}
