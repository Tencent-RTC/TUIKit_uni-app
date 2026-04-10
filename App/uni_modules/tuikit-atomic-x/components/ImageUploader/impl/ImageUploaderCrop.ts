/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

import { CropOverlayShape } from '../ImageUploader';

interface TouchPoint {
	clientX : number;
	clientY : number;
}

export interface CropRect {
	left : number;
	top : number;
	width : number;
	height : number;
}

export interface CropParams {
	imagePath : string;
	cropShape : CropOverlayShape;
}

export interface CropRegion {
	x : number;
	y : number;
	width : number;
	height : number;
}

export interface CanvasOutputSize {
	width : number;
	height : number;
}

export class ImageUploaderCrop {
	static readonly PREVIEW_MAX_SIZE = 1500;
	private static readonly CROP_SIZE_RATIO = 0.9;
	private static readonly MAX_ZOOM = 5;
	private static readonly MAX_CANVAS_SIZE = 1024;
	private static readonly MASK_OPACITY_NORMAL = 0.85;
	private static readonly MASK_OPACITY_ACTIVE = 0.2;

	// Read-only: updated internally, read by View's computed styles
	zoomScale = 1;
	offsetX = 0;
	offsetY = 0;
	maskOpacity = ImageUploaderCrop.MASK_OPACITY_NORMAL;
	cropSize : CropRect = { left: 0, top: 0, width: 0, height: 0 };

	// Writable: set by View after uni.getImageInfo / uni.compressImage
	imageWidth = 0;
	imageHeight = 0;
	naturalWidth = 0;
	naturalHeight = 0;

	private minZoomScale = 1;
	private imageAreaHeight = 0;

	private lastTouchX = 0;
	private lastTouchY = 0;
	private lastPointerCount = 0;
	private lastFocusX = 0;
	private lastFocusY = 0;
	private lastDistance = 0;
	private isScaling = false;
	private isPanning = false;
	private maskRestoreTimer : ReturnType<typeof setTimeout> | null = null;

	static parseCropParams(encodedParams : string) : CropParams | null {
		try {
			const params = JSON.parse(decodeURIComponent(encodedParams));
			return {
				imagePath: params.imagePath,
				cropShape: params.cropShape || CropOverlayShape.CIRCLE
			};
		} catch (error) {
			console.error('Failed to parse crop params:', error);
			return null;
		}
	}

	static getRotateAngle(orientation : string) : number {
		switch (orientation) {
			case 'left': return 270;
			case 'right': return 90;
			case 'down': return 180;
			default: return 0;
		}
	}

	static needsPreviewCompression(
		width : number,
		height : number
	) : boolean {
		return width > ImageUploaderCrop.PREVIEW_MAX_SIZE
			|| height > ImageUploaderCrop.PREVIEW_MAX_SIZE;
	}

	// --- Crop Size ---

	calculateCropSize(
		screenWidth : number,
		screenHeight : number,
		statusBarHeight : number,
		cropShape : CropOverlayShape
	) : void {
		const containerWidth = screenWidth;
		const containerHeight = screenHeight - statusBarHeight;
		this.imageAreaHeight = containerHeight;

		const baseSize = Math.min(containerWidth, containerHeight)
			* ImageUploaderCrop.CROP_SIZE_RATIO;

		if (cropShape === CropOverlayShape.CIRCLE) {
			this.cropSize = {
				left: (containerWidth - baseSize) / 2,
				top: (containerHeight - baseSize) / 2,
				width: baseSize,
				height: baseSize
			};
			return;
		}

		const aspectRatio = this.getAspectRatio(cropShape);
		let cropHeight = baseSize / aspectRatio;
		const maxHeight = containerHeight * ImageUploaderCrop.CROP_SIZE_RATIO;

		if (cropHeight > maxHeight) {
			cropHeight = maxHeight;
			const adjustedWidth = Math.min(
				maxHeight * aspectRatio, containerWidth
			);
			this.cropSize = {
				left: (containerWidth - adjustedWidth) / 2,
				top: (containerHeight - cropHeight) / 2,
				width: adjustedWidth,
				height: cropHeight
			};
		} else {
			this.cropSize = {
				left: (containerWidth - baseSize) / 2,
				top: (containerHeight - cropHeight) / 2,
				width: baseSize,
				height: cropHeight
			};
		}
	}

	private getAspectRatio(
		cropShape : CropOverlayShape
	) : number {
		switch (cropShape) {
			case CropOverlayShape.RECTANGLE_1_1: return 1;
			case CropOverlayShape.RECTANGLE_4_3: return 4 / 3;
			case CropOverlayShape.RECTANGLE_3_4: return 3 / 4;
			case CropOverlayShape.RECTANGLE_16_9: return 16 / 9;
			case CropOverlayShape.RECTANGLE_9_16: return 9 / 16;
			default: return 1;
		}
	}

	// --- Transform ---

	initializeTransform(screenWidth : number) : void {
		if (!this.imageWidth || !this.imageHeight || !this.cropSize.width) return;

		const zoomToFitWidth = this.cropSize.width / this.imageWidth;
		const zoomToFitHeight = this.cropSize.height / this.imageHeight;
		this.minZoomScale = Math.max(zoomToFitWidth, zoomToFitHeight);
		this.zoomScale = this.minZoomScale;

		const scaledWidth = this.imageWidth * this.zoomScale;
		const scaledHeight = this.imageHeight * this.zoomScale;
		this.offsetX = (screenWidth - scaledWidth) / 2;
		this.offsetY = (this.imageAreaHeight - scaledHeight) / 2;
	}

	// --- Touch Gesture ---

	onTouchStart(touches : TouchPoint[]) : void {
		this.clearMaskRestoreTimer();
		this.maskOpacity = ImageUploaderCrop.MASK_OPACITY_ACTIVE;

		if (touches.length === 1) {
			this.lastTouchX = touches[0].clientX;
			this.lastTouchY = touches[0].clientY;
			this.lastPointerCount = 1;
			this.isPanning = true;
		} else if (touches.length === 2) {
			this.lastPointerCount = 2;
			this.lastFocusX = this.focusX(touches);
			this.lastFocusY = this.focusY(touches);
			this.isScaling = true;
			this.isPanning = false;
		}
	}

	onTouchMove(touches : TouchPoint[]) : void {
		if (touches.length === 1 && this.isPanning && !this.isScaling) {
			this.offsetX += touches[0].clientX - this.lastTouchX;
			this.offsetY += touches[0].clientY - this.lastTouchY;
			this.constrainOffset();
			this.lastTouchX = touches[0].clientX;
			this.lastTouchY = touches[0].clientY;
		} else if (touches.length === 2) {
			const fx = this.focusX(touches);
			const fy = this.focusY(touches);

			if (this.lastPointerCount === 2) {
				this.offsetX += fx - this.lastFocusX;
				this.offsetY += fy - this.lastFocusY;
				this.constrainOffset();

				const currentDistance = this.distance(touches);
				const lastDist = this.lastDistance || currentDistance;

				if (lastDist > 0) {
					const maxZoom = ImageUploaderCrop.MAX_ZOOM;
					const newZoom = Math.max(
						this.minZoomScale,
						Math.min(
							maxZoom,
							this.zoomScale * (currentDistance / lastDist)
						)
					);
					if (newZoom !== this.zoomScale) {
						const ratio = newZoom / this.zoomScale;
						this.offsetX = fx - (fx - this.offsetX) * ratio;
						this.offsetY = fy - (fy - this.offsetY) * ratio;
						this.zoomScale = newZoom;
						this.constrainOffset();
					}
				}
				this.lastDistance = currentDistance;
			}

			this.lastFocusX = fx;
			this.lastFocusY = fy;
			this.lastPointerCount = 2;
		}
	}

	onTouchEnd() : void {
		this.isPanning = false;
		this.isScaling = false;
		this.lastDistance = 0;
		this.scheduleMaskRestore();
	}

	private focusX(touches : TouchPoint[]) : number {
		let sum = 0;
		for (let i = 0; i < touches.length; i++) sum += touches[i].clientX;
		return sum / touches.length;
	}

	private focusY(touches : TouchPoint[]) : number {
		let sum = 0;
		for (let i = 0; i < touches.length; i++) sum += touches[i].clientY;
		return sum / touches.length;
	}

	private distance(touches : TouchPoint[]) : number {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private constrainOffset() : void {
		if (!this.imageWidth || !this.imageHeight) return;

		const scaledWidth = this.imageWidth * this.zoomScale;
		const scaledHeight = this.imageHeight * this.zoomScale;
		const { left, top, width, height } = this.cropSize;

		const minX = left + width - scaledWidth;
		const maxX = left;
		const minY = top + height - scaledHeight;
		const maxY = top;

		this.offsetX = minX <= maxX
			? Math.max(minX, Math.min(maxX, this.offsetX))
			: (left + left + width - scaledWidth) / 2;

		this.offsetY = minY <= maxY
			? Math.max(minY, Math.min(maxY, this.offsetY))
			: (top + top + height - scaledHeight) / 2;
	}

	// --- Mask ---

	private clearMaskRestoreTimer() : void {
		if (this.maskRestoreTimer) {
			clearTimeout(this.maskRestoreTimer);
			this.maskRestoreTimer = null;
		}
	}

	private scheduleMaskRestore() : void {
		this.clearMaskRestoreTimer();
		this.maskRestoreTimer = setTimeout(() => {
			this.maskOpacity = ImageUploaderCrop.MASK_OPACITY_NORMAL;
			this.maskRestoreTimer = null;
		}, 1500);
	}

	// --- Crop Calculation ---

	calculateCropRegion() : CropRegion {
		const { left, top, width, height } = this.cropSize;
		const scaleToOriginal = this.naturalWidth / this.imageWidth;

		const rawX = Math.floor(((left - this.offsetX) / this.zoomScale) * scaleToOriginal);
		const rawY = Math.floor(((top - this.offsetY) / this.zoomScale) * scaleToOriginal);
		const rawW = Math.floor((width / this.zoomScale) * scaleToOriginal);
		const rawH = Math.floor((height / this.zoomScale) * scaleToOriginal);

		const x = Math.max(0, Math.min(rawX, this.naturalWidth - 1));
		const y = Math.max(0, Math.min(rawY, this.naturalHeight - 1));
		return {
			x,
			y,
			width: Math.max(1, Math.min(rawW, this.naturalWidth - x)),
			height: Math.max(1, Math.min(rawH, this.naturalHeight - y))
		};
	}

	calculateCanvasOutputSize(
		width : number,
		height : number
	) : CanvasOutputSize {
		const maxSize = ImageUploaderCrop.MAX_CANVAS_SIZE;
		if (width <= maxSize && height <= maxSize) {
			return { width, height };
		}
		const scale = Math.min(maxSize / width, maxSize / height);
		return {
			width: Math.floor(width * scale),
			height: Math.floor(height * scale)
		};
	}

}