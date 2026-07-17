import type {
  AddMemberParams,
  ChangGroupOwnerParams,
  CountersParams,
  CreateGroupParams,
  DeleteMemberParams,
  GetGroupProfileParams,
  GetMemberListParams,
  GetMemberProfileParams,
  GroupAttrParams,
  JoinGroupParams,
  KeyListParams,
  MarkMemberParams,
  SetCountersParams,
  SetMemberCustomFiledParams,
  SetMemberMuteParams,
  SetMemberNameCardParams,
  SetMemberRoleParams,
  UpdateGroupParams,
  handleGroupApplicationParams,
} from '../../type';

/**
 * @interface TUIGroupService
*/
export interface ITUIGroupService {
  /**
   * 初始化 Service
   * @function
   * @private
   */
  init(): void;

  /**
   * 切换群组
   * @function
   * @param {String} groupID 群组ID
   * @example
   * // 切换到 group1 群
   * let promise = TUIGroupService.switchGroup('group1');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  switchGroup(groupID: string): void;

  /**
   * 获取群详细资料
   * @function
   * @param {GetGroupProfileParams} options 获取群详细资料参数
   * @example
   * let promise = TUIGroupService.getGroupProfile({
   *   groupID: 'group1',
   *   groupCustomFieldFilter: ['key1','key2']
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupProfile(options: GetGroupProfileParams): Promise<any>;

  /**
   * 更新群详细资料
   * @function
   * @param {UpdateGroupParams} options 更新群详细资料参数
   * @example
   * let promise = TUIGroupService.updateGroupProfile({
   *   groupID: 'group1',
   *   name: 'new name', // 修改群名称
   *   introduction: 'this is introduction.', // 修改群简介
   *   groupCustomField: [{ key: 'group_level', value: 'high'}] // 修改群组维度自定义字段
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   * @example
   * let promise = TUIGroupService.updateGroupProfile({
   *   groupID: 'group1',
   *   muteAllMembers: true, // true 表示全体禁言，false表示取消全体禁言
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  updateGroupProfile(options: UpdateGroupParams): Promise<any>;

  /**
   * 创建群组
   * @function
   * @param {CreateGroupParams} options 创建群组参数
   * @example
   * let promise = TUIGroupService.createGroup({
   *   type: TUIChatEngine.TYPES.GRP_WORK,
   *   name: 'newGroup',
   *   memberList: [{
   *     userID: 'user1',
   *     // 群成员维度的自定义字段，默认情况是没有的，需要开通，详情请参阅自定义字段
   *     memberCustomField: [{key: 'group_member_test', value: 'test'}]
   *   }, {
   *    userID: 'user2'
   *   }] // 如果填写了 memberList，则必须填写 userID
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  createGroup(options: CreateGroupParams): Promise<any>;

  /**
   * 解散群组
   * @function
   * @param {string} groupID 群组ID
   * @example
   * let promise = TUIGroupService.dismissGroup('group1');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  dismissGroup(groupID: string): Promise<any>;

  /**
   * 通过 groupID 搜索群组
   * @function
   * @param {string} groupID 群组ID
   * @example
   * let promise = TUIGroupService.searchGroupByID('group1');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  searchGroupByID(groupID: string): Promise<any>;

  /**
   * 申请加群
   * @function
   * @param {JoinGroupParams} options 加群参数
   * @example
   * let promise = TUIGroupService.joinGroup({
   *   groupID: 'group1',
   *   applyMessage: 'xxxx'
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  joinGroup(options: JoinGroupParams): Promise<any>;

  /**
   * 退出群组
   * @function
   * @param {string} groupID 群组ID
   * @example
   * let promise = TUIGroupService.quitGroup('group1');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  quitGroup(groupID: string): Promise<any>;

  /**
   * 获取加群申请和邀请进群申请列表
   * @function
   * @example
   * let promise = TUIGroupService.getGroupApplicationList();
   * promise.then(function(chatResponse) {
   *   const { applicationList } = chatResponse.data;
   *   applicationList.forEach((item) => {
   *     // item.applicant - 申请者 userID
   *     // item.applicantNick - 申请者昵称
   *     // item.groupID - 群 ID
   *     // item.groupName - 群名称
   *     // item.applicationType - 申请类型：0 加群申请，2 邀请进群申请
   *     // item.userID - applicationType = 2 时，是被邀请人的 userID
   *     // 接入侧可调用 handleGroupApplication 接口同意或拒绝加群申请
   *     TUIGroupService.handleGroupApplication({
   *       handleAction: 'Agree',
   *       application: {...item},
   *     });
   *   });
   * }).catch(function(imError) {
   *   // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupApplicationList(): Promise<any>;

  /**
   * 处理加群申请和邀请进群申请
   * @function
   * @param {handleGroupApplicationParams} options 处理申请加群参数
     * @example
   * // 通过获取未决列表处理加群申请
   * let promise = TUIGroupService.getGroupApplicationList();
   * promise.then(function(chatResponse) {
   *   const { applicationList } = chatResponse.data;
   *   applicationList.forEach((item) => {
   *     if (item.applicationType === 0) {
   *       TUIGroupService.handleGroupApplication({
   *         handleAction: 'Agree',
   *         application: {...item},
   *       });
   *     }
   *   });
   * }).catch(function(imError) {
   *   // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   * @example
   * // 通过获取未决列表处理邀请进群申请
   * let promise = TUIGroupService.getGroupApplicationList();
   * promise.then(function(chatResponse) {
   *   const { applicationList } = chatResponse.data;
   *   applicationList.forEach((item) => {
   *     if (item.applicationType === 2) {
   *       TUIGroupService.handleGroupApplication({
   *         handleAction: 'Agree',
   *         application: {...item},
   *       });
   *     }
   *   });
   * }).catch(function(imError) {
   *   // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  handleGroupApplication(options: handleGroupApplicationParams): Promise<any>;

  /**
   * 获取群在线人数
   * - 注意：仅支持获取直播群在线人数
   * @function
   * @param {string} groupID 群组ID
   * @example
   * let promise = TUIGroupService.getGroupOnlineMemberCount('group1');
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupOnlineMemberCount(groupID: string): Promise<any>;

  /**
   * 转让群组
   * @function
   * @param {ChangGroupOwnerParams} options 群资料信息
   * @example
   * let promise = TUIGroupService.changeGroupOwner({
   *   groupID: 'group1',
   *   newOwnerID: 'user2'
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  changeGroupOwner(options: ChangGroupOwnerParams): Promise<any>;

  /**
   * 初始化群属性
   * @function
   * @param {GroupAttrParams} groupAttributes 群属性信息
   * @example
   * let promise = TUIGroupService.initGroupAttributes({
   *   groupID: 'group1',
   *   groupAttributes: { key1: 'value1', key2: 'value2' }
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  initGroupAttributes(groupAttributes: GroupAttrParams): Promise<any>;

  /**
   * 设置群属性
   * @function
   * @param {GroupAttrParams} groupAttributes 群属性信息
   * @example
   * let promise = TUIGroupService.setGroupAttributes({
   *   groupID: 'group1',
   *   groupAttributes: { key1: 'value1', key2: 'value2' }
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupAttributes(groupAttributes: GroupAttrParams): Promise<any>;

  /**
   * 删除群属性
   * @function
   * @param {KeyListParams} options 群属性参数
   * @example
   * let promise = TUIGroupService.deleteGroupAttributes({
   *   groupID: 'group1',
   *   keyList: ['key1', 'key2']
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  deleteGroupAttributes(options: KeyListParams): Promise<any>;

  /**
   * 获取群属性
   * @function
   * @param {KeyListParams} options 群属性参数
   * @example
   * let promise = TUIGroupService.getGroupAttributes({
   *   groupID: 'group1',
   *   keyList: ['key1', 'key2']
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupAttributes(options: KeyListParams): Promise<any>;

  /**
   * 设置计数器
   * @function
   * @param {SetCountersParams} counters 计数器信息
   * @example
   * let promise = TUIGroupService.setGroupCounters({
   *   groupID: 'group1',
   *   counters: { key1: 1, key2: 2 }
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupCounters(counters: SetCountersParams): Promise<any>;

  /**
   * 递增计数器
   * @function
   * @param {CountersParams} options 计数器信息
   * @example
   * let promise = TUIGroupService.increaseGroupCounter({
   *   groupID: 'group1',
   *   key: 'key1',
   *   value: 1,
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  increaseGroupCounter(options: CountersParams): Promise<any>;

  /**
   * 递减计数器
   * @function
   * @param {CountersParams} options 计数器信息
   * @example
   * let promise = TUIGroupService.decreaseGroupCounter({
   *   groupID: 'group1',
   *   key: 'key1',
   *   value: 2,
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  decreaseGroupCounter(options: CountersParams): Promise<any>;

  /**
   * 获取计数器
   * @function
   * @param {KeyListParams} options 计数器参数
   * @example
   * let promise = TUIGroupService.getGroupCounters({
   *   groupID: 'group1',
   *   keyList: ['key1', 'key2']
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupCounters(options: KeyListParams): Promise<any>;

  // group member
  /**
   * 获取群成员列表
   * @function
   * @param {GetMemberListParams} options 参数选项
   * @example
   * let promise = TUIGroupService.getGroupMemberList({
   *   groupID: 'group1',
   *   count: 15,
   *   offset: 0
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupMemberList(options: GetMemberListParams): Promise<any>;

  /**
   * 获取群成员资料
   * @function
   * @param {GetMemberProfileParams} options 参数选项
   * @example
   * let promise = TUIGroupService.getGroupMemberProfile({
   *   groupID: 'group1',
   *   userIDList: ['user1', 'user2'], // 请注意：即使只拉取一个群成员的资料，也需要用数组类型，例如：userIDList: ['user1']
   *   memberCustomFieldFilter: ['group_member_custom'], // 筛选群成员自定义字段：group_member_custom
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  getGroupMemberProfile(options: GetMemberProfileParams): Promise<any>;

  /**
   * 邀请群成员
   * @function
   * @param {AddMemberParams} options 参数选项
   * @example
   * let promise = TUIGroupService.addGroupMember({
   *   groupID: 'group1',
   *   userIDList: ['user1','user2','user3']
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  addGroupMember(options: AddMemberParams): Promise<any>;

  /**
   * 删除群成员，群主可移除群成员。
   * - 注意1：旗舰版套餐包支持删除直播群群成员。您可以通过调用此接口实现直播群【封禁群成员】的效果。
   * - 注意2：踢出时长字段仅直播群（AVChatRoom）支持。
   * - 注意3：群成员被移除出直播群后，在【踢出时长内】如果用户想再次进群，需要 APP 管理员调用 restapi 解封。过了【踢出时长】，用户可再次主动加入直播群。
   * @function
   * @param {DeleteMemberParams} options 参数选项
   * @example
   * let promise = TUIGroupService.deleteGroupMember({
   *   groupID: 'group1',
   *   userIDList: ['user1'],
   *   reason: '你违规了，我要踢你！',
   *   duration: 60
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  deleteGroupMember(options: DeleteMemberParams): Promise<any>;

  /**
   * 设置群成员禁言
   * @function
   * @param {SetMemberMuteParams} options 参数选项
   * @example
   * let promise = TUIGroupService.setGroupMemberMuteTime({
   *   groupID: 'group1',
   *   userID: 'user1',
   *   muteTime: 600 // 禁言10分钟；设为0，则表示取消禁言
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupMemberMuteTime(options: SetMemberMuteParams): Promise<any>;

  /**
   * 设置群成员角色
   * @function
   * @param {SetMemberRoleParams} options 参数选项
   * @example
   * let promise = TUIGroupService.setGroupMemberRole({
   *   groupID: 'group1',
   *   userID: 'user1',
   *   role: TUIChatEngine.TYPES.GRP_MBR_ROLE_ADMIN
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupMemberRole(options: SetMemberRoleParams): Promise<any>;

  /**
   * 设置群成员名片
   * - 注意1：群主可设置所有群成员的名片。
   * - 注意2： 群管理员可设置自身和其他普通群成员的群名片。
   * - 注意3：普通群成员只能设置自身群名片。
   * @function
   * @param {SetMemberNameCardParams} options 参数选项
   * @example
   * let promise = TUIGroupService.setGroupMemberNameCard({
   *   groupID: 'group1',
   *   userID: 'user1',
   *   nameCard: '用户名片'
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupMemberNameCard(options: SetMemberNameCardParams): Promise<any>;

  /**
   * 设置群成员自定义字段
   * @function
   * @param {SetMemberCustomFiledParams} options 参数选项
   * @example
   * let promise = TUIGroupService.setGroupMemberCustomField({
   *   groupID: 'group1',
   *   memberCustomField: [{key: 'group_member_test', value: 'test'}]
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  setGroupMemberCustomField(options: SetMemberCustomFiledParams): Promise<any>;

  /**
   * 标记群成员
   * - 注意1：仅支持直播群。
   * - 注意2：只有群主才有权限标记群组中其他成员。
   * - 注意3：使用该接口需要您购买旗舰版套餐。
   * @function
   * @param {MarkMemberParams} options 参数选项
   * @example
   * let promise = TUIGroupService.markGroupMemberList({
   *   groupID: 'group1',
   *   userIDList: ['user1', 'user2'],
   *   markType: 1000,
   *   enableMark: true,
   * });
   * promise.catch((error) => {
   *  // 调用异常时业务侧可以通过 promise.catch 捕获异常进行错误处理
   * });
   */
  markGroupMemberList(options: MarkMemberParams): Promise<any>;
}
