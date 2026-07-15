/**
 * 会话分组状态管理（**新增**）
 * @module ConversationGroupState
 *
 * 对齐底层 atomicxcore.api.conversation.ConversationGroupStore.kt（HybridAPI: ConversationGroupAPI.kt）
 *
 * **重要：Android / iOS 实现差异**
 * - Android：`state.groupList: List<String>` —— 仅分组名数组
 * - iOS：`state.groupList: [ConversationGroupInfo]` —— 富对象
 *
 * 本 state 按 Android 实际推送（字符串数组）落地；
 * 富数据（unreadCount / 分组下会话）由业务层基于 ConversationListStore 二次组合：
 *
 * ```ts
 * const cgState = useConversationGroupState();
 * await cgState.loadGroups();  // 拿到 string[] 分组名
 *
 * // 拿到某分组下的会话列表
 * const convState = useConversationListState({ conversationGroup: groupName });
 * await convState.loadConversations();
 * ```
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import type { HybridResponseData } from "../types/hybridService";

/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap(): Map<string, ConversationGroupState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__CONVERSATION_GROUP_STATE_INSTANCES__) {
        app.globalData.__CONVERSATION_GROUP_STATE_INSTANCES__ = new Map<string, ConversationGroupState>();
      }
      return app.globalData.__CONVERSATION_GROUP_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[ConversationGroupState] getApp() not available:', e);
  }
  return new Map<string, ConversationGroupState>();
}

const InstanceMap = getGlobalInstanceMap();

/**
 * 会话分组状态管理类
 */
class ConversationGroupState {
  public readonly instanceId: string;

  /** 分组名列表（Android 实际推送形态） */
  public readonly groupList: Ref<string[]>;

  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.groupList = ref<string[]>([]);

    this.createStore();
  }

  public static getInstance(instanceId?: string): ConversationGroupState {
    const finalId = instanceId || JSON.stringify({
      storeName: "ConversationGroup",
    });

    if (!InstanceMap.has(finalId)) {
      InstanceMap.set(finalId, new ConversationGroupState(finalId));
    }
    return InstanceMap.get(finalId)!;
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
        const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
        if (result.code === 0) {
          this.bindEvent();
          // 自动拉取一次分组列表
          this.loadGroups();
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
      store: "ConversationGroup",
      name: "groupList",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        // Android 推送 string[]；如果是 iOS 富对象，做兼容映射
        const list = safeJsonParse<any[]>(result.groupList, []);
        if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'object') {
          // iOS 富对象：取 groupName
          this.groupList.value = list.map((item: any) => item?.groupName || '').filter(Boolean);
        } else {
          // Android 字符串数组
          this.groupList.value = list as string[];
        }
      } catch (error) {
        console.error(`[${this.instanceId}][groupList listener] Error:`, error);
      }
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 拉取分组列表（旧名 loadGroupList）
   */
  loadGroups = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadGroups",
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
            console.error(`[${this.instanceId}][loadGroups] Failed:`, result.message);
            reject(Object.assign(new Error(result.message || 'Failed to load groups'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 创建分组
   */
  createGroup = async (groupName: string, conversationIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "createGroup",
        params: {
          createStoreParams: this.instanceId,
          groupName,
          conversationIDList: JSON.stringify(conversationIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to create group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 删除分组
   */
  deleteGroup = async (groupName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteGroup",
        params: {
          createStoreParams: this.instanceId,
          groupName,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to delete group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 重命名分组
   */
  renameGroup = async (oldName: string, newName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "renameGroup",
        params: {
          createStoreParams: this.instanceId,
          oldName,
          newName,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to rename group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 添加会话到分组
   */
  addConversationsToGroup = async (groupName: string, conversationIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "addConversationsToGroup",
        params: {
          createStoreParams: this.instanceId,
          groupName,
          conversationIDList: JSON.stringify(conversationIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to add conversations to group'), { errCode: result.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 从分组移除会话
   */
  deleteConversationsFromGroup = async (groupName: string, conversationIDList: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteConversationsFromGroup",
        params: {
          createStoreParams: this.instanceId,
          groupName,
          conversationIDList: JSON.stringify(conversationIDList),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData>(response, { code: -1 });
          if (result.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(result.message || 'Failed to delete conversations from group'), { errCode: result.code }));
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

  private unbindEvent(): void {
    removeListener({
      type: "",
      store: "ConversationGroup",
      name: "groupList",
      params: { createStoreParams: this.instanceId },
    });
  }

  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.groupList.value = [];
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
 * 会话分组状态管理 Hook
 */
export function useConversationGroupState() {
  return ConversationGroupState.getInstance();
}

export { ConversationGroupState };
export default useConversationGroupState;
