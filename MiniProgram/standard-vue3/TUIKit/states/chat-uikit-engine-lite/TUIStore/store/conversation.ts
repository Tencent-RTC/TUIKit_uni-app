import type { Conversation } from '@tencentcloud/lite-chat/basic';
import type { IConversationStore } from '../../interface/store';
import type { IConversationModel } from '../../interface/model';
import ConversationModel from '../../model/conversation';

export default class ConversationStore implements IConversationStore {
  public store: {
    currentConversationID: string;
    currentConversation: IConversationModel | null;
    totalUnreadCount: number;
    conversationList: IConversationModel[];
    operationTypeMap: Map<string, number>; // 记录退群、群解散、被踢的群
    [key: string]: any;
  };

  public defaultStore = {
    currentConversationID: '',
    totalUnreadCount: 0,
    conversationList: [],
    currentConversation: null,
    operationTypeMap: new Map(),
  } as any;

  constructor() {
    this.store = {
      currentConversationID: '',
      totalUnreadCount: 0,
      conversationList: [],
      currentConversation: null,
      operationTypeMap: new Map(),
    };
  }

  update(key: string, data: any) {
    switch (key) {
      case 'conversationList':
        this.updateConversationList(data);
        break;
      case 'operationTypeMap':
        this.updateOperationTypeMap(data);
        break;
      default:
        this.store[key] = data;
    }
  }

  getData(key: string) {
    return this.store[key];
  }

  getModel(conversationID: string) {
    return this.store.conversationList.find((conversation: IConversationModel) => conversation.conversationID === conversationID);
  }

  reset(keyList: string[] = []) {
    this.store = {
      ...this.defaultStore,
      ...this.store,
      ...keyList.reduce((acc, key) => ({ ...acc, [key]: this.defaultStore[key] }), {}),
    };
  }

  private updateConversationList(list: Conversation[] | ConversationModel[]) {
    const toBeUpdatedList: any[] = [];
    list.forEach((item: Conversation | ConversationModel) => {
      let conversationModel: Conversation | IConversationModel | undefined = item;
      if (!(item instanceof ConversationModel)) {
        conversationModel = new ConversationModel(item);
      } else {
        (conversationModel as ConversationModel).updateProperties(item);
      }
      const optType = this.getOperationType(item);
      (conversationModel as ConversationModel).updateOperationType(optType);
      toBeUpdatedList.push(conversationModel);
    });
    this.store.conversationList = toBeUpdatedList;
  }

  private updateOperationTypeMap(data: Record<string, any>) {
    const { conversationID, operationType = 0 } = data;
    this.store.operationTypeMap.set(conversationID, operationType);
  }

  private getOperationType(conversation: any) {
    const { conversationID } = conversation;
    return this.store.operationTypeMap.get(conversationID) || 0;
  }
}
