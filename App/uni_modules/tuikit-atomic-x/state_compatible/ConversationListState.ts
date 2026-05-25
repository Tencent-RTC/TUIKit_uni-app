/**
 * 会话列表状态管理 (Vue2 适配版)
 * @module ConversationListState
 */
import { safeJsonParse } from "../utils/utsUtils";
import { makeReactive } from "../utils/reactiveCompat";
import type { ConversationInfo } from "../types/conversation";
// @ts-ignore — uni-app 编译器会正确解析 UTS 插件路径，TS 类型检查可忽略
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";

// Vue2 响应式状态接口
interface ConversationListReactiveState {
  conversationList: ConversationInfo[];
  totalUnreadCount: number;
  hasMoreConversation: boolean;
}

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
});

/**
 * 会话列表状态管理类 (Vue2)
 */
class ConversationListState {
  /** Store 实例ID */
  public readonly instanceId: string;

  /** Vue2 响应式状态 */
  public readonly state: ConversationListReactiveState;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param instanceId Store 实例ID
   */
  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    // Vue2 使用 Vue.observable 实现响应式
    this.state = makeReactive<ConversationListReactiveState>({
      conversationList: [],
      totalUnreadCount: 0,
      hasMoreConversation: false,
    });
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

  /** 会话列表 (兼容 .value 访问模式) */
  get conversationList() {
    const instanceId = this.instanceId;
    return {
      get value() {
        var inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.conversationList : [];
      },
      set value(val: ConversationInfo[]) {
        var inst = InstanceMap.get(instanceId);
        if (inst) inst.state.conversationList = val;
      }
    };
  }

  /** 总未读数 (兼容 .value 访问模式) */
  get totalUnreadCount() {
    const instanceId = this.instanceId;
    return {
      get value() {
        var inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.totalUnreadCount : 0;
      },
      set value(val: number) {
        var inst = InstanceMap.get(instanceId);
        if (inst) inst.state.totalUnreadCount = val;
      }
    };
  }

  /** 是否有更多会话 (兼容 .value 访问模式) */
  get hasMoreConversation() {
    const instanceId = this.instanceId;
    return {
      get value() {
        var inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.hasMoreConversation : false;
      },
      set value(val: boolean) {
        var inst = InstanceMap.get(instanceId);
        if (inst) inst.state.hasMoreConversation = val;
      }
    };
  }

  private createStore() {
    const options = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
      }
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          this.fetchConversationList(100);
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, (result && result.message));
        }
      } catch (error: any) {
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
        this.state.conversationList = list;
      } catch (error: any) {
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
        this.state.totalUnreadCount = Number(result.totalUnreadCount);
      } catch (error: any) {
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
        this.state.hasMoreConversation = Boolean(result.hasMoreConversation);
      } catch (error: any) {
        console.error(`[${this.instanceId}][hasMoreConversation listener] Error:`, error);
      }
    });
  }

  /**
   * 拉取会话列表
   */
  fetchConversationList = (count: number = 20): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "fetchConversationList",
        params: {
          createStoreParams: this.instanceId,
          option: { count }
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchConversationList] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to fetch conversation list'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][fetchConversationList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 拉取更多会话列表
   */
  fetchMoreConversationList = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "fetchMoreConversationList",
        params: {
          createStoreParams: this.instanceId,
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][fetchMoreConversationList] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to fetch more conversations'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][fetchMoreConversationList] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取会话信息
   */
  fetchConversationInfo = (conversationID: string): Promise<ConversationInfo> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "fetchConversationInfo",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve(result);
          } else {
            console.error(`[${this.instanceId}][fetchConversationInfo] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to fetch conversation info'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][fetchConversationInfo] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 置顶会话
   */
  pinConversation = (conversationID: string, pin: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "pinConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          pin
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][pinConversation] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to pin conversation'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][pinConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 会话免打扰设置
   */
  muteConversation = (conversationID: string, mute: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "muteConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          mute
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][muteConversation] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to mute conversation'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][muteConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 删除会话
   */
  deleteConversation = (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "deleteConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][deleteConversation] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to delete conversation'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][deleteConversation] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 设置会话草稿
   */
  setConversationDraft = (conversationID: string, draft: string | null = null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "setConversationDraft",
        params: {
          createStoreParams: this.instanceId,
          conversationID,
          draft
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][setConversationDraft] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to set conversation draft'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][setConversationDraft] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 清空会话消息
   */
  clearConversationMessages = (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "clearConversationMessages",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationMessages] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to clear conversation messages'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][clearConversationMessages] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 清空会话未读数
   */
  clearConversationUnreadCount = (conversationID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "clearConversationUnreadCount",
        params: {
          createStoreParams: this.instanceId,
          conversationID
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][clearConversationUnreadCount] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to clear unread count'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][clearConversationUnreadCount] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取总未读数
   */
  getConversationTotalUnreadCount = (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "getConversationTotalUnreadCount",
        params: {
          createStoreParams: this.instanceId,
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve(Number(result.data || 0));
          } else {
            console.error(`[${this.instanceId}][getConversationTotalUnreadCount] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to get total unread count'));
          }
        } catch (error: any) {
          console.error(`[${this.instanceId}][getConversationTotalUnreadCount] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 标记会话
   */
  markConversation = (conversationIDList: string[], markType: number, enable: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: "markConversation",
        params: {
          createStoreParams: this.instanceId,
          conversationIDList,
          markType,
          enable
        }
      };

      callAPI(JSON.stringify(options), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][markConversation] Failed:`, (result && result.message));
            reject(new Error((result && result.message) || 'Failed to mark conversation'));
          }
        } catch (error: any) {
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
    this.state.conversationList = [];
    this.state.totalUnreadCount = 0;
    this.state.hasMoreConversation = false;
  }

  /**
   * 销毁 Store
   */
  destroyStore = (): void => {
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);

    const options = {
      api: "destroyStore",
      params: {
        createStoreParams: this.instanceId,
      }
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);
      } catch (error: any) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * 会话列表状态管理 Hook (Vue2 兼容)
 * @param instanceId Store 实例ID
 */
export function useConversationListState(instanceId?: string) {
  if (instanceId) {
    createStoreParams = JSON.stringify({
      storeName: "ConversationList",
      instanceId
    });
  }
  const instance = ConversationListState.getInstance(createStoreParams);
  return {
    /** 会话列表 (直接访问, 已是响应式) */
    state: instance.state,
    /** 拉取会话列表 */
    fetchConversationList: instance.fetchConversationList,
    /** 拉取更多会话列表 */
    fetchMoreConversationList: instance.fetchMoreConversationList,
    /** 获取会话信息 */
    fetchConversationInfo: instance.fetchConversationInfo,
    /** 置顶会话 */
    pinConversation: instance.pinConversation,
    /** 免打扰 */
    muteConversation: instance.muteConversation,
    /** 删除会话 */
    deleteConversation: instance.deleteConversation,
    /** 设置草稿 */
    setConversationDraft: instance.setConversationDraft,
    /** 清空消息 */
    clearConversationMessages: instance.clearConversationMessages,
    /** 清空未读 */
    clearConversationUnreadCount: instance.clearConversationUnreadCount,
    /** 获取总未读数 */
    getConversationTotalUnreadCount: instance.getConversationTotalUnreadCount,
    /** 标记会话 */
    markConversation: instance.markConversation,
    /** 销毁 Store */
    destroyStore: instance.destroyStore,
  };
}

export { ConversationListState };
export default useConversationListState;
