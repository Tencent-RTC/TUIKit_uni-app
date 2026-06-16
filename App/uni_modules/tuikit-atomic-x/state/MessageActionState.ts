/**
 * 消息操作状态管理
 * @module MessageActionState
 */
import { ref, type Ref } from 'vue'
import type { MessageInfo } from '../types/message'
import type { HybridCallOptions } from '../utssdk/interface.uts'
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from '../utils/utsUtils';


/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap(): Map<string, MessageActionState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__MESSAGE_ACTION_STATE_INSTANCES__) {
        app.globalData.__MESSAGE_ACTION_STATE_INSTANCES__ = new Map<string, MessageActionState>();
      }
      return app.globalData.__MESSAGE_ACTION_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[MessageActionState] getApp() not available:', e);
  }
  return new Map<string, MessageActionState>();
}

const InstanceMap = getGlobalInstanceMap();

/**
 * 消息操作状态管理类
 */
class MessageActionState {
  /** Store 实例ID */
  public readonly instanceId: string;
  /** 消息 */
  public readonly message: MessageInfo;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param message 消息对象
   */
  private constructor(message: MessageInfo) {
    console.log(`[MessageActionState] Constructor called, message.msgID: ${message.msgID}`);
    this.instanceId = MessageActionState.generateInstanceId(message);
    this.message = message;
    // 初始化 Store
    this.createStore();
  }

  private createStore() {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
      }
    };
    
    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        
        if (result.code === 0) {
          // console.log(`[${this.instanceId}][createStore] Success`);
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  /**
   * 生成完整的实例 ID
   * @param message 消息对象
   */
  private static generateInstanceId(message: MessageInfo): string {
    return JSON.stringify({
      storeName: "MessageAction",
      message: message
    });
  }

  /**
   * 获取实例（单例模式）
   * @param message 消息对象，默认为空对象
   */
  public static getInstance(message: MessageInfo): MessageActionState {
    const instanceId = MessageActionState.generateInstanceId(message);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageActionState(message));
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 删除消息
   * @returns Promise<void>
   */
  deleteMessage = async(): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'deleteMessage',
        params: {
          createStoreParams: this.instanceId,
        }
      }
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'deleteMessage failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 撤回消息
   * @returns Promise<void>
   */
  recallMessage = async(): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'recallMessage',
        params: {
          createStoreParams: this.instanceId,
        }
      }

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'recallMessage failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 语音转文字
   *
   * 透传到底层 Native Store 已实现的 convertVoiceToText 接口，
   * 触发当前 SOUND 类型消息的语音转文本。
   *
   * 注意：转换结果由 SDK 异步更新到 message.messageBody.asrText，
   * 通过 MessageList 的响应式数据流刷新到 AudioMessage 组件，
   * 本接口的 Promise 仅表示 "调用是否成功触发"，无需等待返回文本。
   *
   * @param language 转换语言，如 'zh' / 'en'，由 Native 侧定义并校验
   * @returns Promise<void> 调用是否成功
   */
  convertVoiceToText = async(language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'convertVoiceToText',
        params: {
          createStoreParams: this.instanceId,
          language: language,
        }
      }

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            const err = new Error(result.message || 'convertVoiceToText failed') as Error & { code?: number }
            err.code = result.code
            reject(err)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    // MessageAction 暂时没有需要解绑的事件
    console.log(`[${this.instanceId}][unbindEvent] No events to unbind for MessageAction`);
  }

  /**
   * 重置数据
   */
  private resetData(): void {
    // MessageAction 暂时没有需要重置的数据
    console.log(`[${this.instanceId}][resetData] No data to reset for MessageAction`);
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
        createStoreParams: this.instanceId
      }
    };

    callAPI(JSON.stringify(options), (response: string) => {
      try {
        const result = safeJsonParse(response, {}) as any;
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);

        if (result.code === 0) {
          console.log(`[${this.instanceId}][destroyStore] Success`);
        } else {
          console.error(`[${this.instanceId}][destroyStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * useMessageActionState 参数选项
 */
export interface UseMessageActionStateOptions {
  /** 消息对象 */
  message: MessageInfo;
}

/**
 * 导出消息操作状态管理 Hook
 * @param options 配置选项
 */
export function useMessageActionState(options: UseMessageActionStateOptions) {
  const { message } = options;
  
  return MessageActionState.getInstance(message);
}

export {
  MessageActionState,
}