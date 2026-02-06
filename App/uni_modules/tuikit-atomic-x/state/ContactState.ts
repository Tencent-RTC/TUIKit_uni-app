/**
 * 联系人状态管理
 * @module ContactState
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import type {
  ContactInfo,
  FriendApplicationInfo
} from "../types/contact";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";

import type { HybridResponseData } from "../types/hybridService";

/** 消息接收选项 */
export enum ReceiveMessageOpt {
  /** 接收消息 */
  RECEIVE = "RECEIVE",
  /** 不接收消息 */
  NOT_RECEIVE = "NOT_RECEIVE",
  /** 不通知 */
  NOT_NOTIFY = "NOT_NOTIFY",
  /** 不通知（除了@消息） */
  NOT_NOTIFY_EXCEPT_MENTION = "NOT_NOTIFY_EXCEPT_MENTION",
  /** 不接收（除了@消息） */
  NOT_RECEIVE_EXCEPT_MENTION = "NOT_RECEIVE_EXCEPT_MENTION"
}

/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap(): Map<string, ContactState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__CONTACT_STATE_INSTANCES__) {
        app.globalData.__CONTACT_STATE_INSTANCES__ = new Map<string, ContactState>();
      }
      return app.globalData.__CONTACT_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[ContactState] getApp() not available:', e);
  }
  return new Map<string, ContactState>();
}

const InstanceMap = getGlobalInstanceMap();

/**
 * 联系人状态管理类
 */
class ContactState {
  /** Store 实例ID */
  public readonly instanceId: string;

  /** 黑名单列表 */
  public readonly blackList: Ref<ContactInfo[]>;

  /** 好友列表 */
  public readonly friendList: Ref<ContactInfo[]>;

  /** 好友申请列表 */
  public readonly friendApplicationList: Ref<FriendApplicationInfo[]>;

  /** 好友申请未读数 */
  public readonly friendApplicationUnreadCount: Ref<number>;

  /** 添加好友信息 */
  public readonly addFriendInfo: Ref<ContactInfo | null>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param instanceId Store 实例ID
   */
  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.blackList = ref<ContactInfo[]>([]);
    this.friendList = ref<ContactInfo[]>([]);
    this.friendApplicationList = ref<FriendApplicationInfo[]>([]);
    this.friendApplicationUnreadCount = ref<number>(0);
    this.addFriendInfo = ref<ContactInfo | null>(null);

    // 初始化 Store
    this.createStore();
  }

  /**
   * 获取实例（单例模式）
   * @param instanceId Store 实例ID
   */
  public static getInstance(instanceId: string): ContactState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ContactState(instanceId));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore() {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId
      }
    };

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        console.log(`[${this.instanceId}][createStore] Response:`, result);

        if (result.code === 0) {
          console.log(`[${this.instanceId}][createStore] Success`);
          this.bindEvent();
          // 初始化拉取数据
          this.fetchFriendList();
          this.fetchBlackList();
          this.fetchFriendApplicationList();
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  /**
   * 绑定事件监听
   */
  private bindEvent(): void {
    // 监听黑名单列表变化
    addListener({
      type: "",
      store: "Contact",
      name: "blackList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ContactInfo[]>(result.blackList, []);
        console.log(`[${this.instanceId}][blackList listener] Data:`, list);
        this.blackList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][blackList listener] Error:`, error);
      }
    });

    // 监听好友列表变化
    addListener({
      type: "",
      store: "Contact",
      name: "friendList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ContactInfo[]>(result.friendList, []);
        console.log(`[${this.instanceId}][friendList listener] Data:`, list);
        this.friendList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][friendList listener] Error:`, error);
      }
    });

    // 监听好友申请列表变化
    addListener({
      type: "",
      store: "Contact",
      name: "friendApplicationList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<FriendApplicationInfo[]>(result.friendApplicationList, []);
        console.log(`[${this.instanceId}][friendApplicationList listener] Data:`, list);
        this.friendApplicationList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationList listener] Error:`, error);
      }
    });

    // 监听好友申请未读数变化
    addListener({
      type: "",
      store: "Contact",
      name: "friendApplicationUnreadCount",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        console.log(`[${this.instanceId}][friendApplicationUnreadCount listener] Data:`, result);
        this.friendApplicationUnreadCount.value = Number(result.friendApplicationUnreadCount);
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationUnreadCount listener] Error:`, error);
      }
    });
  }

  /**
   * 拉取用户信息列表
   * @param userIDList 用户ID列表
   * @returns {Promise<ContactInfo[]>}
   */
  fetchUserInfo = async (userIDList: string[]): Promise<ContactInfo[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchUserInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{userInfoList: ContactInfo[]}>>(response, {});
          console.log(`[${this.instanceId}][fetchUserInfo] Response:`, result);

          if (result.code === 0) {
            const userInfoList = result.data?.data?.userInfoList || [];
            resolve(userInfoList);
          } else {
            console.error(`[${this.instanceId}][fetchUserInfo] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to fetch user info list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchUserInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拉取好友列表
   * @returns {Promise<void>}
   */
  fetchFriendList = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchFriendList",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][fetchFriendList] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchFriendList] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to fetch friend list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchFriendList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拉取黑名单列表
   * @returns {Promise<void>}
   */
  fetchBlackList = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchBlackList",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][fetchBlackList] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchBlackList] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to fetch black list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchBlackList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拉取好友申请列表
   * @returns {Promise<void>}
   */
  fetchFriendApplicationList = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchFriendApplicationList",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][fetchFriendApplicationList] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchFriendApplicationList] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to fetch friend application list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchFriendApplicationList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 添加好友
   * @param userID 用户ID
   * @param remark 备注
   * @param addWording 添加附言
   * @returns {Promise<void>}
   */
  addFriend = async (userID: string, remark?: string, addWording?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addFriend",
        params: {
          createStoreParams: this.instanceId,
          userID,
          remark,
          addWording
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][addFriend] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][addFriend] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to add friend'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][addFriend] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 删除好友
   * @param userID 用户ID
   * @returns {Promise<void>}
   */
  deleteFriend = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteFriend",
        params: {
          createStoreParams: this.instanceId,
          userID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][deleteFriend] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteFriend] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to delete friend'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][deleteFriend] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置好友备注
   * @param userID 用户ID
   * @param remark 备注
   * @returns {Promise<void>}
   */
  setUserRemark = async (userID: string, remark: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setUserRemark",
        params: {
          createStoreParams: this.instanceId,
          userID,
          remark
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][setUserRemark] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setUserRemark] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to set user remark'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setUserRemark] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 添加到黑名单
   * @param userID 用户ID
   * @returns {Promise<void>}
   */
  addToBlacklist = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addToBlacklist",
        params: {
          createStoreParams: this.instanceId,
          userID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][addToBlacklist] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][addToBlacklist] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to add to blacklist'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][addToBlacklist] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 从黑名单移除
   * @param userID 用户ID
   * @returns {Promise<void>}
   */
  removeFromBlacklist = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "removeFromBlacklist",
        params: {
          createStoreParams: this.instanceId,
          userID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][removeFromBlacklist] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][removeFromBlacklist] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to remove from blacklist'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][removeFromBlacklist] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 同意好友申请
   * @param applicationID 申请ID
   * @returns {Promise<void>}
   */
  acceptFriendApplication = async (applicationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "acceptFriendApplication",
        params: {
          createStoreParams: this.instanceId,
          applicationID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][acceptFriendApplication] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][acceptFriendApplication] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to accept friend application'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][acceptFriendApplication] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拒绝好友申请
   * @param applicationID 申请ID
   * @returns {Promise<void>}
   */
  refuseFriendApplication = async (applicationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "refuseFriendApplication",
        params: {
          createStoreParams: this.instanceId,
          applicationID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][refuseFriendApplication] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][refuseFriendApplication] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to refuse friend application'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][refuseFriendApplication] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 清空好友申请未读数
   * @returns {Promise<void>}
   */
  clearFriendApplicationUnreadCount = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearFriendApplicationUnreadCount",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][clearFriendApplicationUnreadCount] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearFriendApplicationUnreadCount] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to clear friend application unread count'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][clearFriendApplicationUnreadCount] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置消息接收选项
   * @param userID 用户ID
   * @param opt 消息接收选项
   * @returns {Promise<void>}
   */
  setReceiveMessageOpt = async (userID: string, opt: ReceiveMessageOpt): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setReceiveMessageOpt",
        params: {
          createStoreParams: this.instanceId,
          userID,
          opt
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          console.log(`[${this.instanceId}][setReceiveMessageOpt] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setReceiveMessageOpt] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to set receive message opt'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setReceiveMessageOpt] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    const dataNames = [
      "blackList",
      "friendList",
      "friendApplicationList",
      "friendApplicationUnreadCount"
    ];

    dataNames.forEach(dataName => {
      removeListener({
        type: "",
        store: "Contact",
        name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  /**
   * 重置数据
   */
  private resetData(): void {
    this.blackList.value = [];
    this.friendList.value = [];
    this.friendApplicationList.value = [];
    this.friendApplicationUnreadCount.value = 0;
    this.addFriendInfo.value = null;
  }

  /**
   * 销毁 Store
   */
  destroyStore = (): void => {
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);

    const options: HybridCallOptions = {
      api: "destroyStore",
      params: {
        createStoreParams: this.instanceId
      }
    };

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);

        if (result.code === 0) {
          console.log(`[${this.instanceId}][destroyStore] Success`);
        } else {
          console.error(`[${this.instanceId}][destroyStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * 联系人状态管理 Hook
 * @param instanceId Store 实例ID，默认为 "default_contact_store"
 */
export function useContactState(instanceId?: string) {
  const options: any = {
    storeName: "Contact",
  }
  if (instanceId) {
    options.instanceId = instanceId;
  }
  return ContactState.getInstance(JSON.stringify(options));
}

export { ContactState };
export default useContactState;
