/**
 * 会话列表状态管理
 * @module ConversationListState
 *
 * 对齐底层 atomicxcore.api.conversation.ConversationListStore.kt（HybridAPI: ConversationListAPI.kt）
 *
 * **本次升级关键调整：**
 * - `fetchConversationList` → `loadConversations`（参数 option 对齐 ConversationLoadOption）
 * - `fetchMoreConversationList` → `loadMoreConversations`
 * - `fetchConversationInfo` → `getConversationInfo`（响应字段 `conversationInfo: ConversationInfo`）
 * - `muteConversation(boolean)` → `setReceiveMessageOpt(opt: ReceiveMessageOpt)` —— **语义破坏性变更**：boolean → 5 值枚举
 * - **删除** `getConversationTotalUnreadCount`：底层无此 API，totalUnreadCount 仅通过 listener 订阅
 * - listener 字段 `hasMoreConversation` → `hasMoreConversations`（多 s）
 * - createStore 可接受 `conversationGroup` 参数（按分组过滤）；该字段在实例上以私有变量持有
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import type {
  ConversationInfo,
  ConversationLoadOption,
  ConversationMarkTypeValue,
} from "../types/conversation";
import { ReceiveMessageOpt } from "../types/contact";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import type { HybridResponseData } from "../types/hybridService";

/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap(): Map<string, ConversationListState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__CONVERSATION_LIST_STATE_INSTANCES__) {
        app.globalData.__CONVERSATION_LIST_STATE_INSTANCES__ = new Map<string, ConversationListState>();
      }
      return app.globalData.__CONVERSATION_LIST_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[ConversationListState] getApp() not available:', e);
  }
  return new Map<string, ConversationListState>();
}

const InstanceMap = getGlobalInstanceMap();

/**
 * 会话列表状态管理类
 */
class ConversationListState {
  /** Store 实例ID */
  public readonly instanceId: string;
  /** 会话分组（构造时绑定，作为 createStore 透传参数；外部不可见） */
  private readonly conversationGroup?: string;

  /** 会话列表 */
  public readonly conversationList: Ref<ConversationInfo[]>;

  /** 总未读数 */
  public readonly totalUnreadCount: Ref<number>;

  /** 是否有更多会话（旧字段 hasMoreConversation） */
  public readonly hasMoreConversations: Ref<boolean>;

  private constructor(instanceId: string, conversationGroup?: string) {
    this.instanceId = instanceId;
    this.conversationGroup = conversationGroup;
    this.conversationList = ref<ConversationInfo[]>([]);
    this.totalUnreadCount = ref<number>(0);
    this.hasMoreConversations = ref<boolean>(false);

    this.createStore();
  }

  /** 兼容旧字段名 hasMoreConversation */
  get hasMoreConversation(): Ref<boolean> {
    return this.hasMoreConversations;
  }

  public static getInstance(instanceId: string, conversationGroup?: string): ConversationListState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ConversationListState(instanceId, conversationGroup));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore() {
    const params: any = {
      createStoreParams: this.instanceId,
    };
    if (this.conversationGroup) {
      params.conversationGroup = this.conversationGroup;
    }

    const options: HybridCallOptions = {
      api: "createStore",
      params,
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          this.loadConversations({ count: 100 });
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result?.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private bindEvent(): void {
    addListener({
      type: "",
      store: "ConversationList",
      name: "conversationList",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ConversationInfo[]>(result.conversationList, []);
        this.conversationList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][conversationList listener] Error:`, error);
      }
    });

    addListener({
      type: "",
      store: "ConversationList",
      name: "totalUnreadCount",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.totalUnreadCount.value = Number(result.totalUnreadCount);
      } catch (error) {
        console.error(`[${this.instanceId}][totalUnreadCount listener] Error:`, error);
      }
    });

    addListener({
      type: "",
      store: "ConversationList",
      name: "hasMoreConversations",
      params: { createStoreParams: this.instanceId },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.hasMoreConversations.value = Boolean(result.hasMoreConversations);
      } catch (error) {
        console.error(`[${this.instanceId}][hasMoreConversations listener] Error:`, error);
      }
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 拉取会话列表（旧名 fetchConversationList / loadConversationList）
   *
   * @param option ConversationLoadOption（含 count、markType 等）
   *               兼容旧调用：传入 number 时视为 count
   */
  loadConversations = async (
    option: ConversationLoadOption | number = { count: 20 }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const finalOption: ConversationLoadOption =
        typeof option === 'number' ? { count: option } : (option || { count: 20 });

      const options: HybridCallOptions = {
        api: "loadConversations",
        params: {
          createStoreParams: this.instanceId,
          option: JSON.stringify(finalOption),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadConversations] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to load conversations'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 加载更多会话（旧名 fetchMoreConversationList / loadMoreConversationList）
   */
  loadMoreConversations = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "loadMoreConversations",
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
            console.error(`[${this.instanceId}][loadMoreConversations] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to load more conversations'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 获取会话信息（旧名 fetchConversationInfo）
   *
   * 响应字段：`conversationInfo: ConversationInfo`
   */
  getConversationInfo = async (conversationID: string): Promise<ConversationInfo> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "getConversationInfo",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<HybridResponseData<{ conversationInfo: ConversationInfo }>>(response, { code: -1 });
          if (result.code === 0) {
            const info = result.data?.data?.conversationInfo;
            if (info) {
              resolve(info);
            } else {
              reject(new Error('conversationInfo missing in response'));
            }
          } else {
            console.error(`[${this.instanceId}][getConversationInfo] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to get conversation info'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 置顶会话
   */
  pinConversation = async (conversationID: string, pin: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "pinConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          pin,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][pinConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to pin conversation'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置消息接收选项（旧名 muteConversation）
   *
   * **语义破坏性变更**：旧版 `muteConversation(id, mute: boolean)`，
   * 新版 `setReceiveMessageOpt(id, opt: ReceiveMessageOpt)` 支持 5 值：
   * - RECEIVE = 0
   * - NOT_RECEIVE = 1
   * - NOT_NOTIFY = 2
   * - NOT_NOTIFY_EXCEPT_MENTION = 3
   * - NOT_RECEIVE_EXCEPT_MENTION = 4
   *
   * 注：本方法迁入 ConversationList 后，原 ContactState / GroupState 上的
   * setReceiveMessageOpt 已删除；调用点需迁移到此处。
   */
  setReceiveMessageOpt = async (conversationID: string, opt: ReceiveMessageOpt): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setReceiveMessageOpt",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          opt,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setReceiveMessageOpt] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to set receive message opt'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 删除会话
   */
  deleteConversation = async (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to delete conversation'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 设置会话草稿
   */
  setConversationDraft = async (conversationID: string, draft: string | null = null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setConversationDraft",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          draft,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setConversationDraft] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to set conversation draft'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 清空会话消息
   */
  clearConversationMessages = async (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearConversationMessages",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationMessages] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to clear conversation messages'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 清空会话未读数
   */
  clearConversationUnreadCount = async (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearConversationUnreadCount",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationUnreadCount] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to clear unread count'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 标记会话
   */
  markConversation = async (
    conversationIDList: string[],
    markType: ConversationMarkTypeValue,
    enable: boolean
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "markConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationIDList,
          markType,
          enable,
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][markConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to mark conversation'));
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
    const dataNames = ["conversationList", "totalUnreadCount", "hasMoreConversations"];

    dataNames.forEach((name) => {
      removeListener({
        type: "",
        store: "ConversationList",
        name,
        params: {
          createStoreParams: this.instanceId,
        },
      });
    });
  }

  private resetData(): void {
    this.conversationList.value = [];
    this.totalUnreadCount.value = 0;
    this.hasMoreConversations.value = false;
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
 * useConversationListState 参数选项
 */
export interface UseConversationListStateOptions {
  /** 实例 ID（多实例场景使用，与 conversationGroup 配合） */
  instanceId?: string;
  /** 会话分组名（可选；按分组过滤会话列表） */
  conversationGroup?: string;
}

/**
 * 会话列表状态管理 Hook
 *
 * @param optionsOrInstanceId 配置选项；为兼容旧调用，可直接传 instanceId 字符串
 */
export function useConversationListState(
  optionsOrInstanceId?: UseConversationListStateOptions | string
): ConversationListState {
  let conversationGroup: string | undefined;
  let instanceIdSeed: string | undefined;

  if (typeof optionsOrInstanceId === 'string') {
    instanceIdSeed = optionsOrInstanceId;
  } else if (optionsOrInstanceId) {
    instanceIdSeed = optionsOrInstanceId.instanceId;
    conversationGroup = optionsOrInstanceId.conversationGroup;
  }

  const idObject: any = {
    storeName: "ConversationList",
  };
  if (instanceIdSeed) idObject.instanceId = instanceIdSeed;
  if (conversationGroup) idObject.conversationGroup = conversationGroup;

  const instanceId = JSON.stringify(idObject);
  return ConversationListState.getInstance(instanceId, conversationGroup);
}

export { ConversationListState };
export default useConversationListState;
