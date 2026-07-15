/**
 * 消息输入状态管理
 * @module MessageInputState
 *
 * 对齐底层 atomicxcore.api.message.MessageInputStore.kt（HybridAPI: MessageInputAPI.kt）
 *
 * 对外只暴露 `sendMessage(payload, option?)` 单一入口，与底层 `MessageInputStore.sendMessage`
 * 一一对应。具体业务（文本/图片/视频/音频/文件/表情/自定义）由各组件按
 * `SendMessagePayload` sealed 结构自行构造 payload 后调用。
 */
import type {
  SendMessagePayload,
  SendMessageOption,
} from '../types/message'
import type { HybridCallOptions } from '../utssdk/interface.uts'
import { callAPI, HybridResponseData } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from '../utils/utsUtils';

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
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    };

    callAPI(JSON.stringify(options), (response: string) => {
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
   *
   * @param payload SendMessagePayload sealed 结构（type 字段为 discriminator）
   * @param option  SendMessageOption（可选）
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
      if (option) {
        params.option = JSON.stringify(option);
      }

      const options: HybridCallOptions = {
        api: 'sendMessage',
        params,
      };

      callAPI(JSON.stringify(options), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          if (data.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(data.message || 'sendMessage failed'), { errCode: data.code }));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  destroyStore = (): Promise<void> => {
    // 幂等：实例已被销毁过，直接 resolve
    if (!InstanceMap.has(this.instanceId)) {
      return Promise.resolve();
    }
    InstanceMap.delete(this.instanceId);

    return new Promise((resolve) => {
      const hybridCallOptions: HybridCallOptions = {
        api: 'destroyStore',
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(hybridCallOptions), () => {});
    });
  };
}

export interface UseMessageInputStateOptions {
  conversationID?: string;
}

export function useMessageInputState(options: UseMessageInputStateOptions = {}) {
  const { conversationID = "" } = options;

  if (!conversationID) {
    console.error('conversationID is required');
    return;
  }

  return MessageInputState.getInstance(conversationID);
}

export { MessageInputState };
export default useMessageInputState;
