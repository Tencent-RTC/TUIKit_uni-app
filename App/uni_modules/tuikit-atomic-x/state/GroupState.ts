/**
 * Group 状态管理
 * @module GroupState
 * @description 群 Store（Chat Store）。用于群资料、群列表与入群申请管理。
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { GroupType, GroupJoinOption, ReceiveMessageOpt } from "../types/group";
import type { GroupInfo, GroupApplicationInfo, CreateGroupParams } from "../types/group";
import type { HybridResponseData } from "../types/hybridService";

// ============================================================================
// UniApp 侧类型定义（实际使用）
// ============================================================================


/**
 * Group 状态接口
 * 定义 useGroupState Hook 返回的类型
 */
interface IGroupState {
  /** Store 实例ID */
  readonly instanceId: string;
  
  /** 已加入的群列表 */
  readonly joinedGroupList: Ref<GroupInfo[]>;
  /** 入群申请列表 */
  readonly groupApplicationList: Ref<GroupApplicationInfo[]>;
  /** 入群申请未读数 */
  readonly groupApplicationUnreadCount: Ref<number>;

  // Actions
  /** 获取群信息列表 */
  fetchGroupInfo: (groupIDList: string[]) => Promise<GroupInfo[]>;
  /** 获取已加入的群列表 */
  fetchJoinedGroupList: () => Promise<void>;
  /** 获取入群申请列表 */
  fetchGroupApplicationList: () => Promise<void>;
  /** 获取群属性 */
  fetchGroupAttributes: (groupID: string, keys?: string[]) => Promise<Record<string, string>>;
  /** 创建群组 */
  createGroup: (params: CreateGroupParams) => Promise<string>;
  /** 加入群组 */
  joinGroup: (groupID: string, message?: string) => Promise<void>;
  /** 退出群组 */
  quitGroup: (groupID: string) => Promise<void>;
  /** 解散群组 */
  dismissGroup: (groupID: string) => Promise<void>;
  /** 同意入群申请 */
  acceptGroupApplication: (applicationID: string) => Promise<void>;
  /** 拒绝入群申请 */
  refuseGroupApplication: (applicationID: string) => Promise<void>;
  /** 清除入群申请未读数 */
  clearGroupApplicationUnreadCount: (groupID: string) => Promise<void>;
  /** 转让群主 */
  changeGroupOwner: (groupID: string, newOwnerID: string) => Promise<void>;
  /** 更新群资料 */
  updateGroupProfile: (groupInfo: Partial<GroupInfo>) => Promise<void>;
  /** 设置加群方式 */
  setGroupJoinOption: (groupID: string, option: GroupJoinOption) => Promise<void>;
  /** 设置邀请入群方式 */
  setGroupInviteOption: (groupID: string, option: GroupJoinOption) => Promise<void>;
  /** 设置消息接收选项 */
  setReceiveMessageOpt: (groupID: string, opt: ReceiveMessageOpt) => Promise<void>;
  /** 销毁 Store */
  destroyStore: () => Promise<void>;
}

/**
 * 获取全局 InstanceMap
 */
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

/**
 * Group 状态管理类
 * @implements {IGroupState}
 */
class GroupState implements IGroupState {
  /** Store 名称 */
  private static readonly STORE_NAME = "Group";

  /** 可绑定的数据名称列表 */
  private static readonly BINDABLE_DATA_NAMES = [
    "joinedGroupList",
    "groupApplicationList",
    "groupApplicationUnreadCount",
  ] as const;

  /** Store 实例ID */
  public readonly instanceId: string;

  /** 已加入的群列表 */
  public readonly joinedGroupList: Ref<GroupInfo[]>;

  /** 入群申请列表 */
  public readonly groupApplicationList: Ref<GroupApplicationInfo[]>;

  /** 入群申请未读数 */
  public readonly groupApplicationUnreadCount: Ref<number>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   */
  private constructor() {
    console.log(`[GroupState] Constructor called`);
    this.instanceId = GroupState.generateInstanceId();

    // 初始化响应式状态
    this.joinedGroupList = ref<GroupInfo[]>([]);
    this.groupApplicationList = ref<GroupApplicationInfo[]>([]);
    this.groupApplicationUnreadCount = ref<number>(0);

    // 初始化 Store
    this.createStore();
  }

  /**
   * 生成完整的 Store ID
   */
  private static generateInstanceId(): string {
    return JSON.stringify({
      storeName: "Group",
    });
  }

  /**
   * 获取实例（单例模式）
   */
  public static getInstance(): GroupState {
    const instanceId = GroupState.generateInstanceId();
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupState());
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 创建 Store
   */
  private createStore(): void {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
      },
    };

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<HybridResponseData<void>>(response, { code: -1 });

        if (result.code === 0) {
          console.log(`[${this.instanceId}][createStore] Success`);
          this.bindEvent();
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
    const storeName = GroupState.STORE_NAME;

    /** dataName 到更新函数的映射 */
    const dataHandlers: Record<string, (result: any) => void> = {
      joinedGroupList: (r) => { if (Array.isArray(r.joinedGroupList)) this.joinedGroupList.value = r.joinedGroupList; },
      groupApplicationList: (r) => { if (Array.isArray(r.groupApplicationList)) this.groupApplicationList.value = r.groupApplicationList; },
      groupApplicationUnreadCount: (r) => { if (typeof r.groupApplicationUnreadCount === 'number') this.groupApplicationUnreadCount.value = r.groupApplicationUnreadCount; },
    };

    GroupState.BINDABLE_DATA_NAMES.forEach(dataName => {
      addListener({
        type: "",
        store: storeName,
        name: dataName,
        params: {
          createStoreParams: this.instanceId,
        }
      }, (data: string) => {
        try {
          const result = safeJsonParse<any>(data, {});
          console.log(`[${this.instanceId}][${dataName} listener] Data:`, result);
          dataHandlers[dataName]?.(result);
        } catch (error) {
          console.error(`[${this.instanceId}][${dataName} listener] Error:`, error);
        }
      });
    });
  }

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    const storeName = GroupState.STORE_NAME;

    GroupState.BINDABLE_DATA_NAMES.forEach(dataName => {
      removeListener({
        type: "",
        store: storeName,
        name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 获取群信息列表
   * @param groupIDList 群 ID 列表
   * @returns 群信息列表
   */
  fetchGroupInfo = (groupIDList: string[]): Promise<GroupInfo[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchGroupInfo",
        params: {
          createStoreParams: this.instanceId,
          groupIDList: JSON.stringify(groupIDList)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupInfoList: GroupInfo[] }>>(response, { code: -1 });

          if (result.code === 0) {
            const groupInfoList = Array.isArray(result.data?.data?.groupInfoList) ? result.data?.data?.groupInfoList : [];
            resolve(groupInfoList);
          } else {
            console.error(`[${this.instanceId}][fetchGroupInfo] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch group info list'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchGroupInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取已加入的群列表
   */
  fetchJoinedGroupList = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchJoinedGroupList",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          console.log(`[${this.instanceId}][fetchJoinedGroupList] Response:`, result);

          if (result.code === 0) {
            // 数据会通过 listener 自动更新到 joinedGroupList
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchJoinedGroupList] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch joined group list'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchJoinedGroupList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取入群申请列表
   */
  fetchGroupApplicationList = (): Promise<void> => {
    // TODO: 实现 fetchGroupApplicationList
    console.warn('[GroupState] fetchGroupApplicationList is not implemented yet');
    return Promise.resolve();
  }

  /**
   * 获取群属性
   * @param groupID 群 ID
   * @param keys 属性键列表（可选）
   */
  fetchGroupAttributes = (groupID: string, keys?: string[]): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchGroupAttributes",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          keys
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve(result.data || {});
          } else {
            console.error(`[${this.instanceId}][fetchGroupAttributes] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch group attributes'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchGroupAttributes] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 创建群组
   * @param params 创建群组参数
   */
  createGroup = (params: CreateGroupParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { groupType, groupName, groupID, avatarURL, memberList } = params;
      
      const options: HybridCallOptions = {
        api: "createGroup",
        params: {
          createStoreParams: this.instanceId,
          groupType,
          groupName,
          groupID,
          avatarURL,
          memberList
        }
      };


      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupID: string }>>(response, { code: -1 });

          if (result.code === 0) {
            const groupID = result.data?.data?.groupID || '';
            resolve(groupID);
          } else {
            console.error(`[${this.instanceId}][createGroup] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to create group'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][createGroup] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 加入群组
   * @param groupID 群 ID
   * @param message 申请理由（可选）
   */
  joinGroup = (groupID: string, message?: string): Promise<void> => {
    // TODO: 实现 joinGroup
    console.warn('[GroupState] joinGroup is not implemented yet');
    return Promise.resolve();
  }

  /**
   * 退出群组
   * @param groupID 群 ID
   */
  quitGroup = (groupID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "quitGroup",
        params: {
          createStoreParams: this.instanceId,
          groupID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][quitGroup] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to quit group'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][quitGroup] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 解散群组
   * @param groupID 群 ID
   */
  dismissGroup = (groupID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "dismissGroup",
        params: {
          createStoreParams: this.instanceId,
          groupID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][dismissGroup] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to dismiss group'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][dismissGroup] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 同意入群申请
   * @param applicationID 申请 ID
   */
  acceptGroupApplication = (applicationID: string): Promise<void> => {
    // TODO: 实现 acceptGroupApplication
    console.warn('[GroupState] acceptGroupApplication is not implemented yet');
    return Promise.resolve();
  }

  /**
   * 拒绝入群申请
   * @param applicationID 申请 ID
   */
  refuseGroupApplication = (applicationID: string): Promise<void> => {
    // TODO: 实现 refuseGroupApplication
    console.warn('[GroupState] refuseGroupApplication is not implemented yet');
    return Promise.resolve();
  }

  /**
   * 清除入群申请未读数
   * @param groupID 群 ID
   */
  clearGroupApplicationUnreadCount = (groupID: string): Promise<void> => {
    // TODO: 实现 clearGroupApplicationUnreadCount
    console.warn('[GroupState] clearGroupApplicationUnreadCount is not implemented yet');
    return Promise.resolve();
  }

  /**
   * 转让群主
   * @param groupID 群 ID
   * @param newOwnerID 新群主 ID
   */
  changeGroupOwner = (groupID: string, newOwnerID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "changeGroupOwner",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          newOwnerID
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][changeGroupOwner] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to change group owner'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][changeGroupOwner] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 更新群资料
   * @param groupInfo 群资料
   */
  updateGroupProfile = (groupInfo: Partial<GroupInfo>): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "updateGroupProfile",
        params: {
          createStoreParams: this.instanceId,
          groupInfo: JSON.stringify(groupInfo)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][updateGroupProfile] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to update group profile'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][updateGroupProfile] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置加群方式
   * @param groupID 群 ID
   * @param option 加群选项
   */
  setGroupJoinOption = (groupID: string, option: GroupJoinOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setGroupJoinOption",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          option
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setGroupJoinOption] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set group join option'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setGroupJoinOption] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置邀请入群方式
   * @param groupID 群 ID
   * @param option 邀请选项
   */
  setGroupInviteOption = (groupID: string, option: GroupJoinOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setGroupInviteOption",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          option
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setGroupInviteOption] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set group invite option'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setGroupInviteOption] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置消息接收选项
   * @param groupID 群 ID
   * @param opt 消息接收选项
   */
  setReceiveMessageOpt = (groupID: string, opt: ReceiveMessageOpt): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setReceiveMessageOpt",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          opt
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setReceiveMessageOpt] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set receive message opt'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setReceiveMessageOpt] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 销毁 Store
   */
  destroyStore = (): Promise<void> => {
    // 1. 先移除所有 listener
    this.unbindEvent();

    // 2. 再调用 Native destroyStore
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "destroyStore",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });

          if (result.code === 0) {
            const deleted = InstanceMap.delete(this.instanceId);
            if (deleted) {
              resolve();
            } else {
              reject(Object.assign(new Error(`[${this.instanceId}][destroyStore] Failed to delete InstanceMap`), { errCode: -1 }));
            }
          } else {
            console.error(`[${this.instanceId}][destroyStore] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to destroy store'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
          reject(error);
        }
      });
    });
  }
}

// ============================================================================
// Hook 导出
// ============================================================================

/**
 * 创建空的 State 对象（用于错误情况）
 */
function createEmptyState(): IGroupState {
  const noop = async () => {};
  const noopWithReturn = async () => ({});
  return {
    instanceId: '',
    joinedGroupList: ref([]),
    groupApplicationList: ref([]),
    groupApplicationUnreadCount: ref(0),
    fetchGroupInfo: async () => [],
    fetchJoinedGroupList: noop,
    fetchGroupApplicationList: noop,
    fetchGroupAttributes: noopWithReturn as any,
    createGroup: async () => '',
    joinGroup: noop as any,
    quitGroup: noop as any,
    dismissGroup: noop as any,
    acceptGroupApplication: noop as any,
    refuseGroupApplication: noop as any,
    clearGroupApplicationUnreadCount: noop as any,
    changeGroupOwner: noop as any,
    updateGroupProfile: noop as any,
    setGroupJoinOption: noop as any,
    setGroupInviteOption: noop as any,
    setReceiveMessageOpt: noop as any,
    destroyStore: noop,
  };
}

/**
 * Group 状态管理 Hook
 * @returns {IGroupState} 状态对象
 */
function useGroupState(): IGroupState {
  return GroupState.getInstance();
}

export {
  GroupType,
  GroupJoinOption,
  ReceiveMessageOpt,
  useGroupState
};
export type { 
  IGroupState, 
  GroupInfo, 
  GroupApplicationInfo,
  CreateGroupParams
};
