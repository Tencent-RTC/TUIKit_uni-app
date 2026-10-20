import { zhCN as pageZhCN } from './zh-CN';
import { en as pageEn } from './en';
import { roomErrorZhCN, roomErrorEn } from '@/uni_modules/tuikit-atomic-x/constants/roomErrorLocales';

const zhCN: Record<string, string> = { ...pageZhCN, ...roomErrorZhCN };
const en: Record<string, string> = { ...pageEn, ...roomErrorEn };

const languageData: Record<string, Record<string, string>> = {
  'zh-CN': zhCN,
  'zh-Hans': zhCN,
  'zh': zhCN,
  'en': en,
};

function getSystemLanguage(): string {
  try {
    const systemInfo = uni.getSystemInfoSync();
    return systemInfo.language || 'zh-CN';
  } catch {
    return 'zh-CN';
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

  return zhCN[key] || key;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let result = template(key);
  if (!params) return result;
  for (const name in params) {
    result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), String(params[name]));
  }
  return result;
}
