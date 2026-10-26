import { registerComponentLocale, t } from '../../components/locales';
import { zhCN, en } from './locales';
import { LIVE_ERROR_MAP } from './errorMaps';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

function getLiveErrorMessage(code: number): string {
	const key = LIVE_ERROR_MAP[code];
	return key ? t(key) : t('LiveError.Fallback', { code });
}

export { getLiveErrorMessage };
