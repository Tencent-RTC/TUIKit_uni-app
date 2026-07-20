import type { ISearchParamsMap, ISearchResult, ISearchType } from '../../type';

export interface ISearchStoreStore {
  searchMessagesResult: ISearchResult<ISearchType.MESSAGE>;
  searchChatMessagesResult: ISearchResult<ISearchType.MESSAGE>;
  searchUserResult: ISearchResult<ISearchType.USER>;
  searchGroupResult: ISearchResult<ISearchType.GROUP>;
  searchMessageParams: ISearchParamsMap[ISearchType.MESSAGE];
  searchChatMessageParams: ISearchParamsMap[ISearchType.MESSAGE];
  searchUserParams: ISearchParamsMap[ISearchType.USER];
  searchGroupParams: ISearchParamsMap[ISearchType.GROUP];
  error: Error | null;
  [key: string]: any;
}

export interface ISearchStore {
  store: ISearchStoreStore;

  /**
   * 更新 store
   * @param {Sting} key 待更新的 key
   * @param {any} data 更新的数据
   */
  update(key: string, data: any): void;

  /**
   * 从 store 中获取数据
   * @param {Sting} key 需要获取的 key
   */
  getData(key: string): any;

  /**
   * reset Store 内数据
   * @param { Array<string>} keyList 需要 reset 的 keyList
   */
  reset(keyList?: string[]): void;
}
