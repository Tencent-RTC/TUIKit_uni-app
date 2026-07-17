import type { func } from '../../type';

export interface IEventCenter {
  /**
   * Service 添加监听事件
   * @param {string} event 事件名
   * @param {Function} callback 回调函数
   */
  addEvent(event: string, callback: func): void;

  /**
   * 移除 chatEngine 内部注册的事件回调
  */
  removeEvents(): void;

  /**
   * 解绑 IM SDK 事件
   */
  unbindIMEvents(): void;

}
