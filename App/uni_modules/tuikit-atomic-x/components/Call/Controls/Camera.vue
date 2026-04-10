<template>
  <div class="btn" @tap="handleCamera">
    <image class="btn-img" :src="cameraStatus === DeviceStatus.ON ? CAMERA_ON_SRC : CAMERA_OFF_SRC "></image>
    <text class="btn-text">
      {{cameraStatus === DeviceStatus.ON ? '摄像头已开' : '摄像头已关'}}
    </text>
  </div>
</template>

<script setup lang="ts">
  import { computed, watch, ref, onMounted } from "vue";
  import CAMERA_ON_SRC from "../../../static/icon/camera-on.png";
  import CAMERA_OFF_SRC from "../../../static/icon/camera-off.png";
  import {
    useDeviceState,
    DeviceStatus
  } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  const {
    cameraStatus,
    openLocalCamera,
    closeLocalCamera,
    isFrontCamera,
  } = useDeviceState()

  const handleCamera = () => {
    if (cameraStatus.value === DeviceStatus.ON) {
      closeLocalCamera()
    } else {
      openLocalCamera({ isFront: isFrontCamera.value })
    }
  };
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