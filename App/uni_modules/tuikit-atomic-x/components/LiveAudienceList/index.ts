import AudienceActionPanel from './AudienceActionPanel/index.nvue';
import AudienceProfilePanel from './AudienceProfilePanel/index.nvue';
import LiveAudienceList from './LiveAudienceList/index.nvue';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export {
	AudienceActionPanel,
	AudienceProfilePanel,
	LiveAudienceList,
};

export default LiveAudienceList;
