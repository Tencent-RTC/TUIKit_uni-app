<template>
  <view class="live-container">
    <view class="live-video" @click="handleJumpToList">
      <image class="live-video-mask" src="/static/images/live-mask.png" mode=""></image>
      <view style="position: absolute; left: 70rpx; top: 60rpx; display: flex; flex-direction: column;">
        <text style="color: rgba(255, 255, 255, 1); font-size: 40rpx; font-weight: 700;">在线直播</text>
        <text style="color: rgba(255, 255, 255, 1); font-size: 20rpx; font-weight: 400; padding-top: 20rpx;">通过 Live API
          构建互动视频直播，</text>
        <text
          style="color: rgba(255, 255, 255, 1); font-size: 20rpx; font-weight: 400; padding-top: 6rpx;">为您带来清晰流畅的直播体验。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
  const handleJumpToList = () => {
    uni.redirectTo({
      url: '/pages/livelist/index'
    })
  }
</script>

<style>
  .live-container {
    width: 100vw;
    height: 100vh;
  }

  .live-video {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .live-video-mask {
    width: 90vw;
    height: 360rpx;
    padding-top: 20rpx;
  }
</style>