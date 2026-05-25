import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min.js';
/**
 * Expiration time for the signature, it is recommended not to set it too short.
 * Time unit: seconds
 * Default time: 7 x 24 x 60 x 60 = 604800 = 7 days
 */
const EXPIRE_TIME = 604800;

function genTestUserSig({ userID, SDKAppID, secretKey }) {
  const generator = new LibGenerateTestUserSig(SDKAppID, secretKey, EXPIRE_TIME);
  const userSig = generator.genTestUserSig(userID);

  return {
    userID,
    SDKAppID,
    userSig,
  };
}

export { genTestUserSig };
