import TUIBase from '../tui-base';
import type { IConversationModel } from '../interface/model';
import { isPrivateKey, isUrl, calculateTimeAgo, JSONToObject } from '../utils/common-utils';
import type { MuteConversationParams } from '../type';
import { AVATAR } from '../config';
import isEmpty from '../utils/is-empty';
import { IN_WX_MINI_APP } from '../utils/env';

const LAST_MSG_FOR_SHOW = [
  '[图片]',
  '[语音]',
  '[视频]',
  '[文件]',
  '[位置]',
  '[地理位置]',
  '[动画表情]',
  '[自定义消息]',
  '[群提示消息]',
  '[聊天记录]',
];

export default class ConversationModel extends TUIBase implements IConversationModel {
  public conversationID!: string;
  public type!: string;
  public subType!: string;
  public unreadCount!: number;
  public lastMessage!: {
    nick: string;
    nameCard: string;
    lastTime: number;
    lastSequence: string;
    fromAccount: string;
    isRevoked: boolean;
    revoker?: string | undefined;
    isPeerRead: boolean;
    messageForShow: string;
    type: string;
    payload: any;
  };

  public groupProfile?: any;
  public userProfile?: any;
  public groupAtInfoList!: any[];
  public remark!: string;
  public isPinned!: boolean;
  public messageRemindType!: string;
  public markList!: string[];
  public customData!: string;
  public conversationGroupList!: any[];
  public draftText!: string;
  public isMuted!: boolean;
  public operationType!: number;
  public _conversation: any;

  constructor(options: any) {
    super();
    this.initProxy(options);
    this.isMuted = (this.messageRemindType === this.getEngine().TYPES.MSG_REMIND_ACPT_NOT_NOTE)
      || (this.messageRemindType === this.getEngine().TYPES.MSG_REMIND_DISCARD);
    this.operationType = 0;
    this._conversation = options;
  }

  /**
   * 初始化挂载 conversation 字段
   */
  private initProxy(options: any) {
    Object.keys(options).forEach((key) => {
      if (!isPrivateKey(key)) {
        (this as any)[key] = options[key];
      }
    });
  }

  updateProperties(options: any) {
    Object.keys(options).forEach((key) => {
      if (!isPrivateKey(key)) {
        (this as any)[key] = options[key];
      }
    });
  }

  updateOperationType(operationType: number) {
    this.operationType = operationType;
  }

  getConversation() {
    return this._conversation;
  }

  setMessageRead() {
    return this.getEngine().TUIConversation.setMessageRead(this.conversationID);
  }

  // 以下方法用于处理 conversation 需要展示的数据
  getAvatar() {
    const chatEngine = this.getEngine();
    let avatar = '';
    switch (this.type) {
      case chatEngine.TYPES.CONV_C2C:
        avatar = isUrl(this.userProfile?.avatar) ? this.userProfile?.avatar : AVATAR.C2C;
        break;
      case chatEngine.TYPES.CONV_GROUP:
        avatar = isUrl(this.groupProfile?.avatar) ? this.groupProfile?.avatar : AVATAR.GROUP;
        break;
      case chatEngine.TYPES.CONV_SYSTEM:
        avatar = isUrl(this.groupProfile?.avatar) ? this.groupProfile?.avatar : AVATAR.SYSTEM;
        break;
      default:
        break;
    }
    return avatar;
  }

  getShowName() {
    const chatEngine = this.getEngine();
    let name = '';
    switch (this.type) {
      case chatEngine.TYPES.CONV_C2C:
        name = this.remark || this.userProfile?.nick || this.userProfile?.userID || '';
        break;
      case chatEngine.TYPES.CONV_GROUP:
        name = this.groupProfile?.name || this.groupProfile?.groupID || '';
        break;
      case chatEngine.TYPES.CONV_SYSTEM:
        name = '系统通知';
        break;
      default:
        break;
    }
    return name;
  }
}
