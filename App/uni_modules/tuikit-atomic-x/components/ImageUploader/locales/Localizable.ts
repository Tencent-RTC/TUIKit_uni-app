import { zhCN } from './zh-CN';
import { en } from './en';

const languageData : Record<string, Record<string, string>> = {
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
};

function getSystemLanguage() : string {
	try {
		const systemInfo = uni.getSystemInfoSync();
		return systemInfo.language || 'zh-CN';
	} catch {
		return 'zh-CN';
	}
}

export function localizedString(key : string) : string {
	const lang = getSystemLanguage();

	if (languageData[lang]?.[key]) {
		return languageData[lang][key];
	}

	const parts = lang.split('-');
	for (let i = parts.length - 1; i >= 1; i--) {
		const prefix = parts.slice(0, i).join('-');
		if (languageData[prefix]?.[key]) {
			return languageData[prefix][key];
		}
	}

	return zhCN[key] || key;
}