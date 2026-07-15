/**
 * 搜索状态管理 (Vue2 适配版)
 * @module SearchState
 */
import { makeReactive } from "../utils/reactiveCompat";
// @ts-ignore
import { safeJsonParse } from "../utils/utsUtils";
// @ts-ignore
import { callAPI, addListener, removeListener } from "../utils/tuikitBridge";
import {
  KeywordListMatchMode,
  SearchType,
} from "../types/search";
import type {
  SearchOption,
  FriendSearchInfo,
  GroupSearchInfo,
  MessageSearchResultItem,
} from "../types/search";
import type { GroupMember } from "../types/group";
import type { UserProfile } from "../types/userProfile";

declare const getApp: any;

function getGlobalInstanceMap(): Map<string, SearchState> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__SEARCH_STATE_INSTANCES__) {
        app.globalData.__SEARCH_STATE_INSTANCES__ = new Map<string, SearchState>();
      }
      return app.globalData.__SEARCH_STATE_INSTANCES__;
    }
  } catch (e) {
    console.warn('[SearchState] getApp() not available:', e);
  }
  return new Map<string, SearchState>();
}

const InstanceMap = getGlobalInstanceMap();

class SearchState {
  private static readonly STORE_NAME = "Search";

  /** 新版 listener 名（hasMore* 改简单复数形式） */
  private static readonly BINDABLE_DATA_NAMES = [
    "userList",
    "userTotalCount",
    "hasMoreUsers",
    "friendList",
    "friendTotalCount",
    "hasMoreFriends",
    "groupList",
    "groupTotalCount",
    "hasMoreGroups",
    "groupMemberList",
    "groupMemberTotalCount",
    "hasMoreGroupMembers",
    "messageResults",
    "messageResultTotalCount",
    "hasMoreMessageResults"
  ];

  public readonly instanceId: string;

  // 用户（陌生人 / 全量 IM 账号）
  public readonly userList: { value: UserProfile[] };
  public readonly userTotalCount: { value: number };
  public readonly hasMoreUsers: { value: boolean };

  // 好友
  public readonly friendList: { value: FriendSearchInfo[] };
  public readonly friendTotalCount: { value: number };
  public readonly hasMoreFriends: { value: boolean };

  // 群组
  public readonly groupList: { value: GroupSearchInfo[] };
  public readonly groupTotalCount: { value: number };
  public readonly hasMoreGroups: { value: boolean };

  // 群成员
  public readonly groupMemberList: { value: Record<string, GroupMember[]> };
  public readonly groupMemberTotalCount: { value: number };
  public readonly hasMoreGroupMembers: { value: boolean };

  // 消息
  public readonly messageResults: { value: MessageSearchResultItem[] };
  public readonly messageResultTotalCount: { value: number };
  public readonly hasMoreMessageResults: { value: boolean };

  private constructor(instanceId: string = "default_search_store") {
    this.instanceId = SearchState.generateInstanceId(instanceId);

    this.userList = makeReactive({ value: [] });
    this.userTotalCount = makeReactive({ value: 0 });
    this.hasMoreUsers = makeReactive({ value: false });

    this.friendList = makeReactive({ value: [] });
    this.friendTotalCount = makeReactive({ value: 0 });
    this.hasMoreFriends = makeReactive({ value: false });

    this.groupList = makeReactive({ value: [] });
    this.groupTotalCount = makeReactive({ value: 0 });
    this.hasMoreGroups = makeReactive({ value: false });

    this.groupMemberList = makeReactive({ value: {} as Record<string, GroupMember[]> });
    this.groupMemberTotalCount = makeReactive({ value: 0 });
    this.hasMoreGroupMembers = makeReactive({ value: false });

    this.messageResults = makeReactive({ value: [] });
    this.messageResultTotalCount = makeReactive({ value: 0 });
    this.hasMoreMessageResults = makeReactive({ value: false });

    this.createStore();
  }

  private static generateInstanceId(baseInstanceId: string): string {
    return JSON.stringify({
      storeName: SearchState.STORE_NAME,
      instanceId: baseInstanceId
    });
  }

  private createStore(): void {
    callAPI(JSON.stringify({
      api: "createStore",
      params: { createStoreParams: this.instanceId }
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

  public static getInstance(instanceId: string = "default_search_store"): SearchState {
    const fullInstanceId = SearchState.generateInstanceId(instanceId);
    if (!InstanceMap.has(fullInstanceId)) {
      InstanceMap.set(fullInstanceId, new SearchState(instanceId));
    }
    return InstanceMap.get(fullInstanceId)!;
  }

  private bindEvent(): void {
    const handlers: Record<string, (r: any) => void> = {
      userList: (r) => { this.userList.value = safeJsonParse<UserProfile[]>(r.userList, []); },
      userTotalCount: (r) => { this.userTotalCount.value = Number(r.userTotalCount || 0); },
      hasMoreUsers: (r) => { this.hasMoreUsers.value = Boolean(r.hasMoreUsers); },
      friendList: (r) => { this.friendList.value = safeJsonParse<FriendSearchInfo[]>(r.friendList, []); },
      friendTotalCount: (r) => { this.friendTotalCount.value = Number(r.friendTotalCount || 0); },
      hasMoreFriends: (r) => { this.hasMoreFriends.value = Boolean(r.hasMoreFriends); },
      groupList: (r) => { this.groupList.value = safeJsonParse<GroupSearchInfo[]>(r.groupList, []); },
      groupTotalCount: (r) => { this.groupTotalCount.value = Number(r.groupTotalCount || 0); },
      hasMoreGroups: (r) => { this.hasMoreGroups.value = Boolean(r.hasMoreGroups); },
      groupMemberList: (r) => { this.groupMemberList.value = safeJsonParse<Record<string, GroupMember[]>>(r.groupMemberList, {}); },
      groupMemberTotalCount: (r) => { this.groupMemberTotalCount.value = Number(r.groupMemberTotalCount || 0); },
      hasMoreGroupMembers: (r) => { this.hasMoreGroupMembers.value = Boolean(r.hasMoreGroupMembers); },
      messageResults: (r) => { this.messageResults.value = safeJsonParse<MessageSearchResultItem[]>(r.messageResults, []); },
      messageResultTotalCount: (r) => { this.messageResultTotalCount.value = Number(r.messageResultTotalCount || 0); },
      hasMoreMessageResults: (r) => { this.hasMoreMessageResults.value = Boolean(r.hasMoreMessageResults); },
    };

    SearchState.BINDABLE_DATA_NAMES.forEach(dataName => {
      addListener({
        type: "", store: SearchState.STORE_NAME, name: dataName,
        params: { createStoreParams: this.instanceId }
      }, (data: string) => {
        try {
          const result = safeJsonParse<any>(data, {});
          const handler = handlers[dataName];
          if (handler) handler(result);
        } catch (error) {
          console.error(`[${this.instanceId}][${dataName} listener] Error:`, error);
        }
      });
    });
  }

  /**
   * 搜索（新版字段：keywordListMatchMode / searchScope / pageSize）
   */
  search = async (keywordList: string[], option?: SearchOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 兼容旧字段：keywordListMatchType -> keywordListMatchMode；searchType -> searchScope；searchCount -> pageSize
      const opt: any = option ? (option as any) : {};
      const matchMode = (opt.keywordListMatchMode !== undefined) ? opt.keywordListMatchMode
        : (opt.keywordListMatchType !== undefined) ? opt.keywordListMatchType
          : KeywordListMatchMode.OR;
      const pageSize = (opt.pageSize !== undefined) ? opt.pageSize
        : (opt.searchCount !== undefined) ? opt.searchCount
          : 20;
      let scope: SearchType[];
      if (Array.isArray(opt.searchScope)) {
        scope = opt.searchScope;
      } else if (opt.searchType !== undefined) {
        scope = [opt.searchType];
      } else {
        scope = [SearchType.FRIEND, SearchType.GROUP, SearchType.GROUP_MEMBER, SearchType.MESSAGE];
      }

      const searchOption: any = {
        keywordListMatchMode: matchMode,
        searchScope: scope,
        pageSize,
      };
      if (opt.userFilter) searchOption.userFilter = opt.userFilter;
      if (opt.groupMemberFilter) searchOption.groupMemberFilter = opt.groupMemberFilter;
      if (opt.messageFilter) searchOption.messageFilter = opt.messageFilter;

      callAPI(JSON.stringify({
        api: "search",
        params: {
          createStoreParams: this.instanceId,
          keywordList: JSON.stringify(keywordList),
          option: JSON.stringify(searchOption)
        }
      }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][search] Failed:`, result.message);
            const err = new Error(result.message || 'Failed to search') as Error & { code?: number };
            err.code = result.code;
            reject(err);
          }
        } catch (error) { reject(error); }
      });
    });
  }

  /** 加载更多搜索结果（按 SearchType） */
  searchMore = async (searchType: SearchType): Promise<void> => {
    return new Promise((resolve, reject) => {
      callAPI(JSON.stringify({
        api: "searchMore",
        params: {
          createStoreParams: this.instanceId,
          searchType,
        }
      }), (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][searchMore] Failed:`, result.message);
            const err = new Error(result.message || 'Failed to search more') as Error & { code?: number };
            err.code = result.code;
            reject(err);
          }
        } catch (error) { reject(error); }
      });
    });
  }

  clearSearchResults = (): void => {
    this.userList.value = [];
    this.userTotalCount.value = 0;
    this.hasMoreUsers.value = false;

    this.friendList.value = [];
    this.friendTotalCount.value = 0;
    this.hasMoreFriends.value = false;

    this.groupList.value = [];
    this.groupTotalCount.value = 0;
    this.hasMoreGroups.value = false;

    this.groupMemberList.value = {};
    this.groupMemberTotalCount.value = 0;
    this.hasMoreGroupMembers.value = false;

    this.messageResults.value = [];
    this.messageResultTotalCount.value = 0;
    this.hasMoreMessageResults.value = false;
  }

  private unbindEvent(): void {
    SearchState.BINDABLE_DATA_NAMES.forEach(dataName => {
      removeListener({
        type: "", store: SearchState.STORE_NAME, name: dataName,
        params: { createStoreParams: this.instanceId }
      });
    });
  }

  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.clearSearchResults();
    InstanceMap.delete(this.instanceId);
    callAPI(JSON.stringify({
      api: "destroyStore",
      params: { createStoreParams: this.instanceId }
    }), (response: string) => {
      try { safeJsonParse<any>(response, {}); } catch (e) { console.error(e); }
    });
  }
}

export interface UseSearchStateOptions {
  instanceId?: string;
}

export function useSearchState(instanceId: string = "default_search_store") {
  return SearchState.getInstance(instanceId);
}

export { SearchState, SearchType, KeywordListMatchMode };
export default useSearchState;
