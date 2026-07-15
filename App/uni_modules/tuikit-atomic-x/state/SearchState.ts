/**
 * 搜索状态管理
 * @module SearchState
 *
 * 对齐底层 atomicxcore.api.search.SearchStore.kt（HybridAPI: SearchAPI.kt）
 *
 * **本次升级关键调整：**
 * - `SearchOption` 字段重命名：
 *   - `keywordListMatchType` → `keywordListMatchMode`
 *   - `searchType: SearchType（位掩码）` → `searchScope: SearchType[]`
 *   - `searchCount` → `pageSize`
 *   - `isCloudSearch` 删除（底层已移除）
 * - `SearchType` 从位掩码 class 改为 4 值整数枚举（FRIEND=0 / GROUP=1 / GROUP_MEMBER=2 / MESSAGE=3）
 * - listener 字段重命名（对齐 SearchDispatcher）：
 *   - `hasMoreFriendList` → `hasMoreFriends`
 *   - `hasMoreGroupList` → `hasMoreGroups`
 *   - `hasMoreGroupMemberList` → `hasMoreGroupMembers`
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import {
  KeywordListMatchMode,
  SearchType,
  type SearchOption,
  type FriendSearchInfo,
  type MessageSearchResultItem,
} from "../types/search";
import type { GroupSearchInfo, GroupMember } from "../types/group";
import type { UserProfile } from "../types/userProfile";

// ==================== 全局实例管理 ====================

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

// ==================== 搜索状态管理类 ====================

class SearchState {
  private static readonly STORE_NAME = "Search";

  /** 可绑定的数据字段（对齐 SearchDispatcher） */
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
    "hasMoreMessageResults",
  ];

  public readonly instanceId: string;

  // 用户（陌生人 / 全量 IM 账号）
  public readonly userList: Ref<UserProfile[]>;
  public readonly userTotalCount: Ref<number>;
  public readonly hasMoreUsers: Ref<boolean>;

  // 好友
  public readonly friendList: Ref<FriendSearchInfo[]>;
  public readonly friendTotalCount: Ref<number>;
  /** 旧字段 hasMoreFriendList */
  public readonly hasMoreFriends: Ref<boolean>;

  // 群组
  public readonly groupList: Ref<GroupSearchInfo[]>;
  public readonly groupTotalCount: Ref<number>;
  /** 旧字段 hasMoreGroupList */
  public readonly hasMoreGroups: Ref<boolean>;

  // 群成员
  public readonly groupMemberList: Ref<Record<string, GroupMember[]>>;
  public readonly groupMemberTotalCount: Ref<number>;
  /** 旧字段 hasMoreGroupMemberList */
  public readonly hasMoreGroupMembers: Ref<boolean>;

  // 消息
  public readonly messageResults: Ref<MessageSearchResultItem[]>;
  public readonly messageResultTotalCount: Ref<number>;
  public readonly hasMoreMessageResults: Ref<boolean>;

  private constructor(instanceId: string = "default_search_store") {
    this.instanceId = SearchState.generateInstanceId(instanceId);

    this.userList = ref<UserProfile[]>([]);
    this.userTotalCount = ref<number>(0);
    this.hasMoreUsers = ref<boolean>(false);

    this.friendList = ref<FriendSearchInfo[]>([]);
    this.friendTotalCount = ref<number>(0);
    this.hasMoreFriends = ref<boolean>(false);

    this.groupList = ref<GroupSearchInfo[]>([]);
    this.groupTotalCount = ref<number>(0);
    this.hasMoreGroups = ref<boolean>(false);

    this.groupMemberList = ref<Record<string, GroupMember[]>>({});
    this.groupMemberTotalCount = ref<number>(0);
    this.hasMoreGroupMembers = ref<boolean>(false);

    this.messageResults = ref<MessageSearchResultItem[]>([]);
    this.messageResultTotalCount = ref<number>(0);
    this.hasMoreMessageResults = ref<boolean>(false);

    this.createStore();
  }


  private static generateInstanceId(baseInstanceId: string): string {
    return JSON.stringify({
      storeName: SearchState.STORE_NAME,
      instanceId: baseInstanceId,
    });
  }

  private createStore(): void {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId,
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

  public static getInstance(instanceId: string = "default_search_store"): SearchState {
    const fullInstanceId = SearchState.generateInstanceId(instanceId);
    if (!InstanceMap.has(fullInstanceId)) {
      InstanceMap.set(fullInstanceId, new SearchState(instanceId));
    }
    return InstanceMap.get(fullInstanceId)!;
  }

  private bindEvent(): void {
    const storeName = SearchState.STORE_NAME;

    const dataHandlers: Record<string, (result: any) => void> = {
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

    SearchState.BINDABLE_DATA_NAMES.forEach((dataName) => {
      addListener({
        type: "",
        store: storeName,
        name: dataName,
        params: {
          createStoreParams: this.instanceId,
        },
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
   * 搜索
   *
   * @param keywordList 关键词列表
   * @param option 搜索选项；新版字段：keywordListMatchMode / searchScope[] / pageSize
   */
  search = async (keywordList: string[], option?: SearchOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const searchOption: any = {
        keywordListMatchMode: option?.keywordListMatchMode ?? KeywordListMatchMode.OR,
        searchScope: option?.searchScope ?? [
          SearchType.FRIEND,
          SearchType.MESSAGE,
          SearchType.GROUP,
          SearchType.GROUP_MEMBER,
        ],
        pageSize: option?.pageSize ?? 20,
      };
      if (option?.userFilter) searchOption.userFilter = option.userFilter;
      if (option?.groupMemberFilter) searchOption.groupMemberFilter = option.groupMemberFilter;
      if (option?.messageFilter) searchOption.messageFilter = option.messageFilter;

      const options: HybridCallOptions = {
        api: "search",
        params: {
          createStoreParams: this.instanceId,
          keywordList: JSON.stringify(keywordList),
          option: JSON.stringify(searchOption),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
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
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  /**
   * 搜索更多
   *
   * @param searchType 搜索类型（整数枚举：FRIEND=0 / GROUP=1 / GROUP_MEMBER=2 / MESSAGE=3）
   */
  searchMore = async (searchType: SearchType | number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "searchMore",
        params: {
          createStoreParams: this.instanceId,
          searchType: typeof searchType === 'number' ? searchType : Number(searchType),
        },
      };

      callAPI(JSON.stringify(options), (response: string) => {
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
        } catch (error) {
          reject(error);
        }
      });
    });
  };

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
  };

  // ============================================================================
  // 销毁
  // ============================================================================

  private unbindEvent(): void {
    SearchState.BINDABLE_DATA_NAMES.forEach((dataName) => {
      removeListener({
        type: "",
        store: SearchState.STORE_NAME,
        name: dataName,
        params: {
          createStoreParams: this.instanceId,
        },
      });
    });
  }

  destroyStore = (): void => {
    // 幂等：实例已被销毁过，直接 return
    if (!InstanceMap.has(this.instanceId)) return;
    this.unbindEvent();
    this.clearSearchResults();
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

export interface UseSearchStateOptions {
  instanceId?: string;
}

export function useSearchState(instanceId: string = "default_search_store") {
  return SearchState.getInstance(instanceId);
}

export { SearchState };
export default useSearchState;
