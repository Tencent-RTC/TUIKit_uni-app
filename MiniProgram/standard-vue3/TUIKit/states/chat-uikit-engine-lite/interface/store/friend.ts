import type { Friend, FriendApplication, FriendGroup } from '../../type';

export interface IFriendStore {
  store: {
    friendList: Friend[];
    friendApplicationList: FriendApplication[];
    friendApplicationUnreadCount: number; // 好友申请的未读数
    friendGroupList: FriendGroup[];
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
