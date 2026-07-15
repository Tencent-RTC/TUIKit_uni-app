/**
 * 联系人状态管理 (Vue2 适配版)
 * @module ContactState
 */
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { safeJsonParse } from "../utils/utsUtils";
import type {
  ContactInfo,
  FriendApplicationInfo
} from "../types/contact";

import type { HybridResponseData } from "../types/hybridService";

declare const getApp: any;

/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap() : Map<string, ContactState> {
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

class ContactState {
  /** Store 实例ID */
  public readonly instanceId : string;

  /** 黑名单列表 */
  public readonly blackList : { value: ContactInfo[] };

  /** 好友列表 */
  public readonly friendList : { value: ContactInfo[] };

  /** 好友申请列表 */
  public readonly friendApplicationList : { value: FriendApplicationInfo[] };

  /** 好友申请未读数 */
  public readonly friendApplicationUnreadCount : { value: number };

  private constructor(instanceId : string) {
    this.instanceId = instanceId;
    this.blackList = makeReactive({ value: [] });
    this.friendList = makeReactive({ value: [] });
    this.friendApplicationList = makeReactive({ value: [] });
    this.friendApplicationUnreadCount = makeReactive({ value: 0 });

    this.createStore();
  }

  public static getInstance(instanceId : string) : ContactState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ContactState(instanceId));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore() {
    const options = {
      api: "createStore",
      params: { createStoreParams: this.instanceId }
    };

    callAPI(JSON.stringify(options), (response : string) => {
      try {
        const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
        if (result.code === 0) {
          this.bindEvent();
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

  private bindEvent() : void {
    addListener({
      type: "", store: "Contact", name: "blackList",
      params: { createStoreParams: this.instanceId }
    }, (data : string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.blackList.value = safeJsonParse<ContactInfo[]>(result.blackList, []);
      } catch (error) {
        console.error(`[${this.instanceId}][blackList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "Contact", name: "friendList",
      params: { createStoreParams: this.instanceId }
    }, (data : string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.friendList.value = safeJsonParse<ContactInfo[]>(result.friendList, []);
      } catch (error) {
        console.error(`[${this.instanceId}][friendList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "Contact", name: "friendApplicationList",
      params: { createStoreParams: this.instanceId }
    }, (data : string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.friendApplicationList.value = safeJsonParse<FriendApplicationInfo[]>(result.friendApplicationList, []);
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "Contact", name: "friendApplicationUnreadCount",
      params: { createStoreParams: this.instanceId }
    }, (data : string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.friendApplicationUnreadCount.value = Number(result.friendApplicationUnreadCount || 0);
      } catch (error) {
        console.error(`[${this.instanceId}][friendApplicationUnreadCount listener] Error:`, error);
      }
    });
  }

  // ==================== 新版 API（与 vue3 对齐） ====================

  /**
   * 获取联系人信息（替代旧 fetchUserInfo）
   * @param userIDList 用户ID列表
   */
  getContactInfo = async (userIDList : string[]) : Promise<ContactInfo[]> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "getContactInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList)
        }
      };

      callAPI(JSON.stringify(options), (response : string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ contactInfoList: ContactInfo[] }>>(response, { code: -1 });
          if (result.code === 0) {
            const contactInfoList = (result.data && result.data.data && result.data.data.contactInfoList) ? result.data.data.contactInfoList : [];
            resolve(contactInfoList);
          } else {
            console.error(`[${this.instanceId}][getContactInfo] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to get contact info'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][getContactInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /** 加载好友列表（替代旧 fetchFriendList） */
  loadFriends = async () : Promise<void> => {
    return this.callSimpleApi("loadFriends");
  }

  /** 加载黑名单（替代旧 fetchBlackList） */
  loadBlackList = async () : Promise<void> => {
    return this.callSimpleApi("loadBlackList");
  }

  /** 加载好友申请列表（替代旧 fetchFriendApplicationList） */
  loadFriendApplications = async () : Promise<void> => {
    return this.callSimpleApi("loadFriendApplications");
  }

  /** 添加好友 */
  addFriend = async (userID : string, remark ?: string, addWording ?: string) : Promise<any> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "addFriend",
        params: { createStoreParams: this.instanceId, userID, remark, addWording }
      };
      callAPI(JSON.stringify(options), (response : string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0 || result.code === 30539) {
            resolve(result);
          } else {
            console.error(`[${this.instanceId}][addFriend] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to add friend'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][addFriend] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /** 删除好友 */
  deleteFriend = async (userID : string) : Promise<void> => {
    return this.callApiWithParams("deleteFriend", { userID });
  }

  /** 设置好友备注（替代旧 setUserRemark） */
  setFriendRemark = async (userID : string, remark : string) : Promise<void> => {
    return this.callApiWithParams("setFriendRemark", { userID, remark });
  }

  /** 添加到黑名单 */
  addToBlacklist = async (userID : string) : Promise<void> => {
    return this.callApiWithParams("addToBlacklist", { userID });
  }

  /** 从黑名单移除 */
  removeFromBlacklist = async (userID : string) : Promise<void> => {
    return this.callApiWithParams("removeFromBlacklist", { userID });
  }

  /** 同意好友申请 */
  acceptFriendApplication = async (application : FriendApplicationInfo) : Promise<void> => {
    return this.callApiWithParams("acceptFriendApplication", { info: JSON.stringify(application) });
  }

  /** 拒绝好友申请 */
  refuseFriendApplication = async (application : FriendApplicationInfo) : Promise<void> => {
    return this.callApiWithParams("refuseFriendApplication", { info: JSON.stringify(application) });
  }

  /** 清空好友申请未读数 */
  clearFriendApplicationUnreadCount = async () : Promise<void> => {
    return this.callSimpleApi("clearFriendApplicationUnreadCount");
  }

  // ==================== 内部工具 ====================

  private callSimpleApi(api : string) : Promise<void> {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api,
        params: { createStoreParams: this.instanceId }
      }), (response : string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || `${api} failed`), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][${api}] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  private callApiWithParams(api : string, extraParams : Record<string, any>) : Promise<void> {
    return new Promise((resolve, reject) => {
      const params : Record<string, any> = { createStoreParams: this.instanceId };
      for (const k in extraParams) { params[k] = extraParams[k]; }
      callAPI(JSON.stringify({ api, params }), (response : string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || `${api} failed`), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][${api}] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  private unbindEvent() : void {
    const dataNames = [
      "blackList", "friendList", "friendApplicationList", "friendApplicationUnreadCount"
    ];
    dataNames.forEach(name => {
      removeListener({
        type: "", store: "Contact", name,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  private resetData() : void {
    this.blackList.value = [];
    this.friendList.value = [];
    this.friendApplicationList.value = [];
    this.friendApplicationUnreadCount.value = 0;
  }

  destroyStore = () : void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);

    callAPI(JSON.stringify({
      api: "destroyStore",
      params: { createStoreParams: this.instanceId }
    }), (response : string) => {
      try {
        safeJsonParse<HybridResponseData>(response, { code: -1 });
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

export function useContactState(instanceId ?: string) {
  const options : any = { storeName: "Contact" };
  if (instanceId) {
    options.instanceId = instanceId;
  }
  return ContactState.getInstance(JSON.stringify(options));
}

export { ContactState };
export default useContactState;
