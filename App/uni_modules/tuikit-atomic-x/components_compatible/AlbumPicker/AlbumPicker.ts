import { AlbumPickerImpl } from './impl/AlbumPickerImpl';
// @ts-ignore — uni-app 编译器会正确解析 UTS 插件路径，TS 类型检查可忽略
import { showAlbumPicker } from '@/uni_modules/tuikit-atomic-x';

export var AlbumPickerMediaFilter = {
  IMAGE_ONLY: 0,
  VIDEO_ONLY: 1,
  IMAGE_AND_VIDEO: 2,
};

export var AlbumMediaType = {
  IMAGE: 0,
  VIDEO: 1,
};

export var AlbumPickerStyle = {
  LIKE_WECHAT: 0,
  LIKE_WHATSAPP: 1,
};

export var AlbumPickerLanguage = {
  SYSTEM: 0,
  EN: 1,
  ZH_HANS: 2,
  ZH_HANT: 3,
  AR: 4,
};

export var AlbumPickerCompressQuality = {
  STANDARD: 0,
  HIGH: 1,
};

export function createAlbumPicker() {
  var listener: any = null;
  var sessionId = 'album_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  return {
    show: function(config: any, theme: any, inListener: any) {
      listener = inListener;

      var nativeConfig = JSON.stringify(AlbumPickerImpl.serializeConfig(config));
      var nativeTheme = JSON.stringify(AlbumPickerImpl.serializeTheme(theme));

      showAlbumPicker(
        nativeConfig,
        nativeTheme,
        sessionId,
        function(jsonStr: any) {
          try {
            var parsed = JSON.parse(jsonStr);
            var dataList = parsed.pickedAlbumMedias || [];
            var textMessage = parsed.textMessage || null;
            var medias = AlbumPickerImpl.parseAlbumMediaList(dataList);
            if (listener && listener.onPickConfirm) {
              listener.onPickConfirm(medias, textMessage);
            }
          } catch (e) {
            console.error('[AlbumPicker] onPickConfirm parse error:', e);
          }
        },
        function(jsonStr: any) {
          try {
            var parsed = JSON.parse(jsonStr);
            var media = AlbumPickerImpl.parseAlbumMedia(parsed.albumMedia || {});
            var progress = parsed.progress || 0;
            var error = parsed.error || false;
            if (listener && listener.onMediaProcessing) {
              listener.onMediaProcessing(media, progress, error);
            }
          } catch (e) {
            console.error('[AlbumPicker] onMediaProcessing parse error:', e);
          }
        },
        function() {
          if (listener && listener.onMediaProcessed) {
            listener.onMediaProcessed();
          }
          listener = null;
        },
        function() {
          if (listener && listener.onCancel) {
            listener.onCancel();
          }
          listener = null;
        }
      );
    },
  };
}
