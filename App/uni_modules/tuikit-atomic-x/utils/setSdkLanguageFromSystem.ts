import { useLiveListState } from "@/uni_modules/tuikit-atomic-x/state/LiveListState";
import { getSystemLanguage, resolveSdkLanguage } from "../components/locales";

const { callExperimentalAPI } = useLiveListState();
export function setSdkLanguageFromSystem() {
	const systemLanguage = getSystemLanguage();
	const language = resolveSdkLanguage(systemLanguage);
	console.log(`setSdkLanguageFromSystem: system=${systemLanguage} sdk=${language}`);
	callExperimentalAPI({
		jsonData: JSON.stringify({
			api: 'setCurrentLanguage',
			params: { language },
		}),
	});
}
