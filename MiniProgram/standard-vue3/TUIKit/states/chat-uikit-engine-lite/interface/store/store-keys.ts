/**
 * @property {Boolean} enableTyping 正在输入功能是否开启，默认开启 true
 * @property {Boolean} enabledMessageReadReceipt 消息已读回执功能是否已开启，默认 false，购买旗舰版套餐后开启
 * @property {Boolean} enabledEmojiPlugin 表情回复插件能力是否已开启，默认 false，购买旗舰版套餐后开启
 * @property {Boolean} enabledOnlineStatus 用户在线状态能力是否已开启，默认 false，购买旗舰版套餐后开启
 * @property {Boolean} enabledCustomerServicePlugin 客服插件能力是否已开启，默认 false，购买客服插件后开启
 * @property {Boolean} enabledTranslationPlugin 文本消息翻译能力是否已开启，默认 false，购买翻译插件后开启
 * @property {Boolean} enableConversationDraft 会话草稿功能是否开启，默认开启 true
 * @example
 * // UI 层调用以下逻辑关闭正在输入功能
 * TUIStore.update(StoreName.APP, 'enableTyping', false);
 * @example
 * // UI 层调用以下逻辑关闭会话草稿功能
 * TUIStore.update(StoreName.APP, 'enableConversationDraft', false);
 */
export enum AppStore {}

/**
 * @property {String} currentConversationID 当前会话ID
 * @property {Array<IConversationModel>} conversationList 会话列表
 * @property {Number} totalUnreadCount 会话未读总数
 * @example
 * // UI 层监听会话列表更新通知
 * let onConversationListUpdated = function(conversationList) {
 *   console.warn(conversationList);
 * }
 * TUIStore.watch(StoreName.CONV, {
 *   conversationList: onConversationListUpdated,
 * })
 */
export enum ConversationStore {}

/**
 * @property {Array<IMessageModel>} messageList 消息列表
 * @property {Boolean} isCompleted 漫游是否拉完（用于控制‘查看更多’按钮显示）
 * @property {Message | any} quoteMessage 被引用的消息信息，引用消息时会触发更新
 * @property {Boolean} typingStatus 正在输入的状态标识， 默认 false，开启正在输入状态后，输入消息时会触发更新
 * @property {IMessageModel} messageSource 用于消息云端搜索结果跳转至指定消息标识
 * @property {Array<Message>} newMessageList 新消息通知列表，提供给 TUINotification 组件使用
 * @property {Record<string, string | undefined | boolean>} translateTextInfo 文本消息翻译信息
 * @example
 * // UI 层监听当前会话消息列表更新通知
 * let onMessageListUpdated = function(messageList) {
 *   console.warn(messageList);
 * }
 * TUIStore.watch(StoreName.CHAT, {
 *   messageList: onMessageListUpdated,
 * })
 * @example
 * // UI 层更新消息云端搜索结果跳转至指定消息标识
 * TUIStore.update(StoreName.CHAT, 'messageSource', message);
 * // UI 层监听消息云端搜索结果跳转至指定消息标识
 * let onMessageSourceUpdated = function(message) {
 *   console.warn(message);
 * }
 * TUIStore.watch(StoreName.CHAT, {
 *   messageSource: onMessageSourceUpdated,
 * })
 * @example
 * // UI 层更新文本消息翻译信息
 * TUIStore.update(StoreName.CHAT, 'translateTextInfo', {
 *   conversationID: 'xxx',
 *   messageID: 'xxx',
 *   visible: false,
 * });
 * // UI 层监听文本消息翻译更新通知
 * let onTranslateTextInfoUpdated = function(info) {
 *   // info 返回的是 map 或 undefined
 *   if (info) {
 *     const list = info.get('conversationID') || [];
 *     list.forEach(item => {
 *       const { messageID, visible } = item;
 *       // messageID - 当前操作的消息的 ID
 *       // visible - 是否显示翻译文本
 *     }
 *   }
 * }
 * TUIStore.watch(StoreName.CHAT, {
 *   translateTextInfo: onTranslateTextInfoUpdated,
 * })
 */
export enum ChatStore {}

/**
 * @property {String} currentGroupID 当前群组ID
 * @property {Group} currentGroup 当前群组信息
 * @property {Array} currentGroupMemberList 当前群组群成员列表
 * @property {Object} currentGroupAttributes 当前群组群属性信息
 * @property {Object} currentGroupCounters 当前群组计数器信息
 * @property {Array<Group>} groupList 群组列表
 * @property {Array<Message>} groupSystemNoticeList 群组系统通知列表（注意：Store 中不会存储群系统通知，即时通知）
 * @example
 * // UI 层监听群组列表更新通知
 * let onGroupListUpdated = function(groupList) {
 *   console.warn(groupList);
 * }
 * TUIStore.watch(StoreName.GRP, {
 *   groupList: onGroupListUpdated,
 * })
 */
export enum GroupStore {}

/**
 * @property {Object} userProfile 当前登录用户的资料信息
 * @property {Boolean} displayOnlineStatus 是否开启用户状态显示，默认 false：关闭
 * @property {Boolean} displayMessageReadReceipt 是否开启消息阅读状态显示，默认 true：开启
 * @property {String} kickedOut 用户被踢的类型信息
 * @property {String} netStateChange 网络状态变更信息
 * @property {Map<key, statusInfo>} userStatusList 订阅用户的状态信息的列表
 * - key 用户 userID
 * - statusInfo.statusType 用户当前状态
 * - statusInfo.customStatus 用户自定义状态
 * @property {Array<string>} userBlacklist 用户黑名单列表，UI 组件层可以通过监听该属性来获取用户黑名单列表
 * @example
 * // UI 层监听网络变更通知
 * let onNetStateChange = function(state) {
 *   console.warn(state);
 * }
 * TUIStore.watch(StoreName.USER, {
 *   netStateChange: onNetStateChange,
 * })
*/
export enum UserStore {}

/**
 * @property {Array<Friend>} friendList 好友列表，UI 组件层可以通过监听该属性来获取好友列表
 * @property {Array<FriendApplication>} friendApplicationList 好友申请列表，UI 组件层可以通过监听该属性来获取好友申请列表
 * @property {number} friendApplicationUnreadCount 好友申请未读数，UI 组件层可以通过监听该属性来获取好友申请未读数
 * @example
 * // UI 层监听好友列表更新变更通知
 * let onFriendListUpdated = function(friendList) {
 *   console.warn(friendList);
 * }
 * TUIStore.watch(StoreName.FRIEND, {
 *   friendList: onFriendListUpdated ,
 * })
 */
export enum FriendStore {}
