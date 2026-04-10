/*
 * Copyright (c) 2025 Tencent
 * All rights reserved.
 *
 * Author: eddardliu
 */

export class ImageCosUploaderManager {
	private static readonly MAX_RETRY_COUNT = 3;
	private static readonly RETRY_DELAY_MS = 500;
	private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

	async uploadFile(
		localPath : string,
		cosUploadURL : string
	) : Promise<number> {
		if (!localPath || !cosUploadURL) {
			this.logError(
				'Invalid parameters',
				`localPath: ${localPath}\ncosUploadURL: ${cosUploadURL}`
			);
			return -1;
		}

		if (!/^https?:\/\/.+/i.test(cosUploadURL)) {
			this.logError('Invalid cosUploadURL', cosUploadURL);
			return -1;
		}

		const fileSize = await this.getFileSize(localPath);
		if (fileSize < 0) {
			this.logError('Failed to get file size', `localPath: ${localPath}`);
			return -1;
		}
		if (fileSize > ImageCosUploaderManager.MAX_FILE_SIZE) {
			this.logError(
				'File size exceeds limit',
				`size: ${fileSize}, max: ${ImageCosUploaderManager.MAX_FILE_SIZE}`
			);
			return -1;
		}

		const statusCode = await this.uploadFileWithRetry(
			localPath, cosUploadURL,
			ImageCosUploaderManager.MAX_RETRY_COUNT
		);
		if (statusCode < 0 || statusCode >= 300) {
			this.logError(
				'Upload failed',
				`statusCode: ${statusCode}\nurl: ${cosUploadURL}\nfile: ${localPath}`
			);
		}
		return statusCode;
	}

	private async uploadFileWithRetry(
		localPath : string,
		cosUploadURL : string,
		maxRetryCount : number
	) : Promise<number> {
		let currentRetry = 0;
		let lastError : any = null;

		while (currentRetry <= maxRetryCount) {
			try {
				const statusCode = await this.performUpload(
					localPath, cosUploadURL
				);

				if (statusCode >= 200 && statusCode < 300) {
					return statusCode;
				} else if (
					this.shouldRetry(statusCode) &&
					currentRetry < maxRetryCount
				) {
					currentRetry++;
					const delay = ImageCosUploaderManager.RETRY_DELAY_MS;
					await this.delay(delay * currentRetry);
				} else {
					return statusCode;
				}
			} catch (error) {
				lastError = error;
				if (
					this.shouldRetryOnError(error) &&
					currentRetry < maxRetryCount
				) {
					currentRetry++;
					const delay = ImageCosUploaderManager.RETRY_DELAY_MS;
					await this.delay(delay * currentRetry);
				} else {
					const errStr = JSON.stringify(lastError);
					this.logError(
						'Upload exception',
						`error: ${errStr}\nurl: ${cosUploadURL}\nfile: ${localPath}`
					);
					return -1;
				}
			}
		}

		const errStr = JSON.stringify(lastError);
		this.logError(
			'Upload retry exhausted',
			`retries: ${maxRetryCount}\nlastError: ${errStr}\nurl: ${cosUploadURL}`
		);
		return -1;
	}

	private performUpload(
		localPath : string,
		cosUploadURL : string
	) : Promise<number> {
		return new Promise((resolve, reject) => {
			// Normalize path: remove file:// prefix for plus.io
			let filePath = localPath;
			if (filePath.startsWith('file://')) {
				filePath = filePath.substring(7);
			}

			const xhr = new plus.net.XMLHttpRequest();
			xhr.open('PUT', cosUploadURL);
			xhr.setRequestHeader('Content-Type', 'application/octet-stream');
			xhr.timeout = 60000;

			xhr.onload = () => {
				resolve(xhr.status);
			};
			xhr.onerror = () => {
				reject({
					stage: 'request',
					errMsg: `XMLHttpRequest error, status: ${xhr.status}`
				});
			};
			xhr.ontimeout = () => {
				reject({ stage: 'request', errMsg: 'XMLHttpRequest timeout' });
			};

			// Read file using plus.io and send
			plus.io.resolveLocalFileSystemURL(filePath,
				(entry : any) => {
					entry.file((file : any) => {
						const reader = new plus.io.FileReader();
						reader.onloadend = (e : any) => {
							const data = e.target.result;
							xhr.send(data);
						};
						reader.onerror = () => {
							reject({
								stage: 'readFile',
								errMsg: 'FileReader error'
							});
						};
						reader.readAsDataURL(file);
					}, (err : any) => {
						reject({
							stage: 'readFile',
							errMsg: `file() error: ${JSON.stringify(err)}`
						});
					});
				},
				(err : any) => {
					reject({
						stage: 'readFile',
						errMsg: `resolveLocalFileSystemURL error: `
							+ JSON.stringify(err)
					});
				}
			);
		});
	}

	private shouldRetry(statusCode : number) : boolean {
		return statusCode >= 500 || statusCode === 408 || statusCode === 429;
	}

	private shouldRetryOnError(error : any) : boolean {
		if (!error) return false;

		const errorMessage = error.errMsg || error.message || '';

		const retryableErrors = [
			'timeout',
			'network',
			'connection',
			'socket',
			'dns',
			'ssl'
		];

		return retryableErrors.some(keyword =>
			errorMessage.toLowerCase().includes(keyword)
		);
	}

	private getFileSize(localPath : string) : Promise<number> {
		return new Promise((resolve) => {
			let filePath = localPath;
			if (filePath.startsWith('file://')) {
				filePath = filePath.substring(7);
			}
			plus.io.resolveLocalFileSystemURL(filePath, (entry : any) => {
				entry.getMetadata((metadata : any) => {
					resolve(metadata.size || 0);
				}, () => {
					uni.getFileInfo({
						filePath: localPath,
						success: (res) => resolve(res.size),
						fail: () => resolve(0)
					});
				});
			}, () => {
				uni.getFileInfo({
					filePath: localPath,
					success: (res) => resolve(res.size),
					fail: () => resolve(0)
				});
			});
		});
	}

	private delay(ms : number) : Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private logError(title : string, detail : string) : void {
		console.error(`ImageCosUploaderManager: ${title} - ${detail}`);
	}
}