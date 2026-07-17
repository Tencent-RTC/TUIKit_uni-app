import type { ITUIStore, IOptions, Task } from '../interface/store';
import { StoreName } from '../const';
import { notNotifyList } from '../config';
import AppStore from './store/app';
import UserStore from './store/user';
import ConversationStore from './store/conversation';
import ChatStore from './store/chat';
import GroupStore from './store/group';
import CustomStore from './store/custom';
import type { func } from '../type';

export default class TUIStore implements ITUIStore {
  static instance: TUIStore;
  public task: Task;
  private storeMap: Partial<Record<StoreName, any>>;

  constructor() {
    this.storeMap = {
      [StoreName.APP]: new AppStore(),
      [StoreName.USER]: new UserStore(),
      [StoreName.CONV]: new ConversationStore(),
      [StoreName.CHAT]: new ChatStore(),
      [StoreName.GRP]: new GroupStore(),
    };

    // todo 此处后续优化结构后调整
    this.task = {} as Task; // 保存监听回调列表
  }

  /**
   * 获取 TUIStore 实例
  */
  static getInstance() {
    if (!TUIStore.instance) {
      TUIStore.instance = new TUIStore();
    }
    return TUIStore.instance;
  }

  /**
   * UI 组件注册监听回调
   * @param {StoreName} storeName store 名称
   * @param {IOptions} options 监听信息
  */
  watch(storeName: StoreName, options: IOptions) {
    if (!this.task[storeName]) {
      this.task[storeName] = {};
    }
    const watcher = this.task[storeName];
    Object.keys(options).forEach((key) => {
      const callback = options[key];
      if (!watcher[key]) {
        watcher[key] = new Map();
      }
      watcher[key].set(callback, 1);
      // 注册监听后立即通知一次默认数据，避免UI层初始化调用 getData
      this.notifyOnWatch(storeName, key, callback);
    });
  }

  /**
   * UI 取消组件监听回调
   * @param {StoreName} storeName store 名称
   * @param {IOptions} options 监听信息,包含需要取消的回掉等
   */
  unwatch(storeName: StoreName, options: IOptions) {
    // todo 该接口暂未支持，unwatch掉同一类，如仅传入store注销掉该store下的所有callback，同样options仅传入key注销掉该key下的所有callback
    // options的callback function为必填参数，后续修改
    if (!this.task[storeName]) {
      return;
    }
    const watcher = this.task[storeName];
    Object.keys(options).forEach((key) => {
      watcher[key]?.delete(options[key]);
    });
  }

  /**
   * 通用 store 数据更新，messageList 的变更需要单独处理
   * @param {StoreName} storeName store 名称
   * @param {string} key 变更的 key
   * @param {any} data 变更的数据
  */
  update(storeName: StoreName, key: string, data: any) {
    if (storeName === StoreName.CUSTOM && !this.storeMap[storeName]) {
      this.storeMap[storeName] = new CustomStore();
    }
    this.storeMap[storeName]?.update(key, data);
    this.notify(storeName, key);
  }

  /**
   * 获取 Store 数据
   * @param {StoreName} storeName store 名称
   * @param {string} key 待获取的 key
  */
  getData(storeName: StoreName, key: string) {
    if (storeName === StoreName.CUSTOM && !this.storeMap[storeName]) {
      this.storeMap[storeName] = new CustomStore();
    }
    return this.storeMap[storeName]?.getData(key);
  }

  getConversationModel(conversationID: string) {
    return this.storeMap[StoreName.CONV]?.getModel(conversationID);
  }

  getMessageModel(messageID: string) {
    return this.storeMap[StoreName.CHAT]?.getModel(messageID);
  }

  reset(storeName: StoreName, keyList: string[] = [], isNotificationNeeded = false) {
    if (storeName in this.storeMap) {
      const store = this.storeMap[storeName];
      if (keyList.length === 0) {
        // reset all
        keyList = Object.keys(store?.store);
      }
      store.reset(keyList);
      if (isNotificationNeeded) {
        keyList.forEach((key) => {
          this.notify(storeName, key);
        });
      }
    }
  }

  // 注册监听时默认给当前 callback 通知一次，notNotifyList 中配置的 key 如果数据为空就不触发 callback
  private notifyOnWatch(storeName: StoreName, key: string, callback: func) {
    const data = this.getData(storeName, key);
    if (notNotifyList.indexOf(key) > -1 && data.length === 0) {
      return;
    }
    callback && callback.call(this, data);
  }

  /**
   * UI 组件注册监听回调
   * @param {StoreName} storeName store 名称
   * @param {string} key 变更的 key
  */
  private notify(storeName: StoreName, key: string) {
    if (!this.task[storeName]) {
      return;
    }
    const watcher = this.task[storeName];
    if (watcher[key]) {
      const callbackMap = watcher[key];
      const data = this.getData(storeName, key);
      for (const [callback] of callbackMap.entries()) {
        callback.call(this, data);
      }
    }
  }
}
