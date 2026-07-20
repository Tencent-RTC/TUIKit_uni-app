import type { Conversation } from '@tencentcloud/lite-chat/basic';

/**
 * @description ConversationModel 主要负责会话操作和会话数据处理，ConversationModel 不需要开发者进行开发，由 TUIChatEngine 通过 {@link https://web.sdk.qcloud.com/im/doc/chat-engine/global.html#ConversationStore ConversationStore} 的 conversationList 提供给开发者直接使用。
 * @interface ConversationModel
 * @property {String} conversationID - 会话 ID。会话ID组成方式：<br/>
 * - `C2C${userID}`（单聊）
 * - `GROUP${groupID}`（群聊）
 * @property {String} type - 会话类型，具体如下：<br/>
 * | 类型 | 含义 |
 * | :--- | :---- |
 * | TUIChatEngine.TYPES.CONV_C2C | C2C（Client to Client, 端到端）会话 |
 * | TUIChatEngine.TYPES.CONV_GROUP | GROUP（群组）会话 |
 * | TUIChatEngine.TYPES.CONV_SYSTEM | SYSTEM（系统）会话。该会话只能接收来自系统的通知消息，不能发送消息。 |
 * @property {String} subType - 群组会话的群组类型，具体如下：<br/>
 * | 类型 | 含义 |
 * | :--- | :---- |
 * | TUIChatEngine.TYPES.GRP_WORK | 好友工作群 |
 * | TUIChatEngine.TYPES.GRP_PUBLIC | 陌生人社交群 |
 * | TUIChatEngine.TYPES.GRP_MEETING | 临时会议群 |
 * | TUIChatEngine.TYPES.GRP_AVCHATROOM | 直播群 |
 * @property {Number} unreadCount - 未读计数。TUIChatEngine.TYPES.GRP_MEETING / TUIChatEngine.TYPES.GRP_AVCHATROOM 类型的群组会话不记录未读计数，该字段值为0
 * @property {Object} lastMessage - 会话最新的消息
 * @property {String} lastMessage.nick - 群会话最新消息的发送者的昵称，C2C 会话为 ''
 * @property {String} lastMessage.nameCard - 群会话最新消息的发送者的群名片，C2C 会话为 ''
 * @property {Number} lastMessage.lastTime - 当前会话最新消息的时间戳，单位：秒
 * @property {Number} lastMessage.lastSequence - 当前会话的最新消息的 Sequence
 * @property {String} lastMessage.fromAccount - 最新消息来源用户的 userID
 * @property {Boolean} lastMessage.isRevoked - 会话最新的消息是否已被撤回，true 表示已撤回，默认值为 false
 * @property {String|null} lastMessage.revoker - 消息撤回者的 userID
 * @property {Boolean} lastMessage.isPeerRead - 对端是否已读 C2C 会话的最新消息，默认值为 false
 * @property {String} lastMessage.messageForShow - 最新消息的内容，用于展示。可能值：文本消息内容、"[图片]"、"[语音]"、"[位置]"、"[表情]"、"[文件]"、"[自定义消息]"。<br/>
 * 若该字段不满足您的需求，您可以使用 payload 来自定义渲染。
 * @property {String} lastMessage.type - 消息类型，具体如下：<br/>
 * | 类型 | 含义 |
 * | :--- | :---- |
 * | TUIChatEngine.TYPES.MSG_TEXT  | 文本消息 |
 * | TUIChatEngine.TYPES.MSG_IMAGE | 图片消息 |
 * | TUIChatEngine.TYPES.MSG_SOUND | 音频消息 |
 * | TUIChatEngine.TYPES.MSG_AUDIO | 音频消息 |
 * | TUIChatEngine.TYPES.MSG_VIDEO | 视频消息 |
 * | TUIChatEngine.TYPES.MSG_FILE  | 文件消息 |
 * | TUIChatEngine.TYPES.MSG_LOCATION | 地理位置消息 |
 * | TUIChatEngine.TYPES.MSG_CUSTOM | 自定义消息 |
 * | TUIChatEngine.TYPES.MSG_GRP_TIP | 群提示消息 |
 * | TUIChatEngine.TYPES.MSG_GRP_SYS_NOTICE | 群系统通知消息 |
 * @property {Object} lastMessage.payload - 消息的内容，收到的音频 / 文件消息的 payload 中没有 url 字段。
 * @property {Group} groupProfile - 群会话的群组资料
 * @property {Profile} userProfile - C2C会话的用户资料
 * @property {GroupAtInfo[]} groupAtInfoList - 群会话的 at 信息列表，接入侧可根据此信息在会话列表展示【有人@我】【@所有人】等效果。
 * @property {String} remark - 好友备注，只有C2C会话且对端是我的好友，且我设置过此好友的备注才有值
 * @property {Boolean} isPinned - 会话是否置顶
 * @property {String} messageRemindType - 消息提醒类型，具体如下：<br/>
 * - TUIChatEngine.TYPES.MSG_REMIND_ACPT_AND_NOTE 在线正常接收消息，离线时会有厂商的离线推送通知（Web 和小程序端无离线推送）
 * - TUIChatEngine.TYPES.MSG_REMIND_DISCARD 在线和离线都拒收消息
 * - TUIChatEngine.TYPES.MSG_REMIND_ACPT_NOT_NOTE 在线正常接收消息，离线不会有推送通知（消息免打扰）
 * @property {Array} markList - 会话标记列表，具体如下：<br/>
 * - TUIChatEngine.TYPES.CONV_MARK_TYPE_STAR 会话标星
 * - TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD 会话标记未读（重要会话）
 * - TUIChatEngine.TYPES.CONV_MARK_TYPE_FOLD 会话折叠
 * - TUIChatEngine.TYPES.CONV_MARK_TYPE_HIDE 会话隐藏
 * @property {String} customData - 会话自定义数据
 * @property {Array} conversationGroupList - 会话所属分组列表
 * @property {String} draftText - 会话草稿
 * @property {Boolean} isMuted 会话是否已设置免打扰，默认为 false
 * @property {Number} operationType 群组操作类型， 默认 0。4-被踢出群组 5-群组被解散 8-主动退群
*/
export interface IConversationModel {
  conversationID: string;
  type: string;
  subType: string;
  unreadCount: number;
  lastMessage?: {
    nick: string;
    nameCard: string;
    lastTime: number | string;
    lastSequence: string;
    fromAccount: string;
    isRevoked: boolean;
    revoker?: string;
    isPeerRead: boolean;
    messageForShow: string;
    type: string;
    payload: any;
  };
  groupProfile?: any;
  userProfile?: any;
  groupAtInfoList?: any[];
  remark: string;
  isPinned: boolean;
  messageRemindType: string;
  markList: string[];
  customData: string;
  conversationGroupList: any[];
  draftText: string;
  isMuted: boolean;
  operationType: number; // 群组会话的操作类型
  _conversation: any; // 保存原始 conversation 实例数据

  /**
   * 更新 conversationModel 属性
   * @function
   * @private
   */
  updateProperties(options: Conversation): void;

  /**
   * 更新 operationType 属性
   * @function
   * @private
   */
  updateOperationType(operationType: number): void;

  /**
   * 获取 IM SDK 提供的 conversation 对象
   * @function
   * @private
   */
  getConversation(): any;

  // 以下方法用于处理 conversation 需要展示的数据
  /**
   * 获取会话头像
   * @function
   * @example
   * let avatar = conversationModel.getAvatar();
   */
  getAvatar(): string;

  /**
   * 获取会话名称
   * @function
   * @example
   * let name = conversationModel.getShowName();
   */
  getShowName(): string;
}
