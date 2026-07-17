/**
 * @property {String} APP 应用级别的数据管理，主要用于某些功能的全局开关控制。
 * @property {String} CONV 会话数据管理
 * @property {String} CHAT 聊天数据管理
 * @property {String} GRP  群组数据管理
 * @property {String} USER 用户数据管理
 * @property {String} FRIEND 好友数据管理
 * @property {String} SEARCH 搜索数据管理
 * @property {String} CUSTOM 自定义数据管理，业务侧可根据需要添加自定义 key-value。
*/
export enum StoreName {
  APP = 'application',
  CONV = 'conversation',
  CHAT = 'chat',
  GRP = 'group',
  USER = 'user',
  FRIEND = 'friend',
  SEARCH = 'search',
  CUSTOM = 'custom',
}
