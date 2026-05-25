// This file depends on LiveListState which is not available in the current module.
// Stubbed out for Vue2 compatibility.

const LanguageMap: Record<string, string> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'zh-Hans-US': 'zh-Hans',
  en: 'en',
};

export function setSdkLanguageFromSystem() {
  console.warn('[setSdkLanguageFromSystem] LiveListState not available, skipping.');
}
