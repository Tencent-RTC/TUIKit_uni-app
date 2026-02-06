/**
 * 群组权限管理
 * @module permissions
 * @description 基于群类型和成员角色的权限矩阵
 */

import { GroupType, GroupMemberRole } from "../../../types/group";

// ============================================================================
// 权限枚举
// ============================================================================

/**
 * 群组权限类型
 */
export enum GroupPermission {
  /** 编辑群名称 */
  EDIT_GROUP_PROFILE_NAME = "EDIT_GROUP_PROFILE_NAME",
  /** 编辑群头像 */
  EDIT_GROUP_PROFILE_AVATAR = "EDIT_GROUP_PROFILE_AVATAR",
  /** 编辑群简介 */
  EDIT_GROUP_PROFILE_INTRODUCTION = "EDIT_GROUP_PROFILE_INTRODUCTION",
  /** 编辑群公告 */
  EDIT_GROUP_PROFILE_NOTIFICATION = "EDIT_GROUP_PROFILE_NOTIFICATION",
  /** 编辑群其他资料 */
  EDIT_GROUP_PROFILE_ELSE = "EDIT_GROUP_PROFILE_ELSE",
  /** 移除成员 */
  REMOVE_MEMBER = "REMOVE_MEMBER",
  /** 设置成员角色 */
  SET_MEMBER_ROLE = "SET_MEMBER_ROLE",
  /** 禁言成员 */
  MUTE_MEMBER = "MUTE_MEMBER",
  /** 全员禁言 */
  MUTE_ALL_MEMBERS = "MUTE_ALL_MEMBERS",
  /** 转让群主 */
  TRANSFER_OWNERSHIP = "TRANSFER_OWNERSHIP",
  /** 解散群 */
  DISMISS_GROUP = "DISMISS_GROUP",
  /** 退出群 */
  QUIT_GROUP = "QUIT_GROUP",
}

// ============================================================================
// 类型定义
// ============================================================================

/** 角色权限映射 */
type RolePermissions = Record<GroupPermission, boolean>;

/** 群类型-角色-权限矩阵 */
type PermissionMatrix = Record<GroupType, Record<GroupMemberRole, RolePermissions>>;

// ============================================================================
// 权限矩阵数据
// ============================================================================

/**
 * 完整权限矩阵
 * @description 定义了 5种群类型 × 3种角色 × 12种权限 的完整组合
 */
const PERMISSION_MATRIX: PermissionMatrix = {
  [GroupType.Work]: {
    [GroupMemberRole.Owner]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: true,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: false, // Work 群不支持角色管理
      [GroupPermission.MUTE_MEMBER]: false, // Work 群不支持禁言
      [GroupPermission.MUTE_ALL_MEMBERS]: false, // Work 群不支持全员禁言
      [GroupPermission.TRANSFER_OWNERSHIP]: true,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Admin]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true, // Work 群普通成员可编辑
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Member]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true, // Work 群普通成员可编辑
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.All]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: false,
    },
  },

  [GroupType.Public]: {
    [GroupMemberRole.Owner]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: true,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: true,
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true,
      [GroupPermission.TRANSFER_OWNERSHIP]: true,
      [GroupPermission.DISMISS_GROUP]: true,
      [GroupPermission.QUIT_GROUP]: false, // Owner 不能退群，需先转让
    },
    [GroupMemberRole.Admin]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: false, // 仅 Owner 可设置角色
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Member]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.All]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: false,
    },
  },

  [GroupType.Meeting]: {
    [GroupMemberRole.Owner]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: true,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: true,
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true,
      [GroupPermission.TRANSFER_OWNERSHIP]: true,
      [GroupPermission.DISMISS_GROUP]: true,
      [GroupPermission.QUIT_GROUP]: false, // Owner 不能退群，需先转让
    },
    [GroupMemberRole.Admin]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true, // Meeting 群 Admin 可全员禁言
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Member]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.All]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: false,
    },
  },

  [GroupType.Community]: {
    [GroupMemberRole.Owner]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: true,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: true,
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true,
      [GroupPermission.TRANSFER_OWNERSHIP]: true,
      [GroupPermission.DISMISS_GROUP]: true,
      [GroupPermission.QUIT_GROUP]: false, // Owner 不能退群，需先转让
    },
    [GroupMemberRole.Admin]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: true,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true, // Community 群 Admin 可全员禁言
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Member]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.All]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: false,
    },
  },

  [GroupType.AVChatRoom]: {
    [GroupMemberRole.Owner]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: true,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: true,
      [GroupPermission.REMOVE_MEMBER]: false, // AVChatRoom 不支持移除成员
      [GroupPermission.SET_MEMBER_ROLE]: false, // AVChatRoom 角色管理受限
      [GroupPermission.MUTE_MEMBER]: true,
      [GroupPermission.MUTE_ALL_MEMBERS]: true,
      [GroupPermission.TRANSFER_OWNERSHIP]: false, // AVChatRoom 不支持转让
      [GroupPermission.DISMISS_GROUP]: false, // AVChatRoom 不支持解散
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Admin]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.Member]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: true,
    },
    [GroupMemberRole.All]: {
      [GroupPermission.EDIT_GROUP_PROFILE_NAME]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_AVATAR]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_INTRODUCTION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION]: false,
      [GroupPermission.EDIT_GROUP_PROFILE_ELSE]: false,
      [GroupPermission.REMOVE_MEMBER]: false,
      [GroupPermission.SET_MEMBER_ROLE]: false,
      [GroupPermission.MUTE_MEMBER]: false,
      [GroupPermission.MUTE_ALL_MEMBERS]: false,
      [GroupPermission.TRANSFER_OWNERSHIP]: false,
      [GroupPermission.DISMISS_GROUP]: false,
      [GroupPermission.QUIT_GROUP]: false,
    },
  },
};

// ============================================================================
// 权限查询函数
// ============================================================================

/**
 * 检查是否拥有指定权限
 * @param groupType 群类型
 * @param role 成员角色
 * @param permission 权限类型
 * @returns 是否拥有权限
 */
export function hasPermission(
  groupType: GroupType,
  role: GroupMemberRole,
  permission: GroupPermission
): boolean {
  return PERMISSION_MATRIX[groupType]?.[role]?.[permission] ?? false;
}

/**
 * 获取指定群类型和角色的所有权限
 * @param groupType 群类型
 * @param role 成员角色
 * @returns 权限映射对象
 */
export function getPermissions(
  groupType: GroupType,
  role: GroupMemberRole
): RolePermissions | null {
  return PERMISSION_MATRIX[groupType]?.[role] ?? null;
}

/**
 * 检查是否显示群管理入口
 * @description 有禁言权限（MUTE_MEMBER 或 MUTE_ALL_MEMBERS）才显示群管理
 * @param groupType 群类型
 * @param role 成员角色
 * @returns 是否显示群管理入口
 */
export function showGroupManagement(
  groupType: GroupType,
  role: GroupMemberRole
): boolean {
  return (
    hasPermission(groupType, role, GroupPermission.MUTE_MEMBER) ||
    hasPermission(groupType, role, GroupPermission.MUTE_ALL_MEMBERS)
  );
}
