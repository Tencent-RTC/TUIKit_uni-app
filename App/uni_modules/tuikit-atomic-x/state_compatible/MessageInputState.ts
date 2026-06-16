/**
 * 消息输入状态管理
 * @module MessageInputState
 */
import type { MessageInfo, OfflinePushInfo } from '../types/message'
// @ts-ignore
import { callAPI, HybridResponseData } from "../utils/tuikitBridge";
import { MessageType } from '../types/message';
import { safeJsonParse } from '../utils/utsUtils';
import { MAX_AT_USER_COUNT } from '../utils/mention';

interface SendTextMessageOptions {
  text: string;
  /** 离线推送配置；不传则不附带，由 SDK 走默认 */
  offlinePushInfo?: OfflinePushInfo;
  /** 被 @ 的 userID 列表；'__kImSDK_MesssageAtALL__' 表示 @所有人 */
  atUserList?: string[];
}

interface SendImageMessageOptions {
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  /** 离线推送配置；不传则不附带，由 SDK 走默认 */
  offlinePushInfo?: OfflinePushInfo;
}

interface SendVideoMessageOptions {
  videoSnapshotPath: string;
  videoSnapshotWidth: number;
  videoSnapshotHeight: number;
  videoDuration: number;
  videoType: string | 'mp4';
  videoPath: string;
  /** 离线推送配置；不传则不附带，由 SDK 走默认 */
  offlinePushInfo?: OfflinePushInfo;
}

/**
 * 自定义消息发送选项
 *
 * 业务方传入的字段（如 businessID / version / data 等）会被序列化进 customMessage.data；
 * 但 offlinePushInfo 是发送配置，会在方法体内通过解构剥离，不会污染 customMessage.data。
 */
interface SendCustomMessageOptions {
  /** 离线推送配置；不传则不附带，由 SDK 走默认 */
  offlinePushInfo?: OfflinePushInfo;
  [key: string]: any;
}

/**
 * 获取全局 InstanceMap
 */
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

/**
 * 消息输入状态管理类
 */
class MessageInputState {
  /** Store 实例ID */
  public readonly instanceId: string;
  
  /** 会话ID */
  public readonly conversationID: string;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param conversationID 会话ID
   */
  private constructor(conversationID: string) {
    console.log(`[MessageInputState] Constructor called, conversationID: ${conversationID}`);
    this.instanceId = MessageInputState.generateInstanceId(conversationID);
    this.conversationID = conversationID;
    
    // 初始化 Store
    this.createStore();
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
        console.log(`[${this.instanceId}][createStore] Response:`, result);
        
        if (result.code === 0) {
          console.log(`[${this.instanceId}][createStore] Success`);
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });

    // 初始化事件监听
    this.bindEvent();
  }

  /**
   * 生成完整的实例 ID
   * @param conversationID 会话ID
   */
  private static generateInstanceId(conversationID: string): string {
    return JSON.stringify({
      storeName: "MessageInput",
      conversationID: conversationID,
    });
  }

  /**
   * 获取实例（单例模式）
   * @param conversationID 会话ID，默认为空字符串
   */
  public static getInstance(conversationID: string = ""): MessageInputState {
    const instanceId = MessageInputState.generateInstanceId(conversationID);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageInputState(conversationID));
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 绑定事件监听
   */
  private bindEvent(): void {
    // MessageInput 暂时没有需要监听的事件
    // console.log(`[${this.instanceId}][bindEvent] No events to bind for MessageInput`);
  }

  /**
   * 发送消息
   * @param message 消息对象
   * @returns Promise<void>
   */
  sendMessage = (message: MessageInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options = {
        api: 'sendMessage',
        params: {
          createStoreParams: this.instanceId,
          message
        },
      };

      callAPI(JSON.stringify(options), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          // console.log(`[${this.instanceId}][sendMessage] Response:`, data);
          
          if (data.code === 0) {
            resolve();
          } else {
            reject(new Error(data.message || 'sendMessage failed'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][sendMessage] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 发送文本消息
   * @param options 文本消息选项
   * @returns Promise<void>
   */
  sendTextMessage = (options: SendTextMessageOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      // atUserList 数量校验
      if (options.atUserList && options.atUserList.length > MAX_AT_USER_COUNT) {
        reject(Object.assign(
          new Error('atUserList 超过最大限制 ' + MAX_AT_USER_COUNT + ' 个'),
          { errCode: 'AT_USER_LIST_EXCEED' }
        ));
        return;
      }
      const messageObj: any = {
        messageType: MessageType.TEXT,
        messageBody: {
          text: options.text
        }
      };
      if (options.offlinePushInfo) {
        messageObj.offlinePushInfo = options.offlinePushInfo;
      }
      if (options.atUserList && options.atUserList.length > 0) {
        messageObj.atUserList = options.atUserList;
      }
      const hybridCallOptions = {
        api: 'sendMessage',
        params: {
          createStoreParams: this.instanceId,
          message: JSON.stringify(messageObj)
        },
      };

      callAPI(JSON.stringify(hybridCallOptions), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          // console.log(`[${this.instanceId}][sendTextMessage] Response:`, data);
          
          if (data.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(data.message || 'sendTextMessage failed'), { errCode: data.code }));
            console.error(`[${this.instanceId}][sendTextMessage] Parse error:`, data);
          }
        } catch (error) {
          console.error(`[${this.instanceId}][sendTextMessage] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 发送图片消息
   * @param options 图片消息选项
   * @returns Promise<void>
   */
  sendImageMessage = (options: SendImageMessageOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      const messageObj: any = {
        messageType: MessageType.IMAGE,
        messageBody: {
          originalImagePath: options.imagePath,
          originalImageWidth: options.imageWidth,
          originalImageHeight: options.imageHeight
        }
      };
      if (options.offlinePushInfo) {
        messageObj.offlinePushInfo = options.offlinePushInfo;
      }
      const hybridCallOptions = {
        api: 'sendMessage',
        params: {
          createStoreParams: this.instanceId,
          message: JSON.stringify(messageObj)
        },
      };

      callAPI(JSON.stringify(hybridCallOptions), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          // console.log(`[${this.instanceId}][sendImageMessage] Response:`, data);
          
          if (data.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(data.message || 'sendImageMessage failed'), { errCode: data.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][sendImageMessage] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * 发送视频消息
   * @param options 视频消息选项
   * @returns Promise<void>
   */
  sendVideoMessage = (options: SendVideoMessageOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      const messageObj: any = {
        messageType: MessageType.VIDEO,
        messageBody: {
          videoPath: options.videoPath,
          videoSnapshotPath: options.videoSnapshotPath,
          videoSnapshotWidth: options.videoSnapshotWidth,
          videoSnapshotHeight: options.videoSnapshotHeight,
          videoDuration: options.videoDuration,
          videoType: "mp4"
        }
      };
      if (options.offlinePushInfo) {
        messageObj.offlinePushInfo = options.offlinePushInfo;
      }
      const hybridCallOptions = {
        api: 'sendMessage',
        params: {
          createStoreParams: this.instanceId,
          message: JSON.stringify(messageObj)
        },
      };
      
      callAPI(JSON.stringify(hybridCallOptions), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          // console.log(`[${this.instanceId}][sendVideoMessage] Response:`, data);
          
          if (data.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(data.message || 'sendVideoMessage failed'), { errCode: data.code }));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][sendVideoMessage] Parse error:`, error);
          reject(error);
        }
      });
    });
  }

  sendCustomMessage = (options: SendCustomMessageOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 剥离 offlinePushInfo：它是发送配置不应进入 customMessage.data，避免污染业务字段
      const { offlinePushInfo, ...customData } = options;
      const messageObj: any = {
        messageType: MessageType.CUSTOM,
        messageBody: {
          customMessage: {
            data: JSON.stringify(customData),
          }
        }
      };
      if (offlinePushInfo) {
        messageObj.offlinePushInfo = offlinePushInfo;
      }
      const hybridCallOptions = {
        api: 'sendMessage',
        params: {
          createStoreParams: this.instanceId,
          message: JSON.stringify(messageObj)
        },
      };

      callAPI(JSON.stringify(hybridCallOptions), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
		  
          if (data.code === 0) {
            resolve();
          } else {
            reject(Object.assign(new Error(data.message || 'sendCustomMessage failed'), { errCode: data.code }));
            console.error(`[${this.instanceId}][sendCustomMessage] Failed:`, data.message);
          }
        } catch (error) {
            console.error(`[${this.instanceId}][sendCustomMessage] Parse error:`, error);
            reject(error);
        }
      });
    });
  }

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    // MessageInput 暂时没有需要解绑的事件
    return;
  }

  /**
   * 销毁 Store
   */
  destroyStore = (): Promise<void> => {
    this.unbindEvent();
    // 2. 再调用 Native destroyStore
    return new Promise((resolve, reject) => {
      const hybridCallOptions = {
        api: 'destroyStore',
        params: {
          createStoreParams: this.instanceId,
        }
      };

      callAPI(JSON.stringify(hybridCallOptions), (result: string) => {
        try {
          const data = safeJsonParse(result, {}) as HybridResponseData;
          // console.log(`[${this.instanceId}][destroyStore] Response:`, data);
          if (data.code === 0) {
            const deleted = InstanceMap.delete(this.instanceId);
            if (deleted) {
              resolve();
            } else {
              reject(new Error(`[${this.instanceId}][destroyStore] Failed to delete InstanceMap`));
            }
          } else {
            console.error(`[${this.instanceId}][destroyStore] Failed:`, data.message);
            reject(new Error(data.message || 'Failed to destroy store'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
          reject(error);
        }
      });
    });
  }
}

/**
 * useMessageInputState 参数选项
 */
export interface UseMessageInputStateOptions {
  /** 会话ID */
  conversationID?: string;
}

/**
 * 导出消息输入状态管理 Hook
 * @param options 配置选项
 */
export function useMessageInputState(options: UseMessageInputStateOptions = {}) {
  const {
    conversationID = "",
  } = options;

  if (!conversationID) {
    console.error('conversationID is required');
    return;
  }
  
  return MessageInputState.getInstance(conversationID);
}

export { MessageInputState };
export default useMessageInputState;