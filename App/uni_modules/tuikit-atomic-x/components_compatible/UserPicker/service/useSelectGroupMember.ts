import { type UserPickerHookResult, type User } from './types'
import { useGroupMemberState } from '../../../state/GroupMemberState'
import useLoginState from '../../../state/LoginState'

declare const uni: any

export function useSelectGroupMember(routeParams?: any): UserPickerHookResult {
  console.warn('routeParams', routeParams)
  const conversationID = (routeParams && routeParams.conversationID) || ''
  const groupID = conversationID.startsWith('group_') ? conversationID.replace('group_', '') : ''
  const maxCount = (routeParams && routeParams.maxCount) || 500
  const title = (routeParams && routeParams.title) || '选择群成员'
  const excludeSelf = (routeParams && routeParams.excludeSelf) != null ? routeParams.excludeSelf : true

  const loginState = useLoginState()
  const { groupMemberList: allMembers, hasMoreGroupMembers, fetchMoreGroupMemberList, destroyStore } = useGroupMemberState({ groupID })

  const userList = {
    get value(): User[] {
      let members = allMembers.value || []
      if (excludeSelf && loginState.state.loginUserInfo && loginState.state.loginUserInfo.userID) {
        const myID = loginState.state.loginUserInfo.userID
        members = members.filter(member => member.userID !== myID)
      }
      return members.map(member => ({ userID: member.userID, nickname: member.nameCard || member.nickname || member.userID, avatarURL: member.avatarURL || '' }))
    }
  }
  const lockedItems = { get value(): string[] { return [] } }
  const hasMore = { get value() { return hasMoreGroupMembers.value } }

  const handleConfirm = async (selectedUsers: User[]): Promise<void> => {
    await destroyStore()
  }

  const onReachEnd = async (): Promise<void> => {
    if (!hasMoreGroupMembers.value) return
    try { await fetchMoreGroupMemberList() } catch (error) { console.error('[useSelectGroupMember] onReachEnd failed:', error) }
  }

  return { userList, lockedItems, maxCount, title, hasMore, handleConfirm, onReachEnd }
}
