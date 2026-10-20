import { zhCN } from './zh-CN';
import { en } from './en';
import { getSystemLanguage } from '@/uni_modules/tuikit-atomic-x/components/locales';

const languageData: Record<string, Record<string, string>> = {
  'zh-CN': zhCN,
  'zh-Hans': zhCN,
  'zh': zhCN,
  'en': en,
};



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
