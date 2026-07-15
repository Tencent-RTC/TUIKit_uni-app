/**
 * 会话分组状态管理 (Vue2 适配版)
 * @module ConversationGroupState
 *
 * 注意：Android 实际推送的 groupList 是 `string[]`（仅分组名）；
 * iOS 推送的是富对象（含 conversationList / totalUnreadCount 等）。
 * uniapp 侧统一按字符串数组处理；分组下的会话列表请用
 * `useConversationListState({ conversationGroup: name })` 二次拉取。
 */
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore
import { safeJsonParse } from "../utils/utsUtils";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { BuiltInGroup } from "../types/conversationGroup";

declare const getApp: any;

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

class ConversationGroupState {
  private static readonly STORE_NAME = "ConversationGroup";

  public readonly instanceId: string;

  /** 分组名数组（Android 实际推送形态） */
  public readonly groupList: { value: string[] };

  private constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.groupList = makeReactive({ value: [] });
    this.createStore();
  }

  public static getInstance(instanceId: string): ConversationGroupState {
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new ConversationGroupState(instanceId));
    }
    return InstanceMap.get(instanceId)!;
  }

  private createStore() {
    callAPI(JSON.stringify({
      api: "createStore",
      params: { createStoreParams: this.instanceId }
    }), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
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
      type: "", store: ConversationGroupState.STORE_NAME, name: "groupList",
      params: { createStoreParams: this.instanceId }
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const raw = safeJsonParse<any>(result.groupList, []);
        // Android: string[]; iOS: Array<{ groupName: string }>
        let names: string[] = [];
        if (Array.isArray(raw)) {
          names = raw.map((it: any) => typeof it === 'string' ? it : (it && it.groupName) || '').filter(Boolean);
        }
        this.groupList.value = names;
      } catch (error) {
        console.error(`[${this.instanceId}][groupList listener] Error:`, error);
      }
    });
  }

  // ==================== 新版 API ====================

  loadGroups = (): Promise<void> => this.callSimpleApi('loadGroups');

  createGroup = (groupName: string, conversationIDList?: string[]): Promise<void> => {
    const params: any = { groupName };
    if (conversationIDList) params.conversationIDList = JSON.stringify(conversationIDList);
    return this.callApiWithParams('createGroup', params);
  }

  deleteGroup = (groupName: string): Promise<void> =>
    this.callApiWithParams('deleteGroup', { groupName });

  renameGroup = (oldName: string, newName: string): Promise<void> =>
    this.callApiWithParams('renameGroup', { oldName, newName });

  addConversationsToGroup = (groupName: string, conversationIDList: string[]): Promise<void> =>
    this.callApiWithParams('addConversationsToGroup', {
      groupName,
      conversationIDList: JSON.stringify(conversationIDList)
    });

  deleteConversationsFromGroup = (groupName: string, conversationIDList: string[]): Promise<void> =>
    this.callApiWithParams('deleteConversationsFromGroup', {
      groupName,
      conversationIDList: JSON.stringify(conversationIDList)
    });

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
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(new Error(result.message || `${api} failed`));
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
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][${api}] Failed:`, result.message);
            reject(new Error(result.message || `${api} failed`));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  private unbindEvent(): void {
    removeListener({
      type: "", store: ConversationGroupState.STORE_NAME, name: "groupList",
      params: { createStoreParams: this.instanceId }
    });
  }

  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    InstanceMap.delete(this.instanceId);
    callAPI(JSON.stringify({
      api: "destroyStore",
      params: { createStoreParams: this.instanceId }
    }), (response: string) => {
      try { safeJsonParse<any>(response, {}); } catch (e) { console.error(e); }
    });
  }
}

export function useConversationGroupState(instanceId?: string) {
  const id = instanceId || JSON.stringify({ storeName: "ConversationGroup" });
  return ConversationGroupState.getInstance(id);
}

export { ConversationGroupState, BuiltInGroup };
export default useConversationGroupState;
