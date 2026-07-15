/**
 * Group 状态管理 (Vue2 适配版)
 * @module GroupState
 */
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore
import { safeJsonParse } from "../utils/utsUtils";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { GroupType, GroupJoinOption, GroupInviteOption } from "../types/group";
import { ReceiveMessageOpt } from "../types/contact";
import type { GroupInfo, GroupApplicationInfo, GroupCreateParams } from "../types/group";
import type { HybridResponseData } from "../types/hybridService";

declare const getApp: any;

interface IGroupState {
  readonly instanceId: string;
  readonly joinedGroupList: { value: GroupInfo[] };
  readonly applicationList: { value: GroupApplicationInfo[] };
  readonly unreadApplicationCount: { value: number };

  // 新版 API
  getGroupInfo: (groupID: string) => Promise<GroupInfo | null>;
  loadJoinedGroups: () => Promise<void>;
  loadApplications: () => Promise<void>;
  loadGroupAttributes: (groupID: string, keys?: string[]) => Promise<Record<string, string>>;
  createGroup: (params: GroupCreateParams) => Promise<string>;
  joinGroup: (groupID: string, message?: string) => Promise<void>;
  quitGroup: (groupID: string) => Promise<void>;
  dismissGroup: (groupID: string) => Promise<void>;
  acceptApplication: (application: GroupApplicationInfo) => Promise<void>;
  refuseApplication: (application: GroupApplicationInfo) => Promise<void>;
  clearApplicationUnreadCount: () => Promise<void>;
  changeOwner: (groupID: string, newOwnerID: string) => Promise<void>;
  updateProfile: (groupInfo: Partial<GroupInfo>) => Promise<void>;
  setJoinOption: (groupID: string, option: GroupJoinOption) => Promise<void>;
  setInviteOption: (groupID: string, option: GroupInviteOption) => Promise<void>;
  muteAllMembers: (groupID: string, isMuted: boolean) => Promise<void>;
  destroyStore: () => Promise<void>;
  onGroupEvent: (handler: (event: any) => void) => void;
}

function getGlobalInstanceMap(): Map<string, GroupState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__GROUP_STATE_INSTANCES__) {
        app.globalData.__GROUP_STATE_INSTANCES__ = new Map<string, GroupState>();
      }
      return app.globalData.__GROUP_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[GroupState] getApp() not available:', e);
  }
  return new Map<string, GroupState>();
}

const InstanceMap = getGlobalInstanceMap();

class GroupState implements IGroupState {
  private static readonly STORE_NAME = "Group";

  public readonly instanceId: string;
  public readonly joinedGroupList: { value: GroupInfo[] };
  public readonly applicationList: { value: GroupApplicationInfo[] };
  public readonly unreadApplicationCount: { value: number };

  private groupEventHandlers: Array<(event: any) => void> = [];

  private constructor() {
    this.instanceId = GroupState.generateInstanceId();
    this.joinedGroupList = makeReactive({ value: [] });
    this.applicationList = makeReactive({ value: [] });
    this.unreadApplicationCount = makeReactive({ value: 0 });
    this.createStore();
  }

  private static generateInstanceId(): string {
    return JSON.stringify({ storeName: "Group" });
  }

  public static getInstance(): GroupState {
    const instanceId = GroupState.generateInstanceId();
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupState());
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore(): void {
    const options = {
      api: "createStore",
      params: { createStoreParams: this.instanceId }
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
        if (result.code === 0) {
          this.bindEvent();
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private bindEvent(): void {
    const storeName = GroupState.STORE_NAME;

    addListener({
      type: "", store: storeName, name: "joinedGroupList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<GroupInfo[]>(result.joinedGroupList, []);
        if (Array.isArray(list)) this.joinedGroupList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][joinedGroupList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: storeName, name: "applicationList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<GroupApplicationInfo[]>(result.applicationList, []);
        if (Array.isArray(list)) this.applicationList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][applicationList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: storeName, name: "unreadApplicationCount",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.unreadApplicationCount.value = Number(result.unreadApplicationCount || 0);
      } catch (error) {
        console.error(`[${this.instanceId}][unreadApplicationCount listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: storeName, name: "groupEvent",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.groupEventHandlers.forEach(h => {
          try { h(result); } catch (e) { console.error('[GroupState][groupEvent handler] Error:', e); }
        });
      } catch (error) {
        console.error(`[${this.instanceId}][groupEvent listener] Error:`, error);
      }
    });
  }

  private unbindEvent(): void {
    const storeName = GroupState.STORE_NAME;
    ["joinedGroupList", "applicationList", "unreadApplicationCount", "groupEvent"].forEach(dataName => {
      removeListener({
        type: "", store: storeName, name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  // ==================== 新版 API ====================

  getGroupInfo = (groupID: string): Promise<GroupInfo | null> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "getGroupInfo",
        params: { createStoreParams: this.instanceId, groupID }
      };
      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupInfo: GroupInfo }>>(response, { code: -1 });
          if (result.code === 0) {
            const info = (result.data && result.data.data && result.data.data.groupInfo) ? result.data.data.groupInfo : null;
            resolve(info);
          } else {
            console.error(`[${this.instanceId}][getGroupInfo] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to get group info'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  loadJoinedGroups = (): Promise<void> => this.callSimpleApi("loadJoinedGroups");
  loadApplications = (): Promise<void> => this.callSimpleApi("loadApplications");

  loadGroupAttributes = (groupID: string, keys?: string[]): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "loadGroupAttributes",
        params: { createStoreParams: this.instanceId, groupID, keys }
      };
      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<any>>(response, { code: -1 });
          if (result.code === 0) {
            resolve((result.data && result.data.data) ? result.data.data : {});
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to load group attributes'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  createGroup = (params: GroupCreateParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "createGroup",
        params: {
          createStoreParams: this.instanceId,
          params: JSON.stringify(params)
        }
      };
      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupID: string }>>(response, { code: -1 });
          if (result.code === 0) {
            const groupID = (result.data && result.data.data && result.data.data.groupID) ? result.data.data.groupID : '';
            resolve(groupID);
          } else {
            console.error(`[${this.instanceId}][createGroup] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to create group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  joinGroup = (groupID: string, message?: string): Promise<void> =>
    this.callApiWithParams("joinGroup", { groupID, message: message || '' });

  quitGroup = (groupID: string): Promise<void> => this.callApiWithParams("quitGroup", { groupID });
  dismissGroup = (groupID: string): Promise<void> => this.callApiWithParams("dismissGroup", { groupID });

  acceptApplication = (application: GroupApplicationInfo): Promise<void> =>
    this.callApiWithParams("acceptApplication", { info: JSON.stringify(application) });

  refuseApplication = (application: GroupApplicationInfo): Promise<void> =>
    this.callApiWithParams("refuseApplication", { info: JSON.stringify(application) });

  clearApplicationUnreadCount = (): Promise<void> => this.callSimpleApi("clearApplicationUnreadCount");

  changeOwner = (groupID: string, newOwnerID: string): Promise<void> =>
    this.callApiWithParams("changeOwner", { groupID, newOwnerID });

  updateProfile = (groupInfo: Partial<GroupInfo>): Promise<void> =>
    this.callApiWithParams("updateProfile", { groupInfo: JSON.stringify(groupInfo) });

  setJoinOption = (groupID: string, option: GroupJoinOption): Promise<void> =>
    this.callApiWithParams("setJoinOption", { groupID, option });

  setInviteOption = (groupID: string, option: GroupInviteOption): Promise<void> =>
    this.callApiWithParams("setInviteOption", { groupID, option });

  muteAllMembers = (groupID: string, isMuted: boolean): Promise<void> =>
    this.callApiWithParams("muteAllMembers", { groupID, isMuted });

  onGroupEvent = (handler: (event: any) => void): void => {
    this.groupEventHandlers.push(handler);
  }

  // ==================== 内部工具 ====================

  private callSimpleApi(api: string): Promise<void> {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api,
        params: { createStoreParams: this.instanceId }
      }), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || `${api} failed`), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private callApiWithParams(api: string, extraParams: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      const params: Record<string, any> = { createStoreParams: this.instanceId };
      for (const k in extraParams) { params[k] = extraParams[k]; }
      callAPI(JSON.stringify({ api, params }), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || `${api} failed`), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  destroyStore = (): Promise<void> => {
    // 幂等：实例已被销毁过，直接 resolve
    if (!InstanceMap.has(this.instanceId)) {
      return Promise.resolve();
    }
    InstanceMap.delete(this.instanceId);
    this.unbindEvent();
    return new Promise((resolve) => {
      callAPI(JSON.stringify({
        api: "destroyStore",
        params: { createStoreParams: this.instanceId }
      }), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code !== 0) {
            console.warn(`[${this.instanceId}][destroyStore] ignored:`, result.message);
          }
        } catch (error) {
          console.warn(`[${this.instanceId}][destroyStore] parse error:`, error);
        }
        resolve();
      });
    });
  }
}

function useGroupState(): IGroupState {
  return GroupState.getInstance();
}

export {
  GroupType,
  GroupJoinOption,
  GroupInviteOption,
  ReceiveMessageOpt,
  useGroupState
};
export type {
  IGroupState,
  GroupInfo,
  GroupApplicationInfo,
  GroupCreateParams
};
