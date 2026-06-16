import { AlbumPickerImpl } from './impl/AlbumPickerImpl';
import { showAlbumPicker } from '@/uni_modules/tuikit-atomic-x';

export enum AlbumPickerMediaFilter {
	IMAGE_ONLY = 0,
	VIDEO_ONLY = 1,
	IMAGE_AND_VIDEO = 2,
}

export enum AlbumMediaType {
	IMAGE = 0,
	VIDEO = 1,
}

export enum AlbumPickerStyle {
	LIKE_WECHAT = 0,
	LIKE_WHATSAPP = 1,
}

export enum AlbumPickerLanguage {
	SYSTEM = 0,
	EN = 1,
	ZH_HANS = 2,
	ZH_HANT = 3,
	AR = 4,
}

export enum AlbumPickerCompressQuality {
	STANDARD = 0,
	HIGH = 1,
}

export interface AlbumPickerTheme {
	primaryColor ?: string;
	backgroundColor ?: string;
	backgroundColorSecondary ?: string;
	textColor ?: string;
	textColorSecondary ?: string;
	confirmButtonIconAsset ?: string;
	bigFontSize ?: number;
	normalFontSize ?: number;
	smallFontSize ?: number;
	bigRadius ?: number;
	normalRadius ?: number;
	smallRadius ?: number;
}

export interface AlbumMedia {
	id : number;
	mediaType : AlbumMediaType;
	mediaPath : string;
	fileExtension : string;
	fileSize : number;
	videoThumbnailPath ?: string;
	duration : number;
}

export interface AlbumPickerConfig {
	mediaFilter ?: AlbumPickerMediaFilter;
	maxSelectionCount ?: number;
	itemsPerRow ?: number;
	showsCameraItem ?: boolean;
	style ?: AlbumPickerStyle;
	language ?: AlbumPickerLanguage;
	compressQuality ?: AlbumPickerCompressQuality;
	maxVideoDurationInSeconds ?: number;
	maxOutputFileSizeInMB ?: number;
}

export interface AlbumPickerListener {
	onPickConfirm ?: (pickedAlbumMedias : AlbumMedia[], textMessage : string | null) => void;
	onMediaProcessing ?: (albumMedia : AlbumMedia, progress : number, error : boolean) => void;
	onMediaProcessed ?: () => void;
	onCancel ?: () => void;
}

export class AlbumPicker {
	private impl : AlbumPickerImpl = new AlbumPickerImpl();
	private listener ?: AlbumPickerListener;
	private sessionId : string;

	constructor() {
		this.sessionId = `album_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	show(config ?: AlbumPickerConfig, theme ?: AlbumPickerTheme, listener ?: AlbumPickerListener) : void {
		this.listener = listener;

		const nativeConfig = JSON.stringify(this.impl.serializeConfig(config));
		const nativeTheme = JSON.stringify(this.impl.serializeTheme(theme));

		showAlbumPicker(
			nativeConfig,
			nativeTheme,
			this.sessionId,
			(jsonStr : string) => {
				try {
					const parsed = JSON.parse(jsonStr);
					const dataList = parsed.pickedAlbumMedias || [];
					const textMessage = parsed.textMessage || null;
					const medias = AlbumPickerImpl.parseAlbumMediaList(dataList);
					this.listener?.onPickConfirm?.(medias, textMessage);
				} catch (e) {
					console.error('[AlbumPicker] onPickConfirm parse error:', e);
				}
			},
			(jsonStr : string) => {
				try {
					const parsed = JSON.parse(jsonStr);
					const media = AlbumPickerImpl.parseAlbumMedia(parsed.albumMedia || {});
					const progress = parsed.progress || 0;
					const error = parsed.error || false;
					this.listener?.onMediaProcessing?.(media, progress, error);
				} catch (e) {
					console.error('[AlbumPicker] onMediaProcessing parse error:', e);
				}
			},
			() => {
				this.listener?.onMediaProcessed?.();
				this.listener = undefined;
			},
			() => {
				this.listener?.onCancel?.();
				this.listener = undefined;
			}
		);
	}
}
