<template>
  <view class="live-container">
    <!-- 视频直播卡片 -->
    <view class="card" @click="handleJumpToLiveList">
      <image class="card-bg" src="/static/images/index/app-item-bg-live-stream.png" mode="aspectFill"></image>
      <view class="card-content">
        <view class="card-left">
          <text class="card-title">视频直播</text>
          <text class="card-desc">通过 Live API 构建互动视频直播，为您带来流畅清晰的直播体验。</text>
          <view class="card-btn">
            <image class="card-btn-icon" src="/static/images/index/app-ic-enter-live.png" mode="aspectFit"></image>
          </view>
        </view>
        <view class="card-right">
          <image class="card-preview" src="/static/images/index/app-item-live-stream-end-bg.png" mode="aspectFill"></image>
        </view>
      </view>
    </view>

    <!-- 语聊房卡片 -->
    <view class="card" @click="handleJumpToVoiceRoom">
      <image class="card-bg" src="/static/images/index/app-item-bg-voice-room.png" mode="aspectFill"></image>
      <view class="card-content">
        <view class="card-left">
          <text class="card-title">语聊房</text>
          <text class="card-desc">通过 Live API 开启互动语聊房，为您带来更优质的沟通体验。</text>
          <view class="card-btn">
            <image class="card-btn-icon" src="/static/images/index/app-ic-enter-live.png" mode="aspectFit"></image>
          </view>
        </view>
        <view class="card-right">
          <image class="card-preview" src="/static/images/index/app-item-voice-room-end-bg.png" mode="aspectFill"></image>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  const handleJumpToLiveList = () => {
    uni.redirectTo({
      url: '/pages/scenes/live/livelist/index'
    })
  }

  const handleJumpToVoiceRoom = () => {
    uni.redirectTo({
      url: '/pages/scenes/live/VoiceList/VoiceList'
    })
  }
</script>

<style scoped>
  .live-container {
    width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 30rpx;
    background-color: #ffffff;
  }

  .card {
    width: 686rpx;
    height: 340rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    margin-bottom: 30rpx;
  }

  .card-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .card-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    padding: 40rpx;
    box-sizing: border-box;
  }

  .card-left {
    display: flex;
    flex-direction: column;
    max-width: 350rpx;
    padding-right: 20rpx;
  }

  .card-title {
    color: #ffffff;
    font-size: 40rpx;
    font-weight: 700;
    line-height: 56rpx;
  }

  .card-desc {
    color: rgba(255, 255, 255, 0.7);
    font-size: 22rpx;
    font-weight: 400;
    line-height: 34rpx;
    margin-top: 16rpx;
  }

  .card-btn {
    width: 140rpx;
    height: 50rpx;
    border-radius: 30rpx;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30rpx;
  }

  .card-btn-icon {
    width: 28rpx;
    height: 28rpx;
  }

  .card-right {
    position: absolute;
    right: 40rpx;
    bottom: 0;
    display: flex;
    align-items: flex-end;
  }

  .card-preview {
    width: 240rpx;
    height: 300rpx;
    border-radius: 16rpx 16rpx 0 0;
  }
</style>