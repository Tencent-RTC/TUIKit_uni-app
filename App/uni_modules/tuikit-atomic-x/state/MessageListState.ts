/**
 * 消息列表状态管理
 * @module MessageListState
 *
 * 对齐底层 atomicxcore.api.message.MessageListStore.kt（HybridAPI: MessageListAPI.kt）
 *
 * **本次升级关键调整：**
 * - `fetchMessageList` → `loadMessages`（参数 option 对齐 MessageLoadOption）
 * - `fetchMoreMessageList(direction)` → `loadOlderMessages` / `loadNewerMessages`（拆为两个 API）
 * - `forwardMessages(messages, option, conversationIDList[])` → `forwardMessages(messages, option, conversationID)`
 *   单个 ID；多会话需循环调用
 * - **删除** `downloadMessageResource`：迁到 MessageActionStore.downloadMedia
 * - **删除** `fetchMessageReactions`：迁到 MessageActionStore.loadReactionUsers
 * - listener 字段重命名：
 *   - `hasMoreOlderMessage` → `hasOlderMessages`
 *   - `hasMoreNewerMessage` → `hasNewerMessages`
 * - **新增** `pinnedMessageList` 字段订阅
 * - **新增** `messageEvent` 流式订阅（OnReceiveNewMessage 等）
 * - MessageInfo 字段重命名：`isSelf` → `isSentBySelf`，C2C Callkit 翻转逻辑同步调整
 */
import { ref, type Ref } from 'vue'
import {
  MessageLoadDirection,
  MessageListType,
  MessageType,
} from '../types/message'
import type {
  MessageInfo,
  MessageLoadOption,
  ForwardMessageOption,
  MessageEvent,
  CustomMessagePayload,
} from '../types/message'

import type { HybridCallOptions } from '../utssdk/interface.uts'
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from '../utils/utsUtils';
import { useLoginState } from './LoginState';
import { useContactState } from './ContactState';

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

const { getLoginUserInfo } = useLoginState();
const { getContactInfo } = useContactState('MessageListState');

/**
 * 消息列表状态管理类
 */
class MessageListState {
  public readonly instanceId: string;
  private readonly conversationID: string;

  /** 消息列表 */
  public readonly messageList: Ref<MessageInfo[]>;
  /** 是否有更早的消息（旧字段 hasMoreOlderMessage） */
  public readonly hasOlderMessages: Ref<boolean>;
  /** 是否有更新的消息（旧字段 hasMoreNewerMessage） */
  public readonly hasNewerMessages: Ref<boolean>;
  /** 置顶消息列表（**新增**） */
  public readonly pinnedMessageList: Ref<MessageInfo[]>;

  /** C2C 会话对方用户信息（用于 Callkit 消息翻转） */
  private peerUserInfo: { userID: string; avatarURL?: string; nickname?: string } | null = null;

  /** messageEvent 订阅者列表 */
  private messageEventHandlers: Set<(event: MessageEvent) => void> = new Set();

  private constructor(conversationID: string) {
    this.instanceId = MessageListState.generateInstanceId(conversationID);
    this.conversationID = conversationID;
    this.messageList = ref<MessageInfo[]>([]);
    this.hasOlderMessages = ref<boolean>(true);
    this.hasNewerMessages = ref<boolean>(false);
    this.pinnedMessageList = ref<MessageInfo[]>([]);

    this.createStore();
    this.fetchPeerUserInfo();
  }

  /**
   * 预先获取 C2C 会话对方用户信息
   */
  private async fetchPeerUserInfo(): Promise<void> {
    if (!this.conversationID.startsWith('c2c_')) {
      return;
    }

    const peerUserID = this.conversationID.replace('c2c_', '');

    try {
      const userInfoList = await getContactInfo([peerUserID]);
      if (userInfoList && userInfoList.length > 0) {
        const peerInfo = userInfoList[0];
        this.peerUserInfo = {
          userID: peerUserID,
          avatarURL: peerInfo.avatarURL,
          nickname: peerInfo.nickname,
        };
      }
    } catch (e) {
      console.warn(`[${this.instanceId}][fetchPeerUserInfo] Failed:`, e);
      this.peerUserInfo = { userID: peerUserID };
    }
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
        if (result.code === 0) {
          this.bindEvent();
          if (this.conversationID) {
            this.loadMessages({ pageCount: 20 });
          }
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private static generateInstanceId(conversationID: string): string {
    return JSON.stringify({
      storeName: "MessageList",
      conversationID,
    });
  }

  public static getInstance(conversationID: string = ""): MessageListState {
    const instanceId = MessageListState.generateInstanceId(conversationID);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageListState(conversationID));
    }
    return InstanceMap.get(instanceId)!;
  }

  /**
   * 绑定事件监听
   */
  private bindEvent(): void {
    // messageList
    addListener({
      type: "",
      store: "MessageList",
      name: "messageList",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        const list = safeJsonParse(result.messageList, []) as MessageInfo[];
        this.messageList.value = this.handleC2CCallSignaling(list);
      } catch (error) {
        console.error(`[${this.instanceId}][messageList listener] Error:`, error);
      }
    });

    // hasOlderMessages（旧名 hasMoreOlderMessage）
    addListener({
      type: "",
      store: "MessageList",
      name: "hasOlderMessages",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasOlderMessages !== undefined) {
          this.hasOlderMessages.value = result.hasOlderMessages;
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasOlderMessages listener] Error:`, error);
      }
    });

    // hasNewerMessages（旧名 hasMoreNewerMessage）
    addListener({
      type: "",
      store: "MessageList",
      name: "hasNewerMessages",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasNewerMessages !== undefined) {
          this.hasNewerMessages.value = result.hasNewerMessages;
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasNewerMessages listener] Error:`, error);
      }
    });

    // pinnedMessageList（新增）
    addListener({
      type: "",
      store: "MessageList",
      name: "pinnedMessageList",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        const list = safeJsonParse<MessageInfo[]>(result.pinnedMessageList, []);
        this.pinnedMessageList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][pinnedMessageList listener] Error:`, error);
      }
    });

    // messageEvent（流式事件）
    addListener({
      type: "",
      store: "MessageList",
      name: "messageEvent",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID,
      },
    }, (data: string) => {
      try {
        const result = safeJsonParse<any>(data, {});
        const event: MessageEvent = {
          eventType: result.eventType,
          data: typeof result.data === 'string' ? safeJsonParse(result.data, {}) : (result.data || {}),
        } as MessageEvent;
        this.messageEventHandlers.forEach((h) => {
          try { h(event); } catch (e) { console.error('[messageEvent handler] Error:', e); }
        });
      } catch (error) {
        console.error(`[${this.instanceId}][messageEvent listener] Error:`, error);
      }
    });
  }

  /**
   * C2C Callkit 消息翻转
   *
   * 注：MessageInfo 字段已升级为 `from / to / isSentBySelf`（旧 `sender / receiver / isSelf`）
   */
  private handleC2CCallSignaling(messageList: MessageInfo[]): MessageInfo[] {
    if (!this.conversationID.startsWith('c2c_')) {
      return messageList;
    }

    const loginUser = getLoginUserInfo();
    const myUserID = loginUser?.userID;

    if (!myUserID) {
      return messageList;
    }

    const myUserInfo = {
      userID: myUserID,
      avatarURL: loginUser?.avatarURL,
      nickname: loginUser?.nickname,
    };

    const peerUserID = this.conversationID.replace('c2c_', '');
    const peerUserInfo = this.peerUserInfo || { userID: peerUserID };

    const result: MessageInfo[] = [];

    for (const message of messageList) {
      if (message.messageType !== MessageType.CUSTOM) {
        result.push(message);
        continue;
      }

      const customPayload = message.messagePayload as CustomMessagePayload | undefined;
      const customData = customPayload?.customData;
      if (!customData) {
        result.push(message);
        continue;
      }

      try {
        const callSignaling = safeJsonParse<any>(customData.toString(), null);

        if (callSignaling?.businessID !== 1) {
          result.push(message);
          continue;
        }

        const innerData = safeJsonParse<any>(callSignaling.data, null);

        const rawMessage = message.rawMessage;
        const isExcludedFromUnreadCount = rawMessage?._isExcludedFromUnreadCount ?? rawMessage?.isExcludedFromUnreadCount;
        const isExcludedFromLastMessage = rawMessage?._isExcludedFromLastMessage ?? rawMessage?.isExcludedFromLastMessage;
        const isDisplayInChat = !(isExcludedFromUnreadCount && isExcludedFromLastMessage);

        if (!isDisplayInChat) {
          result.push(message);
          continue;
        }

        if (innerData?.data?.consumed === true) {
          result.push(message);
          continue;
        }

        let inviter: string | undefined = innerData?.data?.inviter?.toString();
        if (innerData?.line_busy === 'line_busy' || innerData?.data?.message === 'lineBusy') {
          inviter = callSignaling.inviter?.toString();
        }

        if (!inviter) {
          result.push(message);
          continue;
        }

        const copiedMessage: MessageInfo = JSON.parse(JSON.stringify(message));

        // 消息翻转逻辑（基于新字段名 isSentBySelf / from / to）
        if (inviter !== myUserID && copiedMessage.isSentBySelf) {
          // 当前用户不是发起者，消息应该显示为对方发送（来电）
          copiedMessage.isSentBySelf = false;
          if (copiedMessage.to) {
            copiedMessage.from.userID = peerUserInfo.userID;
            copiedMessage.from.avatarURL = peerUserInfo.avatarURL;
            copiedMessage.from.nickname = peerUserInfo.nickname;
            copiedMessage.to = myUserInfo.userID;
          }
        } else if (inviter === myUserID && !copiedMessage.isSentBySelf) {
          // 当前用户是发起者，消息应该显示为自己发送（呼出）
          copiedMessage.isSentBySelf = true;
          if (copiedMessage.to) {
            copiedMessage.from.userID = myUserInfo.userID;
            copiedMessage.from.avatarURL = myUserInfo.avatarURL;
            copiedMessage.from.nickname = myUserInfo.nickname;
            copiedMessage.to = peerUserInfo.userID;
          }
        }

        result.push(copiedMessage);
      } catch (e) {
        result.push(message);
      }
    }

    return result;
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 拉取消息列表（旧名 fetchMessageList）
   *
   * @param option MessageLoadOption（含 cursor / direction / pageCount / messageTypeList）
   */
  loadMessages = async (option: MessageLoadOption = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      const finalOption: any = {
        messageListType: option.messageListType ?? MessageListType.HISTORY,
        direction: option.direction ?? MessageLoadDirection.OLDER,
        pageCount: option.pageCount ?? 20,
      };
      if (option.cursor) finalOption.cursor = option.cursor;
      if (option.messageTypeList) finalOption.messageTypeList = option.messageTypeList;

      const options: HybridCallOptions = {
        api: 'loadMessages',
        params: {
          createStoreParams: this.instanceId,
          option: JSON.stringify(finalOption),
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve(result);
          } else {
            reject(new Error(result.message || 'loadMessages failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 加载更早消息（拆分自 fetchMoreMessageList(OLDER)）
   */
  loadOlderMessages = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadOlderMessages',
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve(result);
          } else {
            reject(new Error(result.message || 'loadOlderMessages failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 加载更新消息（拆分自 fetchMoreMessageList(NEWER)）
   */
  loadNewerMessages = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadNewerMessages',
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve(result);
          } else {
            reject(new Error(result.message || 'loadNewerMessages failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 发送消息已读回执
   */
  sendMessageReadReceipts = async (messageListParam: MessageInfo[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'sendMessageReadReceipts',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'sendMessageReadReceipts failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 删除消息（批量；底层 MessageListStore.deleteMessages）
   */
  deleteMessages = async (messageListParam: MessageInfo[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'deleteMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            const messageIDsToDelete = messageListParam.map((msg) => msg.msgID);
            this.messageList.value = this.messageList.value.filter(
              (msg: MessageInfo) => !messageIDsToDelete.includes(msg.msgID)
            );
            resolve();
          } else {
            reject(new Error(result.message || 'deleteMessages failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 转发消息
   *
   * **本次升级关键变化**：参数 `conversationIDList: string[]` → `conversationID: string`（**单个**）；
   * 多会话需循环调用
   *
   * @param messageListParam 待转发消息列表
   * @param forwardOption 转发选项
   * @param conversationIDOrList 目标会话 ID（兼容传数组：自动循环调用）
   */
  forwardMessages = async (
    messageListParam: MessageInfo[],
    forwardOption: ForwardMessageOption,
    conversationIDOrList: string | string[]
  ): Promise<void> => {
    // 兼容数组：循环调用
    if (Array.isArray(conversationIDOrList)) {
      const results = await Promise.allSettled(
        conversationIDOrList.map((cid) => this.forwardMessages(messageListParam, forwardOption, cid))
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`[forwardMessages] ${failed.length}/${results.length} failed`);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'forwardMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: messageListParam,
          option: JSON.stringify(forwardOption),
          conversationID: conversationIDOrList,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'forwardMessages failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 订阅消息事件流（OnReceiveNewMessage 等）
   *
   * @returns 取消订阅函数
   */
  onMessageEvent = (handler: (event: MessageEvent) => void): (() => void) => {
    this.messageEventHandlers.add(handler);
    return () => {
      this.messageEventHandlers.delete(handler);
    };
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  private unbindEvent(): void {
    const dataNames = ["messageList", "hasOlderMessages", "hasNewerMessages", "pinnedMessageList", "messageEvent"];

    dataNames.forEach((dataName) => {
      removeListener({
        type: "",
        store: "MessageList",
        name: dataName,
        params: {
          createStoreParams: this.instanceId,
        },
      });
    });
    this.messageEventHandlers.clear();
  }

  private resetData(): void {
    this.messageList.value = [];
    this.hasOlderMessages.value = true;
    this.hasNewerMessages.value = false;
    this.pinnedMessageList.value = [];
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
        conversationID: this.conversationID,
      },
    };

    callAPI(JSON.stringify(options), () => {});
  };
}

/**
 * useMessageListState 参数选项
 */
export interface UseMessageListStateOptions {
  conversationID?: string;
}

export function useMessageListState(options: UseMessageListStateOptions = {}) {
  const { conversationID = "" } = options;

  return MessageListState.getInstance(conversationID);
}

export {
  MessageListState,
  MessageLoadDirection,
  MessageListType,
};
