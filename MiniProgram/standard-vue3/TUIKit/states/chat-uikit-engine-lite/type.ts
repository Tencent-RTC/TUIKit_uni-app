/* eslint-disable @typescript-eslint/naming-convention */

import type { Group, Message, Profile } from '@tencentcloud/lite-chat/basic';
import TencentCloudChat from '@tencentcloud/lite-chat/basic';
import type { IConversationModel, IMessageModel } from './interface/model';

export type func = (...args: any[]) => any;
export type SEARCH_TYPE = 'global' | 'conversation';

// chat engine
/**
 * ChatEngine Login 参数信息
 * @property {number} SDKAppID 云通信应用的 SDKAppID
 * @property {string} userID 用户 ID
 * @property {string} userSig 用户登录即时通信 IM 的密码，其本质是对 UserID 等信息加密后得到的密文。<br/>具体生成方法请参见{@link https://cloud.tencent.com/document/product/269/32688 生成 UserSig}
 * @property {string} [fileUploadProxy] 图片、视频、文件上传代理地址
 * @property {string} [fileDownloadProxy] 图片、视频、文件下载代理地址
 * @property {string} [proxyServer] 设置 IM 服务代理服务
*/
export interface LoginParams {
  SDKAppID: number;
  userID: string;
  userSig: string;
  chat?: any;
  unlimitedAVChatRoom?: boolean;
  scene?: string;
  fileUploadProxy?: string;
  fileDownloadProxy?: string;
  proxyServer?: string;
  devMode?: boolean;
  testEnv?: boolean;
}

// user service
/**
 * 更新自己资料相关参数
 * @interface UpdateMyProfileParams
 * @property {string} [nick] 昵称
 * @property {string} [avatar] 头像地址
 * @property {TencentCloudChat.TYPES} [gender] 性别
 * @property {string} [selfSignature] 个性签名
 * @property {TencentCloudChat.TYPES} [allowType] 是否允许被加为好友
 * @property {number} [birthday] 生日 推荐用法：20000101
 * @property {string} [location] 所在地 推荐用法：App 本地定义一套数字到地名的映射关系 后台实际保存的是4个 uint32_t 类型的数字： 其中第一个 uint32_t 表示国家； 第二个 uint32_t 用于表示省份； 第三个 uint32_t 用于表示城市； 第四个 uint32_t 用于表示区县
 * @property {number} [language] 语言
 * @property {number} [messageSettings] 消息设置 0：接收消息，1：不接收消息
 * @property {TencentCloudChat.TYPES} [adminForbidType] 管理员禁止加好友标识
 * @property {number} [level] 等级，建议拆分以保存多种角色的等级信息
 * @property {number} [role] 角色，建议拆分以保存多种角色信息
 * @property {Array<object>} [profileCustomField] 自定义资料键值对集合，可根据业务侧需要使用，详细请参考: {@link https://cloud.tencent.com/document/product/269/1500#.E8.87.AA.E5.AE.9A.E4.B9.89.E8.B5.84.E6.96.99.E5.AD.97.E6.AE.B5 资料管理}
*/
export interface UpdateMyProfileParams {
  nick?: string;
  avatar?: string;
  gender?: TencentCloudChat.TYPES;
  selfSignature?: string;
  allowType?: TencentCloudChat.TYPES;
  birthday?: number;
  location?: string;
  language?: number;
  messageSettings?: number;
  adminForbidType?: TencentCloudChat.TYPES;
  level?: number;
  role?: number;
  profileCustomField?: object[];
}

/**
 * 用户 userID 列表
 * @interface UserIDListParams
 * @property {Array<string>} userIDList 用户 ID 列表
*/
export interface UserIDListParams {
  userIDList: string[];
}

/**
 * 用户状态控制开关参数信息
 * @interface SwitchUserStatusParams
 * @property {boolean} displayOnlineStatus 是否开启在线状态 默认 false
*/
export interface SwitchUserStatusParams {
  displayOnlineStatus: boolean;
}

// conversation service
/**
 * 删除会话参数信息
 * @interface DeleteConversationParams
 * @property {string} conversationIDList 会话 ID 列表。会话 ID 组成方式：
 * - `C2C${userID}`（单聊）
 * - `GROUP${groupID}`（群聊）
 * @property {boolean} clearHistoryMessage true 清空会话历史消息，false 不清空会话历史消息
*/
export interface DeleteConversationParams {
  conversationIDList: string[];
  clearHistoryMessage: boolean;
}
/**
 * 置顶会话参数信息
 * @interface PinConversationParams
 * @property {string} conversationID 会话ID。会话 ID 组成方式：
 * - `C2C${userID}`（单聊）
 * - `GROUP${groupID}`（群聊）
 * @property {boolean} isPinned true 表示置顶会话，false 表示取消置顶会话
*/
export interface PinConversationParams {
  conversationID: string;
  isPinned: boolean;
}

/**
 * 消息免打扰参数信息
 * @interface MuteConversationParams
 * @property {string} [groupID] 群会话的群组 ID
 * @property {Array<string>} [userIDList] C2C 会话对端 userID 列表，单次请求的 userID 数不得超过30
 * @property {TencentCloudChat.TYPES} messageRemindType 群消息提示类型。
*/
export interface MuteConversationParams {
  groupID?: string;
  userIDList?: string[];
  messageRemindType: TencentCloudChat.TYPES;
}

/**
 * 标记会话参数信息
 * @interface MarkConversationParams
 * @property {Array<string>} conversationIDList 会话 ID 列表
 * @property {number} markType 会话标记类型
 * @property {boolean} enableMark true 设置标记，false 取消标记
*/
export interface MarkConversationParams {
  conversationIDList: string[];
  markType: number;
  enableMark: boolean;
}

/**
 * 设置会话草稿参数信息
 * @interface SetConversationDraftParams
 * @property {string} conversationID 会话 ID
 * @property {Record<string, string>} [draftInfo] 会话草稿的信息，清除会话草稿时不需要传 draftInfo
 * - draftInfo.html 发送消息的 html 格式内容
 * - draftInfo.abstract 会话显示的摘要内容
 * - draftInfo.messageID 被引用或被回复的消息 ID
 * - draftInfo.type 消息引用或消息回复类型，取值只有 'reply' 和 'quote'
*/
export interface SetConversationDraftParams {
  conversationID: string;
  draftText?: string;
  draftInfo?: {
    html: string;
    abstract: string;
    messageID?: string;
    type?: 'reply' | 'quote';
  };
}

// chat service

/**
 * 发送消息基本信息
 * @interface SendMessageBasicParams
 * @property {string} [priority = ChatEngine.TYPES.MSG_PRIORITY_NORMAL] 消息优先级
 * @property {object} payload 消息内容的容器
 * @property {string} [cloudCustomData] 消息自定义数据
 * @property {boolean} [needReadReceipt] 是否支持消息已读回执
 * @param {Array<string>} [receiverList] 定向接收消息的群成员列表（社群和直播群不支持）
*/
interface SendMessageBasicParams {
  priority?: TencentCloudChat.TYPES.MSG_PRIORITY_LOWEST
    | TencentCloudChat.TYPES.MSG_PRIORITY_LOW
    | TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL
    | TencentCloudChat.TYPES.MSG_PRIORITY_HIGH;
  payload: any;
  cloudCustomData?: string;
  needReadReceipt?: boolean;
  receiverList?: string[];
}

/**
 * 发送消息参数信息
 * @interface SendMessageParams
 * @property {string} [to] 消息接收方的 userID、groupID 或 topicID
 * @property {string} [conversationType] 会话类型，取值 ChatEngine.TYPES.CONV_C2C（端到端会话） 或 ChatEngine.TYPES.CONV_GROUP（群组会话）
 * @property {string} [priority = ChatEngine.TYPES.MSG_PRIORITY_NORMAL] 消息优先级
 * @property {object} payload 消息内容的容器
 * @property {string} [cloudCustomData] 消息自定义数据
 * @property {boolean} [needReadReceipt] 是否支持消息已读回执
 * @param {Array<string>} [receiverList] 定向接收消息的群成员列表（社群和直播群不支持）
*/
export interface SendMessageParams extends SendMessageBasicParams {
  to?: string;
  conversationType?: TencentCloudChat.TYPES.CONV_C2C | TencentCloudChat.TYPES.CONV_GROUP;
}

/**
 * 合并转发消息参数选项
 * @interface SendForwardMessageMergeInfo
 * @property {string} [title] 合并转发合并的标题
 * @property {Array<string>} [abstractList] 合并转发摘要列表，不同的消息类型可以设置不同的摘要信息
 * @property {string} [compatibleText] 合并转发兼容文本
*/
export interface SendForwardMessageMergeInfo {
  title?: string;
  abstractList?: string[];
  compatibleText?: string;
}

/**
 * 转发消息发送选项
 * @interface SendForwardMessageOptions
 * @property {boolean} [needMerge] 是否合并转发. 默认: false, true: 合并转发， false: 逐条转发
 * @property {Record<string, any>} [mergeInfo] 合并转发配置项，needMerge = true 时生效。v2.2.3 起支持
 * @property {string} [mergeInfo.title] 合并转发合并的标题
 * @property {Array<string>} [mergeInfo.abstractList] 合并转发摘要列表，不同的消息类型可以设置不同的摘要信息
 * @property {string} [mergeInfo.compatibleText] 合并转发兼容文本
 * @property {Record<string, any>} [params] 消息参数选项
 * @property {string} [params.priority] 消息优先级
 * @property {string} [params.cloudCustomData] 消息自定义数据
 * @property {boolean} [params.needReadReceipt] 是否支持消息已读回执
 * @property {Array<string>} [params.receiverList] 定向接收消息的群成员列表（社群和直播群不支持）
 * @property {boolean} [onlineUserOnly] 消息是否仅发送给在线用户的标识，默认值为 false；设置为 true，则消息既不存漫游，也不会计入未读，也不会离线推送给接收方。
 * @property {OfflinePushInfo} [offlinePushInfo] 离线推送配置
 * @property {MessageControlInfo} [messageControlInfo] 消息控制
*/
export interface SendForwardMessageOptions extends SendMessageOptions {
  needMerge?: boolean;
  params?: {
    priority?: TencentCloudChat.TYPES.MSG_PRIORITY_LOWEST
      | TencentCloudChat.TYPES.MSG_PRIORITY_LOW
      | TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL
      | TencentCloudChat.TYPES.MSG_PRIORITY_HIGH;
    cloudCustomData?: string;
    needReadReceipt?: boolean;
    receiverList?: string[];
  };
  mergeInfo?: SendForwardMessageMergeInfo;
  [key: string]: any;
}

/**
 * 离线推送配置
 * @interface OfflinePushInfo
 * @property {boolean} [disablePush] true 关闭离线推送；false 开启离线推送（默认）
 * @property {boolean} [disableVoipPush] true 关闭 voip 推送（默认）；false 开启 voip 推送（开启 voip 推送需要同时开启离线推送）
 * @property {string} [title] 离线推送标题。该字段为 iOS 和 Android 共用
 * @property {string} [description] 离线推送内容。该字段会覆盖消息实例的离线推送展示文本。若发送的是自定义消息，该 description 字段会覆盖 message.payload.description。如果 description 和 message.payload.description 字段都不填，接收方将收不到该自定义消息的离线推送
 * @property {string} [extension] 离线推送透传内容
 * @property {boolean} [ignoreIOSBadge] 离线推送忽略 badge 计数（仅对 iOS 生效），如果设置为 true，在 iOS 接收端，这条消息不会使 APP 的应用图标未读计数增加
 * @property {string} [androidOPPOChannelID] 离线推送设置 OPPO 手机 8.0 系统及以上的渠道 ID
*/
export interface OfflinePushInfo {
  disablePush?: boolean;
  disableVoipPush?: boolean;
  title?: string;
  description?: string;
  extension?: string;
  ignoreIOSBadge?: boolean;
  androidOPPOChannelID?: string;
}

/**
 * 消息控制
 * @interface MessageControlInfo
 * @property {boolean} [excludedFromUnreadCount] true 消息不更新会话 unreadCount（消息存漫游），默认值为 false；
 * @property {boolean} [excludedFromLastMessage] true 消息不更新会话 lastMessage（消息存漫游），默认值为 false；
 * @property {boolean} [excludedFromContentModeration] 消息是否不过内容审核（包含【本地审核】和【云端审核】）
 * - 只有在开通【本地审核】或【云端审核】功能后，excludedFromContentModeration 设置才有效，设置为 true，消息不过内容审核，设置为 false 消息过内容审核
 * - 【本地审核】开通流程请参考 本地审核功能
 * - 【云端审核】开通流程请参考 云端审核功能
*/
export interface MessageControlInfo {
  excludedFromUnreadCount?: boolean;
  excludedFromLastMessage?: boolean;
  excludedFromContentModeration?: boolean;
}

/**
 * 消息发送选项
 * @interface SendMessageOptions
 * @property {boolean} [onlineUserOnly] 消息是否仅发送给在线用户的标识，默认值为 false；设置为 true，则消息既不存漫游，也不会计入未读，也不会离线推送给接收方。
 * @property {OfflinePushInfo} [offlinePushInfo] 离线推送配置
 * @property {MessageControlInfo} [messageControlInfo] 消息控制
*/
export interface SendMessageOptions {
  onlineUserOnly?: boolean;
  offlinePushInfo?: OfflinePushInfo;
  messageControlInfo?: MessageControlInfo;
}

/**
 * 消息翻译参数信息
 * @interface TranslateTextParams
 * @property {Array<string>} sourceTextList 待翻译文本数组
 * @property {string} [sourceLanguage = auto] 源语言，可以设置为特定语言或 "auto"。"auto" 表示自动识别源语言。
*/
export interface TranslateTextParams {
  sourceTextList: string[];
  sourceLanguage?: string;
}

/**
 * 语音转文字参数信息
 * @interface ConvertVoiceToTextParams
 * @property {IMessageModel} message 音频消息
 * @property {string} [language = zh] 转换的目标语言，默认转成中文，其他可选值：en-US、yue-Hant-HK、ja-JP。
*/
export interface ConvertVoiceToTextParams {
  message: IMessageModel;
  language?: string;
}

export enum ISearchType {
  MESSAGE = 'message',
  CHAT_MESSAGE = 'chat_message',
  USER = 'user',
  GROUP = 'group',
}

export enum MessageType {
  MSG_TEXT = TencentCloudChat.TYPES.MSG_TEXT,
  MSG_IMAGE = TencentCloudChat.TYPES.MSG_IMAGE,
  MSG_SOUND = TencentCloudChat.TYPES.MSG_AUDIO,
  MSG_FILE = TencentCloudChat.TYPES.MSG_FILE,
  MSG_VIDEO = TencentCloudChat.TYPES.MSG_VIDEO,
  MSG_LOCATION = TencentCloudChat.TYPES.MSG_LOCATION,
  MSG_CUSTOM = TencentCloudChat.TYPES.MSG_CUSTOM,
  MSG_MERGER = TencentCloudChat.TYPES.MSG_MERGER,
}

export enum GroupType {
  GRP_WORK = TencentCloudChat.TYPES.GRP_WORK,
  GRP_PUBLIC = TencentCloudChat.TYPES.GRP_PUBLIC,
  GRP_MEETING = TencentCloudChat.TYPES.GRP_MEETING,
  GRP_COMMUNITY = TencentCloudChat.TYPES.GRP_COMMUNITY,
}

interface ISearchCloudMessagesResultBase<T extends ISearchType> {
  totalCount: number;
  params: ISearchParamsMap[T];
}

export interface ISearchCloudMessagesResultItem {
  messageList: IMessageModel[];
  messageCount: number;
  conversation?: IConversationModel;
}

export interface ISearchCloudUsersResultItem {
  profile: Profile;
  relation: TencentCloudChat.TYPES.SNS_TYPE_NO_RELATION
    | TencentCloudChat.TYPES.SNS_TYPE_A_WITH_B
    | TencentCloudChat.TYPES.SNS_TYPE_B_WITH_A
    | TencentCloudChat.TYPES.SNS_TYPE_BOTH_WAY;
}

export interface ISearchCloudGroupsResultItem {
  groupInfo: Group;
  conversation?: IConversationModel;
}

export interface IResultMap {
  [ISearchType.MESSAGE]: ISearchCloudMessagesResultItem[];
  [ISearchType.CHAT_MESSAGE]: ISearchCloudMessagesResultItem[];
  [ISearchType.USER]: ISearchCloudUsersResultItem[];
  [ISearchType.GROUP]: ISearchCloudGroupsResultItem[];
}

export interface ISearchResult<T extends ISearchType> extends ISearchCloudMessagesResultBase<T> {
  resultList: IResultMap[T] | [];
  hasMore: boolean;
  cursor: string;
}

export interface ISearchParamsMap {
  [ISearchType.MESSAGE]: SearchCloudMessagesParams;
  [ISearchType.CHAT_MESSAGE]: SearchCloudMessagesParams;
  [ISearchType.USER]: SearchCloudUsersParams;
  [ISearchType.GROUP]: SearchCloudGroupsParams;
}

interface BaseSearchCloudParams {
  keyword?: string;
  keywordList?: string[];
  keywordListMatchType?: 'or' | 'and';
  cursor?: string;
  count?: number;
}

/**
 * 搜索云端消息参数
 * @interface SearchCloudMessagesParams
 * @property {string} [keyword] 关键字列表。
 * @property {Array<string>} [senderUserIDList] 指定 userID 发送的消息，最多支持 5 个。
 * @property {Array<string>} [messageTypeList] 指定搜索的消息类型集合，默认搜索全部类型。
 *  - 不传入时，表示搜索支持的全部类型消息（TencentCloudChat.TYPES.MSG_FACE、TencentCloudChat.TYPES.MSG_GRP_TIP 和 TencentCloudChat.TYPES.MSG_GRP_SYS_NOTICE 不支持）
 *  - 传值时，取值详见 [TencentCloudChat.TYPES](https://web.sdk.qcloud.com/im/doc/v3/zh-cn/module-TYPES.html)。
 * @property {string} [conversationID] 搜索“全部会话”还是搜索“指定的会话”，不传入时，表示全部会话，默认：全部会话。会话 ID 组成方式：
 * - `C2C${userID}`（单聊）
 * - `GROUP${groupID}`（群聊）
 * - 社群、topic、直播群，不支持搜索云端消息
 * @property {number} [timePosition] 搜索的起始时间点。默认为 0 即代表从现在开始搜索。单位：秒
 * @property {number} [timePeriod] 从起始时间点开始的过去时间范围，单位秒。默认为 0 即代表不限制时间范围，传 24 * 60 * 60 代表过去一天。
 * @property {string} [cursor] 每次云端搜索的起始位置。第一次搜索时不要传入 cursor，继续搜索时填入上次调用 searchCloudMessages 接口返回的 cursor 的值
 * - 注意：全量搜索时，cursor 的有效期为 2 分钟。
*/
export interface SearchCloudMessagesParams extends BaseSearchCloudParams {
  senderUserIDList?: string[];
  messageTypeList?: any[];
  conversationID?: string;
  timePosition?: number;
  timePeriod?: number;
}

/**
 * 搜索云端用户参数
 * @interface SearchCloudUsersParams
 * @property {String} keyword 关键字。
 * @property {String} [gender] 用户性别，不传入时默认搜索所有性别用户。性别表示：
 * - TencentCloudChat.TYPES.GENDER_FEMALE 女性
 * - TencentCloudChat.TYPES.GENDER_MALE 男性
 * @property {Number} [miniBirthday] 用户最小生日，如 19900101
 * @property {Number} [maxBirthday] 用户最大生日，与 miniBirthday 同时设置时则必须大于等于 miniBirthday，如 20240101
 * @property {String} [cursor] 每次云端搜索的起始位置。第一次搜索时不要传入 cursor，继续搜索时填入上次调用 searchCloudUsers 接口返回的 cursor 的值
 * - 注意：cursor 的有效期为 2 分钟。
 * @property {Number} [count] 每次云端搜索结果的数量，默认值为 20, 最大值为100。
*/
export interface SearchCloudUsersParams extends BaseSearchCloudParams {
  gender?: string;
  miniBirthday?: number;
  maxBirthday?: number;
}

/**
 * 搜索云端群组参数
 * @interface SearchCloudGroupsParams
 * @property {String} keyword 关键字列表。
 * @property {Array<String>} [groupTypeList] 不传入时默认搜索所有类型群组（不支持直播群（TencentCloudChat.TYPES.GRP_AVCHATROOM）类型的搜索）。群类型表示：
 * - TencentCloudChat.TYPES.GRP_WORK 好友工作群
 * - TencentCloudChat.TYPES.GRP_PUBLIC 陌生人社交群
 * - TencentCloudChat.TYPES.GRP_MEETING 临时会议群
 * - TencentCloudChat.TYPES.GRP_COMMUNITY 社群
 * @property {String} [cursor] 每次云端搜索的起始位置。第一次搜索时不要传入 cursor，继续搜索时填入上次调用 searchCloudGroups 接口返回的 cursor 的值
 * - 注意：cursor 的有效期为 2 分钟。
 * @property {Number} [count] 每次云端搜索结果的数量，默认值为 20, 最大值为100。
*/
export interface SearchCloudGroupsParams extends BaseSearchCloudParams {
  groupTypeList?: any[];
}

/**
 * 搜索云端群组参数
 * @interface SearchCloudGroupMembersParams
 * @property {String} keyword 关键字。
 * @property {Array<String>} [groupTypeList] 搜索的群组类型列表，不传入时默认搜索所有类型群组（不支持直播群（TencentCloudChat.TYPES.GRP_AVCHATROOM）类型的搜索）。群类型表示：
 * - TencentCloudChat.TYPES.GRP_WORK 好友工作群
 * - TencentCloudChat.TYPES.GRP_PUBLIC 陌生人社交群
 * - TencentCloudChat.TYPES.GRP_MEETING 临时会议群
 * - TencentCloudChat.TYPES.GRP_COMMUNITY 社群
 * @property {Array<String>} [groupIDList] 搜索指定群 ID 列表，不传入时默认搜索所有群组
 * @property {String} [cursor] 每次云端搜索的起始位置。第一次搜索时不要传入 cursor，继续搜索时填入上次调用 searchCloudGroups 接口返回的 cursor 的值
 * - 注意：cursor 的有效期为 2 分钟。
 * @property {Number} [count] 每次云端搜索结果的数量，默认值为 20, 最大值为100。
*/
export interface SearchCloudGroupMembersParams extends BaseSearchCloudParams {
  groupTypeList?: string[];
  groupIDList?: string[];
}

/**
 * 转发消息参数信息
 * @interface ForwardMessageParams
 * @property {string} to 消息接收方的 userID、groupID 或 topicID
 * @property {string} conversationType 会话类型
 * @property {string} [priority] 消息优先级
 * @property {Message} payload 待转发的消息
*/
export interface ForwardMessageParams {
  to: string;
  conversationType: TencentCloudChat.TYPES.CONV_C2C | TencentCloudChat.TYPES.CONV_GROUP;
  priority?: TencentCloudChat.TYPES;
  payload: Message;
}

/**
 * 获取会话历史消息参数信息
 * @interface GetMessageListParams
 * @property {string} [conversationID] 会话ID
 * @property {string} [nextReqMessageID] 用于分页续拉的参数。续拉时填入上次调用 getMessageList 接口返回的该字段的值。
*/
export interface GetMessageListParams {
  conversationID: string;
  nextReqMessageID: string;
}

/**
 * 根据指定的消息 sequence 或 消息时间拉取会话的消息列表参数信息
 * @interface GetMessageListHoppingParams
 * @property {string} conversationID 会话ID
 * @property {number} [sequence] 用于拉群组会话漫游消息的起始 sequence。
 * @property {number} [time] 消息的服务端时间，用于拉 C2C 会话漫游消息的起始时间。
 * @property {number} [direction=0] 消息拉取方向，默认 0。
 * - 0 向上拉，拉更旧的消息
 * - 1 向下拉，拉更新的消息
 * @property {number} [count=15] 需要拉取的消息数量，默认值和最大值为15。
*/
export interface GetMessageListHoppingParams {
  conversationID: string;
  sequence?: number;
  time?: number;
  direction?: number;
  count?: number;
}

/**
 * 获取群消息已读（或未读）群成员列表
 * @interface GetGroupMessageReadParams
 * @property {IMessageModel}  message 群消息
 * @property {string} cursor 分页拉取的游标，第一次拉取传''
 * @property {number} filter 指定拉取已读或未读群成员列表。0 - 拉取已读成员列表；1 - 拉取未读成员列表
 * @property {number} count 分页拉取的个数，最大支持 100 个
*/
export interface GetGroupMessageReadParams {
  message: IMessageModel;
  filter: number;
  cursor: string;
  count: number;
}

/**
 * 批量拉取多条消息回应信息参数
 * @interface GetMessageReactionsParams
 * @property {Array<Message>} messageList 消息列表
 * @property {number} maxUserCountPerReaction 取值范围 [0,10]，每个 Reaction 最多只返回前 10 个用户信息，如需更多用户信息，可以按需调用 getAllUserListOfMessageReaction 接口分页拉取。
*/
export interface GetMessageReactionsParams {
  messageList: Message[];
  maxUserCountPerReaction?: number;
}

/**
 * 消息回应信息结构体
 * @interface ReactionInfo
 * @property {string} reactionID 消息回应 ID
 * @property {number} totalUserCount 同一个 reactionID 回应消息的总的用户个数
 * @property {Array<ReactionUserInfo>} partialUserList 同一个 reactionID 的部分用户列表，包含用户的 userID、nick、avatar 信息
*/
export interface ReactionInfo {
  reactionID: string;
  totalUserCount: number;
  partialUserList: ReactionUserInfo[];
}

interface ReactionUserInfo {
  userID: string;
  nick: string;
  avatar: string;
}

/**
 * 分页拉取指定消息回应的用户列表参数
 * @interface GetAllUserListOfMessageReactionParams
 * @property {IMessageModel}  message 消息实例 Model
 * @property {string} reatcionID 消息回应 ID
 * @property {number} nextSeq 分页拉取的起始位，第一次传 0，续拉时填入上次调用 getAllUserListOfMessageReaction 接口返回的该字段的值。
 * @property {number} [count=100] 一次分页拉取的用户个数，最大支持 100 个。
*/
export interface GetAllUserListOfMessageReactionParams {
  message: IMessageModel;
  reactionID: string;
  nextSeq: number;
  count?: number;
}

/**
 * messageModel 修改消息参数说明
 * @interface ModifyMessageParams
 * @property {TencentCloudChat.TYPES} [type] 修改后的消息类型
 * - 注意：修改 type 时，必须同步修改 payload
 * @property {any} [payload] 修改后的消息内容
 * @property {string} [cloudCustomData] 修改后的 cloudCustomData
 */
export interface ModifyMessageParams {
  type?: TencentCloudChat.TYPES;
  payload?: any;
  cloudCustomData?: string;
}

// group service
export interface GroupServiceBasicParams {
  groupID: string;
}
/**
 * GroupService 获取群资料参数信息
 * @interface GetGroupProfileParams
 * @property {string} groupID 群组 ID
 * @property {Array<string>} [groupCustomFieldFilter] 群组维度的自定义字段过滤器，指定需要获取的群组维度的自定义字段
*/
export interface GetGroupProfileParams extends GroupServiceBasicParams {
  groupCustomFieldFilter?: string[];
}

/**
 * GroupService 更新群资料参数信息
 * @interface UpdateGroupParams
 * @property {string} groupID 群组 ID
 * @property {string} [name] 群名称
 * @property {string} [avatar] 群头像
 * @property {string} [introduction] 群简介
 * @property {string} [notification] 群公告
 * @property {boolean} [muteAllMembers] 全体禁言
 * @property {string} [joinOption] 申请进群处理方式
 * @property {string} [inviteOption] 邀请进群处理方式
 * @property {Array<Record<string, string>>} [groupCustomField] 群自定义字段
*/
export interface UpdateGroupParams extends GroupServiceBasicParams {
  name?: string;
  avatar?: string;
  introduction?: string;
  notification?: string;
  muteAllMembers?: boolean;
  joinOption?: TencentCloudChat.TYPES.JOIN_OPTIONS_FREE_ACCESS
    | TencentCloudChat.TYPES.JOIN_OPTIONS_NEED_PERMISSION
    | TencentCloudChat.TYPES.JOIN_OPTIONS_DISABLE_APPLY;
  inviteOption?: TencentCloudChat.TYPES.JOIN_OPTIONS_FREE_ACCESS
    | TencentCloudChat.TYPES.JOIN_OPTIONS_NEED_PERMISSION
    | TencentCloudChat.TYPES.JOIN_OPTIONS_DISABLE_APPLY;
  groupCustomField?: Record<string, string>[];
}

/**
 * GroupService 转让参数信息
 * @interface ChangGroupOwnerParams
 * @property {string} groupID 群组 ID
 * @property {string} newOwnerID 新群主的 ID
*/
export interface ChangGroupOwnerParams extends GroupServiceBasicParams {
  newOwnerID: string;
}

/**
 * GroupService 群属性操作参数信息
 * @interface GroupAttrParams
 * @property {string} groupID 群组 ID
 * @property {Record<string, string>} groupAttributes 群属性 key-value 信息
*/
export interface GroupAttrParams extends GroupServiceBasicParams {
  groupAttributes: Record<string, string>;
}

/**
 * GroupService 设置群计数器参数信息
 * @interface SetCountersParams
 * @property {string} groupID 群组 ID
 * @property {Record<string, number>} counters 群计数器 key-value 信息
*/
export interface SetCountersParams extends GroupServiceBasicParams {
  counters: Record<string, number>;
}

/**
 * GroupService 递增/递减群计数器参数信息
 * @interface CountersParams
 * @property {string} groupID 群组 ID
 * @property {string} key 群计数器 key
 * @property {number} value 群计数器 key 对应的 value
*/
export interface CountersParams extends GroupServiceBasicParams {
  key: string;
  value: number;
}

/**
 * GroupService 申请加群参数信息
 * @interface JoinGroupParams
 * @property {string} groupID 群组 ID
 * @property {string} [applyMessage = ''] 申请加群附言
*/
export interface JoinGroupParams extends GroupServiceBasicParams {
  applyMessage?: string;
}

export interface KeyListParams extends GroupServiceBasicParams {
  keyList: string[];
}

/**
 * GroupService 创建群组参数信息
 * @interface CreateGroupParams
 * @property {string} name 群名称
 * @property {string} type 群类型
 * @property {string} [groupID] 群组 ID，可以自定义，不传则由系统自动生成
 * @property {string} [avatar] 群头像
 * @property {string} [introduction] 群简介
 * @property {string} [notification] 群公告
 * @property {number} [maxMemberNum] 最大群成员数量，缺省时的默认值：好友工作群是200，陌生人社交群是2000，临时会议群是10000，直播群无限制
 * @property {string} [joinOption] 申请进群选项
 * @property {Array<GroupMemberItem>} [memberList] 初始群成员列表，最多500个。创建直播群时不能添加成员
 * @property {Array<any>} [groupCustomField] 群组维度的自定义字段，默认情况是没有的，需要开通
 * @property {boolean} [isSupportTopic] true - 创建支持话题的社群 false - 创建普通社群。
*/
export interface CreateGroupParams {
  name: string;
  type: string;
  groupID?: string;
  introduction?: string;
  notification?: string;
  avatar?: string;
  maxMemberNum?: number;
  joinOption: string;
  memberList?: GroupMemberItem[];
  groupCustomField?: any[];
  isSupportTopic?: boolean;
}

/**
 * GroupService 创建群组默认群成员列表参数信息
*/
interface GroupMemberItem {
  userID: string;
  role?: string;
  memberCustomField?: any[];
}

/**
 * GroupService 处理申请加群/邀请加群参数信息
 * @interface handleGroupApplicationParams
 * @property {string} handleAction 处理结果 Agree(同意) / Reject(拒绝)
 * @property {string} [handleMessage] 附言
 * @property {object} application 加群申请/邀请进群申请信息
*/
export interface handleGroupApplicationParams {
  handleAction: 'Agree' | 'Reject';
  handleMessage?: string;
  application: any;
}

// group member
/**
 * GroupService 获取群成员列表参数信息
 * @interface GetMemberListParams
 * @property {string} groupID 群组 ID
 * @property {number} [count = 15] 需要拉取的数量。最大值：100，避免回包过大导致请求失败。若传入超过100，则只拉取前100个。
 * @property {number|string} [offset = 0] 偏移量，默认从0开始拉取，社群（Community）使用时该字段为 String 类型。
 * @property {number} [filter] 群成员自定义标记，仅直播群（AVChatRoom）支持。
*/
export interface GetMemberListParams extends GroupServiceBasicParams {
  count?: number;
  offset?: number | string;
  filter?: number;
}

/**
 * GroupService 获取群成员参数信息
 * @interface GetMemberProfileParams
 * @property {string} groupID 群组 ID
 * @property {Array<string>} userIDList 要查询的群成员用户 ID 列表
 * @property {Array<string>} [memberCustomFieldFilter] 群成员自定义字段筛选。可选，若不填，则默认查询所有群成员自定义字段。
*/
export interface GetMemberProfileParams extends GroupServiceBasicParams {
  userIDList: string[];
  memberCustomFieldFilter?: string[];
}

/**
 * GroupService 邀请群成员参数信息
 * @interface AddMemberParams
 * @property {string} groupID 群组 ID
 * @property {Array<string>} userIDList 待添加的群成员 ID 数组。
*/
export interface AddMemberParams extends GroupServiceBasicParams {
  userIDList: string[];
}

/**
 * GroupService 删除群成员参数信息
 * @interface DeleteMemberParams
 * @property {string} groupID 群组 ID
 * @property {Array<string>} userIDList 待删除的群成员的 ID 列表，单次请求最大支持 20 个群成员
 * @property {string} [reason] 踢人的原因
 * @property {number} [duration] 踢出时长，在该时间段内被踢用户不能再次加群。单位：秒，仅直播群支持。
*/
export interface DeleteMemberParams extends GroupServiceBasicParams {
  userIDList: string[];
  reason?: string;
  duration?: number;
}

/**
 * GroupService 设置群成员禁言参数信息
 * @interface SetMemberMuteParams
 * @property {string} groupID 群组 ID
 * @property {string} userID 群成员 ID
 * @property {number} muteTime 禁言时长，单位秒。如设为1000，则表示从现在起禁言该用户1000秒；设为0，则表示取消禁言。
*/
export interface SetMemberMuteParams extends GroupServiceBasicParams {
  userID: string;
  muteTime: number;
}

/**
 * GroupService 设置群成员角色参数信息
 * @interface SetMemberRoleParams
 * @property {string} groupID 群组 ID
 * @property {string} userID 群成员 ID
 * @property {string} role ChatEngine.TYPES.GRP_MBR_ROLE_ADMIN（群管理员）,ChatEngine.TYPES.GRP_MBR_ROLE_MEMBER（群普通成员）,ChatEngine.TYPES.GRP_MBR_ROLE_CUSTOM（自定义群成员角色，仅社群支持）
*/
export interface SetMemberRoleParams extends GroupServiceBasicParams {
  userID: string;
  role: TencentCloudChat.TYPES;
}

/**
 * GroupService 设置群成员名片参数信息
 * @interface SetMemberNameCardParams
 * @property {string} groupID 群组 ID
 * @property {string} [userID] 群成员 ID，可选，默认修改自己的群名片，群主或群管理员可设置其他成员的群名片。
 * @property {string} nameCard 群成员名片
*/
export interface SetMemberNameCardParams extends GroupServiceBasicParams {
  userID?: string;
  nameCard: string;
}

/**
 * GroupService 设置群成员自定义字段参数信息
 * @interface SetMemberCustomFiledParams
 * @property {string} groupID 群组 ID
 * @property {string} [userID] 群成员 ID
 * @property {Array<Record<string, string>>} memberCustomField 群成员自定义字段
 * @property {string} memberCustomField.key 自定义字段的 Key
 * @property {string} memberCustomField.value 自定义字段的 value
*/
export interface SetMemberCustomFiledParams extends GroupServiceBasicParams {
  userID?: string;
  memberCustomField: Record<string, string>[];
}

/**
 * GroupService 标记群成员参数信息
 * @interface MarkMemberParams
 * @property {string} groupID 群组 ID
 * @property {Array<string>} userIDList 群成员 userID 列表，单次请求最多 500 个群成员。
 * @property {number} markType 标记类型。大于等于 1000，您可以自定义，一个直播群里最多允许定义 10 个标记。
 * @property {boolean} enableMark true 表示添加标记，false 表示移除标记。
*/
export interface MarkMemberParams extends GroupServiceBasicParams {
  userIDList: string[];
  markType: number;
  enableMark: boolean;
}

// friendship
/**
 * 好友信息
 * @interface Friend
 * @property {string} userID 好友 ID
 * @property {string} source 好友来源
 * @property {string} remark 好友备注
 * @property {Array<any>} groupList 好友分组列表
 * @property {string} wording 加好友附言
 * @property {any} profile 好友资料
 * @property {Array<any>} friendCustomFriend 自定义好友字段键值对集合
*/
export interface Friend {
  userID: string;
  remark: string;
  groupList: any[];
  source: string;
  wording: string;
  profile: any;
  friendCustomFriend: any[];
}

/**
 * 好友申请信息
 * @interface FriendApplication
 * @property {string} userID 用户 ID
 * @property {string} avatar 用户头像
 * @property {string} nick 好友申请昵称
 * @property {number} time 好友申请时间
 * @property {string} source 好友申请来源
 * @property {string} wording 好友申请附言
 * @property {string} type 好友申请的类型
*/
export interface FriendApplication {
  userID: string;
  avatar: string;
  nick: string;
  time: number;
  source: string;
  wording: string;
  type: string;
}

/**
 * 添加好友参数信息
 * @interface addFriendParams
 * @property {string} to 用户 ID
 * @property {string} source 好友来源
 * @property {string} [remark = ''] 好友备注（备注长度最长不得超过 96 个字节）
 * @property {string} [groupName = ''] 好友分组名（分组名长度不得超过 30 个字节）
 * @property {string} [wording = ''] 加好友附言（加好友附言的长度最长不得超过 256 个字节）
 * @property {TencentCloudChat.TYPES} [type] 加好友方式(默认双向加好友方式)
*/
export interface AddFriendParams {
  to: string;
  source: string;
  remark?: string;
  groupName?: string;
  wording?: string;
  type?: TencentCloudChat.TYPES;
}

/**
 * 删除好友参数信息
 * @interface deleteFriendParams
 * @property {Array<string>} userIDList 用户 ID 列表
 * @property {TencentCloudChat.TYPES} [type] 删除模式（默认双向删除好友）
*/
export interface DeleteFriendParams {
  userIDList: string[];
  type?: TencentCloudChat.TYPES;
}

/**
 * 校验好友关系参数信息
 * @interface CheckFriendParams
 * @property {Array<string>} userIDList 用户 ID 列表
 * @property {TencentCloudChat.TYPES} [type] 校验模式（默认双向校验好友关系）
*/
export interface CheckFriendParams {
  userIDList: string[];
  type: Partial<TencentCloudChat.TYPES>;
}

/**
 * 获取好友资料参数信息
 * @interface GetFriendProfileParams
 * @property {Array<string>} userIDList 用户 ID 列表
*/
export interface GetFriendProfileParams {
  userIDList: string[];
}

/**
 * 更新好友关系链数据参数信息
 * @interface UpdateFriendParams
 * @property {string} userID 用户 ID
 * @property {string} [remark = ''] 好友备注（备注长度最长不得超过 96 个字节）
 * @property {Array<any>} [friendCustomField] 好友自定义字段键值对集合，可根据业务侧需要使用
*/
export interface UpdateFriendParams {
  userID: string;
  remark?: string;
  friendCustomField?: any[];
}

/**
 * 同意好友申请参数信息
 * @interface AcceptFriendApplicationParams
 * @property {string} userID 待同意的好友申请的 userID
 * @property {string} [remark = ''] 给好友设置的备注
 * @property {TencentCloudChat.TYPES} type 同意方式
*/
export interface AcceptFriendApplicationParams {
  userID: string;
  remark?: string;
  type: TencentCloudChat.TYPES;
}

/**
 * 删除好友申请参数信息
 * @interface DeleteFriendApplicationParams
 * @property {string} userID 待删除的好友申请的 userID
 * @property {TencentCloudChat.TYPES} type 好友申请的类型
*/
export interface DeleteFriendApplicationParams {
  userID: string;
  type: TencentCloudChat.TYPES;
}

/**
 * 好友分组信息
 * @interface FriendGroup
 * @property {string} name 好友分组名称
 * @property {Array<Friend>} friendList 好友分组下的好友列表
 * @property {number} count 好友分组下的好友数量
 */
export interface FriendGroup {
  name: string;
  friendList: Friend[];
  count: number;
}

/**
 * 好友分组参数信息
 * @interface FriendGroupParams
 * @property {string} name 好友分组名称
 * @property {Array<Profile>} userIDList 好友分组下的好友列表
 */
export interface FriendGroupParams {
  name: string;
  userIDList: string[];
}

/**
 * 重命名好友分组参数信息
 * @interface RenameFriendGroupParams
 * @property {string} oldName 原好友分组名称
 * @property {string} newName 新好友分组名称
 */
export interface RenameFriendGroupParams {
  oldName: string;
  newName: string;
}
