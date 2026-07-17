import type { Message } from '@tencentcloud/lite-chat/basic';
import TUIBase from '../tui-base';
import type { ITUIChatService } from '../interface/service';
import type {
  SendMessageParams,
  GetMessageListParams,
  SendMessageOptions,
  GetMessageListHoppingParams,
  func,
} from '../type';
import type { IMessageModel } from '../interface/model';
import MessageHandler from './message-handler';
import { JSONToObject, isArray, isUndefined } from '../utils/common-utils';
import { StoreName, ERROR_CODE, ERROR_MSG, ERROR_CODE_ENGINE, ERROR_MSG_ENGINE } from '../const';
import isEmpty from '../utils/is-empty';

export default class TUIChatService extends TUIBase implements ITUIChatService {
  static instance: TUIChatService;
  private serv: string;
  public messageHandler: MessageHandler;
  private isSwitching: boolean;
  private delayGetHoppingFunction: func | undefined;
  private hoppingConfigMap: Map<string, any>;
  constructor() {
    super();
    this.serv = 'TUIChatService';
    this.messageHandler = new MessageHandler(this);
    this.isSwitching = true;
    this.delayGetHoppingFunction = undefined;
    this.hoppingConfigMap = new Map();
  }

  /**
   * 获取 TUIChatService 实例
  */
  static getInstance() {
    if (!TUIChatService.instance) {
      TUIChatService.instance = new TUIChatService();
    }
    return TUIChatService.instance;
  }

  init() {
    const chatEngine = this.getEngine();
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
    this.onCurrentConversationIDUpdated();
    this.onMessageSource();
  }

  private onMessageReceived(messageList: Message[]) {
    this.updateMessageList(messageList, 'received');
    // 提供给 TUINotification 组件使用（即时消费，Store 不存储）
    this.getEngine().TUIStore.update(StoreName.CHAT, 'newMessageList', messageList);
  }

  private onCurrentConversationIDUpdated() {
    const chatEngine = this.getEngine();
    chatEngine.TUIStore.watch(StoreName.CONV, {
      currentConversationID: (conversationID) => {
        // 记录切换会话开始状态
        this.isSwitching = true;
        this.delayGetHoppingFunction = undefined;
        this.hoppingConfigMap.clear();
        // conversation 切换, 需重置 chat 数据
        chatEngine.TUIStore.reset(StoreName.CHAT);
        // todo 此处特化处理，防止在 switch conversation 的时候调用用户页面还没打开，导致事件没监听
        // 注： 此时 Chat Store 内的数值已经在 conversation 模块被 reset
        if (!isEmpty(conversationID)) {
          this.getMessageList().finally(() => {
            // 切换会话完成
            this.isSwitching = false;
            this.delayGetHoppingFunction && this.delayGetHoppingFunction();
          });
        }
      },
    });
  }

  private onMessageSource() {
    const chatEngine = this.getEngine();
    chatEngine.TUIStore.watch(StoreName.CHAT, {
      messageSource: (targetMessage: IMessageModel) => {
        const currentConversationID = this.getStoreData(StoreName.CONV, 'currentConversationID');
        // 当前没有打开会话或搜索的消息不在当前会话中，不进行 messageList 切换
        if (!currentConversationID || (targetMessage && targetMessage.conversationID !== currentConversationID)) {
          return;
        }

        // targetMessage === undefined 有两种情况，1.切换会话; 2.回到最新消息
        if (isUndefined(targetMessage)) {
          this.hoppingConfigMap.clear();
          chatEngine.TUIStore.update(StoreName.CHAT, 'messageList', []);
          chatEngine.TUIStore.update(StoreName.CHAT, 'nextReqMessageID', '');
          chatEngine.TUIStore.update(StoreName.CHAT, 'isCompleted', false);
          this.getMessageList();
          return;
        }

        const currentMessageList = this.getStoreData(StoreName.CHAT, 'messageList');
        const message = currentMessageList && currentMessageList.find((item: IMessageModel) => targetMessage && item.ID === targetMessage.ID);
        if (message) {
          return;
        }
        // 防止切换会话，getMessageList 没有执行完成，再执行 getMessageListHopping 会导致 messageList 错乱
        if (this.isSwitching) {
          this.delayGetHoppingFunction = this.getMessageListHoppingForDown;
          return;
        }
        this.getMessageListHoppingForDown();
      },
    });
  }

  private getMessageListHoppingForDown() {
    const currentMessageList = this.getStoreData(StoreName.CHAT, 'messageList');
    const { conversationID, sequence, time, ID } = this.getStoreData(StoreName.CHAT, 'messageSource');
    const message = currentMessageList && currentMessageList.find((item: IMessageModel) => ID && item.ID === ID);
    if (message) {
      return;
    }
    const chatEngine = this.getEngine();
    chatEngine.TUIStore.update(StoreName.CHAT, 'messageList', []);
    chatEngine.TUIStore.update(StoreName.CHAT, 'nextReqMessageID', '');
    chatEngine.TUIStore.update(StoreName.CHAT, 'isCompleted', false);
    this.getMessageListHopping({ conversationID, sequence, time, direction: 1 });
  }

  /**
   * 私有方法，获取 store data
  */
  private getStoreData(storeName: StoreName, key: string) {
    return this.getEngine().TUIStore.getData(storeName, key);
  }

  /**
   * 私有方法，调用 TIM 接口发送消息
   * @param {Message} message 要发送的 message
   * @param {SendMessageOptions} [options] 消息发送选项
   * @returns {Promise<any>} im 接口的 response 原样返回
   *
   */
  private sendMessage(message: Message, options?: SendMessageOptions) {
    this.updateMessageList([message], 'send'); // 不论成功失败，先消息上屏，更新 UI
    const promise = this.getEngine().chat.sendMessage(message, options);
    return this.getResponse(promise);
  }

  /**
   * 私有方法，用于 messageList 状态变更并 return
   * @param {Promise} promise 调用 im 接口返回的 promise
   * @param {boolean} success 成功回调是否更新数据
   * @param {boolean} fail 失败回调是否更新数据
   * @returns {Promise<any>} im 接口的 response 原样返回
   */
  private getResponse(promise: Promise<any>, success = true, fail = true) {
    return promise
      .then((imResponse: any) => {
        const messageList = imResponse.data.messageList ? imResponse.data.messageList : [imResponse.data.message];
        success && this.updateMessageList(messageList, 'edit');
        return imResponse;
      })
      .catch((error: any) => {
        fail && error?.data?.message && this.updateMessageList([error.data.message], 'edit');
        return Promise.reject(error);
      });
  }

  updateMessageList(messageList: Message[], type = '') {
    if (this.getStoreData(StoreName.CHAT, 'messageSource') && type !== 'unshift' && type !== 'edit') {
      return;
    }
    const currentMessageList = this.getStoreData(StoreName.CHAT, 'messageList');

    const tempMessageList = this.updateTargetMessageList(messageList, currentMessageList, type);
    this.getEngine().TUIStore.update(StoreName.CHAT, 'messageList', tempMessageList);
  }

  updateTargetMessageList(newMessageList: Message[], target: IMessageModel[], type = '') {
    const conversationID = this.getStoreData(StoreName.CONV, 'currentConversationID');
    // filter current conversation message
    let toBeUpdatedMessageList: Message[] = newMessageList.filter(item => item.conversationID === conversationID);
    // handle call signaling message
    toBeUpdatedMessageList = this.handleC2CCallSignaling(toBeUpdatedMessageList);
    if (!type || toBeUpdatedMessageList.length === 0) return target;
    const currentMessageList: any = target || [];
    let tempMessageList: Message[] = [];
    // When Chat is integrated into Room, it needs to be updated.
    if (type === 'send' || type === 'push' || type === 'received') {
      const userInfo: any = this.getStoreData(StoreName.CHAT, 'userInfo');
      if (Object.keys(userInfo).length > 0) {
        this.updateLocalMessage(toBeUpdatedMessageList, userInfo);
      }
    }
    const enableAutoMessageRead = this.getStoreData(StoreName.APP, 'enableAutoMessageRead');
    switch (type) {
      case 'edit':
        for (const currentMessage of target) {
          const message = toBeUpdatedMessageList.find(m => m.ID === currentMessage.ID);
          tempMessageList.push(message || currentMessage);
        }
        break;
      case 'resend':
        // Resending message is not typing and only one message
        tempMessageList = currentMessageList.filter((message: IMessageModel) => message.ID !== toBeUpdatedMessageList[0].ID).concat(toBeUpdatedMessageList);
        break;
      case 'send':
        tempMessageList = currentMessageList.concat(toBeUpdatedMessageList);
        break;
      case 'push':
        // message from call or room
        tempMessageList = currentMessageList.concat(toBeUpdatedMessageList);
        this.getEngine().chat.setMessageRead({ conversationID });
        break;
      case 'received':
        // message from MESSAGE_RECEIVED
        tempMessageList = currentMessageList.concat(toBeUpdatedMessageList);
        tempMessageList = this.sortMessageList(tempMessageList);
        if (enableAutoMessageRead) {
          this.getEngine().chat.setMessageRead({ conversationID });
        }
        break;
      case 'unshift':
        // Deduplicate the data in the Store when pulling roaming
        tempMessageList = toBeUpdatedMessageList.filter((message: Message) => (
          (currentMessageList.length === 0)
          || !currentMessageList.find((m: Message | IMessageModel) => m.ID === message.ID)
        ));
        tempMessageList.push(...currentMessageList);
        tempMessageList = this.sortMessageList(tempMessageList);
        break;
      default:
        break;
    }
    return tempMessageList;
  }

  enterTypingState() {
    const enableTyping = this.getStoreData(StoreName.APP, 'enableTyping');
    if (enableTyping) {
      this.sendTyping(true);
    }
  }

  leaveTypingState() {
    const enableTyping = this.getStoreData(StoreName.APP, 'enableTyping');
    if (enableTyping) {
      this.sendTyping(false);
    }
  }

  private sendTyping(status: boolean) {
    const chatEngine = this.getEngine();
    const currentConversationID = this.getStoreData(StoreName.CONV, 'currentConversationID');
    if (!currentConversationID.startsWith(chatEngine.TYPES.CONV_C2C)) return;
    const to = currentConversationID.replace(chatEngine.TYPES.CONV_C2C, '');
    if (status) {
      const messageList: IMessageModel[] = this.getStoreData(StoreName.CHAT, 'messageList');
      const receivedMessageList = messageList.filter((item: IMessageModel) => item.flow === 'in');
      if (receivedMessageList.length === 0) return;
      const latestMessageTime = receivedMessageList[receivedMessageList.length - 1].time * 1000;
      const nowTime = new Date().getTime();
      const diff = nowTime - latestMessageTime;
      if (diff > 1000 * 30) return;
    }
  }

  quoteMessage(message: Message) {
    this.getEngine().TUIStore.update(StoreName.CHAT, 'quoteMessage', {
      message,
      type: 'quote',
    });
    this.getEngine().TUIReport?.reportFeature(205);
    return message;
  }

  replyMessage(message: Message) {
    this.getEngine().TUIStore.update(StoreName.CHAT, 'quoteMessage', {
      message,
      type: 'reply',
    });
    return message;
  }

  private getCurrentConvInfo() {
    const { conversationID = '', type } = this.getStoreData(StoreName.CONV, 'currentConversation') || {};
    const to = conversationID.replace(type, '');
    return {
      to,
      conversationType: type,
    };
  }

  private getMessageAbstractAndType(message: Message) {
    const chatEngine = this.getEngine();
    const data = {
      abstract: '',
      type: 0,
    };
    // 对齐 native, abstract 不传
    // 兼容低版本，已传入的 abstract 不进行调整，新增的不传 abstract
    switch (message.type) {
      case chatEngine.TYPES.MSG_TEXT:
        data.abstract = message?.payload?.text;
        data.type = 1;
        break;
      case chatEngine.TYPES.MSG_CUSTOM:
        data.abstract = '[自定义消息]';
        data.type = 2;
        break;
      case chatEngine.TYPES.MSG_IMAGE:
        data.abstract = '[图片]';
        data.type = 3;
        break;
      case chatEngine.TYPES.MSG_AUDIO:
        data.abstract = '[语音]';
        data.type = 4;
        break;
      case chatEngine.TYPES.MSG_VIDEO:
        data.abstract = '[视频]';
        data.type = 5;
        break;
      case chatEngine.TYPES.MSG_FILE:
        data.abstract = '[文件]';
        data.type = 6;
        break;
      case chatEngine.TYPES.MSG_LOCATION:
        data.type = 7;
        break;
      case chatEngine.TYPES.MSG_FACE:
        data.abstract = '[表情]';
        data.type = 8;
        break;
      case chatEngine.TYPES.MSG_GRP_TIP:
        data.type = 9;
        break;
      case chatEngine.TYPES.MSG_MERGER:
        data.abstract = message?.payload?.title;
        data.type = 10;
        break;
      default:
        break;
    }
    return data;
  }

  /**
   *  - 注意: 暂只支持文本发送时携带引用消息，结构体参考 https://iwiki.woa.com/pages/viewpage.action?pageId=1238962637
   */
  private genMessageReply(message: Message, type: string) {
    if (type !== 'reply' && type !== 'quote') {
      return {};
    }
    const { abstract, type: messageType } = this.getMessageAbstractAndType(message);
    const messageReplyRoot: any = {
      messageAbstract: abstract,
      messageSender: message.nick || message.from,
      messageID: message.ID,
    };
    const messageReply: any = {
      ...messageReplyRoot,
      messageType,
      messageTime: message?.time,
      messageSequence: message?.sequence,
      version: 1,
    };
    if (type === 'reply') {
      messageReply.messageRootID = message.ID;
      if (message.cloudCustomData) {
        const rootCloudCustomData = JSONToObject(message.cloudCustomData);
        if (rootCloudCustomData.messageReply && rootCloudCustomData.messageReply.messageRootID) {
          messageReply.messageRootID = rootCloudCustomData.messageReply.messageRootID;
        }
      }
    }
    return {
      messageReply,
      messageReplyRoot,
    };
  }

  private getMessageInfo(options: SendMessageParams, message: Message, type: string) {
    const { messageReply, messageReplyRoot } = this.genMessageReply(message, type);
    const cloudCustomData = options.cloudCustomData ? JSONToObject(options.cloudCustomData) : {};
    let rootMessage: any;
    if (cloudCustomData.messageReply) {
      cloudCustomData.messageReply = { ...messageReply, ...cloudCustomData.messageReply };
    } else {
      cloudCustomData.messageReply = messageReply;
    }
    if (type === 'reply') {
      const { messageRootID } = messageReply;
      rootMessage = this.getEngine().chat.findMessage(messageRootID);
      const rootCloudCustomData = rootMessage?.cloudCustomData ? JSONToObject(rootMessage.cloudCustomData) : {};
      if (!rootCloudCustomData.messageReplies) {
        rootCloudCustomData.messageReplies = {};
      }
      if (!isArray(rootCloudCustomData.messageReplies.replies)) {
        rootCloudCustomData.messageReplies.replies = [];
      }
      rootCloudCustomData.messageReplies.replies.push(messageReplyRoot);
      rootMessage.cloudCustomData = JSON.stringify(rootCloudCustomData);
    }
    return {
      cloudCustomData: JSON.stringify(cloudCustomData),
      rootMessage,
    };
  }

  sendTextMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const chatEngine = this.getEngine();
    const { message: quoteMessage, type } = this.getStoreData(StoreName.CHAT, 'quoteMessage');
    let quoteInfo = {
      cloudCustomData: options.cloudCustomData || '',
      rootMessage: undefined,
    };
    if (quoteMessage) {
      quoteInfo = this.getMessageInfo(options, quoteMessage, type);
    }
    const message = chatEngine.chat.createTextMessage({
      ...this.getCurrentConvInfo(),
      ...options,
      cloudCustomData: quoteInfo.cloudCustomData,
    });
    return this.sendMessage(message, sendMessageOptions).then((imResponse: any) => {
      if (quoteInfo.rootMessage) {
        this.modifyMessage(quoteInfo.rootMessage as any);
      }
      chatEngine.TUIStore.reset(StoreName.CHAT, ['quoteMessage'], true);
      return imResponse;
    });
  }

  sendTextAtMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const chatEngine = this.getEngine();
    const { message: quoteMessage, type } = this.getStoreData(StoreName.CHAT, 'quoteMessage');
    let quoteInfo = {
      cloudCustomData: options.cloudCustomData || '',
      rootMessage: undefined,
    };
    if (quoteMessage) {
      quoteInfo = this.getMessageInfo(options, quoteMessage, type);
    }
    const message = chatEngine.chat.createTextAtMessage({
      ...this.getCurrentConvInfo(),
      ...options,
      cloudCustomData: quoteInfo.cloudCustomData,
    });
    return this.sendMessage(message, sendMessageOptions).then((imResponse: any) => {
      if (quoteInfo.rootMessage) {
        this.modifyMessage(quoteInfo.rootMessage as any);
      }
      chatEngine.TUIStore.reset(StoreName.CHAT, ['quoteMessage'], true);
      return imResponse;
    });
  }

  sendImageMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const message = this.getEngine().chat.createImageMessage({
      ...this.getCurrentConvInfo(),
      ...options,
      onProgress: (progress: number) => {
        this.onProgress(message.ID, progress);
      },
    });
    return this.sendMessage(message, sendMessageOptions);
  }

  sendAudioMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const message = this.getEngine().chat.createAudioMessage({
      ...this.getCurrentConvInfo(),
      ...options,
      onProgress: (progress: number) => {
        this.onProgress(message.ID, progress);
      },
    });
    return this.sendMessage(message, sendMessageOptions);
  }

  sendVideoMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const message = this.getEngine().chat.createVideoMessage({
      ...this.getCurrentConvInfo(),
      ...options,
      onProgress: (progress: number) => {
        this.onProgress(message.ID, progress);
      },
    });
    return this.sendMessage(message, sendMessageOptions);
  }

  sendCustomMessage(options: SendMessageParams, sendMessageOptions?: SendMessageOptions) {
    const message = this.getEngine().chat.createCustomMessage({
      ...this.getCurrentConvInfo(),
      ...options,
    });
    return this.sendMessage(message, sendMessageOptions);
  }

  private onProgress(messageID: string, progress: number) {
    const message: IMessageModel = this.getEngine().TUIStore.getMessageModel(messageID);
    if (message) {
      // 避免频繁触发 messageList 更新
      const diff = progress - message.progress;
      if (diff >= 0.1 || progress === 1) {
        message.progress = progress;
        this.updateMessageList([message], 'edit');
      }
    }
  }

  resendMessage(message: Message) {
    message.status = 'unSend';
    this.updateMessageList([message], 'resend');
    const promise = this.getEngine().chat.resendMessage(message);
    return this.getResponse(promise, true, true);
  }

  setMessageExtensions(message: Message, extensions: object[]) {
    return this.getEngine().chat.setMessageExtensions(message, extensions);
  }

  getMessageExtensions(message: Message) {
    return this.getEngine().chat.getMessageExtensions(message);
  }

  deleteMessageExtensions(message: Message, keyList?: string[]) {
    return this.getEngine().chat.deleteMessageExtensions(message, keyList);
  }

  modifyMessage(message: Message) {
    const promise = this.getEngine().chat.modifyMessage(message);
    return this.getResponse(promise, true, false).catch((error: any) => {
      const { code = 0, data = {} } = error.code;
      if (code === ERROR_CODE.MSG_MODIFY_CONFLICT) {
        console.warn(`${ERROR_MSG.MSG_MODIFY_CONFLICT} data.message: ${data?.message}`);
      } else if (code === ERROR_CODE.MSG_MODIFY_DISABLED_IN_AVCHATROOM) {
        console.warn(ERROR_MSG.MSG_MODIFY_DISABLED_IN_AVCHATROOM);
      } else if (code === ERROR_CODE.MODIFY_MESSAGE_NOT_EXIST) {
        console.warn(ERROR_MSG.MODIFY_MESSAGE_NOT_EXIST);
      }
      throw error;
    });
  }

  getMessageList(options: Partial<GetMessageListParams> = {
    conversationID: this.getStoreData(StoreName.CONV, 'currentConversationID'),
    nextReqMessageID: this.getStoreData(StoreName.CHAT, 'nextReqMessageID'),
  }) {
    const chatEngine = this.getEngine();
    if (!chatEngine.chat.isReady()) {
      return Promise.reject({
        code: ERROR_CODE_ENGINE.GET_MSG_LIST_ERROR,
        message: ERROR_MSG_ENGINE.GET_MSG_LIST_ERROR,
      });
    }
    if (this.getStoreData(StoreName.CHAT, 'isCompleted')) {
      return Promise.resolve({
        data: {
          messageList: [],
          nextReqMessageID: '',
          isCompleted: true,
        },
      });
    }
    const messageSource = this.getStoreData(StoreName.CHAT, 'messageSource');
    const nextMessageSeq = this.hoppingConfigMap.get('nextMessageSeq');
    const nextMessageTime = this.hoppingConfigMap.get('nextMessageTime');
    const isHopping = nextMessageSeq || nextMessageTime;
    if (messageSource && messageSource.conversationID === options?.conversationID && isHopping) {
      return this.getMessageListHopping();
    }
    return chatEngine.chat.getMessageList(options as GetMessageListParams).then((imResponse: any) => {
      const { messageList, nextReqMessageID, isCompleted } = imResponse.data;
      const userInfo = this.getStoreData(StoreName.CHAT, 'userInfo');
      if (Object.keys(userInfo).length > 0) {
        // When Chat is integrated into Room, it needs to be updated.
        this.updateLocalMessage(messageList, userInfo);
      }
      this.updateMessageList(messageList, 'unshift');
      chatEngine.TUIStore.update(StoreName.CHAT, 'nextReqMessageID', nextReqMessageID);
      chatEngine.TUIStore.update(StoreName.CHAT, 'isCompleted', isCompleted);

      // 异步获取消息回应、群已读回执信息（operationType > 0 说明用户已经不在群组内）
      // const conversationID = messageList[0]?.conversationID;
      // const { operationType = 0 } = this.getEngine().TUIStore.getConversationModel(conversationID) || {};
      // if (operationType === 0) {
      //   this.getMessageReactions({ messageList });
      //   this.readReceiptHandler.getMessageReadReceiptList(messageList);
      // }
      return imResponse;
    }).catch((error: any) => Promise.reject(error));
  }

  getMessageListHopping(options: GetMessageListHoppingParams = {
    conversationID: this.getStoreData(StoreName.CHAT, 'messageSource')?.conversationID,
    sequence: this.hoppingConfigMap.get('nextMessageSeq'),
    time: this.hoppingConfigMap.get('nextMessageTime'),
  }) {
    const chatEngine = this.getEngine();
    const promise = chatEngine.chat.getMessageListHopping(options);
    return promise.then((imResponse: any) => {
      const { messageList, nextMessageSeq, nextMessageTime, isCompleted } = imResponse.data;
      const _nextMessageSeq = options.direction === 1 ? options.sequence : nextMessageSeq;
      const _nextMessageTime = options.direction === 1 ? options.time : nextMessageTime;
      this.updateMessageList(messageList, 'unshift');
      this.delayGetHoppingFunction = undefined;
      this.hoppingConfigMap.set('nextMessageSeq', _nextMessageSeq);
      this.hoppingConfigMap.set('nextMessageTime', _nextMessageTime);
      chatEngine.TUIStore.update(StoreName.CHAT, 'isCompleted', isCompleted);
      return imResponse;
    }).catch((error: any) => Promise.reject(error));
  }

  clearHistoryMessage(conversationID: string) {
    const chatEngine = this.getEngine();
    return chatEngine.chat.clearHistoryMessage(conversationID).then((imResponse: any) => {
      chatEngine.TUIStore.update(StoreName.CHAT, 'messageList', []);
      chatEngine.TUIStore.update(StoreName.CHAT, 'nextReqMessageID', '');
      chatEngine.TUIStore.update(StoreName.CHAT, 'isCompleted', false);
      return imResponse;
    });
  }

  private updateLocalMessage(messageList: any[], userInfo: Record<string, any>) {
    let flag = false;
    messageList.forEach((message: any) => {
      if (userInfo[message.from]) {
        const { nick, nameCard, avatar } = userInfo[message.from];
        if (nick) {
          message.nick = nick;
          flag = true;
        }
        if (nameCard) {
          message.nameCard = nameCard;
          flag = true;
        }
        if (avatar) {
          message.avatar = avatar;
          flag = true;
        }
      }
    });
    return flag;
  }

  private handleC2CCallSignaling(messageList: Message[]) {
    const chatEngine = this.getEngine();
    const myUserID = chatEngine.getMyUserID();
    const list = messageList.filter((message: Message) => {
      const { conversationType, type, payload } = message;
      let isDisplayInChat = true;
      // handle C2C and custom message
      if (conversationType === chatEngine.TYPES.CONV_C2C && type === chatEngine.TYPES.MSG_CUSTOM) {
        const signalingInfo = this.getSignalingInfo(message);
        if (signalingInfo) {
          const callSignaling: any = JSONToObject(payload.data);
          // callSignaling(businessID = 1)
          if (callSignaling?.businessID === 1) {
            const customData = JSONToObject(callSignaling.data);
            isDisplayInChat = !((message as any)._isExcludedFromUnreadCount && (message as any)._isExcludedFromLastMessage);
            if (isDisplayInChat) {
              // handle call signaling when it is not consumed
              if (customData?.data?.consumed !== true) {
                let inviter = customData?.data?.inviter;
                if (customData?.line_busy === 'line_busy' || customData?.data?.message === 'lineBusy') {
                  inviter = callSignaling.inviter;
                }
                const { from, to } = message;
                // reverse message: currentUser is not inviter
                if (inviter !== myUserID && message.from === myUserID) {
                  const currentConversation = this.getStoreData(StoreName.CONV, 'currentConversation');
                  message.from = to;
                  message.to = from;
                  message.flow = 'in';
                  message.avatar = currentConversation?.userProfile?.avatar || '';
                }
                // reverse message: currentUser is inviter
                if (inviter === myUserID && message.from !== myUserID) {
                  const myProfile = this.getStoreData(StoreName.USER, 'userProfile');
                  message.from = to;
                  message.to = from;
                  message.flow = 'out';
                  message.avatar = myProfile?.avatar;
                }
                console.log(`${this.serv}.handleC2CCallSignaling myUserID:${myUserID} callSignaling.inviter:${callSignaling.inviter} customData.data.inviter:${customData?.data?.inviter}`);
              }
            }
          }
        }
      }
      return isDisplayInChat;
    });
    return list;
  }

  private getSignalingInfo(message: Message) {
    const signalingList = this.filterSignalFromMessageList([message]);

    if (signalingList.length === 0) {
      return;
    }

    const signalingData = this.getPayloadData(message);

    if (!signalingData) {
      return;
    }

    const signaling = {
      businessID: signalingData.businessID || 1,
      inviteID: signalingData.inviteID,
      groupID: signalingData.groupID || '',
      inviter: signalingData.inviter || '',
      inviteeList: signalingData.inviteeList || [],
      data: signalingData.data || '',
      actionType: signalingData.actionType || 1,
      timeout: signalingData.timeout || 0,
    };

    return signaling;
  }

  private filterSignalFromMessageList(messageList: Message[]) {
    return messageList.filter((message) => {
      const chatEngine = this.getEngine();
      if (message.type === chatEngine.TYPES.MSG_CUSTOM) {
        const { cloudCustomData = '', payload = {} } = message;
        const data = payload?.data || '';
      
        if (!cloudCustomData && !data) {
          return false;
        }

        const isSignalingTypeExisted = cloudCustomData && cloudCustomData.match(/"type":"tsignaling"/);
        const isInviteIDExisted = data && data.match(/inviteID/);
        const isActionTypeExisted = data && data.match(/actionType/);
        return isSignalingTypeExisted || (isInviteIDExisted && isActionTypeExisted);
      }
      return false;
    });
  }
  
  private getPayloadData(message: Message) {
    const { data } = message.payload;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private sortMessageList(messageList: Message[] | IMessageModel[]) {
    const { conversationType } = messageList[0];
    // C2C sort by time
    if (conversationType === this.getEngine().TYPES.CONV_C2C) {
      return messageList.sort((a, b) => a.time - b.time);
    }
    // GROUP sort by sequence
    const sortedMessageList = messageList.filter(item => item.status === 'success').sort((a, b) => a.sequence - b.sequence);
    // Insert not success message into sortedList
    for (let i = 0; i < messageList.length; i++) {
      if (messageList[i].status !== 'success') {
        sortedMessageList.splice(i, 0, messageList[i]);
      }
    }
    return sortedMessageList;
  }
}
