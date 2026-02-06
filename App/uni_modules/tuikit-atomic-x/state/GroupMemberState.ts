/**
 * 群成员状态管理
 * @module GroupMemberState
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { GroupMemberRole, ReceiveMessageOpt, GroupType, GroupJoinOption } from '../types/group';
import type { GroupMember } from "../types/group";
import type { HybridResponseData } from "../types/hybridService";
// ============================================================================
// UniApp 侧类型定义（实际使用）
// ============================================================================

/**
 * 群成员状态接口
 * 定义 useGroupMemberState Hook 返回的类型
 */
interface IGroupMemberState {
  /** Store 实例ID */
  readonly instanceId: string;
  /** 群组 ID */
  readonly groupID: string;
  /** 群成员列表 */
  readonly groupMemberList: Ref<GroupMember[]>;
  /** 是否有更多群成员 */
  readonly hasMoreGroupMembers: Ref<boolean>;

  // Actions
  /** 获取群成员列表 */
  fetchGroupMemberList: (role?: GroupMemberRole) => Promise<void>;
  /** 加载更多群成员 */
  fetchMoreGroupMemberList: () => Promise<void>;
  /** 获取指定成员信息 */
  fetchGroupMembersInfo: (userIDList: string[]) => Promise<GroupMember[]>;
  /** 添加群成员 */
  addGroupMember: (userIDList: string[]) => Promise<void>;
  /** 删除群成员 */
  deleteGroupMember: (userIDList: string[]) => Promise<void>;
  /** 全员禁言 */
  setMuteAllMembers: (isMuted: boolean) => Promise<void>;
  /** 禁言成员 */
  setGroupMemberMuteTime: (userID: string, time: number) => Promise<void>;
  /** 设置我的群昵称 */
  setSelfGroupNameCard: (nameCard?: string) => Promise<void>;
  /** 设置成员角色 */
  setGroupMemberRole: (userID: string, role: GroupMemberRole) => Promise<void>;
  /** 销毁 Store */
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
 * @implements {IGroupMemberState}
 */
class GroupMemberState implements IGroupMemberState {
  /** Store 名称 */
  private static readonly STORE_NAME = "GroupMember";

  /** 可绑定的数据名称列表 */
  private static readonly BINDABLE_DATA_NAMES = [
    "groupMemberList",
    "hasMoreGroupMembers",
  ] as const;

  /** Store 实例ID */
  public readonly instanceId: string;

  /** 群组 ID */
  public readonly groupID: string;

  /** 筛选角色（用于区分不同实例） */
  public readonly filterRole?: GroupMemberRole;

  /** 群成员列表 */
  public readonly groupMemberList: Ref<GroupMember[]>;

  /** 是否有更多群成员 */
  public readonly hasMoreGroupMembers: Ref<boolean>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param groupID 群组ID
   * @param role 筛选角色（可选，用于区分不同实例）
   */
  private constructor(groupID: string, role?: GroupMemberRole) {
    console.log(`[GroupMemberState] Constructor called, groupID: ${groupID}, role: ${role}`);
    this.instanceId = GroupMemberState.generateInstanceId(groupID, role);
    this.groupID = groupID;
    this.filterRole = role;

    // 初始化响应式状态
    this.groupMemberList = ref<GroupMember[]>([]);
    this.hasMoreGroupMembers = ref<boolean>(false);

    // 初始化 Store
    this.createStore();
  }

  /**
   * 生成完整的 Store ID
   * @param groupID 群组ID
   * @param role 筛选角色
   */
  private static generateInstanceId(groupID: string, role?: GroupMemberRole): string {
    return JSON.stringify({
      storeName: "GroupMember",
      groupID,
      role: role !== undefined ? role : '',
    });
  }

  /**
   * 获取实例（单例模式）
   * @param groupID 群组ID
   * @param role 筛选角色
   */
  public static getInstance(groupID: string, role?: GroupMemberRole): GroupMemberState {
    const instanceId = GroupMemberState.generateInstanceId(groupID, role);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new GroupMemberState(groupID, role));
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
        const result = safeJsonParse<any>(response, {});
        // console.log(`[${this.instanceId}][createStore] Response:`, result);

        if (result.code === 0) {
          console.log(`[${this.instanceId}][createStore] Success`);
          this.bindEvent();
          // 如果指定了 filterRole，自动拉取对应角色的成员列表
          this.fetchGroupMemberList(this.filterRole);
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
    const storeName = GroupMemberState.STORE_NAME;

    /** dataName 到更新函数的映射 */
    const dataHandlers: Record<string, (result: any) => void> = {
      groupMemberList: (r) => { if (Array.isArray(r.groupMemberList)) this.groupMemberList.value = r.groupMemberList; },
      hasMoreGroupMembers: (r) => { if (typeof r.hasMoreGroupMembers === 'boolean') this.hasMoreGroupMembers.value = r.hasMoreGroupMembers; },
    };

    GroupMemberState.BINDABLE_DATA_NAMES.forEach(dataName => {
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
          // console.log(`[${this.instanceId}][${dataName} listener] Data:`, result);
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
    const storeName = GroupMemberState.STORE_NAME;

    GroupMemberState.BINDABLE_DATA_NAMES.forEach(dataName => {
      removeListener({
        type: "",
        store: storeName,
        name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  // ============================================================================
  // Actions (全部使用箭头函数属性，支持解构使用)
  // ============================================================================

  /**
   * 获取群成员列表
   */
  fetchGroupMemberList = (role: GroupMemberRole = GroupMemberRole.All): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchGroupMemberList",
        params: {
          createStoreParams: this.instanceId,
          role
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchGroupMemberList] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch group member list'), {errCode: result.code}));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchGroupMemberList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 加载更多群成员
   */
  fetchMoreGroupMemberList = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchMoreGroupMemberList",
        params: {
          createStoreParams: this.instanceId
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][fetchMoreGroupMemberList] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchMoreGroupMemberList] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch more group members'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchMoreGroupMemberList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取指定成员信息
   */
  fetchGroupMembersInfo = (userIDList: string[]): Promise<GroupMember[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchGroupMembersInfo",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ membersInfo: GroupMember[] }>>(response, { code: -1 });

          if (result.code === 0) {
            const membersInfo = Array.isArray(result.data?.data?.membersInfo) ? result.data?.data?.membersInfo : [];
            resolve(membersInfo);
          } else {
            console.error(`[${this.instanceId}][fetchGroupMembersInfo] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to fetch group members info'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchGroupMembersInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 添加群成员
   */
  addGroupMember = (userIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addGroupMember",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][addGroupMember] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to add group member'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][addGroupMember] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 删除群成员
   */
  deleteGroupMember = (userIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteGroupMember",
        params: {
          createStoreParams: this.instanceId,
          userIDList: JSON.stringify(userIDList)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][deleteGroupMember] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteGroupMember] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to delete group member'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][deleteGroupMember] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 全员禁言
   */
  setMuteAllMembers = (isMuted: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setMuteAllMembers",
        params: {
          createStoreParams: this.instanceId,
          isMuted
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][setMuteAllMembers] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setMuteAllMembers] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set mute all members'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setMuteAllMembers] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 禁言成员
   */
  setGroupMemberMuteTime = (userID: string, time: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setGroupMemberMuteTime",
        params: {
          createStoreParams: this.instanceId,
          userID,
          time
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][setGroupMemberMuteTime] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setGroupMemberMuteTime] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set group member mute time'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setGroupMemberMuteTime] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置我的群昵称
   */
  setSelfGroupNameCard = (nameCard?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setSelfGroupNameCard",
        params: {
          createStoreParams: this.instanceId,
          nameCard
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][setSelfGroupNameCard] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setSelfGroupNameCard] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set self group name card'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setSelfGroupNameCard] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置成员角色
   */
  setGroupMemberRole = (userID: string, role: GroupMemberRole): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setGroupMemberRole",
        params: {
          createStoreParams: this.instanceId,
          userID,
          role
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][setGroupMemberRole] Response:`, result);

          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setGroupMemberRole] Failed:`, result.message, result.code);
            reject(Object.assign(new Error(result.message || 'Failed to set group member role'), { errCode: result.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setGroupMemberRole] Parse error:`, error);
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
          const result = safeJsonParse<any>(response, {});
          // console.log(`[${this.instanceId}][destroyStore] Response:`, result);
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
function createEmptyState(groupID: string = ''): IGroupMemberState {
  const noop = async () => {};
  const noopWithArg = async (_: any) => {};
  return {
    instanceId: '',
    groupID,
    groupMemberList: ref([]),
    hasMoreGroupMembers: ref(false),
    fetchGroupMemberList: noopWithArg,
    fetchMoreGroupMemberList: noop,
    fetchGroupMembersInfo: () => Promise.resolve([]),
    addGroupMember: noopWithArg,
    deleteGroupMember: noopWithArg,
    setMuteAllMembers: noopWithArg,
    setGroupMemberMuteTime: noopWithArg as any,
    setSelfGroupNameCard: noopWithArg,
    setGroupMemberRole: noopWithArg as any,
    destroyStore: noop,
  };
}

/**
 * useGroupMemberState 参数选项
 */
interface UseGroupMemberStateOptions {
  /** 群组 ID */
  groupID: string;
  /** 筛选角色（可选，不同角色会创建不同实例） */
  role?: GroupMemberRole;
}

/**
 * 群成员状态管理 Hook
 * @param options 配置选项
 * @param options.groupID 群组 ID
 * @param options.role 筛选角色（可选，传入后自动拉取对应角色的成员列表）
 * @returns {IGroupMemberState} 状态对象
 */
function useGroupMemberState(options: UseGroupMemberStateOptions): IGroupMemberState {
  const { groupID = '', role } = options;

  if (!groupID) {
    console.error('[useGroupMemberState] groupID is required');
    return createEmptyState(groupID);
  }

  return GroupMemberState.getInstance(groupID, role);
}

export { useGroupMemberState };
