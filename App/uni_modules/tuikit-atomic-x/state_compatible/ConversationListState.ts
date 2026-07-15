/**
 * 会话列表状态管理 (Vue2 适配版)
 * @module ConversationListState
 */
import { safeJsonParse } from "../utils/utsUtils";
import { makeReactive } from "../utils/reactiveCompat";
import type { ConversationInfo } from "../types/conversation";
import { ReceiveMessageOpt } from "../types/conversation";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";

declare const getApp: any;

interface ConversationLoadOption {
  pageSize?: number;
  conversationGroup?: string;
}

interface ConversationListReactiveState {
  conversationList: ConversationInfo[];
  totalUnreadCount: number;
  hasMoreConversations: boolean;
}

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

let createStoreParams = JSON.stringify({ storeName: "ConversationList" });

class ConversationListState {
  public readonly instanceId: string;
  public readonly state: ConversationListReactiveState;
  /** 会话分组（构造时绑定，作为 createStore 透传参数；外部不可见） */
  private readonly conversationGroup?: string;

  private constructor(instanceId: string, conversationGroup?: string) {
    this.instanceId = instanceId;
    this.conversationGroup = conversationGroup;
    this.state = makeReactive<ConversationListReactiveState>({
      conversationList: [],
      totalUnreadCount: 0,
      hasMoreConversations: false,
    });
    this.createStore();
  }

  public static getInstance(instanceId: string = createStoreParams, conversationGroup?: string): ConversationListState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ConversationListState(instanceId, conversationGroup));
    }
    return InstanceMap.get(instanceId)!;
  }

  /** 会话列表（兼容 .value 访问模式） */
  get conversationList() {
    const instanceId = this.instanceId;
    return {
      get value() {
        const inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.conversationList : [];
      },
      set value(val: ConversationInfo[]) {
        const inst = InstanceMap.get(instanceId);
        if (inst) inst.state.conversationList = val;
      }
    };
  }

  get totalUnreadCount() {
    const instanceId = this.instanceId;
    return {
      get value() {
        const inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.totalUnreadCount : 0;
      },
      set value(val: number) {
        const inst = InstanceMap.get(instanceId);
        if (inst) inst.state.totalUnreadCount = val;
      }
    };
  }

  get hasMoreConversations() {
    const instanceId = this.instanceId;
    return {
      get value() {
        const inst = InstanceMap.get(instanceId);
        return (inst && inst.state) ? inst.state.hasMoreConversations : false;
      },
      set value(val: boolean) {
        const inst = InstanceMap.get(instanceId);
        if (inst) {
          inst.state.hasMoreConversations = val;
        }
      }
    };
  }

  private createStore() {
    const params: any = { createStoreParams: this.instanceId };
    if (this.conversationGroup) {
      params.conversationGroup = this.conversationGroup;
    }
    callAPI(JSON.stringify({
      api: "createStore",
      params
    }), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          this.loadConversations({ pageSize: 100 });
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result && result.message);
        }
      } catch (error: any) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private bindEvent(): void {
    addListener({
      type: "", store: "ConversationList", name: "conversationList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const list = safeJsonParse<ConversationInfo[]>(result.conversationList, []);
        this.state.conversationList = Array.isArray(list) ? list : [];
      } catch (error: any) {
        console.error(`[${this.instanceId}][conversationList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "ConversationList", name: "totalUnreadCount",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        this.state.totalUnreadCount = Number(result.totalUnreadCount || 0);
      } catch (error: any) {
        console.error(`[${this.instanceId}][totalUnreadCount listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "ConversationList", name: "hasMoreConversations",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const v = Boolean(result.hasMoreConversations);
        this.state.hasMoreConversations = v;
      } catch (error: any) {
        console.error(`[${this.instanceId}][hasMoreConversations listener] Error:`, error);
      }
    });
  }

  // ==================== 新版 API ====================

  loadConversations = (option: ConversationLoadOption = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      const params: any = { createStoreParams: this.instanceId };
      const opt: any = {};
      if (option.pageSize !== undefined) opt.pageSize = option.pageSize;
      if (option.conversationGroup !== undefined) opt.conversationGroup = option.conversationGroup;
      if (Object.keys(opt).length > 0) params.option = JSON.stringify(opt);

      callAPI(JSON.stringify({ api: "loadConversations", params }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][loadConversations] Failed:`, result && result.message);
            reject(new Error((result && result.message) || 'Failed to load conversations'));
          }
        } catch (error: any) {
          reject(error);
        }
      });
    });
  }

  loadMoreConversations = (): Promise<void> => this.callSimpleApi("loadMoreConversations");

  getConversationInfo = (conversationID: string): Promise<ConversationInfo | null> => {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: "getConversationInfo",
        params: { createStoreParams: this.instanceId, conversationID }
      }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            const info = (result.data && result.data.data && result.data.data.conversationInfo)
              || (result.data && result.data.conversationInfo)
              || null;
            resolve(info);
          } else {
            console.error(`[${this.instanceId}][getConversationInfo] Failed:`, result && result.message);
            reject(new Error((result && result.message) || 'Failed to get conversation info'));
          }
        } catch (error: any) {
          reject(error);
        }
      });
    });
  }

  pinConversation = (conversationID: string, pin: boolean): Promise<void> =>
    this.callApiWithParams("pinConversation", { conversationID, pin });

  /** 设置消息接收选项（替代旧 muteConversation） */
  setReceiveMessageOpt = (conversationID: string, opt: ReceiveMessageOpt): Promise<void> =>
    this.callApiWithParams("setReceiveMessageOpt", { conversationID, opt });

  deleteConversation = (conversationID: string): Promise<void> =>
    this.callApiWithParams("deleteConversation", { conversationID });

  setConversationDraft = (conversationID: string, draft: string | null = null): Promise<void> =>
    this.callApiWithParams("setConversationDraft", { conversationID, draft });

  clearConversationMessages = (conversationID: string): Promise<void> =>
    this.callApiWithParams("clearConversationMessages", { conversationID });

  clearConversationUnreadCount = (conversationID: string): Promise<void> =>
    this.callApiWithParams("clearConversationUnreadCount", { conversationID });

  markConversation = (conversationIDList: string[], markType: number, enable: boolean): Promise<void> =>
    this.callApiWithParams("markConversation", { conversationIDList, markType, enable });

  // ==================== 内部工具 ====================

  private callSimpleApi(api: string): Promise<void> {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api,
        params: { createStoreParams: this.instanceId }
      }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result && result.message);
            reject(new Error((result && result.message) || `${api} failed`));
          }
        } catch (error: any) { reject(error); }
      });
    });
  }

  private callApiWithParams(api: string, extraParams: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      const params: Record<string, any> = { createStoreParams: this.instanceId };
      for (const k in extraParams) { params[k] = extraParams[k]; }
      callAPI(JSON.stringify({ api, params }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result && result.message);
            reject(new Error((result && result.message) || `${api} failed`));
          }
        } catch (error: any) { reject(error); }
      });
    });
  }

  private unbindEvent(): void {
    ["conversationList", "totalUnreadCount", "hasMoreConversations"].forEach(name => {
      removeListener({
        type: "", store: "ConversationList", name,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  private resetData(): void {
    this.state.conversationList = [];
    this.state.totalUnreadCount = 0;
    this.state.hasMoreConversations = false;
  }

  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.resetData();
    InstanceMap.delete(this.instanceId);

    callAPI(JSON.stringify({
      api: "destroyStore",
      params: { createStoreParams: this.instanceId }
    }), (response: string) => {
      try {
        safeJsonParse<any>(response, {});
      } catch (error: any) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * 会话列表状态管理 Hook (Vue2 兼容)
 */
export function useConversationListState(instanceIdOrOptions?: string | { conversationGroup?: string; instanceId?: string }) {
  let id: string;
  let conversationGroup: string | undefined;
  if (typeof instanceIdOrOptions === 'string') {
    createStoreParams = JSON.stringify({ storeName: "ConversationList", instanceId: instanceIdOrOptions });
    id = createStoreParams;
  } else if (instanceIdOrOptions && typeof instanceIdOrOptions === 'object') {
    const o = instanceIdOrOptions as any;
    conversationGroup = o.conversationGroup;
    createStoreParams = JSON.stringify({
      storeName: "ConversationList",
      ...(o.conversationGroup !== undefined ? { conversationGroup: o.conversationGroup } : {}),
      ...(o.instanceId !== undefined ? { instanceId: o.instanceId } : {})
    });
    id = createStoreParams;
  } else {
    id = createStoreParams;
  }

  const instance = ConversationListState.getInstance(id, conversationGroup);
  return {
    state: instance.state,
    instanceId: instance.instanceId,
    conversationList: instance.conversationList,
    totalUnreadCount: instance.totalUnreadCount,
    hasMoreConversations: instance.hasMoreConversations,

    loadConversations: instance.loadConversations,
    loadMoreConversations: instance.loadMoreConversations,
    getConversationInfo: instance.getConversationInfo,
    pinConversation: instance.pinConversation,
    setReceiveMessageOpt: instance.setReceiveMessageOpt,
    deleteConversation: instance.deleteConversation,
    setConversationDraft: instance.setConversationDraft,
    clearConversationMessages: instance.clearConversationMessages,
    clearConversationUnreadCount: instance.clearConversationUnreadCount,
    markConversation: instance.markConversation,

    destroyStore: instance.destroyStore,
  };
}

export { ConversationListState };
export default useConversationListState;
