import type { ChatSDK } from '@tencentcloud/lite-chat/basic';
import type { LoginParams } from '../../type';
import type { IEventCenter } from './event-center';
import type {
  ITUIConversationService,
  ITUIChatService,
  ITUIGroupService,
  ITUIUserService,
} from '../service';
import type { ITUIStore } from '../store';

/**
 * @interface ITUIChatEngine
 * @property {Object} EVENT {@link https://web.sdk.qcloud.com/im/doc/v3/zh-cn/module-EVENT.html Chat SDK 定义的事件列表 }
 * @property {Object} TYPES {@link https://web.sdk.qcloud.com/im/doc/v3/zh-cn/module-TYPES.html Chat SDK 定义的类型常量}
*/
export interface ITUIChatEngine {
  isInited: boolean;
  chat: ChatSDK;
  EVENT: any;
  TYPES: any;
  eventCenter: IEventCenter;
  TUIStore: ITUIStore;
  TUIConversation: ITUIConversationService;
  TUIChat: ITUIChatService;
  TUIGroup: ITUIGroupService;
  TUIUser: ITUIUserService;

  /**
   * 创建 Chat SDK 实例 & 登录 Chat SDK
   * @function
   * @param {LoginParams} options 登录参数
   * @example
   * let promise = TUIChatEngine.login({
   *  SDKAppID: xxx,
   *  userID: 'xxx',
   *  userSig: 'xxx',
   *  useUploadPlugin: true, // 使用文件上传插件
   * });
   * promise.then(() => {
   *  // 登录成功后进行相关业务逻辑处理
   * })
  */
  login(options: LoginParams): Promise<any>;

  /**
   * 登出 Chat SDK
   * @function
   * @example
   * let promise = TUIChatEngine.logout();
   * promise.then(() => {
   *  // 登出成功后进行相关业务逻辑处理
   * })
   */
  logout(): Promise<any>;

  /**
   * Chat SDK 是否 ready。SDK ready 后，开发者可调用 SDK 发送消息等 API，使用 SDK 的各项功能。
   * @function
   * @example
   * let isReady = TUIChatEngine.isReady();
   */
  isReady(): boolean;

  /**
   * 销毁 Chat SDK 实例，SDK 会先 logout，然后断开 WebSocket 长连接，并释放资源。
   * @function
   * @example
   * let promise = TUIChatEngine.destroy();
   */
  destroy(): Promise<any>;

  /**
   * 设置 SDK 日志级别
   * @function
   * @param {number} level 日志级别
   * - 0 普通级别，日志量较多，接入时建议使用
   * - 1 release级别，SDK 输出关键信息，生产环境时建议使用
   * - 2 告警级别，SDK 只输出告警和错误级别的日志
   * - 3 错误级别，SDK 只输出错误级别的日志
   * - 4 无日志级别，SDK 将不打印任何日志
   * @example
   * TUIChatEngine.setLogLevel(0)
   */
  setLogLevel(level: number): void;

  /**
   * 模块挂载
   * @function
   * @param {string} name 模块名
   * @param {any} instance 类的实例
   * @private
  */
  mount(name: string, instance: any): void;

  /**
   * 获取当前用户 ID
   * @function
   * @private
   */
  getMyUserID(): string;
}
