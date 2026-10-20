// 组件库共享 i18n 机制:词条由各组件自带并注册进来,本文件只持有聚合表 + 查询。
// 用法(组件侧,对齐 hybrid_uikit LivePlayerView 方案):
//   1. 组件目录建 locales/{zh-CN.ts,en.ts,index.ts},locales/index.ts 只导出词条资源;
//   2. 组件目录建 index.ts(组件入口):import 词条并调用
//      registerComponentLocale({ 'zh-CN': zhCN, 'zh-Hans': zhCN, zh: zhCN, en }) 注册,
//      同时 import 并导出组件。消费方一律从组件入口 import 组件——入口模块加载即完成注册;
//   3. 组件 nvue 内只需 import { t } from '../locales' 查询(注册已由入口触发)。
// 系统语言检测与 SDK 语言解析也由本文件统一提供(getSystemLanguage/resolveSdkLanguage),
// 供 setSdkLanguageFromSystem、GiftPicker 等所有需要语言判定的场景共用。

const languageData: Record<string, Record<string, string>> = {
	'zh-CN': {},
	'zh-Hans': {},
	'zh': {},
	'en': {},
};

// 为何不用 uni.getSystemInfoSync().language:它返回【应用语言】而非系统语言——
// iOS 无对应本地化资源时回退开发语言(常 zh-CN),Android 13+ 的 per-app 语言可覆盖。
// plus.os.language(App-Plus)恒为操作系统语言,优先取它;非 App 环境回退 systemInfo。
export function getSystemLanguage(): string {
	// #ifdef APP-PLUS
	try {
		const lang = plus.os && plus.os.language;
		if (lang) return lang;
	} catch (e) { /* ignore */ }
	// #endif
	try {
		return uni.getSystemInfoSync().language || 'zh-CN';
	} catch (e) {
		return 'zh-CN';
	}
}

// 系统语言 → SDK 语言(zh-Hans/zh-Hant/en):精确命中→语言前缀回退(en-US→en)→zh-Hans 兜底,
// 与 t() 的词条判定同构,避免礼物名/SDK 文案与界面语言混排。
const SDK_LANGUAGE_MAP: Record<string, string> = {
	'zh-CN': 'zh-Hans',
	'zh-TW': 'zh-Hant',
	'zh-Hans-US': 'zh-Hans',
	'en': 'en',
};

export function resolveSdkLanguage(language: string): string {
	if (SDK_LANGUAGE_MAP[language]) return SDK_LANGUAGE_MAP[language];
	const prefix = (language || '').split('-')[0];
	if (SDK_LANGUAGE_MAP[prefix]) return SDK_LANGUAGE_MAP[prefix];
	return SDK_LANGUAGE_MAP['zh-CN'];
}

function registerComponentLocale(messages: Record<string, Record<string, string>>) {
	for (const lang in messages) {
		const table = languageData[lang] || (languageData[lang] = {});
		Object.assign(table, messages[lang]);
	}
}

function template(key: string): string {
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

	return languageData['zh-CN'][key] || key;
}

function t(key: string, params?: Record<string, string | number>): string {
	let result = template(key);
	if (!params) return result;
	for (const name in params) {
		result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), String(params[name]));
	}
	return result;
}

export { registerComponentLocale, t };
