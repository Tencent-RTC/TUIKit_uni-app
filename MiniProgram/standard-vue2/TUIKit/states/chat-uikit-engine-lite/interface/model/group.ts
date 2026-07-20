import type TencentCloudChat from '@tencentcloud/lite-chat/basic';
/**
 * @description GroupModel 的属性与 IM SDK Group 属性字段保持一致，详情可参考：{@link https://web.sdk.qcloud.com/im/doc/zh-cn/Group.html Group}。
 * @interface GroupModel
*/
export interface IGroupModel {
  groupID: string;
  name: string;
  avatar: string;
  type: TencentCloudChat.TYPES.GRP_WORK
    | TencentCloudChat.TYPES.GRP_PUBLIC
    | TencentCloudChat.TYPES.GRP_MEETING
    | TencentCloudChat.TYPES.GRP_AVCHATROOM
    | TencentCloudChat.TYPES.GRP_COMMUNITY;
  introduction: string;
  notification: string;
  ownerID: string;
  createTime: number;
  infoSequence?: number;
  lastInfoTime?: number;
  selfInfo?: {
    role?: string;
    messageRemindType?: string;
    joinTime?: number;
    nameCard?: string;
    userID?: string;
    memberCustomField?: any[];
  };
  lastMessage?: any;
  nextMessageSeq: number;
  memberCount: number;
  maxMemberCount: number;
  muteAllMembers: boolean;
  joinOption: string;
  groupCustomField?: any[];
  isSupportTopic: boolean;
  groupAttributes: any;
  groupCounters: any;
}
