/**
 * 群成员状态管理 (Vue2 适配版)
 * @module GroupMemberState
 */
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore
import { safeJsonParse } from "../utils/utsUtils";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { GroupMemberRole, GroupMemberFilterRole } from '../types/group';
import type { GroupMember } from "../types/group";
import type { HybridResponseData } from "../types/hybridService";

declare const getApp: any;

interface IGroupMemberState {
  readonly instanceId: string;
  readonly memberList: { value: GroupMember[] };
  readonly hasMoreMembers: { value: boolean };

  // API
  loadMembers: (roleList?: GroupMemberFilterRole[]) => Promise<void>;
  loadMoreMembers: () => Promise<void>;
  getMemberInfo: (userIDList: string[]) => Promise<GroupMember[]>;
  addMember: (userIDList: string[]) => Promise<void>;
  deleteMember: (userIDList: string[]) => Promise<void>;
  muteMember: (userID: string, muteTime: number) => Promise<void>;
  setSelfNameCard: (nameCard?: string) => Promise<void>;
  setMemberRole: (userID: string, role: GroupMemberRole) => Promise<void>;
  destroyStore: () => Promise<void>;
}

function getGlobalInstanceMap(): Map<string, GroupMemberState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__GROUP_MEMBER_STATE_INSTANCES__) {
        app.globalData.__GROUP_MEMBER_STATE_INSTANCES__ = new Map<string, GroupMemberState>();
      }
      return app.globalData.__GROUP_MEMBER_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[GroupMemberState] getApp() not available:', e);
  }
  return new Map<string, GroupMemberState>();
}

const InstanceMap = getGlobalInstanceMap();

class GroupMemberState implements IGroupMemberState {
  private static readonly STORE_NAME = "GroupMember";

  public readonly instanceId: string;
  private readonly groupID: string;
  private readonly filterRole?: GroupMemberFilterRole | GroupMemberRole;

  public readonly memberList: { value: GroupMember[] };
  public readonly hasMoreMembers: { value: boolean };

  private constructor(groupID: string, role?: GroupMemberFilterRole | GroupMemberRole) {
    this.instanceId = GroupMemberState.generateInstanceId(groupID, role);
    this.groupID = groupID;
    this.filterRole = role;

    this.memberList = makeReactive({ value: [] });
    this.hasMoreMembers = makeReactive({ value: false });

    this.createStore();
  }

  private static generateInstanceId(groupID: string, role?: GroupMemberFilterRole | GroupMemberRole): string {
    return JSON.stringify({
      storeName: "GroupMember",
      groupID,
      role: role !== undefined ? role : '',
    });
  }

  public static getInstance(groupID: string, role?: GroupMemberFilterRole | GroupMemberRole): GroupMemberState {
    const instanceId = GroupMemberState.generateInstanceId(groupID, role);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupMemberState(groupID, role));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore(): void {
    const options = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        groupID: this.groupID
      }
    };
    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
        if (result.code === 0) {
          this.bindEvent();
          // 自动拉取
          const initialRoles: GroupMemberFilterRole[] = this.filterRole !== undefined
            ? [this.filterRole as unknown as GroupMemberFilterRole]
            : [GroupMemberFilterRole.ALL];
          this.loadMembers(initialRoles);
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private bindEvent(): void {
    const storeName = GroupMemberState.STORE_NAME;

    addListener({
      type: "", store: storeName, name: "memberList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<GroupMember[]>(result.memberList, []);
        if (Array.isArray(list)) this.memberList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][memberList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: storeName, name: "hasMoreMembers",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        if (result.hasMoreMembers !== undefined) {
          this.hasMoreMembers.value = Boolean(result.hasMoreMembers);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasMoreMembers listener] Error:`, error);
      }
    });
  }

  private unbindEvent(): void {
    ["memberList", "hasMoreMembers"].forEach(dataName => {
      removeListener({
        type: "", store: GroupMemberState.STORE_NAME, name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  // ==================== 新版 API ====================

  loadMembers = (roleList: GroupMemberFilterRole[] = [GroupMemberFilterRole.ALL]): Promise<void> =>
    this.callApiWithParams("loadMembers", { roleList: JSON.stringify(roleList) });

  loadMoreMembers = (): Promise<void> => this.callSimpleApi("loadMoreMembers");

  getMemberInfo = (userIDList: string[]): Promise<GroupMember[]> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "getMemberInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList)
        }
      };
      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ memberInfoList: GroupMember[] }>>(response, { code: -1 });
          if (result.code === 0) {
            const list = (result.data && result.data.data && result.data.data.memberInfoList) ? result.data.data.memberInfoList : [];
            resolve(list);
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to get member info'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  addMember = (userIDList: string[]): Promise<void> =>
    this.callApiWithParams("addMember", { userIDList: JSON.stringify(userIDList) });

  deleteMember = (userIDList: string[]): Promise<void> =>
    this.callApiWithParams("deleteMember", { userIDList: JSON.stringify(userIDList) });

  muteMember = (userID: string, time: number): Promise<void> =>
    this.callApiWithParams("muteMember", { userID, time });

  setSelfNameCard = (nameCard?: string): Promise<void> =>
    this.callApiWithParams("setSelfNameCard", { nameCard: nameCard || '' });

  setMemberRole = (userID: string, role: GroupMemberRole): Promise<void> =>
    this.callApiWithParams("setMemberRole", { userID, role });

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
        } catch (error) { reject(error); }
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
        } catch (error) { reject(error); }
      });
    });
  }

  destroyStore = (): Promise<void> => {
    // 幂等：实例已从 InstanceMap 中移除，说明已被销毁过，直接 resolve
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

interface UseGroupMemberStateOptions {
  groupID: string;
  role?: GroupMemberFilterRole | GroupMemberRole;
}

function createEmptyState(): IGroupMemberState {
  const noop = async (): Promise<void> => {};
  const empty = makeReactive({ value: [] as GroupMember[] });
  const empty2 = makeReactive({ value: false });
  return {
    instanceId: '',
    memberList: empty,
    hasMoreMembers: empty2,
    loadMembers: noop as any,
    loadMoreMembers: noop,
    getMemberInfo: () => Promise.resolve([]),
    addMember: noop as any,
    deleteMember: noop as any,
    muteMember: noop as any,
    setSelfNameCard: noop as any,
    setMemberRole: noop as any,
    destroyStore: noop,
  };
}

function useGroupMemberState(options: UseGroupMemberStateOptions): IGroupMemberState {
  const { groupID = '', role } = options;
  if (!groupID) {
    console.error('[useGroupMemberState] groupID is required');
    return createEmptyState();
  }
  return GroupMemberState.getInstance(groupID, role);
}

export { useGroupMemberState, GroupMemberFilterRole };
