import type { Ref } from 'vue';

// ==================== Enum Definitions ====================

enum GroupMemberRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  COMMON = 'Member',
}

enum GroupType {
  WORK = 'Private',
  PUBLIC = 'Public',
  MEETING = 'ChatRoom',
  AVCHATROOM = 'AVChatRoom',
  COMMUNITY = 'Community',
}

enum GroupInviteType {
  FREE_ACCESS = 'FREE_ACCESS',
  NEED_PERMISSION = 'NEED_PERMISSION',
  DISABLE_APPLY = 'DISABLE_APPLY',
}

enum GroupPermission {
  // Basic permissions
  VIEW_GROUP_INFO = 'VIEW_GROUP_INFO',
  VIEW_MEMBER_LIST = 'VIEW_MEMBER_LIST',

  // Group profile permissions
  EDIT_GROUP_PROFILE_NAME = 'EDIT_GROUP_PROFILE_NAME',
  EDIT_GROUP_PROFILE_AVATAR = 'EDIT_GROUP_PROFILE_AVATAR',
  EDIT_GROUP_PROFILE_INTRODUCTION = 'EDIT_GROUP_PROFILE_INTRODUCTION',
  EDIT_GROUP_PROFILE_NOTIFICATION = 'EDIT_GROUP_PROFILE_NOTIFICATION',
  EDIT_GROUP_PROFILE_ELSE = 'EDIT_GROUP_PROFILE_ELSE',

  // Member management permissions
  REMOVE_MEMBER = 'REMOVE_MEMBER',
  SET_MEMBER_ROLE = 'SET_MEMBER_ROLE',

  // Mute permissions
  MUTE_MEMBER = 'MUTE_MEMBER',
  MUTE_ALL_MEMBERS = 'MUTE_ALL_MEMBERS',

  // Group management permissions
  TRANSFER_OWNERSHIP = 'TRANSFER_OWNERSHIP',
  DISMISS_GROUP = 'DISMISS_GROUP',
  QUIT_GROUP = 'QUIT_GROUP',
}

// ==================== Interface Definitions ====================

interface GroupMember {
  userID: string;
  nick: string;
  avatar: string;
  role: GroupMemberRole;
  joinTime: number;
  muteUntil: string;
  memberCustomField: string;
}

interface GroupSettingState {
  groupID: Ref<string | undefined>;
  groupType: Ref<GroupType | undefined>;
  groupName: Ref<string | undefined>;
  avatar: Ref<string | undefined>;
  introduction: Ref<string | undefined>;
  notification: Ref<string | undefined>;
  nameCard: Ref<string | undefined>;
  isMuted: Ref<boolean | undefined>;
  isPinned: Ref<boolean | undefined>;
  groupOwner: Ref<GroupMember | undefined>;
  adminMembers: Ref<GroupMember[] | undefined>;
  allMembers: Ref<GroupMember[] | undefined>;
  memberCount: Ref<number | undefined>;
  maxMemberCount: Ref<number | undefined>;
  currentUserID: Ref<string | undefined>;
  currentUserRole: Ref<GroupMemberRole | undefined>;
  isMuteAllMembers: Ref<boolean | undefined>;
  isInGroup: Ref<boolean | undefined>;
  inviteOption: Ref<GroupInviteType | undefined>;
}

// ==================== Permission Related Types ====================

// Complete permission matrix type - ensures all permissions are explicitly configured
type CompletePermissionMatrix = {
  [_GroupTypeKey in GroupType]: {
    [_Role in GroupMemberRole]: {
      [_Permission in GroupPermission]: boolean;
    };
  };
};

// ==================== Method Parameter Types ====================

interface GetGroupMemberListParams {
  // count max is 100
  count?: number;
  groupID?: string;
  role?: string;
  offset?: number;
}

interface UpdateGroupProfileParams {
  groupID?: string;
  name?: string;
  avatar?: string;
  introduction?: string;
  notification?: string;
}

interface AddGroupMemberParams {
  userIDList: string[];
  groupID?: string;
}

interface AddGroupMemberResult {
  data: {
    successUserIDList: string[];
    failureUserIDList: string[];
    existedUserIDList: string[];
  };
}

interface DeleteGroupMemberParams {
  userIDList: string[];
  groupID?: string;
}

interface SetGroupMemberRoleParams {
  userID: string;
  role: string;
  groupID?: string;
}

interface ChangeGroupOwnerParams {
  newOwnerID: string;
  groupID?: string;
}

interface SetGroupMemberMuteTimeParams {
  userID: string;
  time: number;
  groupID?: string;
}

interface SetGroupMemberNameCardParams {
  nameCard: string;
  // If userID is not provided, the nameCard of the current user will be modified
  userID?: string;
  groupID?: string;
}

export {
  GroupType,
  GroupMemberRole,
  GroupPermission,
  GroupInviteType,
};

export type {
  GroupMember,
  GroupSettingState,
  GroupPermissionUtils,
  GetGroupMemberListParams,
  UpdateGroupProfileParams,
  AddGroupMemberParams,
  AddGroupMemberResult,
  DeleteGroupMemberParams,
  SetGroupMemberRoleParams,
  ChangeGroupOwnerParams,
  SetGroupMemberMuteTimeParams,
  SetGroupMemberNameCardParams,
  CompletePermissionMatrix,
};
