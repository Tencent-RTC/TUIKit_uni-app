import TUIBase from '../tui-base';
import type { ITUIUserService } from '../interface/service';
import type { UpdateMyProfileParams, UserIDListParams } from '../type';
import UserProfileHandler from './user-profile-handler';
import { StoreName } from '../const';

export default class TUIUserService extends TUIBase implements ITUIUserService {
  static instance: TUIUserService;
  private userProfileHandler: UserProfileHandler;
  constructor() {
    super();
    this.userProfileHandler = new UserProfileHandler(this);
  }

  /**
   * 获取 TUIUserService 实例
  */
  static getInstance() {
    if (!TUIUserService.instance) {
      TUIUserService.instance = new TUIUserService();
    }
    return TUIUserService.instance;
  }

  init() {
    const chatEngine = this.getEngine();
    // 监听用户被踢通知
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.KICKED_OUT, this.onKickedOut.bind(this));

    this.userProfileHandler.init();
  }

  private onKickedOut(data: any) {
    this.getEngine().TUIStore.update(StoreName.USER, 'kickedOut', data.type);
  }

  // 用户资料相关的方法
  public getUserProfile(userIDList?: UserIDListParams) {
    return this.userProfileHandler.getUserProfile(userIDList);
  }

  public updateMyProfile(options: UpdateMyProfileParams) {
    return this.userProfileHandler.updateMyProfile(options);
  }
}
