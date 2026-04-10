<template>
  <view class="btn" @tap="handleSwitchCamera">
    <image class="btn-img" :style="[style]" :src="SWITCH_CAMERA_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      翻转
    </text>
  </view>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import SWITCH_CAMERA_SRC from "../../../static/icon/switch-camera.png";
  import {
    useDeviceState
  } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  const {
    switchCamera,
    isFrontCamera
  } = useDeviceState()

  const props = defineProps({
    size: {
      type: Number,
      default: 60,
    },
    isShowText: {
      type: Boolean,
      default: true,
    },
  });

  const style = computed(() => ({
    width: props.size + "px",
    height: props.size + "px",
  }));

  const handleSwitchCamera = () => {
    switchCamera({
      isFront: !isFrontCamera.value
    })
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