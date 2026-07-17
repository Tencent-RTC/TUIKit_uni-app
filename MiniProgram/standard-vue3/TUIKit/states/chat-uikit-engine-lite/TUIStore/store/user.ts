import type { IUserStore } from '../../interface/store';
import { UserStatus } from '../../const';

interface IBlackUser {
  userID: string;
  nick: string;
  avatar: string;
}

export default class UserStore implements IUserStore {
  public store: {
    userProfile: object;
    displayOnlineStatus: boolean;
    displayMessageReadReceipt: boolean;
    userStatusList: Map<string, {
      statusType: number;
      customStatus: string;
    }>;
    kickedOut: string;
    netStateChange: string;
    userBlacklist: IBlackUser[];
    targetLanguage: string;
    [key: string]: any;
  };

  public defaultStore = {
    userProfile: {},
    displayOnlineStatus: false,
    displayMessageReadReceipt: true,
    userStatusList: new Map(),
    kickedOut: '',
    netStateChange: '',
    userBlacklist: [],
    targetLanguage: 'zh',
  } as any;

  constructor() {
    this.store = {
      userProfile: {},
      displayOnlineStatus: false, // 默认关闭在线状态功能，防止专业版集成引起报错
      displayMessageReadReceipt: true, // 默认在用户纬度开启消息阅读状态功能
      userStatusList: new Map(), // 获取/订阅/取消订阅用户状态的 userID 列表
      kickedOut: '',
      netStateChange: '',
      userBlacklist: [],
      targetLanguage: 'zh',
    };
  }

  update(key: string, data: any) {
    switch (key) {
      case 'userStatusList':
        this.updateUserStatusList(data);
        break;
      default:
        this.store[key] = data;
    }
  }

  getData(key: string) {
    return this.store[key];
  }

  reset(keyList: string[] = []) {
    this.store = {
      ...this.defaultStore,
      ...this.store,
      ...keyList.reduce((acc, key) => ({ ...acc, [key]: this.defaultStore[key] }), {}),
    };
  }

  private updateUserStatusList(list: any[]) {
    if (list.length === 0) {
      this.store.userStatusList.clear();
      return;
    }
    list.forEach((item: { userID: string; statusType: number; customStatus: string }) => {
      const { userID, statusType = 0, customStatus = '' } = item;
      // statusType = -1 表示该用户已被取消订阅，内部约定规则
      if (statusType === UserStatus.UNSUB_USER) {
        this.store.userStatusList.delete(userID);
      } else {
        this.store.userStatusList.set(userID, { statusType, customStatus });
      }
    });
  }
}
