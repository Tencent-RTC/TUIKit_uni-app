<template>
  <view class="call-bottom-button" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
    <!-- 单人音频通话 - 主叫方呼叫中 -->
    <view v-if="scenario === 'single-audio-caller-calling'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'single-audio-connected'" class="button-group-row" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
      <Microphone />
      <HangupCall />
      <HandsFree :default-open="false" />
    </view>

    <!-- 单人音频通话 - 被叫方呼叫中 -->
    <view v-else-if="scenario === 'single-audio-callee-calling'" class="button-group-row" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
      <RejectCall />
      <AcceptCall />
    </view>

    <!-- 单人视频通话 - 主叫方呼叫中 -->
    <view v-else-if="scenario === 'single-video-caller-calling'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'single-video-connected'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'single-video-callee-calling'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'group-audio-caller-calling'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'group-audio-connected'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'group-audio-callee-calling'" class="button-group-row" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
      <RejectCall />
      <AcceptCall />
    </view>

    <!-- 群组视频通话 - 主叫方呼叫中 -->
    <view v-else-if="scenario === 'group-video-caller-calling'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'group-video-connected'" class="button-group" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
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
    <view v-else-if="scenario === 'group-video-callee-calling'" class="button-group-row" :style="{ width: systemInfo?.safeArea?.width + 'px'}">
      <RejectCall />
      <AcceptCall />
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import Microphone from './Call/Controls/Microphone.vue';
  import HandsFree from './Call/Controls/HandsFree.vue';
  import Camera from './Call/Controls/Camera.vue';
  import HangupCall from './Call/Controls/HangupCall.vue';
  import AcceptCall from './Call/Controls/AcceptCall.vue';
  import RejectCall from './Call/Controls/RejectCall.vue';
  import SwitchCamera from './Call/Controls/switchCamera.vue';
  import Blur from './Call/Controls/blur.vue';
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  import { AudioOutput, useDeviceState } from "@/uni_modules/tuikit-atomic-x/state/DeviceState";
  import { playRingtone } from '../server/callService';

  // ========== 状态 & 依赖 ==========
  const { setAudioRoute } = useDeviceState();
  const { activeCall, selfInfo, startVibrate } = useCallState();

  const scenario = ref('');
  const systemInfo = ref({});
  const safeArea = ref();

  // ========== 通话类型常量 ==========
  const MEDIA_TYPE_AUDIO = 0;
  const MEDIA_TYPE_VIDEO = 1;
  const STATUS_CONNECTED = 2;

  // ========== 铃声资源 ==========
  const RINGTONE_DIALING = '/static/phone_dialing.mp3';
  const RINGTONE_RINGING = '/static/phone_ringing.mp3';

  /**
   * 场景类型定义
   * 格式: {scope}-{media}-{role}-{state} 或 {scope}-{media}-{state}
   *
   * scope: single | group
   * media: audio | video
   * role:  caller | callee (仅 calling 阶段)
   * state: calling | connected
   */

  // ========== 辅助函数 ==========

  /** 判断是否为视频通话 */
  function isVideo(call: any): boolean {
    return call?.mediaType === MEDIA_TYPE_VIDEO;
  }

  /** 判断是否为群组通话（多人邀请 或 有群聊 ID） */
  function isGroup(call: any): boolean {
    return call?.inviteeIds?.length > 1 || (call?.chatGroupId != null && call?.chatGroupId !== '');
  }

  /** 判断是否为主叫方 */
  function isCaller(call: any): boolean {
    return call?.inviterId === uni.$userID;
  }

  /** 判断是否为被叫方 */
  function isCallee(call: any): boolean {
    return call?.inviteeIds?.includes(uni.$userID);
  }

  /** 根据通话信息构建场景字符串 */
  function buildScenario(call: any, role: 'caller' | 'callee' | 'connected'): string {
    const scope = isGroup(call) ? 'group' : 'single';
    const media = isVideo(call) ? 'video' : 'audio';
    if (role === 'connected') {
      return `${scope}-${media}-connected`;
    }
    return `${scope}-${media}-${role}-calling`;
  }

  /** 获取音频路由：视频通话用扬声器，音频通话用听筒 */
  function getAudioRoute(call: any): AudioOutput {
    return isVideo(call) ? AudioOutput.SPEAKERPHONE : AudioOutput.EARPIECE;
  }

  /** 设置主叫方场景（铃声 + 音频路由） */
  function setupCallerScenario(call: any) {
    scenario.value = buildScenario(call, 'caller');
    setAudioRoute({ audioRoute: getAudioRoute(call) });
    playRingtone(RINGTONE_DIALING);
  }

  /** 设置被叫方场景（震动 + 铃声 + 音频路由） */
  function setupCalleeScenario(call: any) {
    scenario.value = buildScenario(call, 'callee');
    startVibrate();
    setAudioRoute({ audioRoute: getAudioRoute(call) });
    playRingtone(RINGTONE_RINGING);
  }

  // ========== 核心 Watch ==========

  /**
   * 监听 selfInfo 变化：通话接通时将场景从 calling → connected
   */
  watch(() => selfInfo.value, (newValue) => {
    if (newValue?.status === STATUS_CONNECTED && scenario.value.endsWith('-calling')) {
      // 将 "xxx-caller-calling" 或 "xxx-callee-calling" 替换为 "xxx-connected"
      scenario.value = scenario.value.replace(/-(?:caller|callee)-calling$/, '-connected');
    }
  }, { immediate: true, deep: true });

  /**
   * 监听 activeCall 变化：根据通话信息确定场景
   */
  watch(() => activeCall.value, (newValue, oldValue) => {
    if (!newValue) return;
    // 同一通话不重复处理（callId 相同且非首次赋值）
    if (newValue.callId === oldValue?.callId || (oldValue?.callId === '' && newValue.callId !== '')) return;

    // 已有通话时长 → 中途进入（如从悬浮窗返回），直接设为已接通
    if (newValue.duration > 0) {
      scenario.value = buildScenario(newValue, 'connected');
      return;
    }

    // 新来电/去电 → 根据角色设置场景
    if (isCaller(newValue)) {
      setupCallerScenario(newValue);
    } else if (isCallee(newValue)) {
      setupCalleeScenario(newValue);
    }
  }, { immediate: true, deep: true });

  // ========== 生命周期 ==========

  onMounted(() => {
    uni.getSystemInfo({
      success: (res) => {
        systemInfo.value = res;
        safeArea.value = res.safeArea;
      }
    });
  });
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