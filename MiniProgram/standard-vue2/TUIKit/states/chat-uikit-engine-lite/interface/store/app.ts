export interface ITasks {
  sendMessage: boolean; // 发送一条消息
  revokeMessage: boolean; // 撤回一条消息
  modifyNickName: boolean; // 修改一次我的昵称
  groupChat: boolean; // 发起一个群聊
  muteGroup: boolean; // 开启一次群禁言
  dismissGroup: boolean; // 解散一个群聊
  call: boolean; // 发起一次通话
  searchCloudMessage: boolean; // 进行一次消息云端搜索
  customerService: boolean; // 进行一次客服会话
  translateTextMessage: boolean; // 进行一次文本消息翻译
}
export interface IAppStore {
  store: {
    enabledMessageReadReceipt: boolean; // 消息已读回执功能是否已开启
    enabledEmojiPlugin: boolean; // 表情回复插件能力是否已开启
    enabledOnlineStatus: boolean; // 用户在线状态能力是否已开启
    enabledCustomerServicePlugin: boolean; // 客服插件能力是否已开启
    enabledTranslationPlugin: boolean; // 文本消息翻译能力是否已开启
    enabledVoiceToText: boolean; // 语音转文字能力是否已开启
    enableTyping: boolean; // 正在输入能力开关
    enableConversationDraft: boolean; // 会话草稿能力开关
    enableAutoMessageRead: boolean; // 接收消息自动已读上报能力开关
    isOfficial: boolean; // 是否是官网 SDKAppID
    SDKVersion: string; // Chat SDK 版本号
    tasks: ITasks; // sample demo 任务列表
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
  reset(keyList?: string[]): void;
}
