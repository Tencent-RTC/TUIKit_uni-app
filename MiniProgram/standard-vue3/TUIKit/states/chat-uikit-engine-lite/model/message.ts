/* eslint-disable prefer-promise-reject-errors */
// @ts-nocheck
import type { Conversation, Message } from '@tencentcloud/chat';
import type TencentCloudChat from '@tencentcloud/chat';
import { ERROR_CODE_ENGINE, ERROR_MSG_ENGINE } from '../const';
import type { IConversationModel, IMessageModel } from '../interface/model';
import { isPrivateKey, isUndefined } from '../utils/common-utils';
import TUIBase from '../tui-base';
import type { ModifyMessageParams, ReactionInfo } from '../type';

export default class MessageModel extends TUIBase implements IMessageModel {
  public ID!: string;
  public type!: TencentCloudChat.TYPES;
  payload: any;
  conversationID!: string;
  conversationType!: TencentCloudChat.TYPES;
  to!: string;
  from!: string;
  flow!: string;
  time!: number;
  status!: string;
  isRevoked!: boolean;
  priority!: TencentCloudChat.TYPES;
  nick!: string;
  avatar!: string;
  isPeerRead!: boolean;
  nameCard!: string;
  atUserList!: string[];
  cloudCustomData!: string;
  isDeleted!: boolean;
  isModified!: boolean;
  needReadReceipt!: boolean;
  readReceiptInfo!: {
    readCount?: number;
    unreadCount?: number;
    isPeerRead?: boolean;
  };

  isBroadcastMessage!: boolean;
  isSupportExtension!: boolean;
  receiverList!: string[];
  revoker!: string;
  sequence!: number;
  progress!: number;
  revokerInfo!: { userID: string; nick: string; avatar: string };
  revokeReason!: string;
  hasRiskContent!: boolean;
  reactionList!: ReactionInfo[];

  private _message: Message;
  private _signalingInfo!: any; // 默认值 undefined，_signalingInfo 的类型是 undefined｜null|object，因为 getSignalingInfo 返回值是 null|object，枚举会引起编译报错，所以此处用 any 代替。
  // 维护映射关系，方便使用
  private messageHandlers = {
    [this.getEngine().TYPES.MSG_TEXT]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleTextMessage(message),
    [this.getEngine().TYPES.MSG_FACE]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleFaceMessage(message),
    [this.getEngine().TYPES.MSG_LOCATION]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleLocationMessage(message),
    [this.getEngine().TYPES.MSG_IMAGE]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleImageMessage(message),
    [this.getEngine().TYPES.MSG_AUDIO]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleAudioMessage(message),
    [this.getEngine().TYPES.MSG_VIDEO]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleVideoMessage(message),
    [this.getEngine().TYPES.MSG_FILE]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleFileMessage(message),
    [this.getEngine().TYPES.MSG_CUSTOM]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleCustomMessage(message),
    [this.getEngine().TYPES.MSG_MERGER]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleMergeMessage(message),
    [this.getEngine().TYPES.MSG_GRP_TIP]: (message: Message) => this.getEngine().TUIChat.messageHandler.handleGroupTipsMessage(message),
  };

  constructor(options: Message) {
    super();
    this._message = options;
    this._signalingInfo = undefined;
    this.progress = 0;
    this.reactionList = [];
    this.initProperties(options);
  }

  /**
   * 初始化 messageModel 属性
   */
  private initProperties(options: Message): void {
    Object.keys(options).forEach((key) => {
      if (!isPrivateKey(key)) {
        (this as any)[key] = options[key as keyof Message];
      }
    });
  }

  updateProperties(options: Message): void {
    this._message = options;
    Object.keys(options).forEach((key) => {
      if (!isPrivateKey(key)) {
        (this as any)[key] = options[key as keyof Message];
      }
    });
  }

  getMessage() {
    return this._message;
  }

  modifyMessage(options: ModifyMessageParams) {
    if (options.type && this._message.type !== options.type && !options.payload) {
      return Promise.reject({
        code: ERROR_CODE_ENGINE.MISMATCH_TYPE_AND_PAYLOAD,
        message: ERROR_MSG_ENGINE.MISMATCH_TYPE_AND_PAYLOAD,
      });
    }
    this._message.type = options.type || this._message.type;
    this._message.payload = options.payload || this._message.payload;
    this._message.cloudCustomData = options.cloudCustomData || this._message.cloudCustomData;
    return this.getEngine().TUIChat.modifyMessage(this._message);
  }

  revokeMessage() {
    return this.getEngine().TUIChat.revokeMessage(this._message);
  }

  resendMessage() {
    return this.getEngine().TUIChat.resendMessage(this._message);
  }

  deleteMessage() {
    return this.getEngine().TUIChat.deleteMessage([this._message]);
  }

  quoteMessage() {
    return this.getEngine().TUIChat.quoteMessage(this._message);
  }

  replyMessage() {
    return this.getEngine().TUIChat.replyMessage(this._message);
  }

  setMessageExtensions(extensions: Record<string, any>[]) {
    return this.getEngine().TUIChat.setMessageExtensions(this._message, extensions);
  }

  getMessageExtensions() {
    return this.getEngine().TUIChat.getMessageExtensions(this._message);
  }

  deleteMessageExtensions(keyList?: string[]) {
    return this.getEngine().TUIChat.deleteMessageExtensions(this._message, keyList);
  }

  getSignalingInfo() {
    if (this.type !== this.getEngine().TYPES.MSG_CUSTOM) {
      return null;
    }
    if (isUndefined(this._signalingInfo)) {
      this._signalingInfo = this.getEngine().chat.getSignalingInfo(this._message);
      return this._signalingInfo;
    }
    return this._signalingInfo;
  }

  getMessageContent() {
    const handler = this.messageHandlers[this.type as any];
    if (isUndefined(handler)) {
      return {};
    }
    // 群提示消息不支持 showName
    if (this.type === this.getEngine().TYPES.MSG_GRP_TIP) {
      return handler(this._message);
    }
    // 普通消息发送方名称显示优先级(对齐微信体验)
    // C2C 会话：remark > nick > userID
    // 群会话：remark > nameCard > nick > userID
    // const friendRemark: any = this.getEngine().TUIFriend.getFriendRemark([this.from]);
    return {
      ...handler(this._message),
      showName: this.nick || this.from,
    };
  }

  sendForwardMessage(conversationList: Conversation[] | IConversationModel[]) {
    return this.getEngine().TUIChat.sendForwardMessage(conversationList, [this._message]);
  }
}
