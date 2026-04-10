/**
 * home config
 */
export interface ModuleItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
  isTabbar?: boolean;
}

export interface HomeConfig {
  modules: ModuleItem[];
}

const homeConfig: HomeConfig = {
  modules: [
    {
      id: 'call',
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
      id: 'chat',
      title: '聊天',
      icon: '/static/images/index/chat-icon.png',
      description: '群组聊天·好友通讯录·语音消息·资料多端同步',
      route: '/pages/scenes/chat/conversationList/conversationList',
      isTabbar: true
    }
  ]
};

export default homeConfig;
