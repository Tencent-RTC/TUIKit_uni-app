/**
 * Group 状态管理
 * @module GroupState
 *
 * 对齐底层 atomicxcore.api.group.GroupStore.kt（HybridAPI: GroupAPI.kt）
 *
 * **本次升级关键调整：**
 * - `fetchGroupInfo` → `getGroupInfo`（参数 `groupIDList: []` → `groupID: string` 单个；响应 `groupInfoList[]` → `groupInfo`）
 * - `fetchJoinedGroupList` → `loadJoinedGroups`
 * - `fetchGroupAttributes` → `loadGroupAttributes`
 * - `fetchGroupApplicationList` → `loadApplications`
 * - `acceptGroupApplication` → `acceptApplication`
 * - `refuseGroupApplication` → `refuseApplication`
 * - `clearGroupApplicationUnreadCount` → `clearApplicationUnreadCount`（无 groupID 参数）
 * - `changeGroupOwner` → `changeOwner`
 * - `updateGroupProfile` → `updateProfile`
 * - `setGroupJoinOption` → `setJoinOption`
 * - `setGroupInviteOption` → `setInviteOption`（参数 `GroupInviteOption`）
 * - **新增** `muteAllMembers`（从 GroupMember 迁入）
 * - **新增** 订阅 `groupEvent`（事件流：群被解散 / 被踢 / 申请处理等）
 * - **删除** `setReceiveMessageOpt`：已下沉到 ConversationListStore
 * - listener 字段重命名：
 *   - `groupApplicationList` → `applicationList`
 *   - `groupApplicationUnreadCount` → `unreadApplicationCount`
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import {
  GroupType,
  GroupJoinOption,
  GroupInviteOption,
} from "../types/group";
import type {
  GroupInfo,
  GroupApplicationInfo,
  GroupCreateParams,
  GroupEvent,
} from "../types/group";
import type { HybridResponseData } from "../types/hybridService";

// ============================================================================
// 类型定义
// ============================================================================

interface IGroupState {
  readonly instanceId: string;

  /** 已加入的群列表 */
  readonly joinedGroupList: Ref<GroupInfo[]>;
  /** 入群申请列表 */
  readonly applicationList: Ref<GroupApplicationInfo[]>;
  /** 入群申请未读数 */
  readonly unreadApplicationCount: Ref<number>;

  // Actions
  getGroupInfo: (groupID: string) => Promise<GroupInfo>;
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

  /** 监听群事件流（如被踢出群 / 收到入群申请） */
  onGroupEvent: (handler: (event: GroupEvent) => void) => () => void;

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
 */
class GroupState implements IGroupState {
  private static readonly STORE_NAME = "Group";

  /** 可绑定的数据字段（对齐 GroupDispatcher） */
  private static readonly BINDABLE_DATA_NAMES = [
    "joinedGroupList",
    "applicationList",
    "unreadApplicationCount",
  ] as const;

  public readonly instanceId: string;
  public readonly joinedGroupList: Ref<GroupInfo[]>;
  public readonly applicationList: Ref<GroupApplicationInfo[]>;
  public readonly unreadApplicationCount: Ref<number>;

  /** 群事件订阅者列表（messageEvent / groupEvent 是事件流，多订阅者复用同一 listener） */
  private groupEventHandlers: Set<(event: GroupEvent) => void> = new Set();

  private constructor() {
    this.instanceId = GroupState.generateInstanceId();
    this.joinedGroupList = ref<GroupInfo[]>([]);
    this.applicationList = ref<GroupApplicationInfo[]>([]);
    this.unreadApplicationCount = ref<number>(0);

    this.createStore();
  }

  private static generateInstanceId(): string {
    return JSON.stringify({
      storeName: "Group",
    });
  }

  public static getInstance(): GroupState {
    const instanceId = GroupState.generateInstanceId();
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupState());
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore(): void {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
      },
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<HybridResponseData<void>>(response, { code: -1 });
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

    const dataHandlers: Record<string, (result: any) => void> = {
      joinedGroupList: (r) => {
        const list = safeJsonParse<GroupInfo[]>(r.joinedGroupList, []);
        this.joinedGroupList.value = list;
      },
      applicationList: (r) => {
        const list = safeJsonParse<GroupApplicationInfo[]>(r.applicationList, []);
        this.applicationList.value = list;
      },
      unreadApplicationCount: (r) => {
        if (r.unreadApplicationCount != null) {
          this.unreadApplicationCount.value = Number(r.unreadApplicationCount);
        }
      },
    };

    GroupState.BINDABLE_DATA_NAMES.forEach((dataName) => {
      addListener({
        type: "",
        store: storeName,
        name: dataName,
        params: {
          createStoreParams: this.instanceId,
        },
      }, (data: string) => {
        try {
          const result = safeJsonParse<any>(data, {});
          const handler = dataHandlers[dataName];
          if (handler) handler(result);
        } catch (error) {
          console.error(`[${this.instanceId}][${dataName} listener] Error:`, error);
        }
      });
    });

    // 订阅 groupEvent（流式事件）
    addListener({
      type: "",
      store: storeName,
      name: "groupEvent",
      params: {
        createStoreParams: this.instanceId,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const event: GroupEvent = {
          eventType: result.eventType,
          data: typeof result.data === 'string' ? safeJsonParse(result.data, {}) : (result.data || {}),
        } as GroupEvent;
        this.groupEventHandlers.forEach((h) => {
          try { h(event); } catch (e) { console.error('[groupEvent handler] Error:', e); }
        });
      } catch (error) {
        console.error(`[${this.instanceId}][groupEvent listener] Error:`, error);
      }
    });
  }

  private unbindEvent(): void {
    const storeName = GroupState.STORE_NAME;
    const dataNames = [...GroupState.BINDABLE_DATA_NAMES, "groupEvent"];

    dataNames.forEach((dataName) => {
      removeListener({
        type: "",
        store: storeName,
        name: dataName,
        params: { createStoreParams: this.instanceId },
      });
    });
    this.groupEventHandlers.clear();
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 获取群信息（旧名 fetchGroupInfo）
   *
   * 注意：参数从 `groupIDList: string[]` 改为 `groupID: string` 单个；
   * 如需获取多个群信息，请循环调用
   */
  getGroupInfo = (groupID: string): Promise<GroupInfo> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "getGroupInfo",
        params: {
          createStoreParams: this.instanceId,
          groupID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupInfo: GroupInfo }>>(response, { code: -1 });
          if (result.code === 0) {
            const info = result.data?.data?.groupInfo;
            if (info) {
              resolve(info);
            } else {
              reject(new Error('groupInfo missing in response'));
            }
          } else {
            console.error(`[${this.instanceId}][getGroupInfo] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to get group info'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取已加入的群列表（旧名 fetchJoinedGroupList）
   */
  loadJoinedGroups = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadJoinedGroups",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadJoinedGroups] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load joined groups'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取入群申请列表（旧名 fetchGroupApplicationList）
   */
  loadApplications = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadApplications",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadApplications] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load applications'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 拉取群属性（旧名 fetchGroupAttributes）
   */
  loadGroupAttributes = (groupID: string, keys?: string[]): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadGroupAttributes",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          keys,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve((result.data as any) || {});
          } else {
            console.error(`[${this.instanceId}][loadGroupAttributes] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load group attributes'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 创建群组
   *
   * 注意：底层 createGroup 接受 `params: GroupCreateParams`（嵌套结构），
   * 与旧版扁平参数不同；本方法已自动包装
   */
  createGroup = (params: GroupCreateParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "createGroup",
        params: {
          createStoreParams: this.instanceId,
          params: JSON.stringify(params),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ groupID: string }>>(response, { code: -1 });
          if (result.code === 0) {
            const groupID = result.data?.data?.groupID || '';
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
  };

  joinGroup = (groupID: string, message?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "joinGroup",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          message: message || '',
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][joinGroup] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to join group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  quitGroup = (groupID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "quitGroup",
        params: {
          createStoreParams: this.instanceId,
          groupID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][quitGroup] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to quit group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  dismissGroup = (groupID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "dismissGroup",
        params: {
          createStoreParams: this.instanceId,
          groupID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][dismissGroup] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to dismiss group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 同意入群申请（旧名 acceptGroupApplication）
   */
  acceptApplication = (application: GroupApplicationInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "acceptApplication",
        params: {
          createStoreParams: this.instanceId,
          info: JSON.stringify(application),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][acceptApplication] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to accept application'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 拒绝入群申请（旧名 refuseGroupApplication）
   */
  refuseApplication = (application: GroupApplicationInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "refuseApplication",
        params: {
          createStoreParams: this.instanceId,
          info: JSON.stringify(application),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][refuseApplication] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to refuse application'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 清空入群申请未读数（旧名 clearGroupApplicationUnreadCount）
   *
   * 注意：底层不再接受 groupID 参数，统一清空所有
   */
  clearApplicationUnreadCount = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearApplicationUnreadCount",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearApplicationUnreadCount] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to clear application unread count'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 转让群主（旧名 changeGroupOwner）
   */
  changeOwner = (groupID: string, newOwnerID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "changeOwner",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          newOwnerID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][changeOwner] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to change owner'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 更新群资料（旧名 updateGroupProfile）
   */
  updateProfile = (groupInfo: Partial<GroupInfo>): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "updateProfile",
        params: {
          createStoreParams: this.instanceId,
          groupInfo: JSON.stringify(groupInfo),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][updateProfile] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to update profile'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置加群方式（旧名 setGroupJoinOption）
   */
  setJoinOption = (groupID: string, option: GroupJoinOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setJoinOption",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          option,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setJoinOption] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to set join option'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置邀请入群方式（旧名 setGroupInviteOption）
   *
   * 注意：参数类型从 GroupJoinOption 改为 GroupInviteOption
   */
  setInviteOption = (groupID: string, option: GroupInviteOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setInviteOption",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          option,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setInviteOption] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to set invite option'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 全员禁言（**新增**，从 GroupMemberStore 迁入）
   */
  muteAllMembers = (groupID: string, isMuted: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "muteAllMembers",
        params: {
          createStoreParams: this.instanceId,
          groupID,
          isMuted,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][muteAllMembers] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to mute all members'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 订阅群事件流（被踢出群 / 收到入群申请等）
   *
   * @returns 取消订阅函数
   */
  onGroupEvent = (handler: (event: GroupEvent) => void): (() => void) => {
    this.groupEventHandlers.add(handler);
    return () => {
      this.groupEventHandlers.delete(handler);
    };
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  destroyStore = (): Promise<void> => {
    // 幂等：实例已被销毁过，直接 resolve
    if (!InstanceMap.has(this.instanceId)) {
      return Promise.resolve();
    }
    InstanceMap.delete(this.instanceId);
    this.unbindEvent();

    return new Promise((resolve) => {
      const options: HybridCallOptions = {
        api: "destroyStore",
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), () => {});
    });
  };
}

// ============================================================================
// Hook 导出
// ============================================================================

function useGroupState(): IGroupState {
  return GroupState.getInstance();
}

export {
  GroupType,
  GroupJoinOption,
  GroupInviteOption,
  useGroupState,
};
export type {
  IGroupState,
  GroupInfo,
  GroupApplicationInfo,
  GroupCreateParams,
};
