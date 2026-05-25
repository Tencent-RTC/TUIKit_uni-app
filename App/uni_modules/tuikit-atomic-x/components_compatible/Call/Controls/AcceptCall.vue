<template>
  <view class="btn" @tap="handleAccept">
    <image class="btn-img" :style="[btnStyle]" :src="ACCEPT_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      接听
    </text>
  </view>
</template>

<script>
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  import { checkCallPermissionWithDialog } from '@/uni_modules/tuikit-atomic-x/utils/callPermission';
  import { stopAndResetAudio } from '../../../server_compatible/callService';

  var ACCEPT_SRC = '/uni_modules/tuikit-atomic-x/static/icon/accept.png';

  var callStateInstance = useCallState();
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
        ACCEPT_SRC: ACCEPT_SRC
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
      handleAccept: function() {
        var self = this;
        var activeCall = callStateInstance.state.activeCall;
        var mediaType = activeCall ? activeCall.mediaType : 0;
        checkCallPermissionWithDialog(mediaType).then(function(hasPermission) {
          if (!hasPermission) {
            callStateInstance.reject();
            return;
          }
          stopAndResetAudio();
          deviceStateInstance.openLocalMicrophone({
            fail: function(error) {
              if (error === -1104) {
                setTimeout(function() {
                  deviceStateInstance.openLocalMicrophone();
                }, 200);
              }
            }
          });
          callStateInstance.accept();
        });
      }
    }
  };
</script>

<style scoped>
  .btn {
    width: 60px;
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
