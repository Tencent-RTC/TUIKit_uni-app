import type { Message } from '@tencentcloud/lite-chat/basic';
import type TencentCloudChat from '@tencentcloud/lite-chat/basic';
import type { ModifyMessageParams, ReactionInfo } from '../../type';

/**
 * @description MessageModel 主要负责消息操作和消息上屏数据处理，MessageModel 不需要开发者进行开发，由 TUIChatEngine 通过 {@link https://web.sdk.qcloud.com/im/doc/chat-engine/global.html#ChatStore ChatStore} 的 messageList 提供给开发者直接使用。<br/>
 * @interface IMessageModel
 * @property {String}  ID - 消息 ID
 * @property {String}  type - 消息类型，具体如下：<br/>
 * | 类型 | 含义 |
 * | :--- | :---- |
 * | TUIChatEngine.TYPES.MSG_TEXT  | 文本消息 |
 * | TUIChatEngine.TYPES.MSG_IMAGE | 图片消息 |
 * | TUIChatEngine.TYPES.MSG_SOUND | 音频消息 |
 * | TUIChatEngine.TYPES.MSG_AUDIO | 音频消息 |
 * | TUIChatEngine.TYPES.MSG_VIDEO | 视频消息 |
 * | TUIChatEngine.TYPES.MSG_FILE  | 文件消息 |
 * | TUIChatEngine.TYPES.MSG_CUSTOM | 自定义消息 |
 * | TUIChatEngine.TYPES.MSG_MERGER | 合并消息 |
 * | TUIChatEngine.TYPES.MSG_LOCATION | 位置消息 |
 * | TUIChatEngine.TYPES.MSG_FACE | 表情消息 |
 * | TUIChatEngine.TYPES.MSG_GRP_TIP | 群提示消息 |
 * | TUIChatEngine.TYPES.MSG_GRP_SYS_NOTICE | 群系统通知消息 |
 * @property {Object}  payload - 消息的内容，详细内容请查看: [Message](https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html)
 * @property {String}  conversationID - 消息所属的会话 ID
 * @property {String}  conversationType - 消息所属会话的类型，具体如下：<br/>
 * | 类型 | 含义 |
 * | :--- | :---- |
 * | TUIChatEngine.TYPES.CONV_C2C | C2C(Client to Client, 端到端) 会话 |
 * | TUIChatEngine.TYPES.CONV_GROUP | GROUP(群组) 会话 |
 * | TUIChatEngine.TYPES.CONV_SYSTEM | SYSTEM(系统) 会话 |
 * @property {String}  to - 接收方的 userID
 * @property {String}  from - 发送方的 userID，在消息发送时，会默认设置为当前登录的用户
 * @property {String}  flow - 消息的流向<br/>
 * - in 为收到的消息
 * - out 为发出的消息
 * @property {Number}  time - 消息时间戳。单位：秒
 * @property {String}  status - 消息状态
 * - unSend(未发送)
 * - success(发送成功)
 * - fail(发送失败)
 * @property {Boolean} isRevoked =false - 是否被撤回的消息，true 标识被撤回的消息
 * @property {String} priority=TUIChatEngineTYPES.MSG_PRIORITY_NORMAL - 消息优先级，用于群聊
 * @property {String} nick='' 消息发送者的昵称（在 AVChatRoom 内支持，需提前调用 [TUIUserService.updateMyProfile](https://web.sdk.qcloud.com/im/doc/chat-engine/ITUIUserService.html#updateMyProfile) 设置）
 * @property {String} avatar='' 消息发送者的头像地址（在 AVChatRoom 内支持，需提前调用 [TUIUserService.updateMyProfile](https://web.sdk.qcloud.com/im/doc/chat-engine/ITUIUserService.html#updateMyProfile) 设置）
 * @property {Boolean} isPeerRead=false - C2C 消息对端是否已读，true 标识对端已读
 * @property {String} nameCard='' 非直播群消息发送者的群名片（也可称之为消息发送者的群昵称），需提前调用 [TUIGroupService.setGroupMemberNameCard](https://web.sdk.qcloud.com/im/doc/chat-engine/ITUIGroupService.html#setGroupMemberNameCard) 设置
 * @property {Array} atUserList 群聊时此字段存储被 at 的群成员的 userID
 * @property {String} cloudCustomData='' - 消息自定义数据（云端保存，会发送到对端，程序卸载重装后还能拉取到）
 * @property {Boolean} isDeleted=false - 是否被删除的消息，true 标识被删除的消息
 * @property {Boolean} isModified=false - 是否被修改过，true 标识被修改过的消息
 * @property {Boolean} needReadReceipt=false - 是否需要已读回执，true 标识需要（需要您购买旗舰版套餐）
 * @property {Object} readReceiptInfo={readCount,unreadCount,isPeerRead} - 消息已读回执信息
 * @property {Number|undefined} readReceiptInfo.readCount - 群消息已读数<br/>
 * 如果想要查询哪些群成员已读了消息，可调用 [TUIChatService.getGroupMessageReadMemberList](https://web.sdk.qcloud.com/im/doc/chat-engine/ITUIChatService.html#getGroupMessageReadMemberList)
 * @property {Number|undefined} readReceiptInfo.unreadCount - 群消息未读数
 * @property {Boolean|undefined} readReceiptInfo.isPeerRead - C2C消息对端是否已发送已读回执，消息发送方收到已读回执通知或拉漫游时会更新此属性
 * @property {Boolean} isBroadcastMessage=false - 对所有直播群广播消息，true 标识直播群广播消息（需要您购买旗舰版套餐）
 * @property {Boolean} isSupportExtension=false - 是否支持消息扩展，true 支持 false 不支持（需要您购买旗舰版套餐）
 * @property {String|null} revoker - 消息撤回者的 userID
 * @property {Number} progress - 图片、视频、语音、文件消息上传进度， 默认 0
 * @property {Object} revokerInfo - 消息撤回者的信息。
 * @property {String} revokerInfo.avatar - 消息撤回者的头像
 * @property {String} revokerInfo.nick - 消息撤回者的昵称
 * @property {String} revokerInfo.userID - 消息撤回者的 userID
 * @property {String} revokeReason - 消息撤回的原因。
 * @property {Boolean} hasRiskContent - 语音、视频消息是否被标记为有安全风险的消息，默认为 false。
 * - 只有在开通【云端审核】功能后才生效，【云端审核】开通流程请参考 [云端审核功能](https://cloud.tencent.com/document/product/269/83795#.E4.BA.91.E7.AB.AF.E5.AE.A1.E6.A0.B8.E5.8A.9F.E8.83.BD)。
 * @property {Array<ReactionInfo>} reactionList - 需要您购买旗舰版才支持此功能，购买旗舰版能力并重新登录后，拉漫游时会自动获取表情回复摘要信息。
*/
export interface IMessageModel {
  ID: string;
  type: TencentCloudChat.TYPES;
  payload: any;
  conversationID: string;
  conversationType: TencentCloudChat.TYPES;
  to: string;
  from: string;
  flow: string;
  time: number;
  status: string;
  isRevoked: boolean;
  priority: TencentCloudChat.TYPES;
  nick: string;
  avatar: string;
  isPeerRead: boolean;
  nameCard: string;
  atUserList: string[];
  cloudCustomData: string;
  isDeleted: boolean;
  isModified: boolean;
  needReadReceipt: boolean;
  readReceiptInfo: any;
  isBroadcastMessage: boolean;
  isSupportExtension: boolean;
  receiverList?: string[];
  revoker: string;
  sequence: number;
  progress: number;
  revokerInfo: { userID: string; nick: string; avatar: string };
  revokeReason: string;
  hasRiskContent: boolean;
  reactionList: ReactionInfo[];

  /**
   * 更新 messageModel 属性
   * @function
   * @private
   */
  updateProperties(options: Message): void;

  /**
   * 获取 Chat SDK 提供的 message 实例
   * @function
   * @private
   * @example
   * let message = messageModel.getMessage();
   */
  getMessage(): Message;

  /**
   * 修改消息
   *
   * @param {ModifyMessageParams} options 修改的内容
   * @function
   * @example
   * let promise = messageModel.modifyMessage(options);
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  modifyMessage(options: ModifyMessageParams): Promise<any>;

  /**
   * 撤回单聊消息或者群聊消息。撤回成功后，消息对象的 isRevoked 属性值为 true。
   * @function
   * @example
   * let promise = messageModel.revokeMessage();
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  revokeMessage(): Promise<any>;

  /**
   * 重发消息的接口，当消息发送失败时，可调用该接口进行重发
   * @function
   * @example
   * let promise = messageModel.resendMessage();
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  resendMessage(): Promise<any>;

  /**
   * 删除消息的接口。删除成功后，被删除消息的 isDeleted 属性值为 true。
   * @function
   * @example
   * let promise = messageModel.deleteMessage();
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  deleteMessage(): Promise<any>;

  /**
   * 引用当前消息
   * @function
   * @example
   * let message = messageModel.quoteMessage();
   */
  quoteMessage(): Message;

  /**
   * 回复当前消息
   * @function
   * @example
   * let message = messageModel.replyMessage();
   */
  replyMessage(): Message;

  /**
   * 设置消息扩展
   * @function
   * @param {Array<object>} extensions 扩展信息
   * @private
   * @example
   * let promise = messageModel.setMessageExtensions([
   *  { key: 'a', value: '1' },
   *  { key: 'b', value: '2' }
   * ]);
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  setMessageExtensions(extensions: object[]): Promise<any>;

  /**
   * 删除消息扩展
   * @function
   * @param {Array<string>|undefined} keyList 消息扩展 key 列表，不传 keyList 表示删除所有扩展 key
   * @private
   * @example
   * // 删除部分 key
   * let promise = messageModel.deleteMessageExtensions(['a', 'b']);
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   * // 删除全部 key
   * let promise = messageModel.deleteMessageExtensions();
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
   */
  deleteMessageExtensions(keyList?: string[]): Promise<any>;

  /**
   * 获取消息扩展
   * @function
   * @private
   * @example
   * let promise = messageModel.getMessageExtensions();
   * promise.then((chatResponse) => {
   *  // 消息扩展信息
   *  const { extensions } = chatResponse.data;
   * });
   *  promise.catch((error) => {
   *    // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   *  });
  */
  getMessageExtensions(): Promise<any>;

  /**
   * 获取信令信息
   * @function
   * @example
   * let signaling = messageModel.getSignalingInfo();
   * // signaling != null 说明是信令消息，可以进行信令相关的业务逻辑处理
   * // signaling = null  说明是非信令消息
   * if (signaling) {
   *   console.log(signaling)
   * }
   */
  getSignalingInfo(): Record<string, any> | null;

  /**
   * 获取消息展示内容 <br/>
   * 注意1：以下解析为默认解析行为，如果需要自定义解析，可以通过 messageModel 结构体内容自行解析。<br/>
   * 注意2：该接口不支持群系统消息解析。<br/>
   * 注意3：群提示消息不支持返回 showName。<br/>
   * 注意4：showName 显示优先级如下：
   * - 单聊：remark > nick > userID
   * - 群聊：remark > nameCard > nick > userID
   * @function
   * @example
   * // 文本消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.text - 文本消息展示内容
   * // result.name - 文本消息名称，值为 text 或 img, 返回 img 时标识是 emoji 表情消息
   * // result.type - 文本消息类型，自定义 emoji 表情消息时返回 custom，UIKit 默认的 emoji 表情和普通文本消息不返回 type 字段（v2.2.0 起支持）
   * // result.emojiKey - emoji 表情的 key（v2.2.0 起支持）
   * // result.src - emoji 表情消息展示链接，type = custom 时返回空字符串，需要 UIKit 层根据 baseUrl 和 emojiKey 拼接完整链接
   * @example
   * // 表情消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.name - 表情消息名称
   * // retsult.type - 表情消息类型，自定义 face 表情消息时返回 custom，UIKit 默认 face 表情包 type 返回 ‘’（v2.2.0 起支持）
   * // result.url - 表情消息展示链接，type = custom 时返回空字符串，需要 UIKit 层根据 baseUrl 和 name 拼接完整链接
   * @example
   * // 地理位置消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.lon - 经度
   * // result.lat - 纬度
   * // result.href - 地图跳转链接
   * // result.url - 地图展示链接
   * // result.description - 描述信息
   * @example
   * // 图片消息返回结果，默认返回的是原图信息，如果需要缩略图或大图信息请从 messageModel.payload 中获取
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.url - 图片访问链接
   * // result.width - 图片宽度
   * // result.width - 图片高度
   * @example
   * // 语音消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.url - 语音播放链接
   * // result.second - 语音时长
   * @example
   * // 视频消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.url - 视频播放链接
   * // result.snapshotUrl - 视频封面图链接
   * // result.snapshotWidth - 视频封面图宽度
   * // result.snapshotHeight - 视频封面图高度
   * @example
   * // 文件消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.url - 文件下载链接
   * // result.name - 文件名称
   * // result.size - 文件大小
   * @example
   * // 自定义消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // result.custom - 自定义消息展示内容
   * // result.businessID - 业务标识信息，创建群组自定义消息的 businessID 是 group_create，其他的自定义消息返回为空字符串
   * @example
   * // 合并消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.showName - 消息发送方名称
   * // 合并消息返回内容是 message.payload 内容
   * @example
   * // 群提示消息返回结果
   * const result = messageModel.getMessageContent();
   * // result.text - 群提示消息展示内容
   */
  getMessageContent(): Record<string, any>;
}
