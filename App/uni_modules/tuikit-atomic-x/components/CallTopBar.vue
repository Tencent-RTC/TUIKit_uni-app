<template>
  <view class="top-bar" :style="{ paddingTop: (safeAreaTop - 20) + 'px' }">
    <view class="top-bar-left">
      <FloatWindow />
    </view>
    <view class="top-bar-center">
      <CallTimer v-if="isConnected" />
      <text v-else-if="isGroupCalling" class="waiting-text">等待对方接收邀请</text>
    </view>
    <view class="top-bar-right" />
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import FloatWindow from './Call/Controls/floatWindow.vue';
  import CallTimer from './CallTimer.vue';
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  declare const uni: any;

  const { selfInfo, activeCall } = useCallState();

  const safeAreaTop = ref(0);

  // 通话已接通（status === 2）
  const isConnected = computed(() => {
    return selfInfo.value?.status === 2;
  });

  // 主叫方呼叫中（status === 1 且自己是邀请者）
  const isGroupCalling = computed(() => {
    return selfInfo.value?.status === 1
      && activeCall.value
      && activeCall.value.inviterId === uni.$userID && (activeCall.value.inviteeIds.length > 1 || activeCall.value.chatGroupId !== '');
  });

  onMounted(() => {
    uni.getSystemInfo({
      success: (res) => {
        safeAreaTop.value = res.safeArea?.top + 20 || 0;
      }
    });
  });
</script>

<style scoped>
  .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 48rpx;
    padding-right: 24rpx;
    padding-bottom: 16rpx;
    min-height: 48px;
  }

  .top-bar-left {
    width: 96rpx;
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .top-bar-center {
    flex: 1;
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .top-bar-right {
    width: 96rpx;
    height: 48px;
  }

  .waiting-text {
    font-size: 28rpx;
    color: #FFFFFF;
    font-weight: 400;
  }
</style>