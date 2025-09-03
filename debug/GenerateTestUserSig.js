import LibGenerateTestUserSig from "./lib-generate-test-usersig-es.min.js";

let SDKAppID = 0;

let SDKSECRETKEY = "";

/**
 * Expiration time for the signature, it is recommended not to set it too short.
 * Time unit: seconds
 * Default time: 7 x 24 x 60 x 60 = 604800 = 7 days
 */
const EXPIRETIME = 604800;

export function genTestUserSig(userID) {
	const generator = new LibGenerateTestUserSig(SDKAppID, SDKSECRETKEY, EXPIRETIME);
	const userSig = generator.genTestUserSig(userID);
	const userName = userID || `user_${	Math.ceil(Math.random() * 10)}`

	return {
		SDKAppID,
		userSig,
		userName,
	};
}