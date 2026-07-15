/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

import { AlbumMediaType } from '../AlbumPicker';

export var AlbumPickerImpl = {
  serializeConfig: function(config: any) {
    var c = config || {};
    return {
      pickMode: c.mediaFilter != null ? c.mediaFilter : null,
      maxCount: c.maxSelectionCount != null ? c.maxSelectionCount : null,
      gridCount: c.itemsPerRow != null ? c.itemsPerRow : null,
      showsCameraItem: c.showsCameraItem != null ? c.showsCameraItem : null,
      style: c.style != null ? c.style : null,
      language: c.language != null ? c.language : null,
      compressQuality: c.compressQuality != null ? c.compressQuality : null,
      maxVideoDurationInSeconds: c.maxVideoDurationInSeconds != null ? c.maxVideoDurationInSeconds : null,
      maxOutputFileSizeInMB: c.maxOutputFileSizeInMB != null ? c.maxOutputFileSizeInMB : null,
    };
  },

  serializeTheme: function(theme: any) {
    var t = theme || {};
    return {
      primaryColor: t.primaryColor != null ? t.primaryColor : null,
      backgroundColor: t.backgroundColor != null ? t.backgroundColor : null,
      backgroundColorSecondary: t.backgroundColorSecondary != null ? t.backgroundColorSecondary : null,
      textColor: t.textColor != null ? t.textColor : null,
      textColorSecondary: t.textColorSecondary != null ? t.textColorSecondary : null,
      confirmButtonIconAsset: t.confirmButtonIconAsset != null ? t.confirmButtonIconAsset : null,
      bigFontSize: t.bigFontSize != null ? t.bigFontSize : null,
      normalFontSize: t.normalFontSize != null ? t.normalFontSize : null,
      smallFontSize: t.smallFontSize != null ? t.smallFontSize : null,
      bigRadius: t.bigRadius != null ? t.bigRadius : null,
      normalRadius: t.normalRadius != null ? t.normalRadius : null,
      smallRadius: t.smallRadius != null ? t.smallRadius : null,
    };
  },

  parseAlbumMedia: function(data: any) {
    var d = data || {};
    return {
      id: d.id || 0,
      mediaType: d.mediaType === 1 ? AlbumMediaType.VIDEO : AlbumMediaType.IMAGE,
      mediaPath: d.mediaPath || '',
      fileExtension: d.fileExtension || '',
      fileSize: d.fileSize || 0,
      videoThumbnailPath: d.videoThumbnailPath || undefined,
      duration: d.duration || 0,
    };
  },

  parseAlbumMediaList: function(dataList: any) {
    var list = dataList || [];
    var result: any[] = [];
    for (var i = 0; i < list.length; i++) {
      result.push(AlbumPickerImpl.parseAlbumMedia(list[i]));
    }
    return result;
  },
};
