/** FriendInfo 操作按钮项 */
export interface FriendInfoAction {
  /** 唯一标识 */
  key: string
  /** 显示文字 */
  label: string
  /** 文字颜色，默认 #147AFF */
  color?: string
  /** 点击回调，若提供则优先执行，否则走默认逻辑 */
  click?: (userID: string) => void
}

/** FriendInfo 默认操作按钮 */
export const defaultFriendInfoActions: FriendInfoAction[] = [
  { key: 'sendMessage', label: '发送消息' },
  { key: 'voiceCall', label: '语音通话' },
  { key: 'videoCall', label: '视频通话' },
  { key: 'deleteFriend', label: '删除好友', color: '#FF584C' }
]
