// @ts-nocheck
/**
 * 群组设置状态管理
 * @module GroupSettingState
 * @description 管理群组设置相关的状态和操作，包括群组信息管理、成员管理、权限控制等功能
 */
import Vue from 'vue';
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
  AddGroupMemberParams,
  DeleteGroupMemberParams,
  ChangeGroupOwnerParams,
} from './types';
import type { IConversationModel } from '../chat-uikit-engine-lite';

/**
 * 群组设置业务操作接口
 * @interface IGroupSettingBusinessAction
 * @description 定义群组设置相关的业务操作方法，继承权限工具接口
 */
interface IGroupSettingBusinessAction {
  setChatPinned: (value: boolean) => Promise<void>;
  setChatMuted: (value: boolean) => Promise<void>;
  getGroupMemberProfile: (userID: string, groupID?: string) => Promise<GroupMember>;
  getGroupMemberList: (params?: GetGroupMemberListParams) => Promise<GroupMember[]>;
  updateGroupProfile: (params: UpdateGroupProfileParams) => Promise<void>;
  addGroupMember: (params: AddGroupMemberParams) => Promise<void>;
  deleteGroupMember: (params: DeleteGroupMemberParams) => Promise<void>;
  changeGroupOwner: (params: ChangeGroupOwnerParams) => Promise<void>;
  setGroupMemberNameCard: (params: SetGroupMemberNameCardParams) => Promise<void>;
  dismissGroup: (groupID?: string) => Promise<void>;
  quitGroup: (groupID?: string) => Promise<void>;
}

// Vue2 响应式数据
const state = Vue.observable({
  currentConversation: undefined as IConversationModel | undefined,
  groupID: undefined as string | undefined,
  groupType: undefined as GroupType | undefined,
  groupName: undefined as string | undefined,
  avatar: undefined as string | undefined,
  introduction: undefined as string | undefined,
  notification: undefined as string | undefined,
  isMuted: undefined as boolean | undefined,
  isPinned: undefined as boolean | undefined,
  groupOwner: undefined as GroupMember | undefined,
  adminMembers: [] as GroupMember[],
  allMembers: [] as GroupMember[],
  memberCount: undefined as number | undefined,
  maxMemberCount: undefined as number | undefined,
  currentUserID: undefined as string | undefined,
  currentUserRole: undefined as GroupMemberRole | undefined,
  nameCard: undefined as string | undefined,
  isInGroup: undefined as boolean | undefined,
  inviteOption: undefined as GroupInviteType | undefined,
});

/**
 * 获取单个群成员资料
 * @memberof module:GroupSettingState
 * @description 获取指定群组中特定成员的资料信息，用于获取单个成员的详细信息
 * @param {string} userID - 用户ID
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<GroupMember>} 群成员信息
 * @throws {Error} 当群组ID或用户ID为空时抛出错误
 */
async function getGroupMemberProfile(userID: string, groupID?: string): Promise<GroupMember> {
  const targetGroupID = groupID || state.groupID;
  if (!targetGroupID || !userID) {
    throw new Error('getGroupMemberProfile::groupID and userID are required');
  }

  const result = await TUIGroupService.getGroupMemberProfile({
    groupID: targetGroupID,
    userIDList: [userID],
  });

  if (result?.data?.memberList && result.data.memberList.length > 0) {
    const member = result.data.memberList[0];
    return member;
  }

  throw new Error('Member not found');
}

/**
 * 获取群成员列表
 * @memberof module:GroupSettingState
 * @description 获取指定群组的成员列表，支持分页获取
 * @param {GetGroupMemberListParams} [params] - 查询参数
 * @returns {Promise<GroupMember[]>} 群成员列表
 */
async function getGroupMemberList(params?: GetGroupMemberListParams): Promise<GroupMember[]> {
  const requestParams = {
    groupID: params?.groupID || state.groupID,
    count: params?.count || 100,
    offset: params?.offset || 0,
  };

  const result = await TUIGroupService.getGroupMemberList(requestParams);
  
  if (result?.data?.memberList) {
    state.allMembers = result.data.memberList;
    state.memberCount = result.data.memberList.length;
    return result.data.memberList;
  }

  return [];
}

/**
 * 更新群组资料
 * @memberof module:GroupSettingState
 * @description 更新群组的基本信息，如群名称、头像、公告等
 * @param {UpdateGroupProfileParams} params - 更新参数
 * @returns {Promise<void>}
 */
async function updateGroupProfile(params: UpdateGroupProfileParams): Promise<void> {
  const requestParams = {
    groupID: params.groupID || state.groupID,
    ...params,
  };

  await TUIGroupService.updateGroupProfile(requestParams);
}

/**
 * 添加群成员
 * @memberof module:GroupSettingState
 * @description 向指定群组添加新成员
 * @param {AddGroupMemberParams} params - 添加参数
 * @returns {Promise<void>}
 */
async function addGroupMember(params: AddGroupMemberParams): Promise<void> {
  const requestParams = {
    groupID: params.groupID || state.groupID,
    ...params,
  };

  await TUIGroupService.addGroupMember(requestParams);
}

/**
 * 删除群成员
 * @memberof module:GroupSettingState
 * @description 从指定群组中删除成员
 * @param {DeleteGroupMemberParams} params - 删除参数
 * @returns {Promise<void>}
 */
async function deleteGroupMember(params: DeleteGroupMemberParams): Promise<void> {
  const requestParams = {
    groupID: params.groupID || state.groupID,
    ...params,
  };

  await TUIGroupService.deleteGroupMember(requestParams);
}

/**
 * 设置群成员名片
 * @memberof module:GroupSettingState
 * @description 设置指定群成员的群名片
 * @param {SetGroupMemberNameCardParams} params - 设置参数
 * @returns {Promise<void>}
 */
async function setGroupMemberNameCard(params: SetGroupMemberNameCardParams): Promise<void> {
  const requestParams = {
    groupID: params.groupID || state.groupID,
    ...params,
  };

  await TUIGroupService.setGroupMemberNameCard(requestParams);
}

/**
 * 转让群主
 * @memberof module:GroupSettingState
 * @description 将群主权限转让给指定成员
 * @param {ChangeGroupOwnerParams} params - 转让参数
 * @returns {Promise<void>}
 */
async function changeGroupOwner(params: ChangeGroupOwnerParams): Promise<void> {
  const requestParams = {
    groupID: params.groupID || state.groupID,
    ...params,
  };

  await TUIGroupService.changeGroupOwner(requestParams);
}

/**
 * 解散群组
 * @memberof module:GroupSettingState
 * @description 解散指定的群组，仅群主可操作
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<void>}
 */
async function dismissGroup(groupID?: string): Promise<void> {
  const targetGroupID = groupID || state.groupID;
  if (!targetGroupID) {
    throw new Error('dismissGroup::groupID is required');
  }

  await TUIGroupService.dismissGroup(targetGroupID);
}

/**
 * 退出群组
 * @memberof module:GroupSettingState
 * @description 退出指定的群组
 * @param {string} [groupID] - 群组ID，不传则使用当前群组ID
 * @returns {Promise<void>}
 */
async function quitGroup(groupID?: string): Promise<void> {
  const targetGroupID = groupID || state.groupID;
  if (!targetGroupID) {
    throw new Error('quitGroup::groupID is required');
  }

  await TUIGroupService.quitGroup(targetGroupID);
}

/**
 * 设置会话置顶
 * @memberof module:GroupSettingState
 * @description 设置或取消会话置顶
 * @param {boolean} value - 是否置顶
 * @returns {Promise<void>}
 */
async function setChatPinned(value: boolean): Promise<void> {
  if (!state.currentConversation) {
    throw new Error('setChatPinned::currentConversation is required');
  }

  await TUIStore.update(StoreName.CONV, 'currentConversation', {
    ...state.currentConversation,
    isPinned: value,
  });
}

/**
 * 设置会话免打扰
 * @memberof module:GroupSettingState
 * @description 设置或取消会话免打扰
 * @param {boolean} value - 是否免打扰
 * @returns {Promise<void>}
 */
async function setChatMuted(value: boolean): Promise<void> {
  if (!state.currentConversation) {
    throw new Error('setChatMuted::currentConversation is required');
  }

  await TUIStore.update(StoreName.CONV, 'currentConversation', {
    ...state.currentConversation,
    muteStatus: value,
  });
}

/**
 * 监听当前会话变化
 * @memberof module:GroupSettingState
 * @description 监听当前会话的变化，更新群组相关状态
 */
function watchCurrentConversation() {
  TUIStore.watch(StoreName.CONV, {
    currentConversation: (conversation: IConversationModel) => {
      if (conversation && conversation.type === 'GROUP') {
        // 检查是否切换了群组，如果是则重置成员相关状态
        const prevConversationID = state.currentConversation?.conversationID;
        if (prevConversationID !== conversation.conversationID) {
          state.allMembers = undefined;
          state.adminMembers = undefined;
          state.groupOwner = undefined;
        }
        
        state.currentConversation = conversation;
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
        
        state.groupID = groupID;
        state.groupType = type as GroupType;
        state.groupName = name;
        state.avatar = avatar;
        state.introduction = introduction;
        state.isMuted = isMuted;
        state.isPinned = isPinned;
        state.memberCount = memberCount;
        state.currentUserID = userID;
        state.currentUserRole = role;
        state.nameCard = nameCard;
        state.maxMemberCount = maxMemberCount;
        state.notification = notification;
        
        // 处理inviteOption
        switch (inviteOption) {
          case TUIChatEngine.TYPES.JOIN_OPTIONS_FREE_ACCESS:
            state.inviteOption = GroupInviteType.FREE_ACCESS;
            break;
          case TUIChatEngine.TYPES.JOIN_OPTIONS_NEED_PERMISSION:
            state.inviteOption = GroupInviteType.NEED_PERMISSION;
            break;
          case TUIChatEngine.TYPES.JOIN_OPTIONS_DISABLE_INVITE:
            state.inviteOption = GroupInviteType.DISABLE_APPLY;
            break;
          default:
            state.inviteOption = GroupInviteType.DISABLE_APPLY;
        }
        
        // 根据operationType判断是否在群中
        if ([4, 5, 8].includes(operationType)) {
          state.isInGroup = false;
        } else if (operationType === 0) {
          state.isInGroup = true;
        }
      } else {
        resetState();
      }
    },
  });

  // 监听群组资料变化
  TUIStore.watch(StoreName.GRP, {
    groupProfile: (groupProfile: unknown) => {
      if (typeof groupProfile === 'object' && groupProfile && 'groupID' in groupProfile) {
        state.groupID = groupProfile.groupID as string;
      }
    },
  });
}

/**
 * 重置状态
 * @memberof module:GroupSettingState
 * @description 重置所有群组设置相关的状态
 */
function resetState() {
  state.groupID = undefined;
  state.groupType = undefined;
  state.groupName = undefined;
  state.avatar = undefined;
  state.introduction = undefined;
  state.notification = undefined;
  state.isMuted = undefined;
  state.isPinned = undefined;
  state.groupOwner = undefined;
  state.adminMembers = [];
  state.allMembers = [];
  state.memberCount = undefined;
  state.maxMemberCount = undefined;
  state.currentUserRole = undefined;
  state.nameCard = undefined;
  state.isInGroup = undefined;
  state.inviteOption = undefined;
}

// 初始化监听
watchCurrentConversation();

/**
 * 群组设置状态管理 Hook
 * @memberof module:GroupSettingState
 * @description 提供群组设置相关的状态和操作方法
 * @returns {GroupSettingState & IGroupSettingBusinessAction} 群组设置状态和操作方法
 */
export function useGroupSettingState(): GroupSettingState & IGroupSettingBusinessAction {
  return {
    // 状态数据
    get groupID() { return state.groupID; },
    get groupType() { return state.groupType; },
    get groupName() { return state.groupName; },
    get avatar() { return state.avatar; },
    get introduction() { return state.introduction; },
    get notification() { return state.notification; },
    get nameCard() { return state.nameCard; },
    get isMuted() { return state.isMuted; },
    get isPinned() { return state.isPinned; },
    get groupOwner() { return state.groupOwner; },
    get adminMembers() { return state.adminMembers; },
    get allMembers() { return state.allMembers; },
    get memberCount() { return state.memberCount; },
    get maxMemberCount() { return state.maxMemberCount; },
    get currentUserID() { return state.currentUserID; },
    get currentUserRole() { return state.currentUserRole; },
    get isMuteAllMembers() { return false; }, // 暂未实现
    get isInGroup() { return state.isInGroup; },
    get inviteOption() { return state.inviteOption; },
    
    // 业务方法
    setChatPinned,
    setChatMuted,
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