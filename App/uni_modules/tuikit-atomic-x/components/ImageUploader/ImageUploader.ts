/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

import { ImageUploaderImpl } from './impl/ImageUploaderImpl';

export enum CropOverlayShape {
	CIRCLE = 'CIRCLE',
	RECTANGLE_1_1 = 'RECTANGLE_1_1',
	RECTANGLE_4_3 = 'RECTANGLE_4_3',
	RECTANGLE_3_4 = 'RECTANGLE_3_4',
	RECTANGLE_16_9 = 'RECTANGLE_16_9',
	RECTANGLE_9_16 = 'RECTANGLE_9_16'
}

export interface ImageUploaderConfig {
	showsCameraItem ?: boolean;
	cropOverlayShape ?: CropOverlayShape;
}

export interface ImageUploaderListener {
	onPickCompleted(localPath : string | null) : void;
	onCosUploadCompleted ?(statusCode : number) : void;
}

export class ImageUploader {
	private listener : ImageUploaderListener | null;
	private impl : ImageUploaderImpl;

	constructor(listener ?: ImageUploaderListener) {
		this.listener = listener || null;
		this.impl = new ImageUploaderImpl(this.listener);
	}

	pick(config : ImageUploaderConfig = {}, cosUploadURL ?: string) : void {
		this.impl.pick(config, cosUploadURL);
	}
}

export default ImageUploader;