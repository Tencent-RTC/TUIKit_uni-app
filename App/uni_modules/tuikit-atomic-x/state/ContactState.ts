/**
 * 联系人状态管理
 * @module ContactState
 *
 * 对齐底层 atomicxcore.api.contact.ContactStore.kt（HybridAPI: ContactAPI.kt）
 *
 * **本次升级关键调整：**
 * - `fetchUserInfo` → `getContactInfo`（响应字段 `userInfoList` → `contactInfoList`）
 * - `fetchFriendList` → `loadFriends`
 * - `fetchBlackList` → `loadBlackList`
 * - `fetchFriendApplicationList` → `loadFriendApplications`
 * - `setUserRemark` → `setFriendRemark`
 * - **移除** `setReceiveMessageOpt`：已下沉到 `ConversationListStore.setReceiveMessageOpt`
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import type {
  ContactInfo,
  FriendApplicationInfo,
} from "../types/contact";
import type { HybridResponseData } from "../types/hybridService";

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

  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.blackList = ref<ContactInfo[]>([]);
    this.friendList = ref<ContactInfo[]>([]);
    this.friendApplicationList = ref<FriendApplicationInfo[]>([]);
    this.friendApplicationUnreadCount = ref<number>(0);



    this.createStore();
  }

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
        createStoreParams: this.instanceId,
      },
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          // 初始化拉取数据
          this.loadFriends();
          this.loadBlackList();
          this.loadFriendApplications();
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private bindEvent(): void {
    addListener({
      type: "",
      store: "Contact",
      name: "blackList",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ContactInfo[]>(result.blackList, []);
        this.blackList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][blackList listener] Error:`, error);
      }
    });

    addListener({
      type: "",
      store: "Contact",
      name: "friendList",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ContactInfo[]>(result.friendList, []);
        this.friendList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][friendList listener] Error:`, error);
      }
    });

    addListener({
      type: "",
      store: "Contact",
      name: "friendApplicationList",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<FriendApplicationInfo[]>(result.friendApplicationList, []);
        this.friendApplicationList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationList listener] Error:`, error);
      }
    });

    addListener({
      type: "",
      store: "Contact",
      name: "friendApplicationUnreadCount",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.friendApplicationUnreadCount.value = Number(result.friendApplicationUnreadCount);
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationUnreadCount listener] Error:`, error);
      }
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 拉取联系人信息列表（旧名 fetchUserInfo）
   * @param userIDList 用户ID列表
   * @returns ContactInfo 列表
   */
  getContactInfo = async (userIDList: string[]): Promise<ContactInfo[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "getContactInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ contactInfoList: ContactInfo[] }>>(response, { code: -1 });
          if (result.code === 0) {
            const list = result.data?.data?.contactInfoList || [];
            resolve(list);
          } else {
            console.error(`[${this.instanceId}][getContactInfo] Failed:`, result.message);
            reject(result);
          }
        } catch (error) {
          console.error(`[${this.instanceId}][getContactInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取好友列表（旧名 fetchFriendList）
   */
  loadFriends = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadFriends",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadFriends] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to load friends'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][loadFriends] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取黑名单列表（旧名 fetchBlackList）
   */
  loadBlackList = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadBlackList",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadBlackList] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to load black list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][loadBlackList] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取好友申请列表（旧名 fetchFriendApplicationList）
   */
  loadFriendApplications = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadFriendApplications",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadFriendApplications] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to load friend applications'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][loadFriendApplications] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 添加好友
   */
  addFriend = async (userID: string, remark?: string, addWording?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addFriend",
        params: {
          createStoreParams: this.instanceId,
          userID,
          remark,
          addWording,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // 30539 = 好友请求待审核
          if (result.code === 0 || result.code === 30539) {
            resolve(result);
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
  };

  /**
   * 删除好友
   */
  deleteFriend = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteFriend",
        params: {
          createStoreParams: this.instanceId,
          userID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  /**
   * 设置好友备注（旧名 setUserRemark）
   */
  setFriendRemark = async (userID: string, remark: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setFriendRemark",
        params: {
          createStoreParams: this.instanceId,
          userID,
          remark,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setFriendRemark] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to set friend remark'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setFriendRemark] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 添加到黑名单
   */
  addToBlacklist = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addToBlacklist",
        params: {
          createStoreParams: this.instanceId,
          userID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  /**
   * 从黑名单移除
   */
  removeFromBlacklist = async (userID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "removeFromBlacklist",
        params: {
          createStoreParams: this.instanceId,
          userID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  /**
   * 同意好友申请
   */
  acceptFriendApplication = async (application: FriendApplicationInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "acceptFriendApplication",
        params: {
          createStoreParams: this.instanceId,
          info: JSON.stringify(application),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  /**
   * 拒绝好友申请
   */
  refuseFriendApplication = async (application: FriendApplicationInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "refuseFriendApplication",
        params: {
          createStoreParams: this.instanceId,
          info: JSON.stringify(application),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  /**
   * 清空好友申请未读数
   */
  clearFriendApplicationUnreadCount = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearFriendApplicationUnreadCount",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
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
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  private unbindEvent(): void {
    const dataNames = [
      "blackList",
      "friendList",
      "friendApplicationList",
      "friendApplicationUnreadCount",
    ];

    dataNames.forEach((dataName) => {
      removeListener({
        type: "",
        store: "Contact",
        name: dataName,
        params: { createStoreParams: this.instanceId },
      });
    });
  }

  private resetData(): void {
    this.blackList.value = [];
    this.friendList.value = [];
    this.friendApplicationList.value = [];
    this.friendApplicationUnreadCount.value = 0;
  }


  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);

    const options: HybridCallOptions = {
      api: "destroyStore",
      params: {
        createStoreParams: this.instanceId,
      },
    };

    callAPI(JSON.stringify(options), () => {});
  };
}

/**
 * 联系人状态管理 Hook
 * @param instanceId Store 实例ID（可选；多 instance 场景使用）
 */
export function useContactState(instanceId?: string) {
  const options: any = {
    storeName: "Contact",
  };
  if (instanceId) {
    options.instanceId = instanceId;
  }
  return ContactState.getInstance(JSON.stringify(options));
}

export { ContactState };
export default useContactState;
