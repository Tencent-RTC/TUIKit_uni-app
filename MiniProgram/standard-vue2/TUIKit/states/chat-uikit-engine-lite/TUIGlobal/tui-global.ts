import { APP_NAMESPACE, IS_PC, IS_H5, IN_WX_MINI_APP, IN_UNI_NATIVE_APP } from '../utils/env';
import type { ITUIGlobal } from '../interface/global';

export default class TUIGlobal implements ITUIGlobal {
  static instance: TUIGlobal;
  public global: any;
  public isOfficial: boolean;

  constructor() {
    this.global = APP_NAMESPACE;
    this.isOfficial = false;
  }

  /**
   * 获取 TUIGlobal 实例
  */
  static getInstance() {
    if (!TUIGlobal.instance) {
      TUIGlobal.instance = new TUIGlobal();
    }
    return TUIGlobal.instance;
  }

  initOfficial(isOfficial: boolean) {
    this.isOfficial = isOfficial;
  }

  getPlatform() {
    let platform = '';
    if (IS_PC) {
      platform = 'pc';
    } else if (IS_H5) {
      platform = 'h5';
    } else if (IN_WX_MINI_APP) {
      platform = 'wechat';
    } else if (IN_UNI_NATIVE_APP && !IN_WX_MINI_APP) {
      platform = 'app';
    }
    return platform;
  }
}
