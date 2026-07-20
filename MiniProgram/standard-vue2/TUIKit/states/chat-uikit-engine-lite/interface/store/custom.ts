export interface ICustomStore {
  store: any; // 自定义 store，属性可根据需要进行自定义

  /**
   * 更新自定义 store
   * @param {Sting} key 待更新的 key，没有则写入
   * @param {any} value 待更新的数据
   */
  update(key: string, value: any): void;

  /**
   * 从自定义 store 中获取数据
   * @param {Sting} store store 的名称
   * @param {Sting} key 待获取的 key
   */
  getData(key: string): any;

  /**
   * reset Store 内数据
   * @param { Array<string>} keyList 需要 reset 的 keyList
   */
  reset(keyList?: string[]): void;
}
