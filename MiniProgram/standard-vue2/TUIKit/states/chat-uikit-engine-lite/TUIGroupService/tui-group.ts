// @ts-nocheck
import type { Group, GroupMember, Message } from '@tencentcloud/lite-chat/basic';
import type { ITUIGroupService } from '../interface/service';
import type {
  AddMemberParams,
  ChangGroupOwnerParams,
  CountersParams,
  CreateGroupParams,
  DeleteMemberParams,
  GetGroupProfileParams,
  GetMemberListParams,
  GetMemberProfileParams,
  GroupAttrParams,
  JoinGroupParams,
  KeyListParams,
  MarkMemberParams,
  SetCountersParams,
  SetMemberCustomFiledParams,
  SetMemberMuteParams,
  SetMemberNameCardParams,
  SetMemberRoleParams,
  UpdateGroupParams,
  handleGroupApplicationParams,
} from '../type';
import type GroupModel from '../model/group';
import type { IGroupModel } from '../interface/model';
import TUIBase from '../tui-base';
import { StoreName } from '../const';
import { isUndefined } from '../utils/common-utils';

export default class TUIGroupService extends TUIBase implements ITUIGroupService {
  static instance: TUIGroupService;
  private groupMap: Map<string, any>;
  constructor() {
    super();
    this.groupMap = new Map();
  }

  /**
   * 获取 TUIGroupService 实例
  */
  static getInstance() {
    if (!TUIGroupService.instance) {
      TUIGroupService.instance = new TUIGroupService();
    }
    return TUIGroupService.instance;
  }

  /**
   * 初始化 Service
   */
  public init() {
    const chatEngine = this.getEngine();
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.GROUP_LIST_UPDATED, this.onGroupListUpdated.bind(this));
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.GROUP_ATTRIBUTES_UPDATED, this.onGroupAttributesUpdated.bind(this));
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.GROUP_COUNTER_UPDATED, this.onGroupCounterUpdated.bind(this));
    chatEngine.eventCenter.addEvent(chatEngine.EVENT.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
    this.getGroupInitData();
  }

  private onGroupListUpdated(groupList: Group[]) {
    const chatEngine = this.getEngine();
    chatEngine.TUIStore.update(StoreName.GRP, 'groupList', groupList);
    const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
    groupList.forEach((item: Group) => {
      if (item.groupID === currentGroupID) {
        chatEngine.TUIStore.update(StoreName.GRP, 'currentGroup', item);
      }
    });
  }

  private onGroupAttributesUpdated(data: any) {
    const chatEngine = this.getEngine();
    const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
    let groupList = chatEngine.TUIStore.getData(StoreName.GRP, 'groupList');
    const { groupID, groupAttributes } = data;
    if (currentGroupID === groupID) {
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupAttributes', groupAttributes);
    }
    groupList = groupList.map((item: GroupModel) => {
      if (item.groupID === groupID) {
        item.groupAttributes = groupAttributes;
      }
      return item;
    });
    chatEngine.TUIStore.update(StoreName.GRP, 'groupList', groupList);
  }

  private onGroupCounterUpdated(data: any) {
    const chatEngine = this.getEngine();
    const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
    const currentGroupCounters = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupCounters') || {};
    let groupList = chatEngine.TUIStore.getData(StoreName.GRP, 'groupList');
    const { groupID, key, value } = data;
    if (currentGroupID === groupID) {
      currentGroupCounters[key] = value;
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupCounters', currentGroupCounters);
    }
    groupList = groupList.map((item: GroupModel) => {
      if (item.groupID === groupID) {
        item.groupCounters = {
          ...item.groupCounters,
          [key]: value,
        };
      }
      return item;
    });
    chatEngine.TUIStore.update(StoreName.GRP, 'groupList', groupList);
  }

  private onMessageReceived(messageList: Message[]) {
    const chatEngine = this.getEngine();
    const groupSystemNoticeList: Message[] = [];
    messageList.forEach((message: Message) => {
      if (message.type === chatEngine.TYPES.MSG_GRP_TIP) {
        const { payload } = message;
        const { operationType, userIDList } = payload;
        switch (operationType) {
          case chatEngine.TYPES.GRP_TIP_MBR_JOIN:
            this.addMemberList(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_MBR_QUIT:
            this.removeMemberList(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_MBR_KICKED_OUT:
            this.removeMemberList(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_MBR_SET_ADMIN:
            this.updateGroupMember(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_MBR_CANCELED_ADMIN:
            this.updateGroupMember(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_GRP_PROFILE_UPDATED:
            // v2.3.3, update currentGroup by GROUP_LIST_UPDATED when group profile is updated.
            break;
          case chatEngine.TYPES.GRP_TIP_MBR_PROFILE_UPDATED:
            this.updateGroupMember(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_BAN_AVCHATROOM_MEMBER:
            this.updateGroupMember(userIDList);
            break;
          case chatEngine.TYPES.GRP_TIP_UNBAN_AVCHATROOM_MEMBER:
            this.updateGroupMember(userIDList);
            break;
          default:
            break;
        }
      }
      if (message.type === chatEngine.TYPES.MSG_GRP_SYS_NOTICE) {
        groupSystemNoticeList.push(message);
      }
    });
    if (groupSystemNoticeList.length > 0) {
      chatEngine.TUIStore.update(StoreName.GRP, 'groupSystemNoticeList', groupSystemNoticeList);
    }
  }

  private getGroupInitData() {
    const chatEngine = this.getEngine();
    // TUIChatEngine 无 UI 集成时不需要执行此逻辑
    if (!chatEngine.chat.isReady()) {
      return;
    }
    chatEngine.chat.getGroupList().then((imResponse: any) => {
      const { groupList = [] } = imResponse.data;
      console.log(`TUIGroupService.init, getGroupList count:${groupList.length}`);
      if (groupList.length > 0) {
        this.onGroupListUpdated(groupList);
      }
    });
  }

  private async updateGroupMember(userIDList: string[]) {
    const groupID = this.getEngine().TUIStore.getData(StoreName.GRP, 'currentGroupID');
    if (groupID) {
      const imResponse = await this.getGroupMemberProfile({
        groupID,
        userIDList,
      });
      const { memberList } = imResponse.data;
      this.updateMemberList(memberList);
    }
  }

  private resetCurrentStore() {
    const keyList = [
      'currentGroupID',
      'currentGroup',
      'currentGroupAttributes',
      'currentGroupCounters',
      'currentGroupMemberList',
    ];
    this.getEngine().TUIStore.reset(StoreName.GRP, keyList, true);
  }

  public async switchGroup(groupID: string) {
    const chatEngine = this.getEngine();
    chatEngine.TUIStore.update(StoreName.GRP, 'offset', 0);
    chatEngine.TUIStore.update(StoreName.GRP, 'isCompleted', false);

    const conversation = chatEngine.TUIStore.getConversationModel(`GROUP${groupID}`);
    // operationType > 0 说明用户已经不在群组内了，直接返回
    if (conversation?.operationType > 0) {
      const currentGroup = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroup');
      return Promise.resolve(currentGroup);
    }
    const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
    if (!groupID) {
      this.resetCurrentStore();
      return Promise.resolve({});
    }
    if (currentGroupID === groupID) {
      const currentGroup = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroup');
      return Promise.resolve(currentGroup);
    }
    this.resetCurrentStore();
    chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupID', groupID);
    try {
      await this.getGroupInfo(groupID);
    } catch (error) {
      Promise.reject(error);
    }
    // 5s 后删除是为了解决快速反复切换到群管理操作面板是重复调用问题
    const timer = setTimeout(() => {
      this.groupMap.delete(groupID);
      clearTimeout(timer);
    }, 5000);
    const currentGroup = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroup');
    return Promise.resolve(currentGroup);
  }

  private async getGroupInfo(groupID: string) {
    const chatEngine = this.getEngine();
    const currentGroupMap = this.groupMap.get(groupID);
    if (currentGroupMap) {
      this.updateMemberList(currentGroupMap?.memberList || []);
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroup', currentGroupMap.group);
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupAttributes', currentGroupMap.groupAttributes || {});
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupCounters', currentGroupMap.counters || {});
      return;
    }
    const groupInfo = {
      group: {},
      memberList: [],
      groupAttributes: undefined,
      counters: undefined,
    };
    const { data: { group } } = await this.getGroupProfile({ groupID });
    groupInfo.group = group;
    const { data: { memberList } } = await this.getGroupMemberList({ groupID });
    groupInfo.memberList = memberList;
    const attributesRes = await this.getGroupAttributes({ groupID, keyList: [] });
    const { groupAttributes } = attributesRes.data;
    groupInfo.groupAttributes = groupAttributes;
    chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupAttributes', groupAttributes);
    try {
      const countersRes = await this.getGroupCounters({ groupID, keyList: [] });
      const { counters } = countersRes.data;
      groupInfo.counters = counters;
      chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupCounters', counters);
    } catch (error: any) {
      console.warn(error?.message); // 旗舰功能，预防初次跑通（直接打印 error uni 打包小程序会报错）
    }
    this.groupMap.set(groupID, groupInfo);
  }

  public getGroupProfile(options: GetGroupProfileParams) {
    const chatEngine = this.getEngine();
    return chatEngine.chat.getGroupProfile(options).then(async (imResponse: any) => {
      const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
      if (currentGroupID === options.groupID) {
        const { group } = imResponse.data;
        chatEngine.TUIStore.update(StoreName.GRP, 'currentGroup', group);
      }
      return imResponse;
    });
  }

  public updateGroupProfile(options: UpdateGroupParams) {
    return this.getEngine().chat.updateGroupProfile(options);
  }

  public createGroup(options: CreateGroupParams) {
    return this.getEngine().chat.createGroup(options);
  }

  public dismissGroup(groupID: string) {
    return this.getEngine().chat.dismissGroup(groupID);
  }

  public searchGroupByID(groupID: string) {
    const chatEngine = this.getEngine();
    return chatEngine.chat.searchGroupByID(groupID).then((imResponse: any) => {
      const { group } = imResponse.data;
      const groupList = chatEngine.TUIStore.getData(StoreName.GRP, 'groupList');
      imResponse.data.group.isJoinedGroup = groupList.some((item: IGroupModel) => item.groupID === group.groupID);
      return imResponse;
    });
  }

  public joinGroup(options: JoinGroupParams) {
    return this.getEngine().chat.joinGroup(options);
  }

  public quitGroup(groupID: string) {
    return this.getEngine().chat.quitGroup(groupID);
  }

  public getGroupApplicationList() {
    return this.getEngine().chat.getGroupApplicationList();
  }

  public handleGroupApplication(options: handleGroupApplicationParams) {
    return this.getEngine().chat.handleGroupApplication(options);
  }

  public getGroupOnlineMemberCount(groupID: string) {
    return this.getEngine().chat.getGroupOnlineMemberCount(groupID);
  }

  public changeGroupOwner(options: ChangGroupOwnerParams) {
    return this.getEngine().chat.changeGroupOwner(options);
  }

  public initGroupAttributes(options: GroupAttrParams) {
    return this.getEngine().chat.initGroupAttributes(options);
  }

  public setGroupAttributes(options: GroupAttrParams) {
    return this.getEngine().chat.setGroupAttributes(options);
  }

  public deleteGroupAttributes(options: KeyListParams) {
    return this.getEngine().chat.deleteGroupAttributes(options);
  }

  public getGroupAttributes(options: KeyListParams) {
    return this.getEngine().chat.getGroupAttributes(options);
  }

  public setGroupCounters(options: SetCountersParams) {
    return this.getEngine().chat.setGroupCounters(options);
  }

  public increaseGroupCounter(options: CountersParams) {
    return this.getEngine().chat.increaseGroupCounter(options);
  }

  public decreaseGroupCounter(options: CountersParams) {
    return this.getEngine().chat.decreaseGroupCounter(options);
  }

  public getGroupCounters(options: KeyListParams) {
    return this.getEngine().chat.getGroupCounters(options);
  }

  // group member
  private updateMemberList(memberList: GroupMember[]) {
    const chatEngine = this.getEngine();
    const currentGroupMemberList = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupMemberList') || [];
    const filterMemberList = currentGroupMemberList.filter((currentMember: GroupMember) => {
      const isExist = memberList.find((member: GroupMember) => member.userID === currentMember.userID);
      return !isExist;
    });
    const newMemberList = [...filterMemberList, ...memberList];
    chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupMemberList', newMemberList);
  }

  private async addMemberList(userIDList: string[]) {
    const groupID = this.getEngine().TUIStore.getData(StoreName.GRP, 'currentGroupID');
    if (groupID) {
      try {
        const imResponse = await this.getGroupMemberProfile({
          groupID,
          userIDList,
        });
        const { memberList } = imResponse.data;
        this.updateMemberList(memberList);
      } catch (error) {
        const memberList: GroupMember[] = userIDList.map((userID: string) => {
          const GroupMember = {
            userID,
            avatar: '',
            nick: '',
            role: '',
            joinTime: 0,
            nameCard: '',
            muteUntil: 0,
            memberCustomField: [],
          };
          return GroupMember;
        });
        this.updateMemberList(memberList);
      }
    }
  }

  private removeMemberList(userIDList: string[]) {
    const chatEngine = this.getEngine();
    const currentGroupMemberList = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupMemberList');
    const newMemberList = currentGroupMemberList.filter((member: GroupMember) => userIDList.indexOf(member.userID) === -1);
    chatEngine.TUIStore.update(StoreName.GRP, 'currentGroupMemberList', newMemberList);
  }

  public getGroupMemberList(options: GetMemberListParams) {
    const chatEngine = this.getEngine();
    if (isUndefined(options.offset)) {
      const _offset = chatEngine.TUIStore.getData(StoreName.GRP, 'offset');
      options.offset = _offset;
    }
    return chatEngine.chat.getGroupMemberList(options).then((imResponse: any) => {
      const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
      if (currentGroupID === options.groupID) {
        const { memberList, offset = 0 } = imResponse.data;
        this.updateMemberList(memberList);
        chatEngine.TUIStore.update(StoreName.GRP, 'offset', offset);
        if (offset === 0) {
          chatEngine.TUIStore.update(StoreName.GRP, 'isCompleted', true);
        }
      }
      return imResponse;
    });
  }

  public getGroupMemberProfile(options: GetMemberProfileParams) {
    return this.getEngine().chat.getGroupMemberProfile(options);
  }

  public addGroupMember(options: AddMemberParams) {
    const chatEngine = this.getEngine();
    return chatEngine.chat.addGroupMember(options).then(async (imResponse: any) => {
      const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
      if (currentGroupID === options.groupID) {
        const { successUserIDList, group } = imResponse.data;
        chatEngine.TUIStore.update(StoreName.GRP, 'currentGroup', group);
        this.addMemberList(successUserIDList);
      }
      return imResponse;
    });
  }

  public deleteGroupMember(options: DeleteMemberParams) {
    const chatEngine = this.getEngine();
    return chatEngine.chat.deleteGroupMember(options).then((imResponse: any) => {
      const currentGroupID = chatEngine.TUIStore.getData(StoreName.GRP, 'currentGroupID');
      if (currentGroupID === options.groupID) {
        const { userIDList, group } = imResponse.data;
        this.removeMemberList(userIDList);
        chatEngine.TUIStore.update(StoreName.GRP, 'currentGroup', group);
      }
      return imResponse;
    });
  }

  public setGroupMemberMuteTime(options: SetMemberMuteParams) {
    return this.getEngine().chat.setGroupMemberMuteTime(options);
  }

  public setGroupMemberRole(options: SetMemberRoleParams) {
    return this.getEngine().chat.setGroupMemberRole(options);
  }

  public setGroupMemberNameCard(options: SetMemberNameCardParams) {
    return this.getEngine().chat.setGroupMemberNameCard(options);
  }

  public setGroupMemberCustomField(options: SetMemberCustomFiledParams) {
    return this.getEngine().chat.setGroupMemberCustomField(options);
  }

  public markGroupMemberList(options: MarkMemberParams) {
    return this.getEngine().chat.markGroupMemberList(options);
  }
}
