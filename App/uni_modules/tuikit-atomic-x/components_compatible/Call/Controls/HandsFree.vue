<template>
  <view class="btn" @tap="handleSwitchAudioPlay">
    <image class="btn-img" :src="currentAudioRouteValue === AudioOutputSPEAKERPHONE ? HANDSFREE_ON_SRC : HANDSFREE_OFF_SRC">
    </image>
    <text class="btn-text">
      {{ currentAudioRouteValue === AudioOutputSPEAKERPHONE ? '扬声器已开' : '扬声器已关' }}
    </text>
  </view>
</template>

<script>
  import { AudioOutput, useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';

  var HANDSFREE_OFF_SRC = '/uni_modules/tuikit-atomic-x/static/icon/handsfree-off.png';
  var HANDSFREE_ON_SRC = '/uni_modules/tuikit-atomic-x/static/icon/handsfree-on.png';

  var deviceStateInstance = useDeviceState();

  export default {
    data: function() {
      return {
        HANDSFREE_OFF_SRC: HANDSFREE_OFF_SRC,
        HANDSFREE_ON_SRC: HANDSFREE_ON_SRC,
        AudioOutputSPEAKERPHONE: AudioOutput.SPEAKERPHONE
      };
    },
    computed: {
      currentAudioRouteValue: function() {
        return deviceStateInstance.state.currentAudioRoute;
      }
    },
    methods: {
      handleSwitchAudioPlay: function() {
        if (deviceStateInstance.state.currentAudioRoute === AudioOutput.SPEAKERPHONE) {
          deviceStateInstance.setAudioRoute({
            audioRoute: AudioOutput.EARPIECE
          });
        } else {
          deviceStateInstance.setAudioRoute({
            audioRoute: AudioOutput.SPEAKERPHONE
          });
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
