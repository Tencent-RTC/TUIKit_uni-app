/**
 * Call role enum
 */
export enum CallRole {
  UNKNOWN = 'unknown',
  CALLEE = 'callee',
  CALLER = 'caller',
}

/**
 * Call status enum
 */
export enum CallStatus {
  IDLE = 'idle',
  CALLING = 'calling',
  CONNECTED = 'connected',
}

/**
 * User information interface
 */
export interface IUserInfo {
  id: string;
  name?: string;
  avatarUrl?: string;
  remark?: string;
  isMicrophoneOpened?: boolean;
  isCameraOpened?: boolean;
  role?: CallRole;
  status?: CallStatus;
}

/**
 * Call participant information interface
 */
export interface ICallParticipantInfo {
  selfInfo: IUserInfo;
  allParticipants: IUserInfo[];
  speakerVolumes: any[];
  networkQualities: any[];
}