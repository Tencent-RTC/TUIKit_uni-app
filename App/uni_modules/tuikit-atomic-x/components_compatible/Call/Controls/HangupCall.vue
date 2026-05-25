<template>
  <view class="btn" @tap="handleHangup">
    <image class="btn-img" :style="[btnStyle]" :src="HANGUP_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      挂断
    </text>
  </view>
</template>

<script>
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  var HANGUP_SRC = '/uni_modules/tuikit-atomic-x/static/icon/hangup.png';

  var callStateInstance = useCallState();

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
        HANGUP_SRC: HANGUP_SRC
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
      handleHangup: function() {
        callStateInstance.hangup();
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
