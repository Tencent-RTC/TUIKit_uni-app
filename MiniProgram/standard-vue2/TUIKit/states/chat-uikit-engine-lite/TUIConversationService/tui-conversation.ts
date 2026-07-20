import type { Conversation, Message } from '@tencentcloud/lite-chat/basic';
import TUIBase from '../tui-base';
import type { ITUIConversationService } from '../interface/service';
import { StoreName, ERROR_CODE_ENGINE, ERROR_MSG_ENGINE } from '../const';
import { isUndefined } from '../utils/common-utils';
import ConversationModel from '../model/conversation';

export default class TUIConversationService extends TUIBase implements ITUIConversationService {
  static instance: TUIConversationService;
  private serv: string;
  constructor() {
    super();
    this.serv = 'TUIConversationService';
  }

  /**
   * 获取 TUIConversationService 实例
  */
  static getInstance() {
    if (!TUIConversationService.instance) {
      TUIConversationService.instance = new TUIConversationService();
    }
    return TUIConversationService.instance;
  }

  public init() {
    const chatEngine = this.getEngine();
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated.bind(this));
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.TOTAL_UNREAD_MESSAGE_COUNT_UPDATED, this.onTotalUnreadCountUpdated.bind(this));
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
    this.getConversationInitData();
  }

  private onConversationListUpdated(conversationList: Conversation[]) {
    const tmpConversationList = this.filterSystemConversation(conversationList);
    this.getEngine().TUIStore.update(StoreName.CONV, 'conversationList', tmpConversationList);
    this.updateCurrentConversation();
  }

  private onTotalUnreadCountUpdated(totalUnreadCount: number) {
    this.getEngine().TUIStore.update(StoreName.CONV, 'totalUnreadCount', totalUnreadCount);
  }

  private onMessageReceived(messageList: Message[]) {
    const chatEngine = this.getEngine();
    const conversationList = this.getEngine().TUIStore.getData(StoreName.CONV, 'conversationList');
    let toBeUpdated = false;
    for (let i = 0; i < messageList.length; i++) {
      if (messageList[i].type !== chatEngine.TYPES.MSG_GRP_SYS_NOTICE) {
        continue;
      }
      const { operationType } = messageList[i].payload;
      const conversationID = `GROUP${messageList[i].to}`;
      const condition1 = (operationType === 4 || operationType === 5 || operationType === 8); // 群成员被踢(operationType=4)、群组被解散(operationType=5)、主动退群(operationType=8)
      const condition2 = (operationType === 2 || operationType === 6 || operationType === 7); // 主动加群(operationType=2)、创建群组(operationType=6)、被邀请进群(operationType=7)
      if (condition1 || condition2) {
        for (let j = 0; j < conversationList.length; j++) {
          // C2C 会话直接跳过，节省循环执行时间
          if (conversationList[j].type === chatEngine.TYPES.CONV_C2C) {
            continue;
          }
          if (conversationList[j].conversationID === conversationID) {
            if (condition1) {
              this.getEngine().TUIStore.update(StoreName.CONV, 'operationTypeMap', { conversationID, operationType });
              toBeUpdated = true;
              break;
            }
            // 当前登录生命周期内，主动退群、解散群组、被踢后，再次主动加群、创建群组、被邀请进群时需要重置 operationType 为 0
            if (condition2 && conversationList[j].operationType > 0) {
              this.getEngine().TUIStore.update(StoreName.CONV, 'operationTypeMap', { conversationID, operationType: 0 });
              toBeUpdated = true;
              break;
            }
          }
        }
      }
    }
    if (toBeUpdated) {
      this.getEngine().TUIStore.update(StoreName.CONV, 'conversationList', conversationList);
      const currentConversationID = this.getEngine().TUIStore.getData(StoreName.CONV, 'currentConversationID') || '';
      const currentConversation = this.findConversation(currentConversationID);
      if (currentConversation) {
        this.getEngine().TUIStore.update(StoreName.CONV, 'currentConversation', currentConversation);
      }
    }
  }

  // 解决 TUIChatEngine 含 UI集成通过 TUILogin 登录时注册 Chat SDK 事件时机后置问题
  private getConversationInitData() {
    const chatEngine = this.getEngine();
    // TUIChatEngine 无 UI 集成时不需要执行此逻辑
    if (!chatEngine.chat.isReady()) {
      return;
    }
    chatEngine.chat.getConversationList().then((imResponse: any) => {
      const { conversationList, isSyncCompleted } = imResponse.data;
      console.log(`${this.serv}.init, getConversationList count:${conversationList.length} isSyncCompleted:${isSyncCompleted}`);
      if (conversationList.length > 0) {
        this.onConversationListUpdated(conversationList);
        const totalUnreadCount: number = chatEngine.chat.getTotalUnreadMessageCount();
        this.onTotalUnreadCountUpdated(totalUnreadCount);
      }
    });
  }

  public async switchConversation(conversationID: string) {
    const logTxt = `${this.serv}.switchConversation`;
    const chatEngine = this.getEngine();
    if (!conversationID) {
      chatEngine.TUIStore.reset(StoreName.CHAT, ['messageList', 'isCompleted', 'nextReqMessageID']);
      chatEngine.TUIStore.update(StoreName.CONV, 'currentConversationID', '');
      chatEngine.TUIStore.update(StoreName.CONV, 'currentConversation', null);
      console.log(`${logTxt} conversationID is empty, conversationID:${conversationID}`);
      return Promise.resolve({});
    }
    if (!conversationID.startsWith(chatEngine.TYPES.CONV_C2C) && !conversationID.startsWith(chatEngine.TYPES.CONV_GROUP)) {
      console.warn(`${logTxt} conversationID is invalid, conversationID:${conversationID}`);
      return Promise.reject({
        code: ERROR_CODE_ENGINE.INVALID_CONV_ID,
        message: ERROR_MSG_ENGINE.INVALID_CONV_ID,
      });
    }
    const enableAutoMessageRead = chatEngine.TUIStore.getData(StoreName.APP, 'enableAutoMessageRead');
    const currentConversationID = chatEngine.TUIStore.getData(StoreName.CONV, 'currentConversationID');
    if (currentConversationID && currentConversationID === conversationID) {
      if (enableAutoMessageRead) {
        this.setMessageRead(currentConversationID);
      }
      console.warn(`${logTxt} please check conversationID, conversationID:${conversationID}`);
      return Promise.resolve({
        code: ERROR_CODE_ENGINE.CONV_ID_SAME,
        message: ERROR_MSG_ENGINE.CONV_ID_SAME,
      });
    }

    // 需要切换的目标会话
    const targetConversation: any = await this.getConversationModel(conversationID);
    if (isUndefined(targetConversation)) {
      console.warn(`${logTxt} target conversation is not exist, conversationID:${conversationID}`);
      return Promise.reject({
        code: ERROR_CODE_ENGINE.CONV_NOT_EXIST,
        message: ERROR_MSG_ENGINE.CONV_NOT_EXIST,
      });
    }
    if (enableAutoMessageRead) {
      if (currentConversationID) {
        this.setMessageRead(currentConversationID);
      }
      if (conversationID) {
        this.setMessageRead(conversationID);
      }
    }
    chatEngine.TUIStore.reset(StoreName.CHAT, ['messageList', 'isCompleted', 'nextReqMessageID']);
    chatEngine.TUIStore.update(StoreName.CONV, 'currentConversationID', conversationID);
    chatEngine.TUIStore.update(StoreName.CONV, 'currentConversation', targetConversation);
    return Promise.resolve(targetConversation);
  }

  private async getConversationModel(conversationID: string) {
    let conversationModel: any = this.findConversation(conversationID);
    if (isUndefined(conversationModel)) {
      try {
        const res: any = await this.getConversationProfile(conversationID);
        if (res.data && res.data.conversation) {
          conversationModel = new ConversationModel(res.data.conversation);
        }
      } catch (error) {
        conversationModel = undefined;
      }
    }
    return conversationModel;
  }

  private findConversation(conversationID: string) {
    let conversation: any;
    const conversationList = this.getEngine().TUIStore.getData(StoreName.CONV, 'conversationList');
    for (let i = 0; i < conversationList.length; i++) {
      if (conversationList[i].conversationID === conversationID) {
        conversation = conversationList[i];
        break;
      }
    }
    return conversation;
  }

  private updateCurrentConversation() {
    const chatEngine = this.getEngine();
    const currentConversationID: string = chatEngine.TUIStore.getData(StoreName.CONV, 'currentConversationID');
    const currentConversation = this.findConversation(currentConversationID);
    // 更新当前会话
    if (currentConversation) {
      chatEngine.TUIStore.update(StoreName.CONV, 'currentConversation', currentConversation);
    }
  }

  public getConversationList() {
    return this.getEngine().chat.getConversationList();
  }

  public getConversationProfile(conversationID: string) {
    return this.getEngine().chat.getConversationProfile(conversationID);
  }

  public clearHistoryMessage(conversationID: string) {
    return this.getEngine().chat.clearHistoryMessage(conversationID).then((imResponse: any) => {
      this.getEngine().TUIStore.update(StoreName.CHAT, 'messageList', []);
      this.getEngine().TUIStore.update(StoreName.CHAT, 'nextReqMessageID', '');
      this.getEngine().TUIStore.update(StoreName.CHAT, 'isCompleted', true);
      return imResponse;
    });
  }

  public setMessageRead(conversationID: string) {
    return this.getEngine().chat.setMessageRead({ conversationID });
  }

  /**
   * 过滤系统会话
   * @param {Array<any>} list SDK 更新下来的会话列表数据
   */
  private filterSystemConversation(list: any[]) {
    const toBeUpdatedList = list.filter(conversation => conversation.type !== this.getEngine().TYPES.CONV_SYSTEM);
    return toBeUpdatedList;
  }

}
