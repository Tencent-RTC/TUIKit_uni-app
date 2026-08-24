/**
 * 消息列表状态管理 (Vue2 适配版)
 * @module MessageListState
 */
import { makeReactive } from "../utils/reactiveCompat";
import {
  MessageLoadDirection,
  MessageListType,
  MessageType,
} from '../types/message'
import type {
  MessageInfo,
  MessageLoadOption,
  ForwardMessageOption,
  CustomMessagePayload,
  MessageEvent,
} from '../types/message'

// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { safeJsonParse } from '../utils/utsUtils';
import { useLoginState } from './LoginState';
import { useContactState } from './ContactState';

declare const getApp: any;

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

class MessageListState {
  public readonly instanceId: string;
  private readonly conversationID: string;
  private readonly initialLoadOption?: MessageLoadOption;

  /** 消息列表 */
  public readonly messageList: { value: MessageInfo[] };

  /** 是否有更早的消息（新版字段） */
  public readonly hasOlderMessages: { value: boolean };

  /** 是否有更新的消息（新版字段） */
  public readonly hasNewerMessages: { value: boolean };

  /** Pinned 消息列表（新增） */
  public readonly pinnedMessageList: { value: MessageInfo[] };

  private peerUserInfo: { userID: string; avatarURL?: string; nickname?: string } | null = null;
  private messageEventHandlers: Set<(event: MessageEvent) => void> = new Set();

  private constructor(conversationID: string, initialLoadOption?: MessageLoadOption) {
    this.instanceId = MessageListState.generateInstanceId(conversationID);
    this.conversationID = conversationID;
    this.initialLoadOption = initialLoadOption;
    this.messageList = makeReactive({ value: [] });
    this.hasOlderMessages = makeReactive({ value: true });
    this.hasNewerMessages = makeReactive({ value: false });
    this.pinnedMessageList = makeReactive({ value: [] });

    this.createStore();
    this.fetchPeerUserInfo();
  }

  private static generateInstanceId(conversationID: string): string {
    return JSON.stringify({
      storeName: "MessageList",
      conversationID,
    });
  }

  /**
   * 获取指定会话的实例（按 conversationID 缓存）
   *
   * @param initialLoadOption 首次拉取选项，**仅实例首次创建时生效**（已存在则忽略）
   */
  public static getInstance(
    conversationID: string = "",
    initialLoadOption?: MessageLoadOption
  ): MessageListState {
    const instanceId = MessageListState.generateInstanceId(conversationID);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageListState(conversationID, initialLoadOption));
    }
    return InstanceMap.get(instanceId)!;
  }

  private async fetchPeerUserInfo(): Promise<void> {
    if (!this.conversationID.startsWith('c2c_')) return;
    const peerUserID = this.conversationID.replace('c2c_', '');
    try {
      const list = await getContactInfo([peerUserID]);
      if (list && list.length > 0) {
        const peer = list[0];
        this.peerUserInfo = {
          userID: peerUserID,
          avatarURL: peer.avatarURL,
          nickname: peer.nickname,
        };
      }
    } catch (e) {
      console.warn(`[${this.instanceId}][fetchPeerUserInfo] Failed:`, e);
      this.peerUserInfo = { userID: peerUserID };
    }
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
        if (result.code === 0) {
          this.bindEvent();
          if (this.conversationID) {
            this.loadMessages(this.initialLoadOption || { pageCount: 20 });
          }
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
      type: "", store: "MessageList", name: "messageList",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        const list = safeJsonParse(result.messageList, []) as MessageInfo[];
        this.messageList.value = this.handleC2CCallSignaling(list);
      } catch (error) {
        console.error(`[${this.instanceId}][messageList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "MessageList", name: "hasOlderMessages",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasOlderMessages !== undefined) {
          this.hasOlderMessages.value = Boolean(result.hasOlderMessages);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasOlderMessages listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "MessageList", name: "hasNewerMessages",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        if (result.hasNewerMessages !== undefined) {
          this.hasNewerMessages.value = Boolean(result.hasNewerMessages);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][hasNewerMessages listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "MessageList", name: "pinnedMessageList",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as any;
        const list = safeJsonParse<MessageInfo[]>(result.pinnedMessageList, []);
        if (Array.isArray(list)) this.pinnedMessageList.value = list;
      } catch (error) {
        console.error(`[${this.instanceId}][pinnedMessageList listener] Error:`, error);
      }
    });

    addListener({
      type: "", store: "MessageList", name: "messageEvent",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }, (data: string) => {
      try {
        const result = safeJsonParse(data, {}) as MessageEvent;
        this.messageEventHandlers.forEach(h => {
          try { h(result); } catch (e) { console.error('[MessageList][messageEvent handler] Error:', e); }
        });
      } catch (error) {
        console.error(`[${this.instanceId}][messageEvent listener] Error:`, error);
      }
    });
  }

  /**
   * 处理 C2C Callkit 消息翻转（使用新版字段 isSentBySelf / from / to）
   */
  private handleC2CCallSignaling(messageList: MessageInfo[]): MessageInfo[] {
    if (!this.conversationID.startsWith('c2c_')) return messageList;

    const loginUser = getLoginUserInfo();
    const myUserID = loginUser ? loginUser.userID : undefined;
    if (!myUserID) return messageList;

    const myUserInfo = {
      userID: myUserID,
      avatarURL: loginUser ? loginUser.avatarURL : undefined,
      nickname: loginUser ? loginUser.nickname : undefined,
    };

    const peerUserID = this.conversationID.replace('c2c_', '');
    const peerUserInfo = this.peerUserInfo || { userID: peerUserID };

    const result: MessageInfo[] = [];
    for (const message of messageList) {
      if (message.messageType !== MessageType.CUSTOM) {
        result.push(message);
        continue;
      }

      const payload = message.messagePayload as CustomMessagePayload | undefined;
      const customData = payload && payload.customData ? payload.customData : undefined;
      if (!customData) {
        result.push(message);
        continue;
      }

      try {
        const callSignaling = safeJsonParse<any>(customData.toString(), null);
        if (callSignaling && callSignaling.businessID !== 1) {
          result.push(message);
          continue;
        }

        const innerData = safeJsonParse<any>(callSignaling.data, null);
        const rawMessage = (message as any).rawMessage;
        const isExcludedFromUnreadCount = rawMessage
          ? (rawMessage._isExcludedFromUnreadCount != null ? rawMessage._isExcludedFromUnreadCount : rawMessage.isExcludedFromUnreadCount)
          : undefined;
        const isExcludedFromLastMessage = rawMessage
          ? (rawMessage._isExcludedFromLastMessage != null ? rawMessage._isExcludedFromLastMessage : rawMessage.isExcludedFromLastMessage)
          : undefined;
        const isDisplayInChat = !(isExcludedFromUnreadCount && isExcludedFromLastMessage);
        if (!isDisplayInChat) {
          result.push(message);
          continue;
        }

        if (innerData && innerData.data && innerData.data.consumed === true) {
          result.push(message);
          continue;
        }

        let inviter: string | undefined = (innerData && innerData.data && innerData.data.inviter) ? innerData.data.inviter.toString() : undefined;
        if ((innerData && innerData.line_busy === 'line_busy') || (innerData && innerData.data && innerData.data.message === 'lineBusy')) {
          inviter = (callSignaling && callSignaling.inviter) ? callSignaling.inviter.toString() : undefined;
        }
        if (!inviter) {
          result.push(message);
          continue;
        }

        const copiedMessage: MessageInfo = JSON.parse(JSON.stringify(message));

        if (inviter !== myUserID && copiedMessage.isSentBySelf) {
          copiedMessage.isSentBySelf = false;
          if (copiedMessage.to) {
            copiedMessage.from.userID = peerUserInfo.userID;
            copiedMessage.from.avatarURL = peerUserInfo.avatarURL;
            copiedMessage.from.nickname = peerUserInfo.nickname;
            copiedMessage.to = myUserInfo.userID;
          }
        } else if (inviter === myUserID && !copiedMessage.isSentBySelf) {
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

  // ==================== 新版 API ====================

  /**
   * 加载消息（替代旧 fetchMessageList）
   */
  loadMessages = async (option: MessageLoadOption = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      const opt: any = {
        direction: option.direction !== undefined ? option.direction : MessageLoadDirection.OLDER,
        pageCount: option.pageCount !== undefined ? option.pageCount : 20,
      };
      if (option.cursor !== undefined) opt.cursor = option.cursor;
      if (option.messageTypeList !== undefined) opt.messageTypeList = option.messageTypeList;
      if (option.messageListType !== undefined) opt.messageListType = option.messageListType;
      callAPI(JSON.stringify({
        api: 'loadMessages',
        params: {
          createStoreParams: this.instanceId,
          option: JSON.stringify(opt)
        },
      }), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'loadMessages failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /**
   * 加载更早的消息（替代旧 fetchMoreMessageList(OLDER)）
   */
  loadOlderMessages = (): Promise<void> => this.callSimpleApi('loadOlderMessages');

  /**
   * 加载更新的消息（替代旧 fetchMoreMessageList(NEWER)）
   */
  loadNewerMessages = (): Promise<void> => this.callSimpleApi('loadNewerMessages');

  /** 发送消息已读回执 */
  sendMessageReadReceipts = async (messageList: MessageInfo[]): Promise<void> =>
    this.callApiWithParams('sendMessageReadReceipts', { messageList: JSON.stringify(messageList) });

  /** 删除消息 */
  deleteMessages = async (messageList: MessageInfo[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: 'deleteMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: JSON.stringify(messageList),
        },
      }), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            const idsToDelete = messageList.map(m => m.msgID);
            this.messageList.value = this.messageList.value.filter(
              (m: MessageInfo) => idsToDelete.indexOf(m.msgID) === -1
            );
            resolve();
          } else {
            reject(new Error(result.message || 'deleteMessages failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /**
   * 转发消息（新版：单 conversationID；兼容数组循环）
   */
  forwardMessages = async (
    messageList: MessageInfo[],
    forwardOption: ForwardMessageOption,
    conversationID: string | string[]
  ): Promise<void> => {
    if (Array.isArray(conversationID)) {
      const results = await Promise.allSettled(
        conversationID.map(id => this.forwardToOne(messageList, forwardOption, id))
      );
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`[${this.instanceId}][forwardMessages] ${failures.length}/${results.length} failed`);
      }
      return;
    }
    return this.forwardToOne(messageList, forwardOption, conversationID);
  }

  private forwardToOne(
    messageList: MessageInfo[],
    forwardOption: ForwardMessageOption,
    conversationID: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: 'forwardMessages',
        params: {
          createStoreParams: this.instanceId,
          messageList: JSON.stringify(messageList),
          forwardOption: JSON.stringify(forwardOption),
          conversationID,
        },
      }), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'forwardMessages failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /** 注册流式消息事件订阅，返回 unsubscribe 函数 */
  messageListOnEvent = (handler: (event: MessageEvent) => void): (() => void) => {
    this.messageEventHandlers.add(handler);
    return () => {
      this.messageEventHandlers.delete(handler);
    };
  }

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
    ["messageList", "hasOlderMessages", "hasNewerMessages", "pinnedMessageList", "messageEvent"].forEach(name => {
      removeListener({
        type: "", store: "MessageList", name,
        params: { createStoreParams: this.instanceId }
      });
    });
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
    callAPI(JSON.stringify({
      api: "destroyStore",
      params: {
        createStoreParams: this.instanceId,
        conversationID: this.conversationID
      }
    }), (response: string) => {
      try {
        safeJsonParse(response, {});
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

export interface UseMessageListStateOptions {
  conversationID?: string;
  initialLoadOption?: MessageLoadOption;
}

export function useMessageListState(options: UseMessageListStateOptions = {}) {
  const { conversationID = "", initialLoadOption } = options;
  return MessageListState.getInstance(conversationID, initialLoadOption);
}

export {
  MessageListState,
  MessageLoadDirection,
  MessageListType,
}
