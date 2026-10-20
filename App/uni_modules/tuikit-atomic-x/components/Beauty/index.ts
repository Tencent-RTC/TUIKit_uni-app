import BeautySliders from './BeautySliders/index.nvue';
import BeautyPanel from './BeautyPanel/index.nvue';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export {
	BeautySliders,
	BeautyPanel,
};

export default BeautyPanel;
