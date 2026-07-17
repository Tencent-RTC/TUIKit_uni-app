<template>
    <view class="video-message">
        <!-- 视频预览图 -->
        <view class="video-preview" @click="handleVideoClick">
            <image class="video-poster" :src="snapshotUrl" mode="aspectFill" />
            <!-- 播放按钮图标 -->
            <view class="play-icon">
                <image :src="playControlIcon" mode="aspectFit" />
            </view>
            <!-- 视频时长 -->
            <view class="video-duration">
                {{ formatDuration(videoSecond) }}
            </view>
        </view>

        <!-- 全屏播放器 -->
        <view class="fullscreen-container" v-if="isPlaying">
            <video id="videoPlayer" :src="remoteVideoUrl" :autoplay="true" :controls="true"
                :show-fullscreen-btn="false" :show-center-play-btn="false" @ended="handleVideoEnd"
                @pause="handleVideoPause" @fullscreenchange="handleFullscreenChange" class="fullscreen-video"
                :enable-progress-gesture="true" objectFit="contain" />
            <!-- 关闭按钮 -->
            <view class="video-controls">
                <view class="close-btn" @click="handleCloseVideo">
                    <view class="close-icon"></view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
// @ts-nocheck
import playControlIcon from '../../../assets/chat/play-control.svg';

export default {
    props: {
        message: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            playControlIcon: playControlIcon,
            isPlaying: false
        }
    },
    computed: {
        snapshotUrl() {
            return this.message && this.message.payload ? this.message.payload.snapshotUrl : '';
        },
        remoteVideoUrl() {
            return this.message && this.message.payload ? this.message.payload.remoteVideoUrl : '';
        },
        videoSecond() {
            return this.message && this.message.payload ? this.message.payload.videoSecond : 0;
        }
    },
    methods: {
        formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        },
        handleVideoClick() {
            this.isPlaying = true;
            setTimeout(() => {
                const videoContext = uni.createVideoContext('videoPlayer', this);
                videoContext.requestFullScreen({
                    direction: 0 // 0表示正常竖屏
                });
            }, 100);
        },
        handleVideoPause() {
            // 空实现，保持与Vue3版本一致
        },
        handleVideoEnd() {
            this.isPlaying = false;
        },
        handleFullscreenChange(e) {
            if (!e.detail.fullScreen) {
                this.isPlaying = false;
            }
        },
        handleCloseVideo() {
            const videoContext = uni.createVideoContext('videoPlayer', this);
            videoContext.pause();
            videoContext.exitFullScreen();
            this.isPlaying = false;
        }
    }
}
</script>

<style lang="scss" scoped>
.video-message {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    background-color: black;

    .video-preview {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .video-poster {
        width: 100%;
        height: 100%;
    }

    .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 48px;
        height: 48px;

        image {
            width: 100%;
            height: 100%;
        }
    }

    .video-duration {
        position: absolute;
        right: 8px;
        bottom: 8px;
        padding: 2px 6px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 12px;
        border-radius: 4px;
    }

    .fullscreen-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999;
        background-color: black;
    }

    .fullscreen-video {
        width: 100%;
        height: 100%;
    }

    .video-controls {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        padding: 15px;
        box-sizing: border-box;
        z-index: 1000;
        /* 确保关闭按钮在控制条上方 */
    }

    .close-btn {
        width: 24px;
        height: 24px;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .close-icon {
        width: 16px;
        height: 16px;
        position: relative;
    }

    .close-icon::before,
    .close-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 2px;
        background-color: white;
        border-radius: 1px;
    }

    .close-icon::before {
        transform: translate(-50%, -50%) rotate(45deg);
    }

    .close-icon::after {
        transform: translate(-50%, -50%) rotate(-45deg);
    }
}
</style>