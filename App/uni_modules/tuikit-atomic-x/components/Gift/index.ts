import FloatingGiftCombo from './FloatingGiftCombo.nvue';
import GiftEntryBanner from './GiftEntryBanner.nvue';
import GiftPicker from './GiftPicker.nvue';
import GiftPlayer from './GiftPlayer.nvue';
import { giftService } from './giftService';
import { zhCN, en } from './locales';
import { registerComponentLocale } from '../locales';

registerComponentLocale({
	'zh-CN': zhCN,
	'zh-Hans': zhCN,
	'zh': zhCN,
	'en': en,
});

export {
	FloatingGiftCombo,
	GiftEntryBanner,
	GiftPicker,
	GiftPlayer,
	giftService,
};

export default GiftPicker;
