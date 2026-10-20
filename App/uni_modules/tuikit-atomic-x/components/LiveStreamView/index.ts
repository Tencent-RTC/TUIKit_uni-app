import LiveStreamActionPanel from './LiveStreamActionPanel.nvue';
import LiveStreamView from './LiveStreamView.nvue';
import UserInfoPanel from './UserInfoPanel.nvue';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export {
	LiveStreamActionPanel,
	LiveStreamView,
	UserInfoPanel,
};

export default LiveStreamView;
