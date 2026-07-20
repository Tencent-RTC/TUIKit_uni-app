import type { IConversationModel } from '../model';

export interface IConversationStore {
  store: {
    currentConversationID: string;
    currentConversation: IConversationModel | null;
    totalUnreadCount: number;
    conversationList: IConversationModel[];
  };

  /**
   * 更新 store
   * @param {Sting} key 待更新的 key
   * @param {any} data 更新的数据
   */
  update(key: string, data: any): void;

  /**
   * 从 store 中获取数据
   * @param {Sting} key 需要获取的 key
   */
  getData(key: string): any;

  /**
   * 从 conversationList 中获取 conversationModel
   * @param {Sting} conversationID 需要获取的会话 ID
   */
  getModel(id: string): any;

  /**
   * reset Store 内数据
   * @param { Array<string>} keyList 需要 reset 的 keyList
   */
  reset(keyList?: string[]): void;
}
