<template>
  <view class="btn" @tap="handleSwitchCamera">
    <image class="btn-img" :style="[btnStyle]" :src="SWITCH_CAMERA_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      翻转
    </text>
  </view>
</template>

<script>
  import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';

  var SWITCH_CAMERA_SRC = '/uni_modules/tuikit-atomic-x/static/icon/switch-camera.png';

  var deviceStateInstance = useDeviceState();

  export default {
    props: {
      size: {
        type: Number,
        default: 60
      },
      isShowText: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        SWITCH_CAMERA_SRC: SWITCH_CAMERA_SRC
      };
    },
    computed: {
      btnStyle: function() {
        return {
          width: this.size + 'px',
          height: this.size + 'px'
        };
      }
    },
    methods: {
      handleSwitchCamera: function() {
        deviceStateInstance.switchCamera({
          isFront: !deviceStateInstance.state.isFrontCamera
        });
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
