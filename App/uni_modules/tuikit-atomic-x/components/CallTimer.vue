<template>
  <view v-if="isConnected" class="call-timer">
    <text class="timer-text">{{ formattedTime }}</text>
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  const { selfInfo, activeCall } = useCallState();

  const isConnected = computed(() => {
    return selfInfo.value?.status === 2;
  });

  const formattedTime = computed(() => {
    const duration = activeCall.value?.duration ?? 0;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  });
</script>

<style scoped>
  .call-timer {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-text {
    font-size: 28rpx;
    color: #FFFFFF;
    font-weight: 400;
  }
</style>
