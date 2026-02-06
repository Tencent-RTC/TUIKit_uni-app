import { useLiveListState } from "@/uni_modules/tuikit-atomic-x/state/LiveListState";

const LanguageMap = {
  'zh-CN': 'zh-Hans', // android
  'zh-TW': 'zh-Hant', // android
  'zh-Hans-US': 'zh-Hans', // iOS
  en: 'en',
};

const { callExperimentalAPI } = useLiveListState();
export function setSdkLanguageFromSystem() {
  uni.getSystemInfo()
    .then((systemInfo) => {
      console.log(`systemInfo.language: ${systemInfo.language}`);
      const data = {
        api: 'setCurrentLanguage',
        params: {
          language: LanguageMap[systemInfo.language] || LanguageMap['zh-CN'],
        },
      };
      console.log(`callExperimentalAPI data: ${JSON.stringify(data)}`);

      callExperimentalAPI({ jsonData: JSON.stringify(data) });
    })
    .catch((e) => {
      console.error('获取系统信息失败', e);
    });
}