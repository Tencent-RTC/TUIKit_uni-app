import type { Profile } from '@tencentcloud/lite-chat/basic';
import type { UpdateMyProfileParams, UserIDListParams } from '../type';
import type { ITUIUserService } from '../interface/service';
import { StoreName } from '../const';
import { isUndefined } from '../utils/common-utils';

export default class UserProfileHandler {
  private TUIUserService: ITUIUserService;
  constructor(TUIUserService: ITUIUserService) {
    this.TUIUserService = TUIUserService;
  }

  private getEngine() {
    return this.TUIUserService.getEngine();
  }

  init() {
    this.getEngine().eventCenter.addEvent(this.getEngine().EVENT.PROFILE_UPDATED, this.onProfileUpdated.bind(this));
    this.getUserProfileInitData();
  }

  private onProfileUpdated(userProfileList: Profile[]) {
    const chatEngine = this.getEngine();
    const myProfile = chatEngine.TUIStore.getData(StoreName.USER, 'userProfile');
    userProfileList.forEach((profile: Profile) => {
      // 自己资料的更新通知需要更新 store 并通知给 UI，好友资料更新通知先不处理
      if (profile.userID === myProfile.userID) {
        chatEngine.TUIStore.update(StoreName.USER, 'userProfile', profile);
      }
    });
  }

  private getUserProfileInitData() {
    const chatEngine = this.getEngine();
    if (!chatEngine.chat.isReady()) {
      return;
    }
    // chatEngine.chat.getBlacklist().then((imResponse: any) => {
    //   const blockList = imResponse.data || [];
    //   console.log(`TUIUserProfileHandler.init, getBlacklist count:${blockList.length}`);
    //   if (blockList.length > 0) {
    //     this.onBlacklistUpdated(blockList);
    //   }
    // });
  }

  public getUserProfile(options?: UserIDListParams) {
    const chatEngine = this.getEngine();
    if (isUndefined(options)) {
      return chatEngine.chat.getMyProfile().then((imResponse: any) => {
        chatEngine.TUIStore.update(StoreName.USER, 'userProfile', imResponse.data);
        return imResponse;
      }).catch((error: any) => Promise.reject(error));
    }
    return chatEngine.chat.getUserProfile(options as UserIDListParams);
  }

  public updateMyProfile(options: UpdateMyProfileParams) {
    return this.getEngine().chat.updateMyProfile(options);
  }
}
