// 商业化能力位文档：https://iwiki.woa.com/pages/viewpage.action?pageId=717923757
interface ICommercialAbility {
  enabledMessageReadReceipt: number;
  enabledEmojiPlugin: number;
  enabledOnlineStatus: number;
  enabledCustomerServicePlugin: number;
  enabledTranslationPlugin: number;
  enabledVoiceToText: number;
  [key: string]: number;
}
export const commercialAbility: ICommercialAbility = {
  enabledMessageReadReceipt: Math.pow(2, 5),
  enabledEmojiPlugin: Math.pow(2, 48),
  enabledOnlineStatus: Math.pow(2, 7),
  enabledCustomerServicePlugin: Math.pow(2, 40),
  enabledTranslationPlugin: Math.pow(2, 38),
  enabledVoiceToText: Math.pow(2, 39),
};
