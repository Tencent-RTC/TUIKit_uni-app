import CoGuestControlBar from './CoGuestControlBar.nvue';
import CoGuestPanel from './CoGuestPanel.nvue';
import CoGuestRequestPanel from './CoGuestRequestPanel.nvue';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export {
	CoGuestControlBar,
	CoGuestPanel,
	CoGuestRequestPanel,
};

export default CoGuestPanel;
