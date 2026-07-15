/**
 * 消息操作状态管理 (Vue2 适配版)
 * @module MessageActionState
 */
import { makeReactive } from "../utils/reactiveCompat";
import type { MessageInfo } from '../types/message'
import type { GroupMember } from '../types/group';
import { MediaQuality } from '../types/message';
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import { safeJsonParse } from '../utils/utsUtils';

declare const getApp: any;

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

class MessageActionState {
  public readonly instanceId: string;
  public readonly message: MessageInfo;

  /** 已读成员列表 */
  public readonly readMemberList: { value: GroupMember[] };
  public readonly hasMoreReadMembers: { value: boolean };

  /** 未读成员列表 */
  public readonly unreadMemberList: { value: GroupMember[] };
  public readonly hasMoreUnreadMembers: { value: boolean };

  /** 表情回应用户列表 */
  public readonly reactionUserList: { value: GroupMember[] };
  public readonly hasMoreReactionUsers: { value: boolean };

  private constructor(message: MessageInfo) {
    this.instanceId = MessageActionState.generateInstanceId(message);
    this.message = message;

    this.readMemberList = makeReactive({ value: [] });
    this.hasMoreReadMembers = makeReactive({ value: false });
    this.unreadMemberList = makeReactive({ value: [] });
    this.hasMoreUnreadMembers = makeReactive({ value: false });
    this.reactionUserList = makeReactive({ value: [] });
    this.hasMoreReactionUsers = makeReactive({ value: false });

    this.createStore();
  }

  private createStore() {
    callAPI(JSON.stringify({
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        message: JSON.stringify(this.message)
      }
    }), (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        if (result.code === 0) {
          this.bindEvent();
        } else {
          console.error(`[${this.instanceId}][createStore] Failed:`, result.message);
        }
      } catch (error) {
        console.error(`[${this.instanceId}][createStore] Parse error:`, error);
      }
    });
  }

  private static generateInstanceId(message: MessageInfo): string {
    return JSON.stringify({
      storeName: "MessageAction",
      message,
    });
  }

  public static getInstance(message: MessageInfo): MessageActionState {
    const instanceId = MessageActionState.generateInstanceId(message);
    if (!InstanceMap.has(instanceId)) {
      InstanceMap.set(instanceId, new MessageActionState(message));
    }
    return InstanceMap.get(instanceId)!;
  }

  private bindEvent(): void {
    const listeners: Array<{ name: string; key: string; transform?: (v: any) => any }> = [
      { name: 'readMemberList', key: 'readMemberList' },
      { name: 'hasMoreReadMembers', key: 'hasMoreReadMembers' },
      { name: 'unreadMemberList', key: 'unreadMemberList' },
      { name: 'hasMoreUnreadMembers', key: 'hasMoreUnreadMembers' },
      { name: 'reactionUserList', key: 'reactionUserList' },
      { name: 'hasMoreReactionUsers', key: 'hasMoreReactionUsers' },
    ];

    listeners.forEach(({ name }) => {
      addListener({
        type: "", store: "MessageAction", name,
        params: { createStoreParams: this.instanceId }
      }, (data: string) => {
        try {
          const result = safeJsonParse<any>(data, {});
          switch (name) {
            case 'readMemberList': {
              const list = safeJsonParse<GroupMember[]>(result.readMemberList, []);
              if (Array.isArray(list)) this.readMemberList.value = list;
              break;
            }
            case 'hasMoreReadMembers':
              this.hasMoreReadMembers.value = Boolean(result.hasMoreReadMembers);
              break;
            case 'unreadMemberList': {
              const list = safeJsonParse<GroupMember[]>(result.unreadMemberList, []);
              if (Array.isArray(list)) this.unreadMemberList.value = list;
              break;
            }
            case 'hasMoreUnreadMembers':
              this.hasMoreUnreadMembers.value = Boolean(result.hasMoreUnreadMembers);
              break;
            case 'reactionUserList': {
              const list = safeJsonParse<GroupMember[]>(result.reactionUserList, []);
              if (Array.isArray(list)) this.reactionUserList.value = list;
              break;
            }
            case 'hasMoreReactionUsers':
              this.hasMoreReactionUsers.value = Boolean(result.hasMoreReactionUsers);
              break;
          }
        } catch (error) {
          console.error(`[${this.instanceId}][${name} listener] Error:`, error);
        }
      });
    });
  }

  // ==================== 新版 API ====================

  /** 删除消息（替代旧 deleteMessage） */
  delete = (): Promise<void> => this.callSimpleApi('delete');

  /** 撤回消息（替代旧 recallMessage） */
  revoke = (): Promise<void> => this.callSimpleApi('revoke');

  /** Pin 消息 */
  pin = (isPinned: boolean): Promise<void> => this.callApiWithParams('pin', { isPinned });

  /** 加载已读成员 */
  loadReadMembers = (): Promise<void> => this.callSimpleApi('loadReadMembers');
  loadUnreadMembers = (): Promise<void> => this.callSimpleApi('loadUnreadMembers');
  loadMoreMembers = (): Promise<void> => this.callSimpleApi('loadMoreMembers');

  /** 添加表情回应 */
  addReaction = (reactionID: string): Promise<void> =>
    this.callApiWithParams('addReaction', { reactionID });

  /** 移除表情回应 */
  removeReaction = (reactionID: string): Promise<void> =>
    this.callApiWithParams('removeReaction', { reactionID });

  /** 加载表情回应用户 */
  loadReactionUsers = (reactionID: string): Promise<void> =>
    this.callApiWithParams('loadReactionUsers', { reactionID });

  loadMoreReactionUsers = (reactionID: string): Promise<void> =>
    this.callApiWithParams('loadMoreReactionUsers', { reactionID });

  /** 设置消息扩展 */
  setExtensions = (extensions: Record<string, string>): Promise<void> =>
    this.callApiWithParams('setExtensions', { extensions: JSON.stringify(extensions) });

  /** 删除消息扩展 */
  deleteExtensions = (keys: string[]): Promise<void> =>
    this.callApiWithParams('deleteExtensions', { keys: JSON.stringify(keys) });

  /** 翻译文本（对齐底层 translateText(sourceTextList, sourceLanguage, targetLanguage)） */
  translateText = (
    sourceTextList: string[],
    sourceLanguage: string | undefined,
    targetLanguage: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const params: any = { createStoreParams: this.instanceId, sourceTextList, targetLanguage };
      if (sourceLanguage !== undefined) params.sourceLanguage = sourceLanguage;
      callAPI(JSON.stringify({ api: 'translateText', params }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'translateText failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /** 下载媒体（替代旧 MessageList.downloadMessageResource） */
  downloadMedia = (quality?: MediaQuality): Promise<void> => {
    const params: any = {};
    if (quality !== undefined) params.quality = quality;
    return this.callApiWithParams('downloadMedia', params);
  }

  /** 下载合并消息列表 */
  downloadMergedMessageList = (): Promise<MessageInfo[]> => {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: 'downloadMergedMessageList',
        params: { createStoreParams: this.instanceId }
      }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            const list = (result.data && result.data.data && result.data.data.messageList) || [];
            resolve(list);
          } else {
            reject(new Error(result.message || 'downloadMergedMessageList failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /** 语音转文字 */
  convertVoiceToText = (language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: 'convertVoiceToText',
        params: { createStoreParams: this.instanceId, language }
      }), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            const err = new Error(result.message || 'convertVoiceToText failed') as Error & { code?: number };
            err.code = result.code;
            reject(err);
          }
        } catch (error) { reject(error); }
      });
    });
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
            reject(new Error(result.message || `${api} failed`));
          }
        } catch (error) { reject(error); }
      });
    });
  }

  private unbindEvent(): void {
    ["readMemberList", "hasMoreReadMembers", "unreadMemberList", "hasMoreUnreadMembers", "reactionUserList", "hasMoreReactionUsers"].forEach(name => {
      removeListener({
        type: "", store: "MessageAction", name,
        params: { createStoreParams: this.instanceId }
      });
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
      try {
        safeJsonParse(response, {});
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

export interface UseMessageActionStateOptions {
  message: MessageInfo;
}

export function useMessageActionState(options: UseMessageActionStateOptions) {
  const { message } = options;
  return MessageActionState.getInstance(message);
}

export { MessageActionState };
