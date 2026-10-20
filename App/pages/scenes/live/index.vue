<template>
  <view class="live-container">
    <view class="card" @click="handleJumpToLiveList">
      <image class="card-bg" src="/static/images/index/app-item-bg-live-stream.png" mode="aspectFill"></image>
      <view class="card-content">
        <view class="card-left">
          <text class="card-title">{{ t('entry.video') }}</text>
          <text class="card-desc">{{ t('entry.videoDesc') }}</text>
          <view class="card-btn">
            <image class="card-btn-icon" src="/static/images/index/app-ic-enter-live.png" mode="aspectFit"></image>
          </view>
        </view>
        <view class="card-right">
          <image class="card-preview" src="/static/images/index/app-item-live-stream-end-bg.png" mode="aspectFill"></image>
        </view>
      </view>
    </view>

    <view class="card" @click="handleJumpToVoiceRoom">
      <image class="card-bg" src="/static/images/index/app-item-bg-voice-room.png" mode="aspectFill"></image>
      <view class="card-content">
        <view class="card-left">
          <text class="card-title">{{ t('entry.voice') }}</text>
          <text class="card-desc">{{ t('entry.voiceDesc') }}</text>
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
  import { t } from './locales';

  const handleJumpToLiveList = () => {
    uni.redirectTo({
      url: '/pages/scenes/live/video/liveList/index'
    })
  }

  const handleJumpToVoiceRoom = () => {
    uni.redirectTo({
      url: '/pages/scenes/live/voice/liveList/index'
    })
  }
</script>

<style lang="scss" scoped>
  @import './live.scss';
</style>