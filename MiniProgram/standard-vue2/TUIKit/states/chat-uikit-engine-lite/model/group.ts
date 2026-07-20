// @ts-nocheck
import type { Group } from '@tencentcloud/chat';
import type TencentCloudChat from '@tencentcloud/chat';
import type { IGroupModel } from '../interface/model';
import { isPrivateKey } from '../utils/common-utils';

export default class GroupModel implements IGroupModel {
  public groupID!: string;
  public name!: string;
  public avatar!: string;
  public type!: TencentCloudChat.TYPES.GRP_WORK
    | TencentCloudChat.TYPES.GRP_PUBLIC
    | TencentCloudChat.TYPES.GRP_MEETING
    | TencentCloudChat.TYPES.GRP_AVCHATROOM
    | TencentCloudChat.TYPES.GRP_COMMUNITY;

  public introduction!: string;
  public notification!: string;
  public ownerID!: string;
  public createTime!: number;
  public infoSequence?: number | undefined;
  public lastInfoTime?: number | undefined;
  public selfInfo?: {
    role?: string | undefined;
    messageRemindType?: string | undefined;
    joinTime?: number | undefined;
    nameCard?: string | undefined;
    userID?: string | undefined;
    memberCustomField?: any[] | undefined;
  } | undefined;

  public lastMessage?: any;
  public nextMessageSeq!: number;
  public memberCount!: number;
  public maxMemberCount!: number;
  public muteAllMembers!: boolean;
  public joinOption!: string;
  public inviteOption!: string;
  public groupCustomField?: any[] | undefined;
  public isSupportTopic!: boolean;
  public groupAttributes: any;
  public groupCounters: any;
  constructor(options: Group) {
    this.groupAttributes = {};
    this.groupCounters = {};
    this.initProxy(options);
  }

  /**
   * 初始化挂载 group 字段
   */
  private initProxy(options: Group) {
    Object.keys(options).forEach((key) => {
      if (!isPrivateKey(key)) {
        (this as any)[key] = options[key as keyof Group];
      }
    });
  }
}
