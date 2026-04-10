<template>
	<view class="crop-page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<view class="crop-container">
			<view class="image-container" @touchstart="onTouchStart" @touchmove.prevent="onTouchMove"
				@touchend="onTouchEnd">
				<image class="source-image" :src="displayImagePath"
					:style="imageStyle" @load="onImageLoad">
				</image>

				<view class="crop-overlay">
					<view class="crop-hole" :style="cropHoleStyle"></view>
					<view class="crop-frame" :class="cropFrameClass" :style="cropFrameStyle"></view>
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<text class="cancel-btn" @tap="onCancel">{{ localizedString('cancel') }}</text>
			<view class="spacer"></view>
			<view class="confirm-btn" @tap="onConfirm">
				<text class="confirm-text">{{ localizedString('done') }}</text>
			</view>
		</view>

		<canvas canvas-id="cropCanvas" class="crop-canvas"
			:style="{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }"></canvas>
	</view>
</template>

<script>
	import {
		CropOverlayShape
	} from '../ImageUploader.ts';
	import {
		localizedString
	} from '../locales/Localizable';
	import {
		ImageUploaderCrop
	} from './ImageUploaderCrop.ts';

	export default {
		data() {
			return {
				statusBarHeight: 0,
				imagePath: '',
				displayImagePath: '',
				cropShape: CropOverlayShape.CIRCLE,
				crop: new ImageUploaderCrop(),
				canvasSize: {
					width: 400,
					height: 400
				}
			}
		},

		computed: {
			cropFrameClass() {
				return {
					'crop-frame-circle': this.cropShape === CropOverlayShape.CIRCLE,
					'crop-frame-rectangle': this.cropShape !== CropOverlayShape.CIRCLE
				};
			},
			cropFrameStyle() {
				return {
					left: this.crop.cropSize.left + 'px',
					top: this.crop.cropSize.top + 'px',
					width: this.crop.cropSize.width + 'px',
					height: this.crop.cropSize.height + 'px'
				};
			},
			cropHoleStyle() {
				if (this.crop.cropSize.width === 0) return {
					display: 'none'
				};
				return {
					position: 'absolute',
					left: this.crop.cropSize.left + 'px',
					top: this.crop.cropSize.top + 'px',
					width: this.crop.cropSize.width + 'px',
					height: this.crop.cropSize.height + 'px',
					borderRadius: this.cropShape === CropOverlayShape.CIRCLE ? '50%' : '0',
					boxShadow: `0 0 0 2000px rgba(0, 0, 0, ${this.crop.maskOpacity})`,
					pointerEvents: 'none'
				};
			},
			imageStyle() {
				return {
					width: (this.crop.imageWidth * this.crop.zoomScale) + 'px',
					height: (this.crop.imageHeight * this.crop.zoomScale) + 'px',
					position: 'absolute',
					left: this.crop.offsetX + 'px',
					top: this.crop.offsetY + 'px'
				};
			}
		},

		onLoad(options) {
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;

			if (options.params) {
				const params = ImageUploaderCrop.parseCropParams(options.params);
				if (params) {
					this.imagePath = params.imagePath;
					this.displayImagePath = params.imagePath;
					this.cropShape = params.cropShape;
				} else {
					this.onCancel();
				}
			}
		},

		onReady() {
			this.$nextTick(() => {
				const systemInfo = uni.getSystemInfoSync();
				this.crop.calculateCropSize(
					systemInfo.screenWidth, systemInfo.screenHeight,
					this.statusBarHeight, this.cropShape
				);
				if (this.imagePath) {
					this.loadImageInfo();
				}
			});
		},

		methods: {
			localizedString(key) {
				return localizedString(key);
			},

			loadImageInfo() {
				uni.getImageInfo({
					src: this.imagePath,
					success: (res) => {
						this.crop.imageWidth = res.width;
						this.crop.imageHeight = res.height;
						this.crop.naturalWidth = res.width;
						this.crop.naturalHeight = res.height;
						this.preparePreviewImage(res.width, res.height, res.orientation);
					},
					fail: (error) => {
						console.error('Failed to get image info:', error);
					}
				});
			},

			preparePreviewImage(originalWidth, originalHeight, orientation) {
				if (!ImageUploaderCrop.needsPreviewCompression(
					originalWidth, originalHeight
				)) {
					this.applyInitialTransform();
					return;
				}

				const previewMaxSize = ImageUploaderCrop.PREVIEW_MAX_SIZE;
				const longerSide = Math.max(originalWidth, originalHeight);
				const compressRatio = previewMaxSize / longerSide;
				const rotate = ImageUploaderCrop.getRotateAngle(orientation);

				const compressOptions = {
					src: this.imagePath,
					quality: 90,
					rotate: rotate,
					success: (res) => {
						uni.getImageInfo({
							src: res.tempFilePath,
							success: (info) => {
								this.displayImagePath = res.tempFilePath;
								this.crop.imageWidth = info.width;
								this.crop.imageHeight = info.height;
								this.applyInitialTransform();
							},
							fail: () => {
								this.displayImagePath = res.tempFilePath;
								this.crop.imageWidth = Math.floor(
									originalWidth * compressRatio
								);
								this.crop.imageHeight = Math.floor(
									originalHeight * compressRatio
								);
								this.applyInitialTransform();
							}
						});
					},
					fail: () => {
						this.applyInitialTransform();
					}
				};

				if (originalWidth >= originalHeight) {
					compressOptions.compressedWidth = previewMaxSize;
				} else {
					compressOptions.compressedHeight = previewMaxSize;
				}

				uni.compressImage(compressOptions);
			},

			applyInitialTransform() {
				const systemInfo = uni.getSystemInfoSync();
				this.crop.initializeTransform(systemInfo.screenWidth);
			},

			onImageLoad() {
				if (!this.crop.imageWidth || !this.crop.imageHeight) {
					this.loadImageInfo();
				}
			},

			onTouchStart(e) {
				this.crop.onTouchStart(e.touches);
			},

			onTouchMove(e) {
				this.crop.onTouchMove(e.touches);
			},

			onTouchEnd() {
				this.crop.onTouchEnd();
			},

			async onConfirm() {
				try {
					const region = this.crop.calculateCropRegion();
					const croppedPath = await this.cropImageWithCanvas(this.imagePath, region);
					this.deleteOriginalFile();
					const eventChannel = this.getOpenerEventChannel();
					eventChannel.emit('cropResult', {
						localPath: croppedPath
					});
					uni.navigateBack();
				} catch (error) {
					console.error('Crop failed:', error);
					uni.showToast({
						title: localizedString('crop_failed'),
						icon: 'none'
					});
				}
			},

			onCancel() {
				this.deleteOriginalFile();
				const eventChannel = this.getOpenerEventChannel();
				eventChannel.emit('cropResult', {
					localPath: null
				});
				uni.navigateBack();
			},

			async cropImageWithCanvas(imagePath, region) {
				const outputSize = this.crop.calculateCanvasOutputSize(region.width, region.height);
				this.canvasSize = outputSize;

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						const ctx = uni.createCanvasContext('cropCanvas', this);
						ctx.clearRect(0, 0, outputSize.width, outputSize.height);
						ctx.drawImage(imagePath, region.x, region.y, region.width, region.height, 0, 0,
							outputSize.width, outputSize.height);

						ctx.draw(false, () => {
							setTimeout(() => {
								uni.canvasToTempFilePath({
									x: 0,
									y: 0,
									width: outputSize.width,
									height: outputSize.height,
									destWidth: outputSize.width,
									destHeight: outputSize.height,
									canvasId: 'cropCanvas',
									fileType: 'png',
									success: (res) => {
										this.saveToCacheDir(res
											.tempFilePath).then(
											resolve).catch(() =>
											resolve(res.tempFilePath));
									},
									fail: (error) => {
										console.error(
											'canvasToTempFilePath failed:',
											JSON.stringify(error));
										reject(error);
									}
								}, this);
							}, 100);
						});
					}, 300);
				});
			},

			saveToCacheDir(tempFilePath) {
				return new Promise((resolve, reject) => {
					const cacheDir = `${plus.io.PUBLIC_DOWNLOADS}/../cache/image_uploader`;
					const fileName = `crop_${Date.now()}.png`;

					plus.io.resolveLocalFileSystemURL(plus.io.convertAbsoluteFileSystem(cacheDir), (dirEntry) => {
						this.copyFileToDir(tempFilePath, dirEntry, fileName, resolve, reject);
					}, () => {
						// Directory doesn't exist, create it
						plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
							fs.root.getDirectory('cache/image_uploader', {
								create: true
							}, (dirEntry) => {
								this.copyFileToDir(tempFilePath, dirEntry, fileName,
									resolve, reject);
							}, reject);
						}, reject);
					});
				});
			},

			copyFileToDir(tempFilePath, dirEntry, fileName, resolve, reject) {
				let srcPath = tempFilePath;
				if (srcPath.startsWith('file://')) {
					srcPath = srcPath.substring(7);
				}
				plus.io.resolveLocalFileSystemURL(srcPath, (fileEntry) => {
					fileEntry.copyTo(dirEntry, fileName, (newEntry) => {
						const fullPath = plus.io.convertLocalFileSystemURL(newEntry.fullPath);
						resolve(fullPath);
					}, reject);
				}, reject);
			},

			deleteOriginalFile() {
				if (!this.imagePath) return;
				let filePath = this.imagePath;
				if (filePath.startsWith('file://')) {
					filePath = filePath.substring(7);
				}
				plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
					entry.remove(() => {
						console.log('ImageUploaderCropView: deleted original file:', this.imagePath);
					}, (err) => {
						console.error('ImageUploaderCropView: failed to delete original file:', err);
					});
				}, (err) => {
					console.error('ImageUploaderCropView: failed to resolve original file:', err);
				});
			}
		}
	}
</script>

<style scoped>
	.crop-page {
		flex: 1;
		background-color: #000000;
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.status-bar {
		background-color: #000000;
	}

	.crop-container {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.image-container {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.source-image {
		display: block;
		pointer-events: none;
	}

	.crop-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.crop-hole {
		background-color: transparent;
		transition: box-shadow 0.3s ease;
	}

	.crop-frame {
		position: absolute;
		border: 1px solid #ffffff;
		pointer-events: none;
	}

	.crop-frame-circle {
		border-radius: 50%;
	}

	.crop-frame-rectangle {
		border-radius: 0;
	}

	.crop-frame::before {
		content: '';
		position: absolute;
		top: -1px;
		left: -1px;
		right: -1px;
		bottom: -1px;
		background: transparent;
		mix-blend-mode: screen;
	}

	.bottom-bar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 56px;
		background-color: transparent;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		padding-bottom: env(safe-area-inset-bottom);
		z-index: 10;
	}

	.cancel-btn {
		font-size: 16px;
		color: #ffffff;
		padding: 8px 0;
	}

	.spacer {
		flex: 1;
	}

	.confirm-btn {
		background-color: #007AFF;
		border-radius: 6px;
		padding: 8px 16px;
	}

	.confirm-text {
		font-size: 16px;
		color: #ffffff;
		font-weight: 500;
	}

	.crop-canvas {
		position: fixed;
		top: -9999px;
		left: -9999px;
		opacity: 0;
		pointer-events: none;
	}
</style>