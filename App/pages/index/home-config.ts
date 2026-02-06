/**
 * home config
 */
export interface ModuleItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
}

export interface SecurityDialogConfig {
  title: string;
  intro: string;
  tips: string[];
  footer: string;
  buttonText: string;
  countdownSeconds: number;
}

export interface HomeConfig {
  noticeText: string;
  modules: ModuleItem[];
  securityDialog: SecurityDialogConfig;
}

const homeConfig: HomeConfig = {
  noticeText: '仅用于业务功能体验，请勿轻信汇款、中奖等涉及钱款的信息，谨防上当受骗，立即举报',
  modules: [
    {
      id: 'chat',
      title: '通话',
      icon: '/static/images/index/call-icon.png',
      description: '呼铃通知·通话悬浮窗·通话卡顿优化',
      route: '/pages/scenes/call/index'
    },
    {
      id: 'live',
      title: '直播',
      icon: '/static/images/index/live-icon.png',
      description: '开播预约·智能美颜·连麦PK',
      route: '/pages/scenes/live/livelist/index'
    },
    {
      id: 'meeting',
      title: '会议',
      icon: '/static/images/index/meeting-icon.png',
      description: '快速会议·邀请入会·会中管控·共享屏幕',
      route: ''
    },
    {
      id: 'chatroom',
      title: '聊天',
      icon: '/static/images/index/chat-icon.png',
      description: '群组聊天·好友通讯录·语音消息·资料多端同步',
      route: '/pages/scenes/chat/conversationList/conversationList'
    }
  ],

  securityDialog: {
    title: '安全提示',
    intro: '腾讯云音视频 App 为您提供腾讯云音视频及通信云服务的演示与体验,请注意:',
    tips: [
      '1. 本 App 用途仅适用于演示和体验,请勿用于日常沟通或商业交易。',
      '2. 请勿向陌生人透露您的个人信息、账号密码等敏感信息,以保护您的隐私安全。',
      '3. 请务必警惕汇款、中奖等涉及钱款的信息,避免上当受骗。',
      '4. 如遇到可疑情况,请及时向我们反馈,我们将尽快为您核实处理。'
    ],
    footer: '感谢您的理解与支持,祝您使用愉快!',
    buttonText: '我知道了',
    countdownSeconds: 5
  }
};

export default homeConfig;
