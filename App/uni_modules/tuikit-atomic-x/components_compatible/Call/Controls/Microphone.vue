<template>
  <view class="btn" @tap="handleMic">
    <image class="btn-img" :src="microphoneStatusValue === DeviceStatusON ? MIC_ON_SRC : MIC_OFF_SRC"></image>
    <text class="btn-text">
      {{ microphoneStatusValue === DeviceStatusON ? '麦克风已开' : '麦克风已关' }}
    </text>
  </view>
</template>

<script>
  import { useDeviceState, DeviceStatus } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';

  var MIC_ON_SRC = '/uni_modules/tuikit-atomic-x/static/icon/mic-on.png';
  var MIC_OFF_SRC = '/uni_modules/tuikit-atomic-x/static/icon/mic-off.png';

  var deviceStateInstance = useDeviceState();

  export default {
    data: function() {
      return {
        MIC_ON_SRC: MIC_ON_SRC,
        MIC_OFF_SRC: MIC_OFF_SRC,
        DeviceStatusON: DeviceStatus.ON
      };
    },
    computed: {
      microphoneStatusValue: function() {
        return deviceStateInstance.state.microphoneStatus;
      }
    },
    methods: {
      handleMic: function() {
        if (deviceStateInstance.state.microphoneStatus === DeviceStatus.ON) {
          deviceStateInstance.closeLocalMicrophone();
        } else {
          deviceStateInstance.openLocalMicrophone();
        }
      }
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
