export function genTestUserSig({ SDKAppID: number, secretKey: string, userID: string }): {
  SDKAppID: number;
  userID: string;
  userSig: string;
};
