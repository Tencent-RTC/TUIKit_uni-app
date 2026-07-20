import type { Message } from '@tencentcloud/lite-chat/basic';
import type { IMessageHandler, ITUIChatService } from '../interface/service';
import { JSONToObject, formatTime } from '../utils/common-utils';

export default class MessageHandler implements IMessageHandler {
  private TUIChatService: ITUIChatService;
  private userShowNameMap: Map<string, string>; // Map<userID, showName>
  private requestedUserMap: Map<string, number>; // Map<userID, 1>
  constructor(TUIChatService: ITUIChatService) {
    this.TUIChatService = TUIChatService;
    this.userShowNameMap = new Map();
    this.requestedUserMap = new Map();
  }

  private getEngine() {
    return this.TUIChatService.getEngine();
  }

  /**
   * 国际化翻译
   * @param {string} text 待翻译的文本
   * @returns {string}
  */
  private t(text: string) {
    return text;
  }

  handleTextMessage(message: Message) {
    const ret: any = {
      text:  message.payload.text,
    };
    return ret;
  }

  handleImageMessage(message: Message) {
    return {
      url: message.payload.imageInfoArray[0].url,
      width: message.payload.imageInfoArray[0].width,
      height: message.payload.imageInfoArray[0].height,
    };
  }

  handleVideoMessage(message: Message) {
    return {
      url: message.payload.videoUrl,
      snapshotUrl: message.payload.snapshotUrl,
      snapshotWidth: message.payload.snapshotWidth,
      snapshotHeight: message.payload.snapshotHeight,
    };
  }

  handleCustomMessage(message: Message) {
    const createGroupText = this.handleCreateGroupCustomMessage(message);
    return {
      custom: this.handleCallKitSignaling(message) || createGroupText || message?.payload?.extension || `[自定义消息]`,
      businessID: createGroupText ? 'group_create' : '',
    };
  }

  handleGroupTipsMessage(message: Message) {
    const chatEngine = this.getEngine();
    const ret: any = {
      text: '',
    };

    // 优先取 nick，nick 不存在时取 userID，以下逻辑是为兼容不同群提示消息的处理
    let showName: string = message?.nick || message?.payload?.userIDList?.join(',');
    if (message?.payload?.memberList?.length > 0) {
      showName = '';
      message?.payload?.memberList?.map((user: any) => {
        const _showName = user?.nick || user?.userID;
        showName += `${this.substringByLength(_showName)},`;
        return user;
      });
      showName = showName?.slice(0, -1);
    }

    return ret;
  }

  handleGroupSystemMessage(message: Message) {
    const groupName = message.payload.groupProfile.name || message.payload.groupProfile.groupID;
    const ret = {
      text: '',
    };
    return ret;
  }

  handleCallKitSignaling(message: any) {
    const callMessage: any = JSONToObject(message.payload.data);
    if (callMessage?.businessID !== 1) {
      return '';
    }
    const objectData = JSONToObject(callMessage?.data);
    const userID = message.fromAccount || message.from; // 取 message.fromAccount 兼容会话 lastMsg
    const myUserID = this.getEngine().getMyUserID();
    let messageSender = message.nameCard || message.nick || userID;
    messageSender = this.substringByLength(messageSender);
    switch (callMessage?.actionType) {
      case 1: {
        if (objectData?.data?.cmd === 'audioCall' || objectData?.data?.cmd === 'videoCall') {
          if (callMessage?.groupID) {
            return `${messageSender} ${this.t('message.custom.发起通话')}`;
          }
        }
        if (objectData?.data?.cmd === 'hangup') {
          if (callMessage?.groupID) {
            return `${this.t('message.custom.通话结束')}`;
          }
          return `${this.t('message.custom.通话时长')}：${formatTime(objectData?.call_end)}`;
        }
        if (objectData?.data?.cmd === 'switchToAudio') {
          return `${this.t('message.custom.切换语音通话')}`;
        }
        if (objectData?.data?.cmd === 'switchToVideo') {
          return `${this.t('message.custom.切换视频通话')}`;
        }
        // CDM 异常时【发起通话】作为默认返回值
        return `${this.t('message.custom.发起通话')}`;
      }
      case 2:
        if (callMessage?.groupID) {
          return `${messageSender} ${this.t('message.custom.取消通话')}`;
        }
        if (this.isOldUIKit('message.custom.已取消')) {
          return this.t('message.custom.取消通话');
        }
        if (callMessage?.inviter === myUserID) {
          return this.t('message.custom.已取消');
        }
        return this.t('message.custom.对方已取消');
      case 3:
        if (objectData?.data?.cmd === 'switchToAudio') {
          return `${this.t('message.custom.切换语音通话')}`;
        }
        if (objectData?.data?.cmd === 'switchToVideo') {
          return `${this.t('message.custom.切换视频通话')}`;
        }
        if (callMessage?.groupID) {
          return `${messageSender} ${this.t('message.custom.已接听')}`;
        }
        return this.t('message.custom.已接听');
      case 4:
        if (callMessage?.groupID) {
          return `${messageSender} ${this.t('message.custom.拒绝通话')}`;
        }
        if (this.isOldUIKit('message.custom.已拒绝')) {
          return this.t('message.custom.拒绝通话');
        }
        if (objectData?.line_busy === 'line_busy' || objectData?.data.message === 'lineBusy') {
          if (callMessage?.inviter === myUserID) {
            return this.t('message.custom.对方忙线中');
          }
          return this.t('message.custom.忙线未接听');
        }
        if (callMessage?.inviter === myUserID) {
          return this.t('message.custom.对方已拒绝');
        }
        return this.t('message.custom.已拒绝');
      case 5:
        if (objectData?.data?.cmd === 'switchToAudio') {
          return `${this.t('message.custom.切换语音通话')}`;
        }
        if (objectData?.data?.cmd === 'switchToVideo') {
          return `${this.t('message.custom.切换视频通话')}`;
        }
        if (callMessage?.groupID) {
          // 群通话主叫超时
          if (userID === callMessage?.inviter) {
            this.handleCallkitTimeoutSignaling(callMessage.inviteeList);
            let inviteeList = '';
            callMessage.inviteeList?.forEach((inviteeUserID: string) => {
              const showName = this.userShowNameMap.get(inviteeUserID) || inviteeUserID;
              inviteeList += `${this.substringByLength(showName)}、`;
            });
            inviteeList = inviteeList.substring(0, inviteeList.lastIndexOf('、'));
            return `${inviteeList} ${this.t('message.custom.无应答')}`;
          }
          // 群通话被叫超时
          return `${messageSender} ${this.t('message.custom.无应答')}`;
        }
        if (this.isOldUIKit('message.custom.对方无应答')) {
          return this.t('message.custom.无应答');
        }
        if (callMessage?.inviter === myUserID) {
          return this.t('message.custom.对方无应答');
        }
        return this.t('message.custom.超时无应答');
      default:
        return '';
    }
  }

  private handleCreateGroupCustomMessage(message: Message) {
    let text: undefined | string;
    const data = JSONToObject(message.payload.data);
    if (data?.businessID === 'group_create') {
      text = `${data.opUser} ${data.content}`;
    }
    return text;
  }

  private handleCallkitTimeoutSignaling(inviteeList: string[] = []) {
    if (inviteeList.length === 0) {
      return;
    }
    const userIDList: string[] = [];
    inviteeList.forEach((userID: string) => {
      const showName = false;
      if (showName) {
        this.userShowNameMap.set(userID, showName);
      } else if (!this.requestedUserMap.has(userID)) {
        userIDList.push(userID);
        this.requestedUserMap.set(userID, 1);
      }
    });
    // 注意：按照一条主叫超时信令请求一次处理，先不用截流处理
    if (userIDList.length > 0) {
      this.getEngine().TUIUser.getUserProfile({ userIDList }).then((imResponse: any) => {
        const profileList = imResponse.data || [];
        profileList.forEach((profile: any) => {
          const { userID, nick } = profile;
          const showName = nick || userID;
          this.userShowNameMap.set(userID, showName);
        });
      }).catch(() => {
        // 请求出错时捕获异常，避免阻塞代码执行流程
      });
    }
  }

  private substringByLength(str: string, len = 12) {
    return str.length > len ? `${str.slice(0, len)}...` : str;
  }

  private isOldUIKit(target: string) {
    const index = target.lastIndexOf('.');
    const flag = target.slice(0, index + 1);
    return this.t(target)?.startsWith(flag);
  }
}
