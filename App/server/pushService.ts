// TencentCloud-Push 推送服务独立模块
import {
  EVENT,
  addPushListener,
  createNotificationChannel,
  setRegistrationID,
  registerPush,
  getRegistrationID,
  unRegisterPush,
  removePushListener,
} from '@/uni_modules/TencentCloud-Push';
import { getNotificationAuth } from '../utils/getNotificationAuth';
import type { LoginInfo, NotificationChannelInfo, IEnterChatConfig } from './types';
import { NOTIFICATION_CHANNEL_CONFIG } from './constants';


class PushService {
  static instance: PushService;
  private notificationChannelInfo: NotificationChannelInfo;
  private isInitialized: boolean = false;
  private enterChatConfig: IEnterChatConfig = {
    isLoginChat: false,
    conversationID: '',
  };

  constructor() {
    this.notificationChannelInfo = NOTIFICATION_CHANNEL_CONFIG;
    this.enterChatConfig = {
      isLoginChat: false,
      conversationID: '',
    };
  }

  static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  public init() {
    if (this.isInitialized) {
      console.warn('PushService already initialized');
      return;
    }
    this.initNotificationChannel();
    this.initPushListeners();
    this.isInitialized = true;
  }

  public login(loginInfo: LoginInfo) {
    const { userId, sdkAppId, appKey } = loginInfo;
    if (appKey) {
      this.setEnterChatConfig({ isLoginChat: true });
      getNotificationAuth();
      setRegistrationID(userId, () => {
        console.log('PushInit | setRegistrationID ok');
      });
      registerPush(sdkAppId, appKey, (data: any) => {
        console.log('PushInit | registerPush ok', data);
        getRegistrationID((registrationID: string) => {
          console.log('PushInit | getRegistrationID ok', registrationID);
        });
      }, (errCode: any, errMsg: any) => {
        console.error('PushInit | registerPush failed', errCode, errMsg);
      });
    }
  }

  public logout() {
    this.reset();
    unRegisterPush(() => {
      console.log('PushInit | unRegisterPush ok');
    });
  }

  private initNotificationChannel(): void {
    createNotificationChannel(this.notificationChannelInfo, () => {
      console.log('createNotificationChannel success');
    });
  }

  private onNotificationClicked = (res: any): void => {
    console.log('PushService | onNotificationClicked', res);
    const notification = res?.data || {};
    if (!notification) {
      return;
    }
    try {
      const parsedNotification = JSON.parse(notification);
      if (!parsedNotification || !parsedNotification.entity) {
        return;
      }
      const { entity } = parsedNotification;
      const type = entity.chatType === 1 ? 'C2C' : 'GROUP';
      this.setEnterChatConfig({
        conversationID: `${type}${entity.sender}`,
      });
    } catch (error) {
      console.error('PushService | onNotificationClicked error', error);
    }
  };

  private onMessageReceived = (res: any): void => {
    console.log('PushService | onMessageReceived', res, JSON.stringify(res));
  };

  private onMessageRevoked = (res: any): void => {
    console.log('PushService | onMessageRevoked', res);
  };

  private initPushListeners(): void {
    addPushListener(EVENT.NOTIFICATION_CLICKED, this.onNotificationClicked);
    addPushListener(EVENT.MESSAGE_RECEIVED, this.onMessageReceived);
    addPushListener(EVENT.MESSAGE_REVOKED, this.onMessageRevoked);
  }

  private reset(): void {
    this.isInitialized = false;
    removePushListener(EVENT.NOTIFICATION_CLICKED, this.onNotificationClicked);
    removePushListener(EVENT.MESSAGE_RECEIVED, this.onMessageReceived);
    removePushListener(EVENT.MESSAGE_REVOKED, this.onMessageRevoked);
    this.setEnterChatConfig({
      isLoginChat: false,
      conversationID: '',
    });
    console.log('PushService reset');
  }

  setEnterChatConfig(config: IEnterChatConfig) {
    Object.assign(this.enterChatConfig, config);
    this.openChat(this.enterChatConfig);
  }

  openChat(enterChatConfig: IEnterChatConfig) {
    const { isLoginChat = false, conversationID = '' } = enterChatConfig || {};
    if (!isLoginChat || !conversationID) {
      return;
    }
    // TODO: 跳转具体 Chat
  }
}

export const pushService = PushService.getInstance();
