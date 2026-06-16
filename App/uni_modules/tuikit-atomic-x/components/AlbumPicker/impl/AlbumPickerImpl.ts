/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

import {
	AlbumMedia,
	AlbumMediaType,
	AlbumPickerConfig,
	AlbumPickerTheme,
} from '../AlbumPicker';

export class AlbumPickerImpl {

	serializeConfig(config ?: AlbumPickerConfig) : object {
		return {
			pickMode: config?.mediaFilter ?? null,
			maxCount: config?.maxSelectionCount ?? null,
			gridCount: config?.itemsPerRow ?? null,
			showsCameraItem: config?.showsCameraItem ?? null,
			style: config?.style ?? null,
			language: config?.language ?? null,
			compressQuality: config?.compressQuality ?? null,
			maxVideoDurationInSeconds: config?.maxVideoDurationInSeconds ?? null,
			maxOutputFileSizeInMB: config?.maxOutputFileSizeInMB ?? null,
		};
	}

	serializeTheme(theme ?: AlbumPickerTheme) : object {
		return {
			primaryColor: theme?.primaryColor ?? null,
			backgroundColor: theme?.backgroundColor ?? null,
			backgroundColorSecondary: theme?.backgroundColorSecondary ?? null,
			textColor: theme?.textColor ?? null,
			textColorSecondary: theme?.textColorSecondary ?? null,
			confirmButtonIconAsset: theme?.confirmButtonIconAsset ?? null,
			bigFontSize: theme?.bigFontSize ?? null,
			normalFontSize: theme?.normalFontSize ?? null,
			smallFontSize: theme?.smallFontSize ?? null,
			bigRadius: theme?.bigRadius ?? null,
			normalRadius: theme?.normalRadius ?? null,
			smallRadius: theme?.smallRadius ?? null,
		};
	}

	static parseAlbumMedia(data : any) : AlbumMedia {
		return {
			id: data.id as number ?? 0,
			mediaType: (data.mediaType as number) === 1 ? AlbumMediaType.VIDEO : AlbumMediaType.IMAGE,
			mediaPath: data.mediaPath as string ?? '',
			fileExtension: data.fileExtension as string ?? '',
			fileSize: data.fileSize as number ?? 0,
			videoThumbnailPath: data.videoThumbnailPath as string ?? undefined,
			duration: data.duration as number ?? 0,
		};
	}

	static parseAlbumMediaList(dataList : any[]) : AlbumMedia[] {
		return dataList.map((item : any) => AlbumPickerImpl.parseAlbumMedia(item));
	}
}
