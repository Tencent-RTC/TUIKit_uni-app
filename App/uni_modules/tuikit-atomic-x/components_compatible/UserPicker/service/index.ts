import { UserPickerType } from '../../../types/userpicker'
import { type UserPickerHook, type UserPickerHookResult, type User } from './types'
import { makeReactive } from '../../../utils/reactiveCompat'

// Hook 导入
import { useStartC2CConversation } from './useStartC2CConversation'
import { useCreateGroup } from './useCreateGroup'
import { useInviteGroupMember } from './useInviteGroupMember'
import { useRemoveGroupMember } from './useRemoveGroupMember'
import { usePromoteAdmin } from './usePromoteAdmin'
import { useDemoteAdmin } from './useDemoteAdmin'
import { useMuteGroupMember } from './useMuteGroupMember'
import { useUnmuteGroupMember } from './useUnmuteGroupMember'
import { useTransferGroupOwner } from './useTransferGroupOwner'
import { useSelectGroupMember } from './useSelectGroupMember'

declare const uni: any

// Hook 注册表
const hooks = new Map<UserPickerType, UserPickerHook>([
  [UserPickerType.C2C_CONVERSATION, useStartC2CConversation],
  [UserPickerType.CREATE_GROUP, useCreateGroup],
  [UserPickerType.INVITE_GROUP_MEMBER, useInviteGroupMember],
  [UserPickerType.REMOVE_GROUP_MEMBER, useRemoveGroupMember],
  [UserPickerType.PROMOTE_ADMIN, usePromoteAdmin],
  [UserPickerType.DEMOTE_ADMIN, useDemoteAdmin],
  [UserPickerType.MUTE_GROUP_MEMBER, useMuteGroupMember],
  [UserPickerType.UNMUTE_GROUP_MEMBER, useUnmuteGroupMember],
  [UserPickerType.TRANSFER_GROUP_OWNER, useTransferGroupOwner],
  [UserPickerType.SELECT_GROUP_MEMBER, useSelectGroupMember],
])

/**
 * 创建默认的 Hook 结果
 */
const createDefaultHookResult = (): UserPickerHookResult => ({
  userList: makeReactive({ value: [] as User[] }),
  lockedItems: makeReactive({ value: [] as string[] }),
  maxCount: 500,
  title: '选择用户',
  hasMore: makeReactive({ value: false }),
  handleConfirm: async () => {
    uni.showToast({ title: '不支持的操作类型', icon: 'none' })
  },
  handleCancel: async () => {},
})

/**
 * 使用 UserPicker Hook
 */
export function useUserPicker(type: number, routeParams?: any): UserPickerHookResult {
  const hook = hooks.get(type)
  if (!hook) {
    console.warn(`[useUserPicker] Unknown type: ${type}`)
    return createDefaultHookResult()
  }
  return hook(routeParams)
}

/**
 * 获取类型名称
 */
export function getTypeName(type: number): string {
  const typeNames: Record<number, string> = {
    [UserPickerType.C2C_CONVERSATION]: '单聊会话',
    [UserPickerType.CREATE_GROUP]: '创建群聊',
    [UserPickerType.REMOVE_GROUP_MEMBER]: '删除群成员',
    [UserPickerType.INVITE_GROUP_MEMBER]: '邀请群成员',
    [UserPickerType.PROMOTE_ADMIN]: '晋升管理员',
    [UserPickerType.DEMOTE_ADMIN]: '降级管理员',
    [UserPickerType.MUTE_GROUP_MEMBER]: '禁言群成员',
    [UserPickerType.UNMUTE_GROUP_MEMBER]: '取消禁言群成员',
    [UserPickerType.TRANSFER_GROUP_OWNER]: '转交群主',
    [UserPickerType.SELECT_GROUP_MEMBER]: '选择群成员'
  }
  return typeNames[type] || `未知类型(${type})`
}

export { type User, type UserPickerHookResult, type UserPickerHook } from './types'
