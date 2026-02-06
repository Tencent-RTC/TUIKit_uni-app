import {
  CallStatus,
  CallRole,
  CallMediaType,
  AudioPlaybackDevice,
} from "../const/index";

export interface ICallStore {
  callStatus: CallStatus;
  callRole: CallRole;
  callMediaType: CallMediaType;
  localUserInfo: object;
  callDuration: string;
  callTips: string;
  language: string;
  translate: Function;
  enableFloatWindow: boolean;
  isGroupCall: boolean;
  isLocalMicOpen: boolean;
  isLocalCameraOpen: boolean;
  isEarPhone: boolean;
  currentSpeakerStatus: AudioPlaybackDevice;
  isLocalBlurOpen: boolean;
  currentCameraIsOpen: boolean;
}
