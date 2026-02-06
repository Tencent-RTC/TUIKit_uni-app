/**
 * 搜索状态管理
 * @module SearchState
 */
import { ref, type Ref } from "vue";
import type { HybridCallOptions } from "@/uni_modules/tuikit-atomic-x";
import { safeJsonParse } from "../utils/utsUtils";
import { callAPI, addListener, removeListener } from "@/uni_modules/tuikit-atomic-x";
import type { UserProfile } from "../types/userProfile";
import {
  KeywordListMatchType,
  SearchType,
  type SearchOption,
  type FriendSearchInfo,
  type MessageSearchResultItem
} from "../types/search";
import type { GroupSearchInfo, GroupMember } from "../types/group";

// ==================== 全局实例管理 ====================

/**
 * 获取全局 InstanceMap
 */
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

/**
 * 搜索状态管理类
 */
class SearchState {
  /** Store 名称 */
  private static readonly STORE_NAME = "Search";
  
  /** 可绑定的数据名称列表 */
  private static readonly BINDABLE_DATA_NAMES = [
    "userList",
    "userTotalCount", 
    "hasMoreUserList",
    "friendList",
    "friendTotalCount",
    "hasMoreFriendList",
    "groupList",
    "groupTotalCount",
    "hasMoreGroupList",
    "groupMemberList",
    "groupMemberTotalCount",
    "hasMoreGroupMemberList",
    "messageResults",
    "messageResultTotalCount",
    "hasMoreMessageResults"
  ];

  /** Store 实例ID */
  public readonly instanceId: string;

  // ========== 用户搜索结果 ==========
  /** 用户列表 */
  public readonly userList: Ref<UserProfile[]>;
  /** 用户总数 */
  public readonly userTotalCount: Ref<number>;
  /** 是否有更多用户 */
  public readonly hasMoreUserList: Ref<boolean>;

  // ========== 好友搜索结果 ==========
  /** 好友列表 */
  public readonly friendList: Ref<FriendSearchInfo[]>;
  /** 好友总数 */
  public readonly friendTotalCount: Ref<number>;
  /** 是否有更多好友 */
  public readonly hasMoreFriendList: Ref<boolean>;

  // ========== 群组搜索结果 ==========
  /** 群组列表 */
  public readonly groupList: Ref<GroupSearchInfo[]>;
  /** 群组总数 */
  public readonly groupTotalCount: Ref<number>;
  /** 是否有更多群组 */
  public readonly hasMoreGroupList: Ref<boolean>;

  // ========== 群成员搜索结果 ==========
  /** 群成员列表 (key: groupID, value: 成员列表) */
  public readonly groupMemberList: Ref<Record<string, GroupMember[]>>;
  /** 群成员总数 */
  public readonly groupMemberTotalCount: Ref<number>;
  /** 是否有更多群成员 */
  public readonly hasMoreGroupMemberList: Ref<boolean>;

  // ========== 消息搜索结果 ==========
  /** 消息搜索结果列表 */
  public readonly messageResults: Ref<MessageSearchResultItem[]>;
  /** 消息搜索结果总数 */
  public readonly messageResultTotalCount: Ref<number>;
  /** 是否有更多消息结果 */
  public readonly hasMoreMessageResults: Ref<boolean>;

  /**
   * 私有构造函数，使用 getInstance 获取实例
   * @param instanceId Store 实例ID
   */
  private constructor(instanceId: string = "default_search_store") {
    console.log(`[SearchState] Constructor called, instanceId: ${instanceId}`);
    this.instanceId = SearchState.generateInstanceId(instanceId);

    // 用户搜索结果
    this.userList = ref<UserProfile[]>([]);
    this.userTotalCount = ref<number>(0);
    this.hasMoreUserList = ref<boolean>(false);

    // 好友搜索结果
    this.friendList = ref<FriendSearchInfo[]>([]);
    this.friendTotalCount = ref<number>(0);
    this.hasMoreFriendList = ref<boolean>(false);

    // 群组搜索结果
    this.groupList = ref<GroupSearchInfo[]>([]);
    this.groupTotalCount = ref<number>(0);
    this.hasMoreGroupList = ref<boolean>(false);

    // 群成员搜索结果
    this.groupMemberList = ref<Record<string, GroupMember[]>>({});
    this.groupMemberTotalCount = ref<number>(0);
    this.hasMoreGroupMemberList = ref<boolean>(false);

    // 消息搜索结果
    this.messageResults = ref<MessageSearchResultItem[]>([]);
    this.messageResultTotalCount = ref<number>(0);
    this.hasMoreMessageResults = ref<boolean>(false);

    // 初始化 Store
    this.createStore();
  }

  /**
   * 生成实例ID
   * @param baseInstanceId 基础实例ID
   */
  private static generateInstanceId(baseInstanceId: string): string {
    return JSON.stringify({
      storeName: SearchState.STORE_NAME,
      instanceId: baseInstanceId
    });
  }

  /**
   * 创建 Store
   */
  private createStore(): void {
    const options: HybridCallOptions = {
      api: "createStore",
      params: {
        createStoreParams: this.instanceId
      }
    };

    callAPI(options, (response: string) => {
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
  /**
   * 获取实例（单例模式）
   * @param instanceId Store 实例ID，默认为 "default_search_store"
   */
  public static getInstance(instanceId: string = "default_search_store"): SearchState {
    const fullInstanceId = SearchState.generateInstanceId(instanceId);
    if (!InstanceMap.has(fullInstanceId)) {
      InstanceMap.set(fullInstanceId, new SearchState(instanceId));
    }
    return InstanceMap.get(fullInstanceId)!;
  }

  /**
   * 绑定事件监听
   */
  private bindEvent(): void {
    const storeName = SearchState.STORE_NAME;

    const dataHandlers: Record<string, (result: any) => void> = {
      userList: (r) => { this.userList.value = safeJsonParse<UserProfile[]>(r.userList, []); },
      userTotalCount: (r) => { this.userTotalCount.value = Number(r.userTotalCount || 0); },
      hasMoreUserList: (r) => { this.hasMoreUserList.value = Boolean(r.hasMoreUserList); },
      friendList: (r) => { this.friendList.value = safeJsonParse<FriendSearchInfo[]>(r.friendList, []); },
      friendTotalCount: (r) => { this.friendTotalCount.value = Number(r.friendTotalCount || 0); },
      hasMoreFriendList: (r) => { this.hasMoreFriendList.value = Boolean(r.hasMoreFriendList); },
      groupList: (r) => { this.groupList.value = safeJsonParse<GroupSearchInfo[]>(r.groupList, []); },
      groupTotalCount: (r) => { this.groupTotalCount.value = Number(r.groupTotalCount || 0); },
      hasMoreGroupList: (r) => { this.hasMoreGroupList.value = Boolean(r.hasMoreGroupList); },
      groupMemberList: (r) => { this.groupMemberList.value = safeJsonParse<Record<string, GroupMember[]>>(r.groupMemberList, {}); },
      groupMemberTotalCount: (r) => { this.groupMemberTotalCount.value = Number(r.groupMemberTotalCount || 0); },
      hasMoreGroupMemberList: (r) => { this.hasMoreGroupMemberList.value = Boolean(r.hasMoreGroupMemberList); },
      messageResults: (r) => { this.messageResults.value = safeJsonParse<MessageSearchResultItem[]>(r.messageResults, []); },
      messageResultTotalCount: (r) => { this.messageResultTotalCount.value = Number(r.messageResultTotalCount || 0); },
      hasMoreMessageResults: (r) => { this.hasMoreMessageResults.value = Boolean(r.hasMoreMessageResults); },
    };

    SearchState.BINDABLE_DATA_NAMES.forEach(dataName => {
      addListener({
        type: "",
        store: storeName,
        name: dataName,
        params: {
          createStoreParams: this.instanceId
        }
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

  /**
   * 搜索
   * @param keywordList 关键词列表
   * @param option 搜索选项
   * @returns {Promise<void>}
   */
  search = async (keywordList: string[], option?: SearchOption): Promise<void> => {
    return new Promise((resolve, reject) => {
      const searchOption = {
        keywordListMatchType: option?.keywordListMatchType ?? KeywordListMatchType.OR,
        isCloudSearch: option?.isCloudSearch ?? false,
        searchType: option?.searchType?.value ?? (SearchType.Friend.or(SearchType.Message).or(SearchType.Group).or(SearchType.GroupMember).value),
        searchCount: option?.searchCount ?? 20,
        userFilter: option?.userFilter,
        groupMemberFilter: option?.groupMemberFilter,
        messageFilter: option?.messageFilter
      };

      const options: HybridCallOptions = {
        api: "search",
        params: {
          createStoreParams: this.instanceId,
          keywordList: JSON.stringify(keywordList),
          option: JSON.stringify(searchOption)
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][search] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to search'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][search] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 搜索更多
   * @param searchType 搜索类型
   * @returns {Promise<void>}
   */
  searchMore = async (searchType: SearchType): Promise<void> => {
    return new Promise((resolve, reject) => {
      const options: HybridCallOptions = {
        api: "searchMore",
        params: {
          createStoreParams: this.instanceId,
          searchType: searchType.value
        }
      };

      callAPI(options, (response: string) => {
        try {
          const result = safeJsonParse<any>(response, {});
          if (result.code === 0) {
            resolve();
          } else {
            console.error(`[${this.instanceId}][searchMore] Failed:`, result.message);
            reject(new Error(result.message || 'Failed to search more'));
          }
        } catch (error) {
          console.error(`[${this.instanceId}][searchMore] Parse error:`, error);
          reject(error);
        }
      });
    });
  };

  /**
   * 清空搜索结果
   */
  clearSearchResults = (): void => {
    this.userList.value = [];
    this.userTotalCount.value = 0;
    this.hasMoreUserList.value = false;

    this.friendList.value = [];
    this.friendTotalCount.value = 0;
    this.hasMoreFriendList.value = false;

    this.groupList.value = [];
    this.groupTotalCount.value = 0;
    this.hasMoreGroupList.value = false;

    this.groupMemberList.value = {};
    this.groupMemberTotalCount.value = 0;
    this.hasMoreGroupMemberList.value = false;

    this.messageResults.value = [];
    this.messageResultTotalCount.value = 0;
    this.hasMoreMessageResults.value = false;
  };

  /**
   * 移除事件监听
   */
  private unbindEvent(): void {
    SearchState.BINDABLE_DATA_NAMES.forEach(dataName => {
      removeListener({
        type: "",
        store: SearchState.STORE_NAME,
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
    this.clearSearchResults();
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

    callAPI(options, (response: string) => {
      try {
        const result = safeJsonParse<any>(response, {});
        console.log(`[${this.instanceId}][destroyStore] Response:`, result);
      } catch (error) {
        console.error(`[${this.instanceId}][destroyStore] Parse error:`, error);
      }
    });
  }
}

/**
 * useSearchState 参数选项
 */
export interface UseSearchStateOptions {
  /** Store 实例ID */
  instanceId?: string;
}

/**
 * 搜索状态管理 Hook
 * @param options 配置选项
 * @example
 * ```ts
 * // 解构使用
 * const { userList, friendList, groupList, messageResults, search, searchMore, clearSearchResults } = useSearchState()
 * 
 * // 搜索
 * await search(['关键词'])
 * 
 * // 加载更多
 * await searchMore(SearchType.Friend)
 * 
 * // 访问结果
 * console.log(userList.value)
 * ```
 */
export function useSearchState(instanceId: string = "default_search_store") {
  return SearchState.getInstance(instanceId);
}

export { SearchState };
export default useSearchState;
