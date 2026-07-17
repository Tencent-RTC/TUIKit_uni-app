/**
 * 群组设置状态管理
 * @module GroupSettingState
 * @description 管理群组设置相关的状态和操作，包括群组信息管理、成员管理、权限控制等功能
 */
import { ref } from 'vue';
import {
  TUIChatEngine,
  TUIStore,
  StoreName,
  TUIGroupService,
} from '../chat-uikit-engine-lite';
import { GroupMemberRole, GroupType, GroupPermission, GroupInviteType } from './types';
import type {
  GroupMember,
  GroupSettingState,
  GetGroupMemberListParams,
  UpdateGroupProfileParams,
  SetGroupMemberNameCardParams,
  GroupPermissionUtils,
  AddGroupMemberParams,
  DeleteGroupMemberParams,
  ChangeGroupOwnerParams,
  AddGroupMemberResult,
} from './types';
import type { IConversationModel } from '../chat-uikit-engine-lite';

/**
 * 群组设置业务操作接口
 * @interface IGroupSettingBusinessAction
 * @description 定义群组设置相关的业务操作方法，继承权限工具接口
 */
interface IGroupSettingBusinessAction extends GroupPermissionUtils {
  setChatPinned: (value: boolean) => Promise<void>;
  setChatMuted: (value: boolean) => Promise<void>;
  getGroupMemberProfile: (userID: string, groupID?: string) => Promise<GroupMember>;
  getGroupMemberList: (params?: GetGroupMemberListParams) => Promise<GroupMember[]>;
  updateGroupProfile: (params: UpdateGroupProfileParams) => Promise<void>;
  addGroupMember: (params: AddGroupMemberParams) => Promise<AddGroupMemberResult>;
  deleteGroupMember: (params: DeleteGroupMemberParams) => Promise<void>;
  changeGroupOwner: (params: ChangeGroupOwnerParams) => Promise<void>;
  setGroupMemberNameCard: (params: SetGroupMemberNameCardParams) => Promise<void>;
  dismissGroup: (groupID?: string) => Promise<void>;
  quitGroup: (groupID?: string) => Promise<void>;
}

const currentConversationRef = ref<IConversationModel | undefined>(undefined);
const groupIDRef = ref<string | undefined>(undefined);
const groupTypeRef = ref<GroupType | undefined>(undefined);
const groupNameRef = ref<string | undefined>(undefined);
const avatarRef = ref<string | undefined>(undefined);
const introductionRef = ref<string | undefined>(undefined);
const notificationRef = ref<string | undefined>(undefined);
const isMutedRef = ref<boolean | undefined>(undefined);
const isPinnedRef = ref<boolean | undefined>(undefined);
const groupOwnerRef = ref<GroupMember | undefined>(undefined);
const adminMembersRef = ref<GroupMember[] | undefined>([]);
const allMembersRef = ref<GroupMember[] | undefined>([]);
const memberCountRef = ref<number | undefined>(undefined);
const maxMemberCountRef = ref<number | undefined>(undefined);
const currentUserIDRef = ref<string | undefined>(undefined);
const currentUserRoleRef = ref<GroupMemberRole | undefined>(undefined);
const nameCardRef = ref<string | undefined>(undefined);
const isInGroupRef = ref<boolean | undefined>(undefined);
const inviteOptionRef = ref<GroupInviteType | undefined>(undefined);

/**
 * 获取单个群成员资料
 * @memberof module:GroupSettingState
 * @description 获取指定群组中特定成员的资料信息，用于获取单个成员的详细信息
 * @param {string} userID - 用户ID
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<GroupMember>} 群成员信息
 * @throws {Error} 当群组ID或用户ID为空时抛出错误
 * @example
 * ```typescript
 * const { getGroupMemberProfile } = useGroupSettingState();
 * 
 * // 获取自己的群成员信息
 * try {
 *   const myProfile = await getGroupMemberProfile('user123');
 *   console.log('我的群昵称:', myProfile.nameCard);
 * } catch (error) {
 *   console.error('获取成员信息失败:', error);
 * }
 * ```
 */
async function getGroupMemberProfile(userID: string, groupID?: string): Promise<GroupMember> {
  const targetGroupID = groupID || groupIDRef.value;
  if (!targetGroupID || !userID) {
    throw new Error('getGroupMemberProfile::groupID and userID are required');
  }

  const result = await TUIGroupService.getGroupMemberProfile({
    groupID: targetGroupID,
    userIDList: [userID],
  });

  if (result?.data?.memberList && result.data.memberList.length > 0) {
    const member = result.data.memberList[0];
    return {
      userID: member.userID,
      nick: member.nick || member.userID,
      avatar: member.avatar || '',
      role: member.role as GroupMemberRole,
      joinTime: member.joinTime,
      muteUntil: member.muteUntil || '',
      memberCustomField: member.memberCustomField || '',
      nameCard: member.nameCard || '',
    };
  }
  throw new Error('getGroupMemberProfile::member not found');
}

/**
 * 获取群组成员列表
 * @memberof module:GroupSettingState
 * @description 获取指定群组的成员列表，支持分页加载和数据合并
 * @param {GetGroupMemberListParams} [params] - 获取成员列表的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {number} [params.count=100] - 获取成员数量，默认100
 * @param {number} [params.offset=0] - 偏移量，用于分页，默认0
 * @returns {Promise<GroupMember[]>} 群组成员列表
 * @throws {Error} 当群组ID为空或获取失败时抛出错误
 * @example
 * ```typescript
 * const { getGroupMemberList } = useGroupSettingState();
 * 
 * // 获取群组成员列表
 * try {
 *   const members = await getGroupMemberList({
 *     groupID: 'group123',
 *     count: 50,
 *     offset: 0
 *   });
 *   console.log('群组成员:', members);
 * } catch (error) {
 *   console.error('获取成员列表失败:', error);
 * }
 * 
 * // 分页加载更多成员
 * const moreMembers = await getGroupMemberList({
 *   count: 50,
 *   offset: 50
 * });
 * ```
 */
async function getGroupMemberList(params?: GetGroupMemberListParams): Promise<GroupMember[]> {
  const targetGroupID = params?.groupID || groupIDRef.value;
  if (!targetGroupID) {
    throw new Error('getGroupMemberList::groupID is required');
  }

  const result = await TUIGroupService.getGroupMemberList({
    groupID: targetGroupID,
    count: params?.count || 100,
    offset: params?.offset || 0,
  });

  if (result?.data?.memberList) {
    const newMembers: GroupMember[] = result.data.memberList.map((member: any) => ({
      userID: member.userID,
      nick: member.nick || member.userID,
      avatar: member.avatar || '',
      role: member.role as GroupMemberRole,
      joinTime: member.joinTime,
      muteUntil: member.muteUntil || '',
      memberCustomField: member.memberCustomField || '',
      nameCard: member.nameCard || '',
    }));

    const currentMembers = allMembersRef.value || [];
    const offset = params?.offset || 0;

    let updatedMembers: GroupMember[];

    if (offset === 0) {
      // First load or refresh - replace all members
      updatedMembers = newMembers;
    } else {
      // Pagination load - merge with existing members
      updatedMembers = [...currentMembers];

      // Handle overlapping and new data
      newMembers.forEach((newMember, index) => {
        const targetIndex = offset + index;

        if (targetIndex < updatedMembers.length) {
          // Replace existing member at this position
          updatedMembers[targetIndex] = newMember;
        } else {
          // Append new member to the end
          updatedMembers.push(newMember);
        }
      });
    }

    // Separate owner, admins from the updated members list
    const owner = updatedMembers.find(member => member.role === GroupMemberRole.OWNER);
    const admins = updatedMembers.filter(member => member.role === GroupMemberRole.ADMIN);

    // Update refs with merged data
    if (owner) {
      groupOwnerRef.value = owner;
    }
    adminMembersRef.value = admins;
    allMembersRef.value = updatedMembers;
    return updatedMembers;
  }
  throw new Error('getGroupMemberList::getGroupMemberList failed');
}

/**
 * 更新群组资料
 * @memberof module:GroupSettingState
 * @description 更新群组的基本信息，包括群名称、头像、简介、公告等，并进行参数验证
 * @param {UpdateGroupProfileParams} params - 更新群组资料的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {string} [params.name] - 群组名称，长度限制1-30字符
 * @param {string} [params.avatar] - 群组头像URL，长度限制500字符以内
 * @param {string} [params.introduction] - 群组简介，长度限制130字符以内
 * @param {string} [params.notification] - 群组公告，长度限制130字符以内
 * @returns {Promise<void>} 更新群组资料的Promise
 * @throws {Error} 当参数验证失败或更新失败时抛出错误
 * @example
 * ```typescript
 * const { updateGroupProfile } = useGroupSettingState();
 * 
 * // 更新群组资料
 * try {
 *   await updateGroupProfile({
 *     groupID: 'group123',
 *     name: '新的群组名称',
 *     introduction: '这是一个学习交流群',
 *     notification: '欢迎大家积极讨论',
 *     avatar: 'https://example.com/avatar.jpg'
 *   });
 *   console.log('群组资料更新成功');
 * } catch (error) {
 *   console.error('更新群组资料失败:', error);
 * }
 * 
 * // 只更新群名称
 * await updateGroupProfile({
 *   name: '技术交流群'
 * });
 * ```
 */
async function updateGroupProfile(params: UpdateGroupProfileParams): Promise<void> {
  const targetGroupID = params.groupID || groupIDRef.value;

  if (!targetGroupID) {
    throw new Error('updateGroupProfile::groupID is required');
  }

  const updateParams: UpdateGroupProfileParams = { groupID: targetGroupID };

  // Validate and process name
  if (params.name !== undefined) {
    if (typeof params.name !== 'string') {
      throw new Error('updateGroupProfile::name must be a string');
    }
    if (params.name.length === 0) {
      throw new Error('updateGroupProfile::name cannot be empty');
    }
    if (params.name.length > 30) {
      throw new Error('updateGroupProfile::name must be less than or equal to 25 characters');
    }
    if (params.name === groupNameRef.value) {
      throw new Error('updateGroupProfile::name cannot be the same as current value');
    }
    updateParams.name = params.name;
  }

  // Validate and process introduction
  if (params.introduction !== undefined) {
    if (typeof params.introduction !== 'string') {
      throw new Error('updateGroupProfile::introduction must be a string');
    }
    if (params.introduction.length > 130) {
      throw new Error('updateGroupProfile::introduction must be less than 100 characters');
    }
    if (params.introduction === introductionRef.value) {
      throw new Error('updateGroupProfile::introduction cannot be the same as current value');
    }
    updateParams.introduction = params.introduction;
  }

  // Validate and process notification
  if (params.notification !== undefined) {
    if (typeof params.notification !== 'string') {
      throw new Error('updateGroupProfile::notification must be a string');
    }
    if (params.notification.length > 130) {
      throw new Error('updateGroupProfile::notification must be less than 100 characters');
    }
    if (params.notification === notificationRef.value) {
      throw new Error('updateGroupProfile::notification cannot be the same as current value');
    }
    updateParams.notification = params.notification;
  }

  // Validate and process avatar
  if (params.avatar !== undefined) {
    if (typeof params.avatar !== 'string') {
      throw new Error('updateGroupProfile::avatar must be a string');
    }
    if (params.avatar.length > 500) {
      throw new Error('updateGroupProfile::avatar must be less than 500 characters');
    }
    if (params.avatar === avatarRef.value) {
      throw new Error('updateGroupProfile::avatar cannot be the same as current value');
    }
    updateParams.avatar = params.avatar;
  }

  await TUIGroupService.updateGroupProfile(updateParams as any);

  // Update local state
  if (params.name !== undefined) {
    groupNameRef.value = params.name;
  }
  if (params.introduction !== undefined) {
    introductionRef.value = params.introduction;
  }
  if (params.notification !== undefined) {
    notificationRef.value = params.notification;
  }
  if (params.avatar !== undefined) {
    avatarRef.value = params.avatar;
  }
}

/**
 * 添加群组成员
 * @memberof module:GroupSettingState
 * @description 向群组中添加新成员，添加成功后自动刷新成员列表
 * @param {AddGroupMemberParams} params - 添加成员的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {string[]} params.userIDList - 要添加的用户ID列表
 * @returns {Promise<AddGroupMemberResult>} 添加成员的结果，包含成功和失败的用户信息
 * @throws {Error} 当群组ID为空或添加失败时抛出错误
 * @example
 * ```typescript
 * const { addGroupMember } = useGroupSettingState();
 * 
 * // 添加群组成员
 * try {
 *   const result = await addGroupMember({
 *     groupID: 'group123',
 *     userIDList: ['user1', 'user2', 'user3']
 *   });
 *   console.log('添加成功的用户:', result.successUserIDList);
 *   console.log('添加失败的用户:', result.failureUserIDList);
 * } catch (error) {
 *   console.error('添加群组成员失败:', error);
 * }
 * ```
 */
async function addGroupMember(params: AddGroupMemberParams): Promise<AddGroupMemberResult> {
  const targetGroupID = params.groupID || groupIDRef.value;
  if (!targetGroupID) {
    throw new Error('addGroupMember::groupID is required');
  }

  const result: AddGroupMemberResult = await TUIGroupService.addGroupMember({
    groupID: targetGroupID,
    userIDList: params.userIDList,
  });
  getGroupMemberList({ count: 100 });
  return result;
}

/**
 * 删除群组成员
 * @memberof module:GroupSettingState
 * @description 从群组中移除指定成员，删除成功后自动更新本地成员列表
 * @param {DeleteGroupMemberParams} params - 删除成员的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {string[]} params.userIDList - 要删除的用户ID列表
 * @returns {Promise<void>} 删除成员的Promise
 * @throws {Error} 当群组ID为空或删除失败时抛出错误
 * @example
 * ```typescript
 * const { deleteGroupMember } = useGroupSettingState();
 * 
 * // 删除群组成员
 * try {
 *   await deleteGroupMember({
 *     groupID: 'group123',
 *     userIDList: ['user1', 'user2']
 *   });
 *   console.log('群组成员删除成功');
 * } catch (error) {
 *   console.error('删除群组成员失败:', error);
 * }
 * ```
 */
async function deleteGroupMember(params: DeleteGroupMemberParams): Promise<void> {
  const targetGroupID = params.groupID || groupIDRef.value;
  if (!targetGroupID) {
    throw new Error('deleteGroupMember::groupID is required');
  }

  await TUIGroupService.deleteGroupMember({
    groupID: targetGroupID,
    userIDList: params.userIDList,
  });

  const newAllMembers = allMembersRef.value?.filter(member => !params.userIDList.includes(member.userID));
  const newAdminMembers = adminMembersRef.value?.filter(member => !params.userIDList.includes(member.userID));
  allMembersRef.value = newAllMembers;
  adminMembersRef.value = newAdminMembers;
}

/**
 * 转让群主
 * @memberof module:GroupSettingState
 * @description 将群主身份转让给指定的群成员，只有群主才能执行此操作
 * @param {ChangeGroupOwnerParams} params - 转让群主的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {string} params.newOwnerID - 新群主的用户ID
 * @returns {Promise<void>} 转让群主的Promise
 * @throws {Error} 当转让失败时抛出错误
 * @example
 * ```typescript
 * const { changeGroupOwner } = useGroupSettingState();
 * 
 * // 转让群主
 * try {
 *   await changeGroupOwner({
 *     groupID: 'group123',
 *     newOwnerID: 'user123'
 *   });
 *   console.log('群主转让成功');
 * } catch (error) {
 *   console.error('转让群主失败:', error);
 * }
 * ```
 */
async function changeGroupOwner(params: ChangeGroupOwnerParams): Promise<void> {
  const targetGroupID = params.groupID || groupIDRef.value;
  if (!targetGroupID) {
    return;
  }

  await TUIGroupService.changeGroupOwner({
    groupID: targetGroupID,
    newOwnerID: params.newOwnerID,
  });
}

/**
 * 设置群组成员名片
 * @memberof module:GroupSettingState
 * @description 设置指定群成员的群名片（群昵称），通常用于设置自己的群名片
 * @param {SetGroupMemberNameCardParams} params - 设置成员名片的参数
 * @param {string} [params.groupID] - 群组ID，不传则使用当前群组ID
 * @param {string} [params.userID] - 用户ID，不传则使用当前用户ID
 * @param {string} params.nameCard - 群名片内容
 * @returns {Promise<void>} 设置成员名片的Promise
 * @throws {Error} 当设置失败时抛出错误
 * @example
 * ```typescript
 * const { setGroupMemberNameCard } = useGroupSettingState();
 * 
 * // 设置自己的群名片
 * try {
 *   await setGroupMemberNameCard({
 *     groupID: 'group123',
 *     nameCard: '技术负责人-小王'
 *   });
 *   console.log('群名片设置成功');
 * } catch (error) {
 *   console.error('设置群名片失败:', error);
 * }
 * 
 * // 设置其他成员的群名片（需要管理员权限）
 * await setGroupMemberNameCard({
 *   userID: 'user123',
 *   nameCard: '产品经理-小李'
 * });
 * ```
 */
async function setGroupMemberNameCard(params: SetGroupMemberNameCardParams): Promise<void> {
  const targetGroupID = params.groupID || groupIDRef.value;
  if (!targetGroupID || !currentUserIDRef.value) {
    return;
  }
  nameCardRef.value = params.nameCard;

  await TUIGroupService.setGroupMemberNameCard({
    groupID: targetGroupID,
    userID: params.userID || currentUserIDRef.value,
    nameCard: params.nameCard,
  });
}

/**
 * 解散群组
 * @memberof module:GroupSettingState
 * @description 解散指定的群组，只有群主才能执行此操作，解散后群组将被永久删除
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<void>} 解散群组的Promise
 * @throws {Error} 当群组ID为空或解散失败时抛出错误
 * @example
 * ```typescript
 * const { dismissGroup } = useGroupSettingState();
 * 
 * // 解散群组
 * try {
 *   await dismissGroup('group123');
 *   console.log('群组解散成功');
 * } catch (error) {
 *   console.error('解散群组失败:', error);
 * }
 * 
 * // 解散当前群组
 * await dismissGroup();
 * ```
 */
async function dismissGroup(groupID?: string): Promise<void> {
  const targetGroupID = groupID || groupIDRef.value;
  if (!targetGroupID) {
    throw new Error('dismissGroup::groupID is required');
  }

  await TUIGroupService.dismissGroup(targetGroupID);
}

/**
 * 退出群组
 * @memberof module:GroupSettingState
 * @description 退出指定的群组，退出后将不再接收群组消息
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<void>} 退出群组的Promise
 * @throws {Error} 当群组ID为空或退出失败时抛出错误
 * @example
 * ```typescript
 * const { quitGroup } = useGroupSettingState();
 * 
 * // 退出群组
 * try {
 *   await quitGroup('group123');
 *   console.log('退出群组成功');
 * } catch (error) {
 *   console.error('退出群组失败:', error);
 * }
 * 
 * // 退出当前群组
 * await quitGroup();
 * ```
 */
async function quitGroup(groupID?: string): Promise<void> {
  const targetGroupID = groupID || groupIDRef.value;
  if (!targetGroupID) {
    throw new Error('quitGroup::groupID is required');
  }

  await TUIGroupService.quitGroup(targetGroupID);
}

/**
 * 重置状态
 * @memberof module:GroupSettingState
 * @description 重置所有群组设置相关的状态数据为初始值
 * @example
 * ```typescript
 * // 当切换到非群组会话或退出群组时，自动调用重置状态
 * // 通常不需要手动调用此函数
 * reset();
 * ```
 */
function reset() {
  currentConversationRef.value = undefined;
  groupIDRef.value = undefined;
  groupTypeRef.value = undefined;
  groupNameRef.value = undefined;
  avatarRef.value = undefined;
  introductionRef.value = undefined;
  notificationRef.value = undefined;
  isMutedRef.value = undefined;
  isPinnedRef.value = undefined;
  groupOwnerRef.value = undefined;
  adminMembersRef.value = [];
  allMembersRef.value = [];
  memberCountRef.value = undefined;
  maxMemberCountRef.value = undefined;
  currentUserIDRef.value = undefined;
  currentUserRoleRef.value = undefined;
  nameCardRef.value = undefined;
  isInGroupRef.value = undefined;
  inviteOptionRef.value = undefined;
}

/**
 * 初始化数据监听器
 * @memberof module:GroupSettingState
 * @description 初始化TUIStore数据变化监听器，实现群组状态的自动同步更新
 * @example
 * ```typescript
 * // 自动调用，监听以下数据变化：
 * // - 当前会话变化：自动更新群组信息和用户状态
 * // - 群组资料变化：同步更新群组ID等信息
 * // - 会话切换：自动重置或更新相关状态
 * initWatcher();
 * ```
 */
function initWatcher() {
  TUIStore.watch(StoreName.CONV, {
    currentConversation: (conversation: IConversationModel) => {
      if (conversation && conversation.type === 'GROUP') {
        const prevConversationID = currentConversationRef.value?.conversationID;
        if (prevConversationID !== conversation.conversationID) {
          allMembersRef.value = undefined;
          adminMembersRef.value = undefined;
          groupOwnerRef.value = undefined;
        }
        currentConversationRef.value = conversation;
        const {
          groupProfile: {
            groupID,
            name,
            avatar,
            introduction,
            memberCount,
            maxMemberCount,
            notification,
            type,
            inviteOption,
            selfInfo: {
              role,
              userID,
              nameCard,
            },
          },
          isMuted,
          isPinned,
          operationType,
        } = conversation;
        groupIDRef.value = groupID;
        groupTypeRef.value = type as GroupType;
        groupNameRef.value = name;
        avatarRef.value = avatar;
        introductionRef.value = introduction;
        isMutedRef.value = isMuted;
        isPinnedRef.value = isPinned;
        memberCountRef.value = memberCount;
        currentUserIDRef.value = userID;
        currentUserRoleRef.value = role;
        nameCardRef.value = nameCard;
        maxMemberCountRef.value = maxMemberCount;
        notificationRef.value = notification;
        // inviteOption
        switch (inviteOption) {
          case TUIChatEngine.TYPES.JOIN_OPTIONS_FREE_ACCESS:
            inviteOptionRef.value = GroupInviteType.FREE_ACCESS;
            break;
          case TUIChatEngine.TYPES.JOIN_OPTIONS_NEED_PERMISSION:
            inviteOptionRef.value = GroupInviteType.NEED_PERMISSION;
            break;
          case TUIChatEngine.TYPES.JOIN_OPTIONS_DISABLE_INVITE:
            inviteOptionRef.value = GroupInviteType.DISABLE_APPLY;
            break;
          default:
            inviteOptionRef.value = GroupInviteType.DISABLE_APPLY;
        }
        if ([4, 5, 8].includes(operationType)) {
          isInGroupRef.value = false;
        } else if (operationType === 0) {
          isInGroupRef.value = true;
        }
      } else {
        reset();
      }
    },
  });

  TUIStore.watch(StoreName.GRP, {
    groupProfile: (groupProfile: unknown) => {
      if (typeof groupProfile === 'object' && groupProfile && 'groupID' in groupProfile) {
        groupIDRef.value = groupProfile.groupID as string;
      }
    },
  });
}

initWatcher();

/**
 * 群组设置状态管理Hook
 * @memberof module:GroupSettingState
 * @description 提供群组设置相关的状态和操作方法，包括群组信息管理、成员管理、权限控制等功能
 * @returns {GroupSettingState & IGroupSettingBusinessAction} 群组设置状态和操作方法
 * @example
 * ```typescript
 * import { useGroupSettingState } from './GroupSettingState';
 * 
 * // 在组件中使用
 * const {
 *   // 状态数据
 *   groupID,
 *   groupName,
 *   groupOwner,
 *   allMembers,
 *   currentUserRole,
 *   
 *   // 权限检查
 *   hasPermission,
 *   canOperateOnMember,
 *   
 *   // 业务操作
 *   updateGroupProfile,
 *   addGroupMember,
 *   deleteGroupMember,
 *   setGroupMemberRole,
 *   setMuteAllMember,
 *   dismissGroup
 * } = useGroupSettingState();
 * 
 * // 更新群组信息
 * await updateGroupProfile({
 *   name: '新群名称',
 *   introduction: '群组简介'
 * });
 * 
 * // 添加群成员
 * await addGroupMember({
 *   userIDList: ['user1', 'user2']
 * });
 * 
 * // 检查权限
 * if (hasPermission(GroupPermission.DELETE_MEMBER)) {
 *   // 显示删除成员按钮
 * }
 * 
 * // 检查是否可以操作某个成员
 * const member = allMembers.value?.find(m => m.userID === 'user123');
 * if (member && canOperateOnMember(member)) {
 *   // 显示管理操作
 * }
 * ```
 */
function useGroupSettingState(): GroupSettingState & IGroupSettingBusinessAction {
  return {
    // State
    groupID: groupIDRef,
    groupType: groupTypeRef,
    groupName: groupNameRef,
    avatar: avatarRef,
    introduction: introductionRef,
    notification: notificationRef,
    groupOwner: groupOwnerRef,
    adminMembers: adminMembersRef,
    allMembers: allMembersRef,
    memberCount: memberCountRef,
    maxMemberCount: maxMemberCountRef,
    currentUserID: currentUserIDRef,
    currentUserRole: currentUserRoleRef,
    nameCard: nameCardRef,
    isInGroup: isInGroupRef,
    inviteOption: inviteOptionRef,

    // Business actions
    getGroupMemberProfile,
    getGroupMemberList,
    updateGroupProfile,
    addGroupMember,
    deleteGroupMember,
    changeGroupOwner,
    setGroupMemberNameCard,
    dismissGroup,
    quitGroup,
  };
}

export {
  useGroupSettingState,
  GroupPermission,
  GroupType,
  GroupMemberRole,
  GroupInviteType,
};

export type {
  GroupMember,
};
