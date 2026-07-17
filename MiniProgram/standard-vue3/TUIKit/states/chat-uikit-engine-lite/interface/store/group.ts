import type { Message } from '@tencentcloud/lite-chat/basic';
import type { IGroupModel } from '../model';

export interface GroupMember {
  userID: string;
  avatar: string;
  nick: string;
  role: string;
  joinTime: number;
  nameCard: string;
  muteUntil: number;
  memberCustomField: Record<string, any>[];
}

export interface IGroupStore {
  store: {
    currentGroupID: string;
    currentGroup: IGroupModel | undefined;
    currentGroupMemberList: GroupMember[];
    currentGroupAttributes: Record<string, any>;
    currentGroupCounters: Record<string, number>;
    groupList: IGroupModel[];
    groupSystemNoticeList: Message[];
    isCompleted: boolean;
    offset: number | string;
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
   * reset Store 内数据
   * @param { Array<string>} keyList 需要 reset 的 keyList
   */
  reset(keyList?: string[]): void;
}
