import type { Message } from '@tencentcloud/lite-chat/basic';
import type { IMessageModel } from '../model';

interface ITextInfo {
  messageID: string;
  visible: boolean;
}

export interface IChatStore {
  store: {
    messageList: IMessageModel[];
    isCompleted: boolean;
    nextReqMessageID: string;
    quoteMessage: Message | any;
    typingStatus: boolean;
    messageSource: IMessageModel | undefined;
    newMessageList: Message[];
    translateTextInfo: Map<string, ITextInfo[]> | undefined;
    voiceToTextInfo: Map<string, ITextInfo[]> | undefined;
    userInfo: Record<string, any>;
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
   * 从 messageList 中获取 messageModel
   * @param {Sting} id 需要获取的 messageID
   */
  getModel(id: string): any;

  /**
   * reset Store 内数据
   * @param { Array<string>} keyList 需要 reset 的 keyList
   */
  reset(keyList?: string[]): void;
}
