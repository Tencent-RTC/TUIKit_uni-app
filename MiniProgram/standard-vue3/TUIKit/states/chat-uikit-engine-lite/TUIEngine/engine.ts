import type { ChatSDK } from '@tencentcloud/lite-chat/basic';
import TencentCloudChat from '@tencentcloud/lite-chat/basic';
import EventCenter from './event-center';
import type { ITUIChatEngine, IEventCenter } from '../interface/engine';
import type {
  ITUIConversationService,
  ITUIChatService,
  ITUIGroupService,
  ITUIUserService,
  ITUIReportService,
} from '../interface/service';
import type { ITUIStore } from '../interface/store';
import type { LoginParams } from '../type';
import type { MountedList } from '../const';
import { StoreName } from '../const';
import { isUndefined } from '../utils/common-utils';
import { commercialAbility } from '../config';
import TUIGlobal from '../TUIGlobal/tui-global';

export default class ChatEngine implements ITUIChatEngine {
  static instance: ChatEngine;
  public isInited: boolean; // 是否执行了初始化
  public chat!: ChatSDK;
  public EVENT: any;
  public TYPES: any;
  public eventCenter!: IEventCenter;
  public TUIStore!: ITUIStore;
  public TUIConversation!: ITUIConversationService;
  public TUIChat!: ITUIChatService;
  public TUIGroup!: ITUIGroupService;
  public TUIUser!: ITUIUserService;
  public TUIReport!: ITUIReportService;
  private loginStatusPromise: Map<string, unknown>; // 保存 login Promise
  private userID: string; // 当前用户 ID

  constructor() {
    this.EVENT = TencentCloudChat.EVENT;
    this.TYPES = TencentCloudChat.TYPES;
    this.loginStatusPromise = new Map();
    this.userID = '';
    this.isInited = false;
  }

  /**
   * 获取 ChatEngine 实例
  */
  static getInstance() {
    if (!ChatEngine.instance) {
      ChatEngine.instance = new ChatEngine();
    }
    return ChatEngine.instance;
  }

  mount(name: MountedList, instance: any) {
    this[name] = instance;
  }

  login(options: LoginParams) {
    const { chat, SDKAppID, userID } = options;
    const isOfficial = SDKAppID === 1400187352 || SDKAppID === 1400188366;
    this.createChat(options);
    this.userID = userID;
    TUIGlobal.getInstance().initOfficial(isOfficial); // 兼容低版本 uikit
    this.TUIStore.update(StoreName.APP, 'isOfficial', isOfficial);
    this.TUIStore.update(StoreName.APP, 'SDKVersion', (TencentCloudChat as any).VERSION);
    this.eventCenter = new EventCenter(this);
    this.eventCenter.removeEvents(); // 移除注册的事件监听，避免重复注册
    this.resetStore();
    this.initService();
    if (chat && chat.isReady()) {
      console.log('TUIChatEngine.login ok, from TUICore.');
      this.TUIUser.getUserProfile();
      this.checkCommercialAbility();
      return Promise.resolve({});
    }
    this.eventCenter.addEvent(this.EVENT.SDK_READY, () => {
      this.onSDKReady();
    });
    this.eventCenter.addEvent(this.EVENT.SDK_NOT_READY, () => {
      this.onSDKNotReady();
    });
    return this.loginChat(options);
  }

  logout() {
    this.userID = '';
    this.isInited = false;
    this.resetStore();
    return this.chat.logout();
  }

  isReady() {
    return this.chat?.isReady() || false;
  }

  setLogLevel(level: number) {
    if (!this.chat) {
      console.warn('TUIChatEngine 初始化未完成，请确认 TUIChatEngine.login 接口调用是否正常。');
      return;
    }
    this.chat.setLogLevel(level);
  }

  destroy() {
    // 解绑 IM 事件
    this.eventCenter.unbindIMEvents();
    this.isInited = false;
    this.resetStore();
    return this.chat.destroy();
  }

  getMyUserID() {
    return this.userID;
  }

  /**
   * 重置 Store
  */
  private resetStore() {
    this.TUIStore.reset(StoreName.CHAT);
    this.TUIStore.reset(StoreName.CONV);
    this.TUIStore.reset(StoreName.GRP);
    this.TUIStore.reset(StoreName.USER);
    this.TUIStore.reset(StoreName.SEARCH);
    this.TUIStore.reset(StoreName.FRIEND);
    this.TUIStore.reset(StoreName.CUSTOM);
    console.log('TUIChatEngine.resetStore ok.');
  }

  /**
   * 初始化 Service
  */
  private initService() {
    this.TUIChat.init();
    this.TUIConversation.init();
    this.TUIUser.init();
    this.isInited = true;
    console.log('TUIChatEngine.initService ok.');
  }

  private createChat(options: LoginParams) {
    const { chat, ...rest } = options;
    if (!isUndefined(chat)) {
      this.chat = chat;
      return;
    }
    this.chat = TencentCloudChat.create({
      ...rest,
      scene: 'engine-lite',
    });
  }

  private loginChat(options: LoginParams) {
    const { userID, userSig } = options;
    return new Promise((resolve, reject) => {
      this.chat.login({ userID, userSig }).then((imResponse: any) => {
        console.log('TUIChatEngine.loginChat ok.');
        this.checkCommercialAbility();
        if (imResponse.data.repeatLogin && this.chat.isReady()) {
          resolve(imResponse);
        }
        this.loginStatusPromise.set('login', { resolve, reject, imResponse });
      }).catch((error: any) => {
        reject(error);
      });
    });
  }

  private onSDKReady() {
    if (this.loginStatusPromise.has('login')) {
      const handler: any = this.loginStatusPromise.get('login');
      handler.resolve(handler.imResponse);
      // 独立使用 engine 登录成功 SDK Ready 后获取一次自己的资料
      this.TUIUser.getUserProfile();
    }
    this.loginStatusPromise.delete('login');
  }

  private onSDKNotReady() {
    if (this.loginStatusPromise.has('login')) {
      const handler: any = this.loginStatusPromise.get('login');
      handler.reject(new Error('sdk not ready'));
    }
    this.loginStatusPromise.delete('login');
    this.resetStore();
  }

  // 登录成功后校验商业化能力位
  private checkCommercialAbility() {
    Object.keys(commercialAbility).forEach((key: string) => {
      const ability: number = commercialAbility[key];
      this.chat.callExperimentalAPI('isCommercialAbilityEnabled', ability).then((imResponse: any) => {
        const { enabled = false } = imResponse.data;
        this.TUIStore.update(StoreName.APP, key, enabled);
      });
    });
  }
}
