/**
 * 个人中心页面配置
 */

export interface SettingItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

export const settingsList: SettingItem[] = [
  {
    id: 'privacy',
    label: '隐私',
    icon: '/static/images/mine/privacy.png',
    route: '/pages/privacy/privacy'
  },
  {
    id: 'disclaimer',
    label: '免责声明',
    icon: '/static/images/mine/disclaimer.png',
    route: '/pages/disclaimer/disclaimer'
  },
  {
    id: 'about',
    label: '关于',
    icon: '/static/images/mine/about.png',
    route: '/pages/icp/icp'
  },
  {
    id: 'settings',
    label: '设置',
    icon: '/static/images/mine/setting.png',
    route: '/pages/about/about'
  }
];

export default {
  settingsList
};
