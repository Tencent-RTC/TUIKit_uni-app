<template>
    <view class="call-bottom-button" :style="{ width: safeAreaWidth + 'px'}">
      <!-- 单人音频通话 - 主叫方呼叫中 -->
      <view v-if="scenario === 'single-audio-caller-calling'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-bottom">
          <text class="waiting-text">等待对方接收邀请</text>
        </view>
        <view class="button-group-row">
          <Microphone />
          <HangupCall />
          <HandsFree :default-open="false" />
        </view>
      </view>

      <!-- 单人音频通话 - 已接通 -->
      <view v-else-if="scenario === 'single-audio-connected'" class="button-group-row" :style="{ width: safeAreaWidth + 'px'}">
        <Microphone />
        <HangupCall />
        <HandsFree :default-open="false" />
      </view>

      <!-- 单人音频通话 - 被叫方呼叫中 -->
      <view v-else-if="scenario === 'single-audio-callee-calling'" class="button-group-row" :style="{ width: safeAreaWidth + 'px'}">
        <RejectCall />
        <AcceptCall />
      </view>

      <!-- 单人视频通话 - 主叫方呼叫中 -->
      <view v-else-if="scenario === 'single-video-caller-calling'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-bottom">
          <text class="waiting-text">等待对方接收邀请</text>
        </view>
        <view class="button-group-row">
          <SwitchCamera />
          <Blur />
          <Camera />
        </view>
        <view class="button-group-bottom">
          <HangupCall />
        </view>
      </view>

      <!-- 单人视频通话 - 已接通 -->
      <view v-else-if="scenario === 'single-video-connected'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <Microphone />
          <HandsFree />
          <Camera />
        </view>
        <view class="button-group-row">
          <Blur :size="35" :is-show-text="false" />
          <HangupCall :is-show-text="false" />
          <SwitchCamera :size="35" :is-show-text="false" />
        </view>
      </view>

      <!-- 单人视频通话 - 被叫方呼叫中 -->
      <view v-else-if="scenario === 'single-video-callee-calling'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <SwitchCamera />
          <Blur />
          <Camera />
        </view>
        <view class="button-group-row">
          <RejectCall :is-show-text="false" />
          <AcceptCall :is-show-text="false" />
        </view>
      </view>

      <!-- 群组音频通话 - 主叫方呼叫中 -->
      <view v-else-if="scenario === 'group-audio-caller-calling'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <Microphone />
          <HandsFree :default-open="false" />
          <Camera />
        </view>
        <view class="button-group-bottom">
          <HangupCall :is-show-text="false" />
        </view>
      </view>

      <!-- 群组音频通话 - 已接通 -->
      <view v-else-if="scenario === 'group-audio-connected'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <Microphone />
          <HandsFree :default-open="false" />
          <Camera />
        </view>
        <view class="button-group-bottom">
          <HangupCall :is-show-text="false" />
        </view>
      </view>

      <!-- 群组音频通话 - 被叫方呼叫中 -->
      <view v-else-if="scenario === 'group-audio-callee-calling'" class="button-group-row" :style="{ width: safeAreaWidth + 'px'}">
        <RejectCall />
        <AcceptCall />
      </view>

      <!-- 群组视频通话 - 主叫方呼叫中 -->
      <view v-else-if="scenario === 'group-video-caller-calling'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <Microphone />
          <HandsFree />
          <Camera />
        </view>
        <view class="button-group-row">
          <Blur :size="35" :is-show-text="false" />
          <HangupCall :is-show-text="false" />
          <SwitchCamera :size="35" :is-show-text="false" />
        </view>
      </view>

      <!-- 群组视频通话 - 已接通 -->
      <view v-else-if="scenario === 'group-video-connected'" class="button-group" :style="{ width: safeAreaWidth + 'px'}">
        <view class="button-group-row">
          <Microphone />
          <HandsFree />
          <Camera />
        </view>
        <view class="button-group-row">
          <Blur :size="35" :is-show-text="false" />
          <HangupCall :is-show-text="false" />
          <SwitchCamera :size="35" :is-show-text="false" />
        </view>
      </view>

      <!-- 群组视频通话 - 被叫方呼叫中 -->
      <view v-else-if="scenario === 'group-video-callee-calling'" class="button-group-row" :style="{ width: safeAreaWidth + 'px'}">
        <RejectCall />
        <AcceptCall />
      </view>
    </view>
  </template>

  <script>
    import Microphone from './Call/Controls/Microphone.vue';
    import HandsFree from './Call/Controls/HandsFree.vue';
    import Camera from './Call/Controls/Camera.vue';
    import HangupCall from './Call/Controls/HangupCall.vue';
    import AcceptCall from './Call/Controls/AcceptCall.vue';
    import RejectCall from './Call/Controls/RejectCall.vue';
    import SwitchCamera from './Call/Controls/switchCamera.vue';
    import Blur from './Call/Controls/blur.vue';
    import {
      useCallState
    } from '@/uni_modules/tuikit-atomic-x/state/CallState';
    import {
      AudioOutput,
      useDeviceState
    } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
    import {
      playRingtone
    } from '../server/callService';
    import {
      useLoginState
    } from '@/uni_modules/tuikit-atomic-x/state/LoginState';

    var callStateInstance = useCallState();
    var deviceStateInstance = useDeviceState();
    var loginStateInstance = useLoginState();

    // ========== 通话类型常量 ==========
    var MEDIA_TYPE_AUDIO = 0;
    var MEDIA_TYPE_VIDEO = 1;
    var STATUS_CONNECTED = 2;

    // ========== 铃声资源 ==========
    var RINGTONE_DIALING = '/static/phone_dialing.mp3';
    var RINGTONE_RINGING = '/static/phone_ringing.mp3';

    // ========== 辅助函数 ==========

    /** 判断是否为视频通话 */
    function isVideo(call) {
      if (!call) {
        return false;
      }
      return call.mediaType === MEDIA_TYPE_VIDEO;
    }

    /** 判断是否为群组通话 */
    function isGroup(call) {
      if (!call) {
        return false;
      }
      var hasMultipleInvitees = call.inviteeIds && call.inviteeIds.length > 1;
      var hasChatGroupId = call.chatGroupId != null && call.chatGroupId !== '';
      return hasMultipleInvitees || hasChatGroupId;
    }

    /** 判断是否为主叫方 */
    function isCaller(call) {
      if (!call) {
        return false;
      }
      return call.inviterId === uni.$userID;
    }

    /** 判断是否为被叫方 */
    function isCallee(call) {
      if (!call) {
        return false;
      }
      if (!call.inviteeIds) {
        return false;
      }
      return call.inviteeIds.indexOf(uni.$userID) !== -1;
    }

    /** 根据通话信息构建场景字符串 */
    function buildScenario(call, role) {
      var scope = isGroup(call) ? 'group' : 'single';
      var media = isVideo(call) ? 'video' : 'audio';
      if (role === 'connected') {
        return scope + '-' + media + '-connected';
      }
      return scope + '-' + media + '-' + role + '-calling';
    }

    /** 获取音频路由 */
    function getAudioRoute(call) {
      return isVideo(call) ? AudioOutput.SPEAKERPHONE : AudioOutput.EARPIECE;
    }

    export default {
      components: {
        Microphone: Microphone,
        HandsFree: HandsFree,
        Camera: Camera,
        HangupCall: HangupCall,
        AcceptCall: AcceptCall,
        RejectCall: RejectCall,
        SwitchCamera: SwitchCamera,
        Blur: Blur
      },
      data: function() {
        // 设置 userID
        var loginInfo = loginStateInstance.state.loginUserInfo;
        if (loginInfo && loginInfo.userID) {
          uni.$userID = loginInfo.userID;
        }
        return {
          scenario: '',
          systemInfo: {},
        };
      },
      computed: {
        selfInfo: function() {
          return callStateInstance.state.selfInfo;
        },
        activeCall: function() {
          return callStateInstance.state.activeCall;
        },
        safeAreaWidth: function() {
          if (this.systemInfo && this.systemInfo.safeArea && this.systemInfo.safeArea.width) {
            return this.systemInfo.safeArea.width;
          }
          return 375;
        }
      },
      watch: {
        selfInfo: {
          handler: function(newValue) {
            if (!newValue) {
              return;
            }
            if (newValue.status === STATUS_CONNECTED && this.scenario.indexOf('-calling') !== -1) {
              this.scenario = this.scenario.replace(/-(?:caller|callee)-calling$/, '-connected');
            }
          },
          immediate: true,
          deep: true
        },
        activeCall: {
          handler: function(newValue, oldValue) {
            if (!newValue) {
              return;
            }
            // 同一通话不重复处理
            if (newValue.callId === oldValue?.callId || (oldValue?.callId === '' && newValue.callId !== '')) return;

            // 已有通话时长 → 中途进入
            if (newValue.duration > 0) {
              this.scenario = buildScenario(newValue, 'connected');
              return;
            }

            // 新来电/去电 → 根据角色设置场景
            if (isCaller(newValue)) {
              this.setupCallerScenario(newValue);
            } else if (isCallee(newValue)) {
              this.setupCalleeScenario(newValue);
            }
          },
          immediate: true,
          deep: true
        }
      },
      mounted: function() {
        var self = this;
        uni.getSystemInfo({
          success: function(res) {
            self.systemInfo = res;
          }
        });
      },
      methods: {
        setupCallerScenario: function(call) {
          this.scenario = buildScenario(call, 'caller');
          deviceStateInstance.setAudioRoute({
            audioRoute: getAudioRoute(call)
          });
          playRingtone(RINGTONE_DIALING);
        },
        setupCalleeScenario: function(call) {
          this.scenario = buildScenario(call, 'callee');
          callStateInstance.startVibrate();
          deviceStateInstance.setAudioRoute({
            audioRoute: getAudioRoute(call)
          });
          playRingtone(RINGTONE_RINGING);
        }
      }
    };
  </script>

  <style scoped>
    .call-bottom-button {
      min-height: 400rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    /* 单行水平布局 - 用于单人通话和群组音频 */
    .button-group-row {
      flex: 1;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
    }

    /* 底部居中布局 - 用于接听/拒绝场景 */
    .button-group-bottom {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 双行布局容器 - 用于群组视频通话 */
    .button-group {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* 等待文案样式 */
    .waiting-text {
      font-size: 30rpx;
      color: white;
      font-weight: 400;
      margin-bottom: 10rpx;
    }
  </style>