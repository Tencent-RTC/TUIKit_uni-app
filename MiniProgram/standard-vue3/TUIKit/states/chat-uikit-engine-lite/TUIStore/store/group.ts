import type { Group, Message } from '@tencentcloud/lite-chat/basic';
import type { GroupMember, IGroupStore } from '../../interface/store';
import type { IGroupModel } from '../../interface/model';
import GroupModel from '../../model/group';

export default class GroupStore implements IGroupStore {
  public store: {
    currentGroupID: string;
    currentGroup: IGroupModel | undefined;
    currentGroupAttributes: Record<string, any>;
    currentGroupCounters: Record<string, number>;
    currentGroupMemberList: GroupMember[];
    groupList: IGroupModel[];
    groupSystemNoticeList: Message[]; // 下发给个人的群系统通知
    isCompleted: boolean;
    offset: number;
    [key: string]: any;
  };

  public defaultStore = {
    currentGroupID: '',
    currentGroup: {},
    currentGroupAttributes: {},
    currentGroupCounters: {},
    currentGroupMemberList: [],
    groupList: [],
    groupSystemNoticeList: [],
    isCompleted: false,
    offset: 0,
  } as any;

  constructor() {
    this.store = {
      currentGroupID: '',
      currentGroup: undefined,
      currentGroupAttributes: {},
      currentGroupCounters: {},
      currentGroupMemberList: [],
      groupList: [],
      groupSystemNoticeList: [],
      isCompleted: false,
      offset: 0,
    };
  }

  update(key: string, data: any) {
    switch (key) {
      case 'groupList':
        this.updateGroupList(data);
        break;
      case 'currentGroup':
        if (data instanceof GroupModel) {
          this.store.currentGroup = data;
        } else {
          this.store.currentGroup = new GroupModel(data);
        }
        break;
      default:
        this.store[key] = data;
    }
  }

  getData(key: string) {
    if (key === 'groupSystemNoticeList') {
      const groupSystemNoticeList = [...this.store.groupSystemNoticeList];
      // 群系统通知给 UI 后立即清空
      this.store.groupSystemNoticeList.length = 0;
      return groupSystemNoticeList;
    }
    return this.store[key];
  }

  reset(keyList: string[] = []) {
    this.store = {
      ...this.defaultStore,
      ...this.store,
      ...keyList.reduce((acc, key) => ({ ...acc, [key]: this.defaultStore[key] }), {}),
    };
  }

  private updateGroupList(list: any[]) {
    this.store.groupList = list.map((item: Group | GroupModel) => {
      if (item instanceof GroupModel) {
        return item;
      }
      return new GroupModel(item);
    });
  }
}
