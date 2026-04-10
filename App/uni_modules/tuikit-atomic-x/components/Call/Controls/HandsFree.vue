<template>
  <view class="btn" @tap="handleSwitchAudioPlay">
    <image class="btn-img" :src="currentAudioRoute === AudioOutput.SPEAKERPHONE ? HANDSFREE_ON_SRC : HANDSFREE_OFF_SRC">
    </image>
    <text class="btn-text">
      {{ currentAudioRoute === AudioOutput.SPEAKERPHONE ? '扬声器已开' : '扬声器已关' }}
    </text>
  </view>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from "vue";
  import HANDSFREE_OFF_SRC from "../../../static/icon/handsfree-off.png";
  import HANDSFREE_ON_SRC from "../../../static/icon/handsfree-on.png";
  import {
    AudioOutput,
    useDeviceState
  } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  const {
    currentAudioRoute,
    setAudioRoute
  } = useDeviceState()

  const handleSwitchAudioPlay = () => {
    if (currentAudioRoute.value === AudioOutput.SPEAKERPHONE) {
      setAudioRoute({
        audioRoute: AudioOutput.EARPIECE
      })
    } else {
      setAudioRoute({
        audioRoute: AudioOutput.SPEAKERPHONE
      })
    }

  }
</script>

<style>
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