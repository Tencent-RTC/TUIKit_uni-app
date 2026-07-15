import { MessageType, MessageStatus } from '../../types/message';
import { AlbumMediaType, createAlbumPicker } from '../AlbumPicker/AlbumPicker';
import { useMessageInputState } from '../../state_compatible/MessageInputState';
import { useMessageListState } from '../../state_compatible/MessageListState';
import { useLoginState } from '../../state_compatible/LoginState';

var TAG = '[AlbumPickerMediaSendManager]';
var PLACEHOLDER_PREFIX = 'placeholder_video_';
var loginState = useLoginState();

var cachedGrayThumbnailPath: string | null = null;

function getPickerSessions() {
  try {
    var app = getApp();
    if (app && app.globalData) {
      if (!app.globalData.__PICKER_SESSIONS__) {
        app.globalData.__PICKER_SESSIONS__ = [];
      }
      return app.globalData.__PICKER_SESSIONS__;
    }
  } catch (e) {}
  return [];
}

export function openAlbumPicker(conversationID: any, config: any) {
  console.log(TAG, 'openAlbumPicker, conversationID:', conversationID);
  var pickerSessions = getPickerSessions();

  var picker = createAlbumPicker();
  var session = {
    picker: picker,
    conversationID: conversationID,
    sentMediaIds: {},
    mediaStates: {},
  };
  pickerSessions.push(session);

  picker.show(config, undefined, {
    onPickConfirm: function(medias: any, textMessage: any) {
      console.log(TAG, 'onPickConfirm: ' + medias.length + ' items');
    },

    onMediaProcessing: function(albumMedia: any, progress: any, error: any) {
      handleMediaProcessing(session, albumMedia, progress, error);
    },

    onMediaProcessed: function() {
      console.log(TAG, 'onMediaProcessed: conversationID=' + conversationID);
      removeSession(pickerSessions, session);
      refreshMessageList(conversationID);
    },

    onCancel: function() {
      console.log(TAG, 'onCancel: conversationID=' + conversationID);
      removeSession(pickerSessions, session);
      refreshMessageList(conversationID);
    },
  });
}

export function getPlaceholderMessages(conversationID: any) {
  var placeholders = [];
  var sessions = getPickerSessions();
  for (var i = 0; i < sessions.length; i++) {
    var session = sessions[i];
    if (session.conversationID !== conversationID) continue;
    var keys = Object.keys(session.mediaStates);
    for (var j = 0; j < keys.length; j++) {
      var state = session.mediaStates[keys[j]];
      if (state && state.placeholder) {
        placeholders.push(state.placeholder);
      }
    }
  }
  return placeholders;
}

function removeSession(sessions: any, session: any) {
  var idx = sessions.indexOf(session);
  if (idx !== -1) {
    sessions.splice(idx, 1);
  }
}

function handleMediaProcessing(session: any, albumMedia: any, progress: any, error: any) {
  if (error) return;
  if (session.sentMediaIds[albumMedia.id]) return;

  if (albumMedia.mediaType === AlbumMediaType.IMAGE) {
    if (progress >= 1.0 && albumMedia.mediaPath) {
      session.sentMediaIds[albumMedia.id] = true;
      sendImageMessage(session.conversationID, albumMedia);
    }
    return;
  }

  if (albumMedia.mediaType === AlbumMediaType.VIDEO) {
    handleVideoProgress(session, albumMedia, progress);
    return;
  }
}

function handleVideoProgress(session: any, albumMedia: any, progress: any) {
  var mediaId = albumMedia.id;
  var state = session.mediaStates[mediaId];
  if (!state) {
    state = { placeholderCreating: false, progress: 0, placeholder: null };
    session.mediaStates[mediaId] = state;
  }
  state.progress = progress;

  createPlaceholderIfNeeded(session, albumMedia, state);

  if (state.placeholder && progress < 1.0) {
    state.placeholder.progress = Math.round(progress * 100);
    var currentList = useMessageListState({ conversationID: session.conversationID }).messageList.value;
    var found = false;
    for (var i = 0; i < currentList.length; i++) {
      if (currentList[i].msgID === state.placeholder.msgID) {
        found = true;
        break;
      }
    }
    if (!found) {
      refreshMessageList(session.conversationID);
    }
    return;
  }

  if (progress >= 1.0 && albumMedia.mediaPath) {
    session.sentMediaIds[mediaId] = true;
    delete session.mediaStates[mediaId];

    if (!albumMedia.videoThumbnailPath) {
      createGrayThumbnail().then(function(grayPath: any) {
        var mediaWithThumbnail: any = {};
        for (var key in albumMedia) {
          mediaWithThumbnail[key] = albumMedia[key];
        }
        mediaWithThumbnail.videoThumbnailPath = grayPath;
        sendVideoMessage(session.conversationID, mediaWithThumbnail);
      }).catch(function(err: any) {
        console.error(TAG, 'createGrayThumbnail failed, send without thumbnail:', err);
        sendVideoMessage(session.conversationID, albumMedia);
      });
    } else {
      sendVideoMessage(session.conversationID, albumMedia);
    }
  }
}

function createPlaceholderIfNeeded(session: any, albumMedia: any, state: any) {
  if (state.placeholder || state.placeholderCreating) return;

  state.placeholderCreating = true;
  var snapshotPath = albumMedia.videoThumbnailPath || '';

  if (snapshotPath) {
    var infoSrc = snapshotPath.indexOf('/') === 0 ? 'file://' + snapshotPath : snapshotPath;
    uni.getImageInfo({
      src: infoSrc,
      success: function(info: any) {
        buildPlaceholder(session, albumMedia, state, snapshotPath, info.width || 0, info.height || 0);
      },
      fail: function() {
        buildPlaceholder(session, albumMedia, state, snapshotPath, 0, 0);
      },
    });
  } else {
    buildPlaceholder(session, albumMedia, state, '', 0, 0);
  }
}

function buildPlaceholder(session: any, albumMedia: any, state: any, snapshotPath: any, width: any, height: any) {
  var loginUser = loginState.getLoginUserInfo();

  var videoSnapshotPath = snapshotPath;
  if (videoSnapshotPath.indexOf('file:///') === 0) {
    videoSnapshotPath = videoSnapshotPath.substring(7);
  }

  var placeholder = {
    msgID: PLACEHOLDER_PREFIX + albumMedia.id + '_' + Date.now(),
    sender: {
      userID: (loginUser && loginUser.userID) ? loginUser.userID : '',
      avatarURL: loginUser ? loginUser.avatarURL : undefined,
      nickname: loginUser ? loginUser.nickname : undefined,
    },
    isSelf: true,
    timestamp: Math.floor(Date.now() / 1000),
    status: MessageStatus.SENDING,
    progress: Math.round(state.progress * 100),
    atUserList: [],
    isPinned: false,
    messageType: MessageType.VIDEO,
    messageBody: {
      videoSnapshotPath: videoSnapshotPath,
      videoSnapshotWidth: width,
      videoSnapshotHeight: height,
      videoSnapshotSize: 0,
      videoDuration: albumMedia.duration || 0,
      videoPath: '',
      videoType: 'mp4',
      videoSize: 0,
      originalImageWidth: 0,
      originalImageHeight: 0,
      originalImageSize: 0,
      soundSize: 0,
      soundDuration: 0,
      fileSize: 0,
      faceIndex: 0,
    },
    needReadReceipt: false,
    supportExtension: false,
    extensionList: [],
    reactionList: [],
    repliedMessageCount: 0,
  };

  state.placeholder = placeholder;
  refreshMessageList(session.conversationID);
}

function createGrayThumbnail() {
  if (cachedGrayThumbnailPath) {
    return Promise.resolve(cachedGrayThumbnailPath);
  }

  return new Promise(function(resolve: any, reject: any) {
    var grayPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVQYV2M0Mzb5z0ABYBw1kn4mAgA2bAILwLMOFgAAAABJRU5ErkJggg==';
    var savePath = '_doc/gray_video_thumbnail.png';

    try {
      // @ts-ignore — plus.nativeObj.Bitmap 是 uni-app 运行时 API
      var bitmap = new plus.nativeObj.Bitmap('gray_thumb_' + Date.now());
      bitmap.loadBase64Data(
        'data:image/png;base64,' + grayPngBase64,
        function() {
          bitmap.save(
            savePath,
            { overwrite: true, quality: 100 },
            function(event: any) {
              bitmap.clear();
              var absolutePath = plus.io.convertLocalFileSystemURL(savePath);
              cachedGrayThumbnailPath = absolutePath;
              console.log(TAG, 'Gray thumbnail created:', absolutePath);
              resolve(absolutePath);
            },
            function(err: any) {
              bitmap.clear();
              console.error(TAG, 'Bitmap save failed:', err);
              reject(err);
            }
          );
        },
        function(err: any) {
          console.error(TAG, 'Bitmap loadBase64Data failed:', err);
          reject(err);
        }
      );
    } catch (e) {
      console.error(TAG, 'createGrayThumbnail exception:', e);
      reject(e);
    }
  });
}

function refreshMessageList(conversationID: any) {
  var state = useMessageListState({ conversationID: conversationID });
  var placeholders = getPlaceholderMessages(conversationID);
  var currentList = state.messageList.value;

  var filtered = [];
  for (var i = 0; i < currentList.length; i++) {
    var msg = currentList[i];
    if (!msg.msgID || msg.msgID.indexOf(PLACEHOLDER_PREFIX) !== 0) {
      filtered.push(msg);
    }
  }

  if (placeholders.length > 0) {
    state.messageList.value = filtered.concat(placeholders);
  } else if (filtered.length !== currentList.length) {
    state.messageList.value = filtered;
  }
}

function removeFilePrefix(path: any) {
  if (!path) return '';
  return path.indexOf('file:///') === 0 ? path.substring(7) : path;
}

function sendImageMessage(conversationID: any, media: any) {
  var imagePath = removeFilePrefix(media.mediaPath);
  var inputState = useMessageInputState({ conversationID: conversationID });
  var infoSrc = imagePath.indexOf('/') === 0 ? 'file://' + imagePath : imagePath;
  uni.getImageInfo({
    src: infoSrc,
    success: function(info: any) {
      console.log(TAG, 'sendImage: width=' + info.width + ', height=' + info.height + ', path=' + imagePath);
      if (inputState) {
        inputState.sendMessage({
          type: 'image',
          imagePath: imagePath,
          imageWidth: info.width || 1920,
          imageHeight: info.height || 1080,
        }).catch(function(err: any) {
          console.error(TAG, 'sendImageMessage failed:', err);
        });
      }
    },
    fail: function() {
      console.log(TAG, 'sendImage: getImageInfo failed, using default 1920x1080, path=' + imagePath);
      if (inputState) {
        inputState.sendMessage({
          type: 'image',
          imagePath: imagePath,
          imageWidth: 1920,
          imageHeight: 1080,
        }).catch(function(err: any) {
          console.error(TAG, 'sendImageMessage failed:', err);
        });
      }
    },
  });
}

function sendVideoMessage(conversationID: any, media: any) {
  var videoPath = removeFilePrefix(media.mediaPath);
  var snapshotPath = removeFilePrefix(media.videoThumbnailPath || '');
  var inputState = useMessageInputState({ conversationID: conversationID });
  var infoSrc = videoPath.indexOf('/') === 0 ? 'file://' + videoPath : videoPath;

  uni.getVideoInfo({
    src: infoSrc,
    success: function(info: any) {
      console.log(TAG, 'sendVideo: width=' + info.width + ', height=' + info.height + ', duration=' + media.duration + ', path=' + videoPath);
      if (inputState) {
        inputState.sendMessage({
          type: 'video',
          videoFilePath: videoPath,
          videoType: 'mp4',
          duration: media.duration || 0,
          snapshotPath: snapshotPath,
          snapshotWidth: info.width || 1920,
          snapshotHeight: info.height || 1080,
        }).catch(function(err: any) {
          console.error(TAG, 'sendVideoMessage failed:', err);
        });
      }
    },
    fail: function() {
      console.log(TAG, 'sendVideo: getVideoInfo failed, using default 1920x1080, path=' + videoPath);
      if (inputState) {
        inputState.sendMessage({
          type: 'video',
          videoFilePath: videoPath,
          videoType: 'mp4',
          duration: media.duration || 0,
          snapshotPath: snapshotPath,
          snapshotWidth: 1920,
          snapshotHeight: 1080,
        }).catch(function(err: any) {
          console.error(TAG, 'sendVideoMessage failed:', err);
        });
      }
    },
  });
}
