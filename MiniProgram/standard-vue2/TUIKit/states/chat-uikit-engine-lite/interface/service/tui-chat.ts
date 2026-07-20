import type { Message } from '@tencentcloud/lite-chat/basic';
import type TUIBase from '../../tui-base';
import type {
  SendMessageParams,
  GetMessageListParams,
  SendMessageOptions,
  GetMessageListHoppingParams,
} from '../../type';
import type { IMessageHandler } from './message-handler';

/**
 * @interface TUIChatService
*/
export interface ITUIChatService extends TUIBase {
  messageHandler: IMessageHandler;

  /**
   * 初始化 Service
   * @function
   * @private
   */
  init: () => void;

  /**
   * 更新 store 里的 messageList
   * @param messageList 要进行更新的 messageList
   * @param type 更新类型
   * @private
   */
  updateMessageList(messageList: Message[], type: string): void;

  /**
   * 发送文本消息
   * @function
   * @param {SendMessageParams} options 文本消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送普通文本消息
   * let promise = TUIChatService.sendTextMessage({
   *  payload: {
   *    text: 'Hello world!'
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   * @example
   * // 发送普通文本消息并携带消息自定义数据
   * let promise = TUIChatService.sendTextMessage({
   *  payload: {
   *    text: 'Hello world!'
   *  },
   *  cloudCustomData: 'your cloud custom data'
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendTextMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 发送附带 @ 提醒功能的文本消息
   * @function
   * @param {SendMessageParams} options 附带 @ 提醒功能的文本消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送 @ 消息
   * let promise = TUIChatService.sendTextAtMessage({
   *  payload: {
   *    text: '@denny @lucy @所有人 今晚聚餐，收到的请回复1',
   *    atUserList: ['denny', 'lucy', TUIChatEngine.TYPES.MSG_AT_ALL] // 'denny' 'lucy' 都是 userID，而非昵称
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendTextAtMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 发送图片消息
   * @function
   * @param {SendMessageParams} options 图片消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送图片消息
   * let promise = TUIChatService.sendImageMessage({
   *  payload: {
   *    file: file
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendImageMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 发送音频消息
   * @function
   * @param {SendMessageParams} options 音频消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送音频消息
   * let promise = TUIChatService.sendAudioMessage({
   *  payload: {
   *    file: file
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendAudioMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 发送视频消息
   * @function
   * @param {SendMessageParams} options 视频消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送视频消息
   * let promise = TUIChatService.sendVideoMessage({
   *  payload: {
   *    file: file
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendVideoMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 发送自定义消息
   * @function
   * @param {SendMessageParams} options 自定义消息相关参数
   * @param {SendMessageOptions}[sendMessageOptions] 消息发送选项
   * @example
   * // 发送自定义消息
   * let promise = TUIChatService.sendCustomMessage({
   *  payload: {
   *   data: 'dice', // 用于标识该消息是骰子类型消息
   *   description: String(random(1,6)), // 获取骰子点数
   *   extension: ''
   *  },
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  sendCustomMessage(
    options: SendMessageParams,
    sendMessageOptions?: SendMessageOptions,
  ): Promise<any>;

  /**
   * 重发消息的接口，当消息发送失败时，可调用该接口进行重发
   * @function
   * @param {Message} message 需要重发的消息对象
   * @private
   */
  resendMessage(message: Message): Promise<any>;

  /**
   * 分页拉取指定会话的消息列表的接口，当用户进入会话首次渲染消息列表或者用户“下拉查看更多消息”时，需调用该接口。
   * @function
   * @param {GetMessageListParams} [options] 获取漫游消息参数
   * @example
   * let promise = TUIChatService.getMessageList();
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getMessageList(options?: GetMessageListParams): Promise<any>;

  /**
   * 根据指定的消息 sequence 或 消息时间拉取会话的消息列表
   * @function
   * @param {GetMessageListHoppingParams} options 消息实例
   * @private
   */
  getMessageListHopping(options?: GetMessageListHoppingParams): Promise<any>;

  /**
   * 清空单聊或群聊本地及云端的消息（不删除会话）
   * @function
   * @param {conversationID} string 会话 ID
   * @example
   * // 清空群聊 groupID 为 test 的历史消息
   * let promise = TUIChatService.clearHistoryMessage('GROUPtest');
   * promise.then((chatResponse) => {
   *  const { result } = chatResponse.data;
   * });
   */
  clearHistoryMessage(conversationID: string): Promise<any>;
}
