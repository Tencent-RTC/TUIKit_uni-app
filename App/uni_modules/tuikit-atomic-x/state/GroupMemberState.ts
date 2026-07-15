/**
 * 群成员状态管理
 * @module GroupMemberState
 *
 * 对齐底层 atomicxcore.api.group.GroupMemberStore.kt（HybridAPI: GroupMemberAPI.kt）
 *
 * **本次升级关键调整：**
 * - `fetchGroupMemberList` → `loadMembers`（参数 `role: GroupMemberRole` → `roleList: GroupMemberFilterRole[]`）
 * - `fetchMoreGroupMemberList` → `loadMoreMembers`
 * - `fetchGroupMembersInfo` → `getMemberInfo`（响应 `membersInfo` → `memberInfoList`）
 * - `addGroupMember` → `addMember`
 * - `deleteGroupMember` → `deleteMember`
 * - `setGroupMemberMuteTime` → `muteMember`（参数 `time` → `muteTime`）
 * - `setSelfGroupNameCard` → `setSelfNameCard`
 * - `setGroupMemberRole` → `setMemberRole`
 * - **删除** `setMuteAllMembers`：已迁到 GroupStore.muteAllMembers
 * - listener 字段：
 *   - `groupMemberList` → `memberList`
 *   - `hasMoreGroupMembers` → `hasMoreMembers`
 * - createStore 必传 `groupID`
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import {
  GroupMemberRole,
  GroupMemberFilterRole,
} from "../types/group";
import type { GroupMember } from "../types/group";
import type { HybridResponseData } from "../types/hybridService";

// ============================================================================
// 类型定义
// ============================================================================

interface IGroupMemberState {
  readonly instanceId: string;

  /** 群成员列表 */
  readonly memberList: Ref<GroupMember[]>;
  /** 是否有更多群成员 */
  readonly hasMoreMembers: Ref<boolean>;

  // Actions
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

/**
 * 获取全局 InstanceMap
 */
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

/**
 * 群成员状态管理类
 */
class GroupMemberState implements IGroupMemberState {
  private static readonly STORE_NAME = "GroupMember";

  /** 可绑定的数据字段（对齐 GroupMemberDispatcher） */
  private static readonly BINDABLE_DATA_NAMES = [
    "memberList",
    "hasMoreMembers",
  ] as const;

  public readonly instanceId: string;
  private readonly groupID: string;
  private readonly filterRole?: GroupMemberRole;

  public readonly memberList: Ref<GroupMember[]>;
  public readonly hasMoreMembers: Ref<boolean>;

  private constructor(groupID: string, role?: GroupMemberRole) {
    this.instanceId = GroupMemberState.generateInstanceId(groupID, role);
    this.groupID = groupID;
    this.filterRole = role;

    this.memberList = ref<GroupMember[]>([]);
    this.hasMoreMembers = ref<boolean>(false);

    this.createStore();
  }

  private static generateInstanceId(groupID: string, role?: GroupMemberRole): string {
    return JSON.stringify({
      storeName: "GroupMember",
      groupID,
      role: role !== undefined ? role : '',
    });
  }

  public static getInstance(groupID: string, role?: GroupMemberRole): GroupMemberState {
    const instanceId = GroupMemberState.generateInstanceId(groupID, role);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupMemberState(groupID, role));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore(): void {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        groupID: this.groupID,
      },
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          // 自动拉取一次成员列表（默认拉全部）
          const initialRoleList: GroupMemberFilterRole[] =
            this.filterRole !== undefined
              ? [this.filterRole as unknown as GroupMemberFilterRole]
              : [GroupMemberFilterRole.ALL];
          this.loadMembers(initialRoleList);
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

    const dataHandlers: Record<string, (result: any) => void> = {
      memberList: (r) => {
        const list = safeJsonParse<GroupMember[]>(r.memberList, []);
        this.memberList.value = list;
      },
      hasMoreMembers: (r) => {
        if (typeof r.hasMoreMembers === 'boolean') {
          this.hasMoreMembers.value = r.hasMoreMembers;
        }
      },
    };

    GroupMemberState.BINDABLE_DATA_NAMES.forEach((dataName) => {
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
  }

  private unbindEvent(): void {
    const storeName = GroupMemberState.STORE_NAME;

    GroupMemberState.BINDABLE_DATA_NAMES.forEach((dataName) => {
      removeListener({
        type: "",
        store: storeName,
        name: dataName,
        params: { createStoreParams: this.instanceId },
      });
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 拉取群成员列表（旧名 fetchGroupMemberList）
   *
   * @param roleList 角色筛选数组（默认 [ALL]）；旧版接受单个 role，本方法兼容
   */
  loadMembers = (roleList: GroupMemberFilterRole[] = [GroupMemberFilterRole.ALL]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadMembers",
        params: {
          createStoreParams: this.instanceId,
          roleList: JSON.stringify(roleList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadMembers] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load members'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 加载更多群成员（旧名 fetchMoreGroupMemberList）
   */
  loadMoreMembers = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadMoreMembers",
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
            console.error(`[${this.instanceId}][loadMoreMembers] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load more members'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 获取指定成员信息（旧名 fetchGroupMembersInfo）
   *
   * 响应字段从 `membersInfo` 改为 `memberInfoList`
   */
  getMemberInfo = (userIDList: string[]): Promise<GroupMember[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "getMemberInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ memberInfoList: GroupMember[] }>>(response, { code: -1 });
          if (result.code === 0) {
            const list = Array.isArray(result.data?.data?.memberInfoList) ? result.data?.data?.memberInfoList : [];
            resolve(list);
          } else {
            console.error(`[${this.instanceId}][getMemberInfo] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to get member info'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 添加群成员（旧名 addGroupMember）
   */
  addMember = (userIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addMember",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][addMember] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to add member'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 删除群成员（旧名 deleteGroupMember）
   */
  deleteMember = (userIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteMember",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteMember] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to delete member'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 禁言成员（旧名 setGroupMemberMuteTime）
   *
   * 注意：旧参数名 `time`，新参数名 `muteTime`（底层 GroupMemberAPI 使用 `time` 不变 —— 见 GroupMemberAPI.kt）
   *
   * 对齐底层 `GroupMemberStore.muteMember(userID, time)`，参数名为 `time`（单位：秒）
   */
  muteMember = (userID: string, time: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "muteMember",
        params: {
          createStoreParams: this.instanceId,
          userID,
          time,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][muteMember] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to mute member'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置我的群昵称（旧名 setSelfGroupNameCard）
   */
  setSelfNameCard = (nameCard?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setSelfNameCard",
        params: {
          createStoreParams: this.instanceId,
          nameCard,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setSelfNameCard] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to set self name card'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置成员角色（旧名 setGroupMemberRole）
   */
  setMemberRole = (userID: string, role: GroupMemberRole): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setMemberRole",
        params: {
          createStoreParams: this.instanceId,
          userID,
          role,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setMemberRole] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to set member role'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  destroyStore = (): Promise<void> => {
    // 幂等：实例已从 InstanceMap 中移除，说明已被销毁过，直接 resolve
    if (!InstanceMap.has(this.instanceId)) {
      return Promise.resolve();
    }
    // 先从 InstanceMap 中移除并解绑监听，避免并发重复进入；
    // 即使底层 callAPI 报 "store not found"（其他渠道已销毁）也视为已销毁状态。
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

/**
 * useGroupMemberState 参数选项
 */
interface UseGroupMemberStateOptions {
  /** 群组 ID */
  groupID: string;
  /** 筛选角色（可选；不同角色会创建不同实例） */
  role?: GroupMemberRole;
}

function createEmptyState(): IGroupMemberState {
  const noop = async () => {};
  const noopWithArg = async (_: any) => {};
  return {
    instanceId: '',
    memberList: ref([]),
    hasMoreMembers: ref(false),
    loadMembers: noopWithArg as any,
    loadMoreMembers: noop,
    getMemberInfo: () => Promise.resolve([]),
    addMember: noopWithArg as any,
    deleteMember: noopWithArg as any,
    muteMember: noopWithArg as any,
    setSelfNameCard: noopWithArg as any,
    setMemberRole: noopWithArg as any,
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

export {
  useGroupMemberState,
  GroupMemberRole,
  GroupMemberFilterRole,
};
export type { IGroupMemberState, GroupMember };
