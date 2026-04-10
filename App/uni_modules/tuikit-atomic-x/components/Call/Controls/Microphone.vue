<template>
  <view class="btn" @tap="handleMic">
    <image class="btn-img" :src="microphoneStatus === DeviceStatus.ON ? MIC_ON_SRC : MIC_OFF_SRC"></image>
    <text class="btn-text">
      {{ microphoneStatus === DeviceStatus.ON ? '麦克风已开' : '麦克风已关' }}
    </text>
  </view>
</template>

<script setup lang="ts">
  import { watch, ref, computed, onMounted } from "vue";

  import MIC_ON_SRC from "../../../static/icon/mic-on.png";
  import MIC_OFF_SRC from "../../../static/icon/mic-off.png";
  import {
    useDeviceState,
    DeviceStatus
  } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  const {
    microphoneStatus,
    openLocalMicrophone,
    closeLocalMicrophone,
  } = useDeviceState()


  const handleMic = () => {
    if (microphoneStatus.value === DeviceStatus.ON) {
      closeLocalMicrophone();
    } else {
      openLocalMicrophone();
    }
  };
</script>

<style scoped>
  .btn {
    margin: 10px 20px;
  }

  .btn-img {
    width: 60px;
    height: 60px;
    border-radius: 140px;
  }

  .btn-text {
    font-size: 12px;
    color: #d5e0f2;
    font-weight: 400;
    text-align: center;
    margin-top: 10px;
  }
</style>