<template>
  <view class="btn" @tap="handleCamera">
    <image class="btn-img" :src="cameraStatusValue === DeviceStatusON ? CAMERA_ON_SRC : CAMERA_OFF_SRC"></image>
    <text class="btn-text">
      {{ cameraStatusValue === DeviceStatusON ? '摄像头已开' : '摄像头已关' }}
    </text>
  </view>
</template>

<script>
  import { useDeviceState, DeviceStatus } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';

  var CAMERA_ON_SRC = '/uni_modules/tuikit-atomic-x/static/icon/camera-on.png';
  var CAMERA_OFF_SRC = '/uni_modules/tuikit-atomic-x/static/icon/camera-off.png';

  var deviceStateInstance = useDeviceState();

  export default {
    data: function() {
      return {
        CAMERA_ON_SRC: CAMERA_ON_SRC,
        CAMERA_OFF_SRC: CAMERA_OFF_SRC,
        DeviceStatusON: DeviceStatus.ON
      };
    },
    computed: {
      cameraStatusValue: function() {
        return deviceStateInstance.state.cameraStatus;
      }
    },
    methods: {
      handleCamera: function() {
        if (deviceStateInstance.state.cameraStatus === DeviceStatus.ON) {
          deviceStateInstance.closeLocalCamera();
        } else {
          deviceStateInstance.openLocalCamera({ isFront: deviceStateInstance.state.isFrontCamera });
        }
      }
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
