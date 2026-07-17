export interface IUserStore {
  store: {
    userProfile: object;
    displayOnlineStatus: boolean; // 是否开启用户状态显示
    displayMessageReadReceipt: boolean; // 是否开启消息阅读状态显示
    userStatusList: Map<string, {
      statusType: number;
      customStatus: string;
    }>; // 订阅用户的状态信息的列表
    kickedOut: string; // 用户被踢的类型信息
    netStateChange: string; // 网络状态变更信息
    userBlacklist: any[]; // 用户黑名单列表
    targetLanguage: string; // 文本消息翻译目标语言，内部使用
  };

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
  reset(keyList?: any[]): void;
}
