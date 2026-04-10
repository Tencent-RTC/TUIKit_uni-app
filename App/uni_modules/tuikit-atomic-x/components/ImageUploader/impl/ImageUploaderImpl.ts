/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

import { pickSingleImageFromAlbum } from '@/uni_modules/tuikit-atomic-x';
import { localizedString } from '../locales/Localizable';
import { CropOverlayShape, ImageUploaderConfig, ImageUploaderListener } from '../ImageUploader';
import { ImageCosUploaderManager } from './ImageCosUploaderManager';

export class ImageUploaderImpl {
	private listener : ImageUploaderListener | null;
	private cosUploadURL : string | null = null;
	private cosUploaderManager : ImageCosUploaderManager = new ImageCosUploaderManager();

	constructor(listener : ImageUploaderListener | null) {
		this.listener = listener;
	}

	pick(config : ImageUploaderConfig, cosUploadURL ?: string) : void {
		this.cosUploadURL = cosUploadURL || null;

		const finalConfig : Required<ImageUploaderConfig> = {
			showsCameraItem: config.showsCameraItem ?? false,
			cropOverlayShape: config.cropOverlayShape ?? CropOverlayShape.CIRCLE
		};

		this.showImageSourcePicker(finalConfig);
	}

	private showImageSourcePicker(config : Required<ImageUploaderConfig>) : void {
		if (config.showsCameraItem) {
			uni.showActionSheet({
				itemList: [localizedString('take_photo'), localizedString('choose_from_album')],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.launchCamera(config);
					} else if (res.tapIndex === 1) {
						this.launchImagePicker(config);
					}
				},
				fail: () => {
					this.handlePickResult(null);
				}
			});
		} else {
			this.launchImagePicker(config);
		}
	}

	private launchCamera(config : Required<ImageUploaderConfig>) : void {
		uni.chooseImage({
			count: 1,
			sizeType: ['original'],
			sourceType: ['camera'],
			success: (res) => {
				const tempFilePath = res.tempFilePaths[0];
				this.handleImageSelected(tempFilePath, config);
			},
			fail: () => {
				this.handlePickResult(null);
			}
		});
	}

	private launchImagePicker(config : Required<ImageUploaderConfig>) : void {
		pickSingleImageFromAlbum(
			(tempFilePath : string) => {
				this.handleImageSelected(tempFilePath, config);
			},
			() => {
				this.handlePickResult(null);
			}
		);
	}

	private handleImageSelected(
		imagePath : string,
		config : Required<ImageUploaderConfig>
	) : void {
		let normalizedPath = imagePath;
		if (
			!imagePath.startsWith('file://') &&
			!imagePath.startsWith('http://') &&
			!imagePath.startsWith('https://') &&
			imagePath.startsWith('/')
		) {
			normalizedPath = 'file://' + imagePath;
		}
		this.showCropView(normalizedPath, config);
	}

	private showCropView(
		imagePath : string,
		config : Required<ImageUploaderConfig>
	) : void {
		const cropParams = {
			imagePath,
			cropShape: config.cropOverlayShape
		};
		const basePath = '/uni_modules/tuikit-atomic-x/components' +
			'/ImageUploader/impl/ImageUploaderCropView';
		const params = encodeURIComponent(JSON.stringify(cropParams));

		uni.navigateTo({
			url: `${basePath}?params=${params}`,
			events: {
				cropResult: (data : { localPath : string | null }) => {
					this.handlePickResult(data.localPath);
				}
			}
		});
	}

	private handlePickResult(localPath : string | null) : void {
		this.listener?.onPickCompleted(localPath);

		if (localPath && this.cosUploadURL) {
			this.uploadToCos(localPath, this.cosUploadURL);
		}
	}

	private async uploadToCos(
		localPath : string,
		cosUploadURL : string
	) : Promise<void> {
		const statusCode = await this.cosUploaderManager.uploadFile(
			localPath, cosUploadURL
		);
		this.listener?.onCosUploadCompleted?.(statusCode);
	}
}