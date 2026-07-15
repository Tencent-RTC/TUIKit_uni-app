import { MessageType, MessageStatus } from '../../types/message';
import type { MessageInfo, SendMessagePayload, SendMessageOption, OfflinePushInfoResolver } from '../../types/message';
import { ConversationType } from '../../types/conversation';
import type { AlbumPickerConfig, AlbumMedia } from '../AlbumPicker/AlbumPicker';
import { AlbumMediaType, AlbumPicker } from '../AlbumPicker/AlbumPicker';
import { useMessageInputState } from '../../state/MessageInputState';
import { useMessageListState } from '../../state/MessageListState';
import { useLoginState } from '../../state/LoginState';
import { buildOfflinePushInfo } from '../../utils/buildOfflinePushInfo';

const TAG = '[AlbumPickerMediaSendManager]';
const PLACEHOLDER_PREFIX = 'placeholder_video_';
const { getLoginUserInfo } = useLoginState();

let cachedGrayThumbnailPath: string | null = null;

interface MediaState {
  placeholder?: MessageInfo;
  placeholderCreating: boolean;
  thumbnailPath?: string;
  progress: number;
}

interface PickerSession {
  picker: AlbumPicker;
  conversationID: string;
  sentMediaIds: Set<number>;
  mediaStates: Map<number, MediaState>;
  /** 业务方注入的离线推送配置（透传自 ToolsPanel 的 setOfflinePushInfo） */
  setOfflinePushInfo?: OfflinePushInfoResolver;
}

function getPickerSessions(): Set<PickerSession> {
  try {
    const app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__PICKER_SESSIONS__) {
        app.globalData.__PICKER_SESSIONS__ = new Set<PickerSession>();
      }
      return app.globalData.__PICKER_SESSIONS__;
    }
  } catch (e) {}
  return new Set<PickerSession>();
}

export function openAlbumPicker(
  conversationID: string,
  config: AlbumPickerConfig,
  options?: { setOfflinePushInfo?: OfflinePushInfoResolver }
): void {
  console.log(TAG, 'openAlbumPicker, conversationID:', conversationID);
  const pickerSessions = getPickerSessions();

  const picker = new AlbumPicker();
  const session: PickerSession = {
    picker,
    conversationID,
    sentMediaIds: new Set<number>(),
    mediaStates: new Map<number, MediaState>(),
    setOfflinePushInfo: options?.setOfflinePushInfo,
  };
  pickerSessions.add(session);

  picker.show(config, undefined, {
    onPickConfirm: (medias: AlbumMedia[], textMessage: string | null) => {
      console.log(TAG, `onPickConfirm: ${medias.length} items`);
    },

    onMediaProcessing: (albumMedia: AlbumMedia, progress: number, error: boolean) => {
      handleMediaProcessing(session, albumMedia, progress, error);
    },

    onMediaProcessed: () => {
      console.log(TAG, `onMediaProcessed: conversationID=${conversationID}`);
      pickerSessions.delete(session);
      refreshMessageList(conversationID);
    },

    onCancel: () => {
      console.log(TAG, `onCancel: conversationID=${conversationID}`);
      pickerSessions.delete(session);
      refreshMessageList(conversationID);
    },
  });
}

export function getPlaceholderMessages(conversationID: string): MessageInfo[] {
  const placeholders: MessageInfo[] = [];
  for (const session of getPickerSessions()) {
    if (session.conversationID !== conversationID) continue;
    for (const state of session.mediaStates.values()) {
      if (state.placeholder) {
        placeholders.push(state.placeholder);
      }
    }
  }
  return placeholders;
}

function handleMediaProcessing(
  session: PickerSession,
  albumMedia: AlbumMedia,
  progress: number,
  error: boolean,
): void {
  if (error) return;
  if (session.sentMediaIds.has(albumMedia.id)) return;

  if (albumMedia.mediaType === AlbumMediaType.IMAGE) {
    if (progress >= 1.0 && albumMedia.mediaPath) {
      session.sentMediaIds.add(albumMedia.id);
      sendImageMessage(session, albumMedia);
    }
    return;
  }

  if (albumMedia.mediaType === AlbumMediaType.VIDEO) {
    handleVideoProgress(session, albumMedia, progress);
    return;
  }
}

function handleVideoProgress(
  session: PickerSession,
  albumMedia: AlbumMedia,
  progress: number,
): void {
  let state = session.mediaStates.get(albumMedia.id);
  if (!state) {
    state = { placeholderCreating: false, progress: 0 };
    session.mediaStates.set(albumMedia.id, state);
  }
  state.progress = progress;

  createPlaceholderIfNeeded(session, albumMedia, state);

  if (state.placeholder && progress < 1.0) {
    // 上传进度：底层 MessageInfo 字段已从 progress 拆分为 uploadMediaProgress / downloadMediaProgress
    state.placeholder.uploadMediaProgress = Math.round(progress * 100);
    const currentList = useMessageListState({ conversationID: session.conversationID }).messageList.value;
    if (!currentList.some((msg) => msg.msgID === state.placeholder!.msgID)) {
      refreshMessageList(session.conversationID);
    }
    return;
  }

  if (progress >= 1.0 && albumMedia.mediaPath) {
    session.sentMediaIds.add(albumMedia.id);
    session.mediaStates.delete(albumMedia.id);

    if (!albumMedia.videoThumbnailPath) {
      createGrayThumbnail().then((grayPath) => {
        const mediaWithThumbnail: AlbumMedia = {
          ...albumMedia,
          videoThumbnailPath: grayPath,
        };
        sendVideoMessage(session, mediaWithThumbnail);
      }).catch((err) => {
        console.error(TAG, 'createGrayThumbnail failed, send without thumbnail:', err);
        sendVideoMessage(session, albumMedia);
      });
    } else {
      sendVideoMessage(session, albumMedia);
    }
  }
}

function createPlaceholderIfNeeded(
  session: PickerSession,
  albumMedia: AlbumMedia,
  state: MediaState,
): void {
  if (state.placeholder || state.placeholderCreating) return;

  state.placeholderCreating = true;
  const snapshotPath = albumMedia.videoThumbnailPath || '';

  if (snapshotPath) {
    const infoSrc = snapshotPath.startsWith('/') ? 'file://' + snapshotPath : snapshotPath;
    uni.getImageInfo({
      src: infoSrc,
      success: (info: any) => {
        buildPlaceholder(session, albumMedia, state, snapshotPath, info.width || 0, info.height || 0);
      },
      fail: () => {
        buildPlaceholder(session, albumMedia, state, snapshotPath, 0, 0);
      },
    });
  } else {
    buildPlaceholder(session, albumMedia, state, '', 0, 0);
  }
}

function buildPlaceholder(
  session: PickerSession,
  albumMedia: AlbumMedia,
  state: MediaState,
  snapshotPath: string,
  width: number,
  height: number,
): void {
  const loginUser = getLoginUserInfo();
  const normalizedSnapshotPath = snapshotPath.startsWith('file:///') ? snapshotPath.substring(7) : snapshotPath;

  // VideoMessagePayload（PR-1 sealed union 子类）只包含视频本身字段；
  // 不再有 originalImage* / sound* / fileSize / faceIndex / videoSnapshotSize 等扁平字段。
  const placeholder: MessageInfo = {
    msgID: `${PLACEHOLDER_PREFIX}${albumMedia.id}_${Date.now()}`,
    from: {
      userID: loginUser?.userID || '',
      avatarURL: loginUser?.avatarURL,
      nickname: loginUser?.nickname,
    },
    to: '',
    isSentBySelf: true,
    timestamp: Math.floor(Date.now() / 1000),
    status: MessageStatus.SENDING,
    conversationType: ConversationType.UNKNOWN,
    messageType: MessageType.VIDEO,
    messagePayload: {
      videoSnapshotPath: normalizedSnapshotPath,
      videoSnapshotWidth: width,
      videoSnapshotHeight: height,
      videoDuration: albumMedia.duration || 0,
      videoPath: '',
      videoType: 'mp4',
      videoSize: 0,
    },
    uploadMediaProgress: Math.round(state.progress * 100),
    downloadMediaProgress: 0,
    atUserList: [],
    isPinned: false,
    needReadReceipt: false,
    isExtensionEnabled: false,
    extensionList: [],
    reactionList: [],
  };

  state.placeholder = placeholder;
  refreshMessageList(session.conversationID);
}

function createGrayThumbnail(): Promise<string> {
  if (cachedGrayThumbnailPath) {
    return Promise.resolve(cachedGrayThumbnailPath);
  }

  return new Promise((resolve, reject) => {
    const grayPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVQYV2M0Mzb5z0ABYBw1kn4mAgA2bAILwLMOFgAAAABJRU5ErkJggg==';
    const savePath = '_doc/gray_video_thumbnail.png';

    try {
      const bitmap = new plus.nativeObj.Bitmap('gray_thumb_' + Date.now());
      bitmap.loadBase64Data(
        'data:image/png;base64,' + grayPngBase64,
        () => {
          bitmap.save(
            savePath,
            { overwrite: true, quality: 100 },
            (event) => {
              bitmap.clear();
              const absolutePath = plus.io.convertLocalFileSystemURL(savePath);
              cachedGrayThumbnailPath = absolutePath;
              console.log(TAG, 'Gray thumbnail created:', absolutePath);
              resolve(absolutePath);
            },
            (err) => {
              bitmap.clear();
              console.error(TAG, 'Bitmap save failed:', err);
              reject(err);
            },
          );
        },
        (err) => {
          console.error(TAG, 'Bitmap loadBase64Data failed:', err);
          reject(err);
        },
      );
    } catch (e) {
      console.error(TAG, 'createGrayThumbnail exception:', e);
      reject(e);
    }
  });
}

function refreshMessageList(conversationID: string): void {
  const state = useMessageListState({ conversationID });
  const placeholders = getPlaceholderMessages(conversationID);
  const currentList = state.messageList.value;

  const filtered = currentList.filter(
    (msg) => !msg.msgID || !msg.msgID.startsWith(PLACEHOLDER_PREFIX)
  );

  if (placeholders.length > 0) {
    state.messageList.value = [...filtered, ...placeholders];
  } else if (filtered.length !== currentList.length) {
    state.messageList.value = filtered;
  }
}

function removeFilePrefix(path: string): string {
  return path.startsWith('file:///') ? path.substring(7) : path;
}

function sendImageMessage(session: PickerSession, media: AlbumMedia): void {
  const conversationID = session.conversationID;
  const imagePath = removeFilePrefix(media.mediaPath);
  const state = useMessageInputState({ conversationID });
  const infoSrc = imagePath.startsWith('/') ? 'file://' + imagePath : imagePath;

  const send = (width: number, height: number) => {
    const payload: SendMessagePayload = {
      type: 'image',
      imagePath,
      imageWidth: width,
      imageHeight: height,
    };
    const offlinePushInfo = buildOfflinePushInfo(session.setOfflinePushInfo, {
      messageType: MessageType.IMAGE,
      messagePayload: payload,
      conversationID,
    });
    const option: SendMessageOption = {};
    if (offlinePushInfo) option.offlinePushInfo = offlinePushInfo;

    state?.sendMessage(payload, option).catch(err => {
      console.error(TAG, 'sendMessage(image) failed:', err);
    });
  };

  uni.getImageInfo({
    src: infoSrc,
    success: (info: any) => {
      console.log(TAG, `sendImage: width=${info.width}, height=${info.height}, path=${imagePath}`);
      send(info.width || 1920, info.height || 1080);
    },
    fail: () => {
      console.log(TAG, `sendImage: getImageInfo failed, using default 1920x1080, path=${imagePath}`);
      send(1920, 1080);
    },
  });
}

function sendVideoMessage(session: PickerSession, media: AlbumMedia): void {
  const conversationID = session.conversationID;
  const videoPath = removeFilePrefix(media.mediaPath);
  const snapshotPath = removeFilePrefix(media.videoThumbnailPath || '');
  const state = useMessageInputState({ conversationID });
  const infoSrc = videoPath.startsWith('/') ? 'file://' + videoPath : videoPath;

  const send = (width: number, height: number) => {
    const payload: SendMessagePayload = {
      type: 'video',
      videoFilePath: videoPath,
      videoType: 'mp4',
      duration: media.duration || 0,
      snapshotPath,
      snapshotWidth: width,
      snapshotHeight: height,
    };
    const offlinePushInfo = buildOfflinePushInfo(session.setOfflinePushInfo, {
      messageType: MessageType.VIDEO,
      messagePayload: payload,
      conversationID,
    });
    const option: SendMessageOption = {};
    if (offlinePushInfo) option.offlinePushInfo = offlinePushInfo;

    state?.sendMessage(payload, option).catch(err => {
      console.error(TAG, 'sendMessage(video) failed:', err);
    });
  };

  uni.getVideoInfo({
    src: infoSrc,
    success: (info: any) => {
      console.log(TAG, `sendVideo: width=${info.width}, height=${info.height}, duration=${media.duration}, path=${videoPath}`);
      send(info.width || 1920, info.height || 1080);
    },
    fail: () => {
      console.log(TAG, `sendVideo: getVideoInfo failed, using default 1920x1080, path=${videoPath}`);
      send(1920, 1080);
    },
  });
}
