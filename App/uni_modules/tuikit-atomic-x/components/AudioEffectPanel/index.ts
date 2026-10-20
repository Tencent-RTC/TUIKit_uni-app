import AudioEffectPanel from './index.nvue';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export default AudioEffectPanel;
