/**
 * 消息列表状态管理
 * @module MessageListState
 */
import { ref, type Ref } from 'vue'
import {
  MessageFetchDirection,
  MessageMediaFileType,
  MessageListType,
  MessageFilterType,
} from '../types/message'
import type {
  MessageInfo,
  MessageFetchOption,
  MessageForwardOption,
} from '../types/message'
import type { HybridCallOptions } from '../utssdk/interface.uts'
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from '../utils/utsUtils';

/**
 * 获取全局 InstanceMap
 */
function getGlobalInstanceMap(): Map<string, MessageListState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__MESSAGE_LIST_STATE_INSTANCES__) {
        app.globalData.__MESSAGE_LIST_STATE_INSTANCES__ = new Map<string, MessageListState>();
      }
      return app.globalData.__MESSAGE_LIST_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[MessageListState] getApp() not available:', e);
  }
  return new Map<string, MessageListState>();
}

const InstanceMap = getGlobalInstanceMap();

const downloadingMsgIDs: Set<string> = new Set();

/**
 * 消息列表状态管理类
 */
class MessageListState {
  /** Store 实例ID */
  public readonly instanceId: string;
  
  /** 会话ID */
  public readonly conversationID: string;
  
  /** 消息列表类型 */
  public readonly messageListType: MessageListType;
  
  /** 消息列表 */
  public readonly messageList: Ref<MessageInfo[]>;
  
  /** 是否有更早的消息 */
  public readonly hasMoreOlderMessage: Ref<boolean>;
  
  /** 是否有更新的消息 */
  public readonly hasMoreNewerMessage: Ref<boolean>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param instanceId Store 实例ID
   * @param conversationID 会话ID
   * @param messageListType 消息列表类型
   */
  private constructor(conversationID: string, messageListType: MessageListType) {
    console.log(`[MessageListState] Constructor called, conversationID: ${conversationID}, messageListType: ${messageListType}`);
    this.instanceId = MessageListState.generateInstanceId(conversationID, messageListType);
    this.conversationID = conversationID;
    this.messageListType = messageListType;
    this.messageList = ref<MessageInfo[]>([]);
    this.hasMoreOlderMessage = ref<boolean>(true);
    this.hasMoreNewerMessage = ref<boolean>(false);
    
    // 初始化 Store
    this.createStore();
  }

  private createStore() {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    };
    
    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
          if (this.conversationID && this.messageListType === MessageListType.HISTORY) {
            this.fetchMessageList({ pageCount: 20 });
          }
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  /**
   * 生成完整的 Store ID
   * 包含 baseStoreID、conversationID 和 messageListType，用于实例缓存和传给 native
   * @param baseStoreID 基础 Store ID
   * @param conversationID 会话ID
   * @param messageListType 消息列表类型
   */
  private static generateInstanceId(conversationID: string, messageListType: MessageListType): string {
    return JSON.stringify({
      storeName: "MessageList",
      conversationID: conversationID,
      messageListType,
    });
  }

  /**
   * 获取实例（单例模式）
   * @param instanceId Store 实例ID，默认为基于会话ID和消息类型生成的标识
   * @param conversationID 会话ID，默认为空字符串
   * @param messageListType 消息列表类型，默认为 HISTORY
   */
  public static getInstance(
    conversationID: string = "",
    messageListType: MessageListType = MessageListType.HISTORY,
  ): MessageListState {
    const instanceId = MessageListState.generateInstanceId(conversationID, messageListType);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageListState(conversationID, messageListType));
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 绑定事件监听
   */
  private bindEvent(): void {
    // 监听消息列表变化
    addListener({
      type: "",
      store: "MessageList",
      name: "messageList",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
        messageListType: this.messageListType
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        const list = safeJsonParse(result.messageList, []);
        this.messageList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][messageList listener] Error:`, error)
      }
    })

    // 监听是否有更早的消息
    addListener({
      type: "",
      store: "MessageList",
      name: "hasMoreOlderMessage",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
        messageListType: this.messageListType
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasMoreOlderMessage !== undefined) {
          this.hasMoreOlderMessage.value = result.hasMoreOlderMessage
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasMoreOlderMessage listener] Error:`, error)
      }
    })

    // 监听是否有更新的消息
    addListener({
      type: "",
      store: "MessageList",
      name: "hasMoreNewerMessage",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
        messageListType: this.messageListType
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasMoreNewerMessage !== undefined) {
          this.hasMoreNewerMessage.value = result.hasMoreNewerMessage
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasMoreNewerMessage listener] Error:`, error)
      }
    })
  }

  /**
   * 拉取消息列表
   * @param option 消息拉取选项
   * @returns Promise<void>
   */
  fetchMessageList = async(option: MessageFetchOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'fetchMessageList',
        params: {
          createStoreParams: this.instanceId,
          option: JSON.stringify({
            message: option.message,
            direction: option.direction || MessageFetchDirection.OLDER,
            filterType: option.filterType || MessageFilterType.All,
            pageCount: option.pageCount || 20,
          })
        },
      }
      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve(result)
          } else {
            reject(new Error(result.message || 'fetchMessageList failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 拉取更多消息列表
   * @param direction 拉取方向
   * @returns Promise<void>
   */
  fetchMoreMessageList = (direction: MessageFetchDirection): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'fetchMoreMessageList',
        params: {
          createStoreParams: this.instanceId,
          direction: direction || MessageFetchDirection.OLDER,
        },
      }

      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve(result)
          } else {
            reject(new Error(result.message || 'fetchMoreMessageList failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 下载消息资源
   * @param message 消息对象
   * @param resourceType 资源类型
   * @returns Promise<void>
   */
  downloadMessageResource = async(
    message: MessageInfo,
    resourceType: MessageMediaFileType
  ): Promise<void> => {
    const msgID = message.msgID;
    const downloadKey = `${msgID}_${resourceType}`;
    
    if (downloadingMsgIDs.has(downloadKey)) {
      return Promise.resolve();
    }
    
    // Mark as downloading
    downloadingMsgIDs.add(downloadKey);
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'downloadMessageResource',
        params: {
          createStoreParams: this.instanceId,
          message: JSON.stringify(message),
          resourceType,
        },
      }

      callAPI(options, (data: string) => {
        downloadingMsgIDs.delete(downloadKey);
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'downloadMessageResource failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 发送消息已读回执
   * @param messageListParam 消息列表
   * @returns Promise<void>
   */
  sendMessageReadReceipts = async(messageListParam: MessageInfo[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'sendMessageReadReceipts',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
        },
      }

      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'sendMessageReadReceipts failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 拉取消息表情回应
   * @param messageListParam 消息列表
   * @param maxUserCountPerReaction 每个表情回应的最大用户数
   * @returns Promise<void>
   */
  fetchMessageReactions = async(
    messageListParam: MessageInfo[],
    maxUserCountPerReaction: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'fetchMessageReactions',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
          maxUserCountPerReaction,
        },
      }

      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'fetchMessageReactions failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 删除消息
   * @param messageListParam 消息列表
   * @returns Promise<void>
   */
  deleteMessages = async(messageListParam: MessageInfo[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'deleteMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
        },
      }

      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            // 从本地消息列表中删除
            const messageIDsToDelete = messageListParam.map((msg) => msg.msgID)
            this.messageList.value = this.messageList.value.filter(
              (msg: MessageInfo) => !messageIDsToDelete.includes(msg.msgID)
            )
            resolve()
          } else {
            reject(new Error(result.message || 'deleteMessages failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 转发消息
   * @param messageListParam 消息列表
   * @param forwardOption 转发选项
   * @param conversationIDList 会话ID列表
   * @returns Promise<void>
   */
  forwardMessages = async(
    messageListParam: MessageInfo[],
    forwardOption: MessageForwardOption,
    conversationIDList: string[]
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'forwardMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
          forwardOption,
          conversationIDList,
        },
      }

      callAPI(options, (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve()
          } else {
            reject(new Error(result.message || 'forwardMessages failed'))
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
    const dataNames = ["messageList", "hasMoreOlderMessage", "hasMoreNewerMessage"];

    dataNames.forEach(dataName => {
      removeListener({
        type: "",
        store: "MessageList",
        name: dataName,
        params: {
          createStoreParams: this.instanceId
        }
      });
    });
  }

  /**
   * 重置数据
   */
  private resetData(): void {
    this.messageList.value = [];
    this.hasMoreOlderMessage.value = true;
    this.hasMoreNewerMessage.value = false;
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
        conversationID: this.conversationID
      }
    };

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse(response, {}) as any;
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * useMessageListState 参数选项
 */
export interface UseMessageListStateOptions {
  /** 会话ID */
  conversationID?: string;
  /** 消息列表类型 */
  messageListType?: MessageListType;
  /** Store 实例ID */
  instanceId?: string;
}

/**
 * 导出消息列表状态管理 Hook
 * @param options 配置选项
 */
export function useMessageListState(options: UseMessageListStateOptions = {}) {
  const {
    conversationID = "",
    messageListType = MessageListType.HISTORY,
  } = options;
  
  return MessageListState.getInstance(conversationID, messageListType);
}

export {
  MessageListState,
  MessageFetchDirection,
  MessageMediaFileType,
  MessageListType,
}