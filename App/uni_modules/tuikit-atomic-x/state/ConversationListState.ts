/**
 * 会话列表状态管理
 * @module ConversationListState
 */
import { ref, type Ref } from "vue";
import type {
  HybridCallOptions,
} from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import type { ConversationInfo } from "../types/conversation";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";

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

let createStoreParams = JSON.stringify({
  storeName: "ConversationList",
})

/**
 * 会话列表状态管理类
 */
class ConversationListState {
  /** Store 实例ID */
  public readonly instanceId: string;

  /** 会话列表 */
  public readonly conversationList: Ref<ConversationInfo[]>;
  
  /** 总未读数 */
  public readonly totalUnreadCount: Ref<number>;
  
  /** 是否有更多会话 */
  public readonly hasMoreConversation: Ref<boolean>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param instanceId Store 实例ID
   */
  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.conversationList = ref<ConversationInfo[]>([]);
    this.totalUnreadCount = ref<number>(0);
    this.hasMoreConversation = ref<boolean>(false);
    // 初始化 Store
    this.createStore();
  }

  /**
   * 获取实例（单例模式）
   * @param instanceId Store 实例ID，默认为 createStoreParams
   */
  public static getInstance(instanceId: string = createStoreParams): ConversationListState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ConversationListState(instanceId));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore() {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
      }
    };
    
    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          this.fetchConversationList(100);
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result?.message);
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
    // 监听会话列表变化
    addListener({
      type: "",
      store: "ConversationList",
      name: "conversationList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<any>(result.conversationList, {});
        this.conversationList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][conversationList listener] Error:`, error);
      }
    });

    // 监听总未读数变化
    addListener({
      type: "",
      store: "ConversationList",
      name: "totalUnreadCount",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.totalUnreadCount.value = Number(result.totalUnreadCount);
      } catch (error) {
        console.error(`[${this.instanceId}][totalUnreadCount listener] Error:`, error);
      }
    });

    // 监听是否有更多会话
    addListener({
      type: "",
      store: "ConversationList",
      name: "hasMoreConversation",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.hasMoreConversation.value = Boolean(result.hasMoreConversation);
      } catch (error) {
        console.error(`[${this.instanceId}][hasMoreConversation listener] Error:`, error);
      }
    });
  }

  /**
   * 拉取会话列表
   * @param count 每页数量
   * @returns {Promise<void>}
   */
  fetchConversationList = async(count: number = 20): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchConversationList",
        params: {
          createStoreParams: this.instanceId,
          option: {
            count
          }
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchConversationList] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to fetch conversation list'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchConversationList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拉取更多会话列表
   * @returns {Promise<void>}
   */
  fetchMoreConversationList = async(): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchMoreConversationList",
        params: {
          createStoreParams: this.instanceId,
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchMoreConversationList] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to fetch more conversations'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchMoreConversationList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取会话信息
   * @param conversationID 会话ID
   * @returns {Promise<ConversationInfo>}
   */
  fetchConversationInfo = async(conversationID: string): Promise<ConversationInfo> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "fetchConversationInfo",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve(result);
          } else {
            console.error(`[${this.instanceId}][fetchConversationInfo] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to fetch conversation info'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][fetchConversationInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 置顶会话
   * @param conversationID 会话ID
   * @param pin 是否置顶
   * @returns {Promise<void>}
   */
  pinConversation = async(conversationID: string, pin: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "pinConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          pin
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][pinConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to pin conversation'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][pinConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 会话免打扰设置
   * @param conversationID 会话ID
   * @param mute 是否免打扰
   * @returns {Promise<void>}
   */
  muteConversation = async(conversationID: string, mute: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "muteConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          mute
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][muteConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to mute conversation'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][muteConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 删除会话
   * @param conversationID 会话ID
   * @returns {Promise<void>}
   */
  deleteConversation = async(conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "deleteConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to delete conversation'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][deleteConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置会话草稿
   * @param conversationID 会话ID
   * @param draft 草稿文本
   * @returns {Promise<void>}
   */
  setConversationDraft = async(conversationID: string, draft: string | null = null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "setConversationDraft",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          draft
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setConversationDraft] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to set conversation draft'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][setConversationDraft] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 清空会话消息
   * @param conversationID 会话ID
   * @returns {Promise<void>}
   */
  clearConversationMessages = async(conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearConversationMessages",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationMessages] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to clear conversation messages'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][clearConversationMessages] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 清空会话未读数
   * @param conversationID 会话ID
   * @returns {Promise<void>}
   */
  clearConversationUnreadCount = async(conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "clearConversationUnreadCount",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationUnreadCount] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to clear unread count'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][clearConversationUnreadCount] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取总未读数
   * @returns {Promise<number>}
   */
  getConversationTotalUnreadCount = async(): Promise<number> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "getConversationTotalUnreadCount",
        params: {
          createStoreParams: this.instanceId,
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve(Number(result.data || 0));
          } else {
            console.error(`[${this.instanceId}][getConversationTotalUnreadCount] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to get total unread count'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][getConversationTotalUnreadCount] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 标记会话
   * @param conversationIDList 会话ID列表
   * @param markType 标记类型
   * @param enable 是否启用
   * @returns {Promise<void>}
   */
  markConversation = async(conversationIDList: string[], markType: number, enable: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "markConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationIDList,
          markType,
          enable
        }
      };
      
      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][markConversation] Failed:`, result?.message);
            reject(new Error(result?.message || 'Failed to mark conversation'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][markConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    const dataNames = ["conversationList", "totalUnreadCount", "hasMoreConversation"];
    
    dataNames.forEach(name => {
      removeListener({
        type: "",
        store: "ConversationList",
        name,
        params: {
          createStoreParams: this.instanceId,
        }
      });
    });
  }

  /**
   * 重置数据
   */
  private resetData(): void {
    this.conversationList.value = [];
    this.totalUnreadCount.value = 0;
    this.hasMoreConversation.value = false;
  }

  /**
   * 销毁 Store
   */
  destroyStore = (): void => {
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);
    
    const options: HybridCallOptions = {
      api: "destroyStore",
      params: {
        createStoreParams: this.instanceId,
      }
    };

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * 会话列表状态管理 Hook
 * @param instanceId Store 实例ID，默认为 createStoreParams
 */
export function useConversationListState(instanceId: string) {
  if (instanceId) {
    createStoreParams = JSON.stringify({
      storeName: "ConversationList",
      instanceId
    })
  }
  return ConversationListState.getInstance(createStoreParams);
}

export { ConversationListState };
export default useConversationListState;