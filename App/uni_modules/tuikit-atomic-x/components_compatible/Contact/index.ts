import AddFriend from './AddFriend.nvue'
import AddGroup from './AddGroup.nvue'
import ContactList, {
  FriendApplicationList,
  GroupApplicationList,
  GroupList,
  BlackList
} from './ContactList'
import ContactInfo, {
  AddFriendInfo,
  NewContactInfo,
  FriendInfo
} from './ContactInfo'
import { defaultFriendInfoActions, type FriendInfoAction } from './config'

export type { ContactInfoType } from './ContactInfo'
export type { FriendInfoAction }

export {
  defaultFriendInfoActions,
  ContactList,
  ContactInfo,
  AddFriend,
  AddGroup,
  FriendApplicationList,
  GroupApplicationList,
  GroupList,
  BlackList,
  AddFriendInfo,
  NewContactInfo,
  FriendInfo
}

export default ContactList
