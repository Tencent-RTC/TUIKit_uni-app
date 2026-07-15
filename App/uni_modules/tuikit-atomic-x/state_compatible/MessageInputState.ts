/**
 * 消息输入状态管理 (Vue2 适配版)
 * @module MessageInputState
 *
 * 对外只暴露 sendMessage(payload, option?) 单一入口，与底层一一对应。
 */
import type {
  SendMessagePayload,
  SendMessageOption,
} from '../types/message';
// @ts-ignore
import { callAPI, HybridResponseData } from "../utils/tuikitBridge";
import { safeJsonParse } from '../utils/utsUtils';

declare const getApp: any;

function getGlobalInstanceMap(): Map<string, MessageInputState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__MESSAGE_INPUT_STATE_INSTANCES__) {
        app.globalData.__MESSAGE_INPUT_STATE_INSTANCES__ = new Map<string, MessageInputState>();
      }
      return app.globalData.__MESSAGE_INPUT_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[MessageInputState] getApp() not available:', e);
  }
  return new Map<string, MessageInputState>();
}

const InstanceMap = getGlobalInstanceMap();

class MessageInputState {
  public readonly instanceId: string;
  private readonly conversationID: string;

  private constructor(conversationID: string) {
    this.instanceId = MessageInputState.generateInstanceId(conversationID);
    this.conversationID = conversationID;
    this.createStore();
  }

  private createStore() {
    callAPI(JSON.stringify({
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code !== 0) {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private static generateInstanceId(conversationID: string): string {
    return JSON.stringify({
      storeName: "MessageInput",
      conversationID,
    });
  }

  public static getInstance(conversationID: string = ""): MessageInputState {
    const instanceId = MessageInputState.generateInstanceId(conversationID);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageInputState(conversationID));
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 发送消息（与底层 MessageInputStore.sendMessage 一一对应）
   */
  sendMessage = (
    payload: SendMessagePayload,
    option?: SendMessageOption
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const params: any = {
        createStoreParams: this.instanceId,
        payload: JSON.stringify(payload),
      };
      if (option) params.option = JSON.stringify(option);

      callAPI(JSON.stringify({
        api: 'sendMessage',
        params,
      }), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          if (data.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][sendMessage] Failed:`, data.message);
            reject(Object.assign(new Error(data.message || 'sendMessage failed'), { errCode: data.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  destroyStore = (): Promise<void> => {
    // 幂等：实例已被销毁过，直接 resolve
    if (!InstanceMap.has(this.instanceId)) {
      return Promise.resolve();
    }
    InstanceMap.delete(this.instanceId);
    return new Promise((resolve) => {
      callAPI(JSON.stringify({
        api: 'destroyStore',
        params: { createStoreParams: this.instanceId }
      }), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          if (data.code !== 0) {
            console.warn(`[${this.instanceId}][destroyStore] ignored:`, data.message);
          }
        } catch (error) {
          console.warn(`[${this.instanceId}][destroyStore] parse error:`, error);
        }
        resolve();
      });
    });
  }
}

export interface UseMessageInputStateOptions {
  conversationID?: string;
}

export function useMessageInputState(options: UseMessageInputStateOptions = {}) {
  const { conversationID = "" } = options;
  if (!conversationID) {
    console.error('[useMessageInputState] conversationID is required');
    return;
  }
  return MessageInputState.getInstance(conversationID);
}

export { MessageInputState };
export default useMessageInputState;
