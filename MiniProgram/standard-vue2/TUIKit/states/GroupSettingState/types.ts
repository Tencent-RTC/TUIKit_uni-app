// ts-nocheck

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
  offset?: number;
  groupID?: string;
}

interface UpdateGroupProfileParams {
  groupID?: string;
  name?: string;
  avatar?: string;
  introduction?: string;
  notification?: string;
  /**
   * @deprecated
   */
  custom?: string;
}

interface SetGroupMemberNameCardParams {
  groupID?: string;
  userID?: string;
  nameCard?: string;
}

interface AddGroupMemberParams {
  groupID?: string;
  userIDList: string[];
}

interface DeleteGroupMemberParams {
  groupID?: string;
  userIDList: string[];
  reason?: string;
}

interface ChangeGroupOwnerParams {
  groupID?: string;
  userID?: string;
}

// ==================== Export ====================

export {
  GroupMemberRole,
  GroupType,
  GroupInviteType,
  GroupPermission,
  type GroupMember,
  type CompletePermissionMatrix,
  type GetGroupMemberListParams,
  type UpdateGroupProfileParams,
  type SetGroupMemberNameCardParams,
  type AddGroupMemberParams,
  type DeleteGroupMemberParams,
  type ChangeGroupOwnerParams,
};