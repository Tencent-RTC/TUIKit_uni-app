import type { Message } from '@tencentcloud/lite-chat/basic';
import type { IChatStore } from '../../interface/store';
import type { IMessageModel } from '../../interface/model';
import MessageModel from '../../model/message';
import { CHAT_IGNORE_KEYS } from '../../config';

interface ITextInfo {
  messageID: string;
  visible: boolean;
}

export default class ChatStore implements IChatStore {
  public store: {
    messageList: IMessageModel[];
    isCompleted: boolean;
    nextReqMessageID: string;
    quoteMessage: Message | any;
    newMessageList: Message[];
    typingStatus: boolean;
    messageSource: IMessageModel | undefined;
    translateTextInfo: Map<string, ITextInfo[]> | undefined;
    voiceToTextInfo: Map<string, ITextInfo[]> | undefined;
    userInfo: Record<string, any>;
    [key: string]: any;
  };

  public defaultStore = {
    messageList: [],
    isCompleted: false,
    nextReqMessageID: '',
    quoteMessage: {},
    newMessageList: [],
    typingStatus: false,
    messageSource: undefined,
    translateTextInfo: undefined,
    voiceToTextInfo: undefined,
    userInfo: {},
  } as any;

  constructor() {
    this.store = {
      messageList: [],
      isCompleted: false,
      nextReqMessageID: '',
      quoteMessage: {},
      newMessageList: [],
      typingStatus: false,
      messageSource: undefined,
      translateTextInfo: undefined,
      voiceToTextInfo: undefined,
      userInfo: {},
    };
  }

  update(key: string, data: any): void {
    switch (key) {
      case 'messageList':
        this.updateMessageList(data);
        break;
      case 'translateTextInfo':
        this.updateTranslateTextInfo(data);
        break;
      case 'voiceToTextInfo':
        this.updateVoiceToTextInfo(data);
        break;
      default:
        this.store[key] = data;
    }
  }

  getData(key: string) {
    return this.store[key];
  }

  getModel(messageID: string) {
    return this.store.messageList.find((message: IMessageModel) => message.ID === messageID);
  }

  reset(keyList: string[] = []) {
    const resetkeyList = keyList.filter((key: string) => !CHAT_IGNORE_KEYS.includes(key));
    this.store = {
      ...this.defaultStore,
      ...this.store,
      ...resetkeyList?.reduce((acc, key) => ({ ...acc, [key]: this.defaultStore[key] }), {}),
    };
  }

  private updateMessageList(list: any[]) {
    const toBeUpdatedList: IMessageModel[] = [];
    list.forEach((item) => {
      let messageModel: Message | IMessageModel | undefined = item;
      if (!(item instanceof MessageModel)) {
        messageModel = this.getModel(item.ID);
        if (messageModel) {
          (messageModel as MessageModel).updateProperties(item);
        } else {
          messageModel = new MessageModel(item);
        }
      }
      toBeUpdatedList.push(messageModel as IMessageModel);
    });
    this.store.messageList = toBeUpdatedList;
  }

  private updateTranslateTextInfo(data: Record<string, any>) {
    this.updateBykey('translateTextInfo', data);
  }

  private updateVoiceToTextInfo(data: Record<string, any>) {
    this.updateBykey('voiceToTextInfo', data);
  }

  private updateBykey(key: string, data: Record<string, any>) {
    const { conversationID, messageID, visible = false } = data;
    if (!this.store[key]) {
      this.store[key] = new Map();
    }
    if (!this.store[key].has(conversationID)) {
      this.store[key].set(conversationID, []);
    }
    const list = this.store[key].get(conversationID) || [];
    let isAdded = true;
    for (let i = 0; i < list.length; i++) {
      if (list[i].messageID === messageID) {
        list[i].visible = visible;
        isAdded = false;
        break;
      }
    }
    if (isAdded) {
      list.push({ messageID, visible });
    }
    this.store[key].set(conversationID, list);
  }
}
