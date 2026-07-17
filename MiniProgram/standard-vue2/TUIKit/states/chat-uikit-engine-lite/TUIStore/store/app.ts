import type { IAppStore, ITasks } from '../../interface/store';

export default class AppStore implements IAppStore {
  public store: {
    enabledMessageReadReceipt: boolean;
    enabledEmojiPlugin: boolean;
    enabledOnlineStatus: boolean;
    enabledCustomerServicePlugin: boolean;
    enabledTranslationPlugin: boolean;
    enabledVoiceToText: boolean;
    enableTyping: boolean;
    enableConversationDraft: boolean;
    enableAutoMessageRead: boolean;
    isOfficial: boolean;
    SDKVersion: string;
    tasks: ITasks;
    [key: string]: any;
  };

  public defaultStore = {
    enabledMessageReadReceipt: false,
    enabledEmojiPlugin: false,
    enabledOnlineStatus: false,
    enabledCustomerServicePlugin: false,
    enabledTranslationPlugin: false,
    enabledVoiceToText: false,
    enableTyping: true,
    enableConversationDraft: true,
    enableAutoMessageRead: true,
    isOfficial: false,
    SDKVersion: '3.0.0',
    tasks: {
      sendMessage: false,
      revokeMessage: false,
      modifyNickName: false,
      groupChat: false,
      muteGroup: false,
      dismissGroup: false,
      call: false,
      searchCloudMessage: false,
      customerService: false,
      translateTextMessage: false,
    },
  } as any;

  constructor() {
    this.store = {
      enabledEmojiPlugin: false,
      enabledMessageReadReceipt: false,
      enabledOnlineStatus: false,
      enabledCustomerServicePlugin: false,
      enabledTranslationPlugin: false,
      enabledVoiceToText: false,
      enableTyping: true,
      enableConversationDraft: true,
      enableAutoMessageRead: true,
      isOfficial: false,
      SDKVersion: '3.0.0',
      tasks: {
        sendMessage: false,
        revokeMessage: false,
        modifyNickName: false,
        groupChat: false,
        muteGroup: false,
        dismissGroup: false,
        call: false,
        searchCloudMessage: false,
        customerService: false,
        translateTextMessage: false,
      },
    };
  }

  update(key: string, data: any) {
    this.store[key] = data;
  }

  getData(key: string) {
    return this.store[key];
  }

  reset(keyList: string[] = []) {
    this.store = {
      ...this.defaultStore,
      ...this.store,
      ...keyList.reduce((acc, key) => ({ ...acc, [key]: this.defaultStore[key] }), {}),
    };
  }
}
