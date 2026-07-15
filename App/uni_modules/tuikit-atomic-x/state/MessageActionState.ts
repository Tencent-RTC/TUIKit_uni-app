/**
 * 消息操作状态管理
 * @module MessageActionState
 *
 * 对齐底层 atomicxcore.api.message.MessageActionStore.kt（HybridAPI: MessageActionAPI.kt）
 *
 * **本次升级关键调整：**
 * - `deleteMessage` → `delete`
 * - `recallMessage` → `revoke`
 * - **大量新增 API**：pin / loadReadMembers / loadUnreadMembers / loadMoreMembers /
 *   addReaction / removeReaction / loadReactionUsers / loadMoreReactionUsers /
 *   setExtensions / deleteExtensions / translateText / downloadMedia / downloadMergedMessageList
 * - **新增订阅字段**：readMemberList / hasMoreReadMembers / unreadMemberList /
 *   hasMoreUnreadMembers / reactionUserList / hasMoreReactionUsers
 * - createStore 必传 `message: MessageInfo` 参数
 */
import { ref, type Ref } from 'vue'
import type {
  MessageInfo,
  MessageExtension,
  MediaQuality as MediaQualityType,
} from '../types/message'
import { MediaQuality } from '../types/message'
import type { GroupMember } from '../types/group'
import type { UserProfile } from '../types/userProfile'
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
  public readonly instanceId: string;
  public readonly message: MessageInfo;

  /** 已读成员列表（**新增**） */
  public readonly readMemberList: Ref<GroupMember[]>;
  /** 是否有更多已读成员 */
  public readonly hasMoreReadMembers: Ref<boolean>;
  /** 未读成员列表 */
  public readonly unreadMemberList: Ref<GroupMember[]>;
  /** 是否有更多未读成员 */
  public readonly hasMoreUnreadMembers: Ref<boolean>;
  /** 表情回应用户列表 */
  public readonly reactionUserList: Ref<UserProfile[]>;
  /** 是否有更多表情回应用户 */
  public readonly hasMoreReactionUsers: Ref<boolean>;

  private constructor(message: MessageInfo) {
    this.instanceId = MessageActionState.generateInstanceId(message);
    this.message = message;

    this.readMemberList = ref<GroupMember[]>([]);
    this.hasMoreReadMembers = ref<boolean>(false);
    this.unreadMemberList = ref<GroupMember[]>([]);
    this.hasMoreUnreadMembers = ref<boolean>(false);
    this.reactionUserList = ref<UserProfile[]>([]);
    this.hasMoreReactionUsers = ref<boolean>(false);

    this.createStore();
  }

  private createStore() {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
        message: JSON.stringify(this.message),
      },
    };

    callAPI(JSON.stringify(options), (response: string) => {
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

  /**
   * 绑定事件监听（订阅 6 个新字段）
   */
  private bindEvent(): void {
    const storeName = "MessageAction";

    const dataHandlers: Record<string, (result: any) => void> = {
      readMemberList: (r) => {
        this.readMemberList.value = safeJsonParse<GroupMember[]>(r.readMemberList, []);
      },
      hasMoreReadMembers: (r) => {
        this.hasMoreReadMembers.value = Boolean(r.hasMoreReadMembers);
      },
      unreadMemberList: (r) => {
        this.unreadMemberList.value = safeJsonParse<GroupMember[]>(r.unreadMemberList, []);
      },
      hasMoreUnreadMembers: (r) => {
        this.hasMoreUnreadMembers.value = Boolean(r.hasMoreUnreadMembers);
      },
      reactionUserList: (r) => {
        this.reactionUserList.value = safeJsonParse<UserProfile[]>(r.reactionUserList, []);
      },
      hasMoreReactionUsers: (r) => {
        this.hasMoreReactionUsers.value = Boolean(r.hasMoreReactionUsers);
      },
    };

    Object.keys(dataHandlers).forEach((dataName) => {
      addListener({
        type: "",
        store: storeName,
        name: dataName,
        params: { createStoreParams: this.instanceId },
      }, (data: string) => {
        try {
          const result = safeJsonParse<any>(data, {});
          dataHandlers[dataName]?.(result);
        } catch (error) {
          console.error(`[${this.instanceId}][${dataName} listener] Error:`, error);
        }
      });
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 撤回消息（旧名 recallMessage）
   */
  revoke = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'revoke',
        params: {
          createStoreParams: this.instanceId,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'revoke failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 删除消息（单条；旧名 deleteMessage）
   */
  delete = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'delete',
        params: {
          createStoreParams: this.instanceId,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'delete failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 置顶/取消置顶消息（**新增**）
   */
  pin = async (isPinned: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'pin',
        params: {
          createStoreParams: this.instanceId,
          isPinned,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            reject(new Error(result.message || 'pin failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 加载已读成员列表（**新增**）
   */
  loadReadMembers = async (count: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadReadMembers',
        params: {
          createStoreParams: this.instanceId,
          count,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'loadReadMembers failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 加载未读成员列表（**新增**）
   */
  loadUnreadMembers = async (count: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadUnreadMembers',
        params: {
          createStoreParams: this.instanceId,
          count,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'loadUnreadMembers failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 加载更多成员（已读/未读，由 isRead 切换；**新增**）
   */
  loadMoreMembers = async (isRead: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadMoreMembers',
        params: {
          createStoreParams: this.instanceId,
          isRead,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'loadMoreMembers failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 添加表情回应（**新增**；从 MessageList 迁入）
   */
  addReaction = async (reactionID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'addReaction',
        params: {
          createStoreParams: this.instanceId,
          reactionID,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'addReaction failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 移除表情回应（**新增**）
   */
  removeReaction = async (reactionID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'removeReaction',
        params: {
          createStoreParams: this.instanceId,
          reactionID,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'removeReaction failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 加载表情回应用户列表（**新增**）
   */
  loadReactionUsers = async (reactionID: string, count: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadReactionUsers',
        params: {
          createStoreParams: this.instanceId,
          reactionID,
          count,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'loadReactionUsers failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 加载更多表情回应用户（**新增**）
   */
  loadMoreReactionUsers = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'loadMoreReactionUsers',
        params: {
          createStoreParams: this.instanceId,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'loadMoreReactionUsers failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 设置消息扩展（**新增**）
   */
  setExtensions = async (extensions: MessageExtension[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'setExtensions',
        params: {
          createStoreParams: this.instanceId,
          extensions: JSON.stringify(extensions),
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'setExtensions failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 删除消息扩展（**新增**）
   */
  deleteExtensions = async (keys?: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'deleteExtensions',
        params: {
          createStoreParams: this.instanceId,
          keys,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'deleteExtensions failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 翻译文本（**新增**）
   *
   * 对齐底层 `MessageActionStore.translateText(sourceTextList, sourceLanguage, targetLanguage)`
   */
  translateText = async (
    sourceTextList: string[],
    sourceLanguage: string | undefined,
    targetLanguage: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'translateText',
        params: {
          createStoreParams: this.instanceId,
          sourceTextList,
          sourceLanguage,
          targetLanguage,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'translateText failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 语音转文字（参数不变）
   */
  convertVoiceToText = async (language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'convertVoiceToText',
        params: {
          createStoreParams: this.instanceId,
          language,
        },
      };

      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            resolve();
          } else {
            const err = new Error(result.message || 'convertVoiceToText failed') as Error & { code?: number };
            err.code = result.code;
            reject(err);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 下载媒体资源（**新增**；从 MessageListStore.downloadMessageResource 迁入）
   *
   * @param quality 下载画质（仅图片消息有意义；视频/音频/文件忽略此参数）
   */
  downloadMedia = async (quality?: MediaQualityType): Promise<void> => {
    return new Promise((resolve, reject) => {
      const params: any = { createStoreParams: this.instanceId };
      if (quality !== undefined) params.quality = quality;

      const options: HybridCallOptions = {
        api: 'downloadMedia',
        params,
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) resolve();
          else reject(new Error(result.message || 'downloadMedia failed'));
        } catch (error) { reject(error); }
      });
    });
  };

  /**
   * 下载合并转发消息列表（**新增**）
   */
  downloadMergedMessageList = async (): Promise<MessageInfo[]> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: 'downloadMergedMessageList',
        params: {
          createStoreParams: this.instanceId,
        },
      };
      callAPI(JSON.stringify(options), (data: string) => {
        try {
          const result = safeJsonParse(data, {}) as any;
          if (result.code === 0) {
            const list = safeJsonParse<MessageInfo[]>(result.data?.data?.messageList, []);
            resolve(list);
          } else {
            reject(new Error(result.message || 'downloadMergedMessageList failed'));
          }
        } catch (error) { reject(error); }
      });
    });
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  private unbindEvent(): void {
    const dataNames = [
      "readMemberList",
      "hasMoreReadMembers",
      "unreadMemberList",
      "hasMoreUnreadMembers",
      "reactionUserList",
      "hasMoreReactionUsers",
    ];

    dataNames.forEach((name) => {
      removeListener({
        type: "",
        store: "MessageAction",
        name,
        params: { createStoreParams: this.instanceId },
      });
    });
  }

  private resetData(): void {
    this.readMemberList.value = [];
    this.hasMoreReadMembers.value = false;
    this.unreadMemberList.value = [];
    this.hasMoreUnreadMembers.value = false;
    this.reactionUserList.value = [];
    this.hasMoreReactionUsers.value = false;
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
      },
    };

    callAPI(JSON.stringify(options), () => {});
  };
}

/**
 * useMessageActionState 参数选项
 */
export interface UseMessageActionStateOptions {
  message: MessageInfo;
}

export function useMessageActionState(options: UseMessageActionStateOptions) {
  const { message } = options;
  return MessageActionState.getInstance(message);
}

export {
  MessageActionState,
  MediaQuality,
};
