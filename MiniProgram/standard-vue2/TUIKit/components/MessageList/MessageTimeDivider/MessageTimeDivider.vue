<template>
  <div
    v-if="timestampShowFlag"
    class="message-timestamp"
  >
    {{ timestampShowContent }}
  </div>
</template>
<script lang="ts">
// @ts-nocheck
import { calculateTimestamp } from '../../../utils/time';

export default {
  props: {
    currTime: {
      type: Number,
      default: 0,
    },
    prevTime: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      timestampShowFlag: false,
      timestampShowContent: ''
    }
  },
  watch: {
    currTime: {
      handler(newVal, oldVal) {
        this.handleTimeChange();
      },
      immediate: true
    },
    prevTime: {
      handler(newVal, oldVal) {
        this.handleTimeChange();
      },
      immediate: true
    }
  },
  methods: {
    handleTimeChange() {
      // 防止重复计算
      const currentValues = [this.currTime, this.prevTime].toString();
      if (currentValues === this.lastValues) {
        return;
      }
      this.lastValues = currentValues;
      
      this.timestampShowContent = this.handleItemTime(this.currTime, this.prevTime);
    },
    handleItemTime(currTime, prevTime) {
      this.timestampShowFlag = false;
      
      if (currTime <= 0) return '';
      
      const minDiffToShow = 5 * 60;
      
      // 第一条消息必显示
      if (!prevTime || prevTime <= 0) {
        this.timestampShowFlag = true;
        return calculateTimestamp(currTime);
      }
      
      // 计算时间差(秒)
      const diff = currTime - prevTime;
      
      // 超过5分钟显示
      if (diff >= minDiffToShow) {
        this.timestampShowFlag = true;
        return calculateTimestamp(currTime);
      }
      
      // 跨天必显示(即使间隔<5分钟)
      const currDate = new Date(currTime * 1000);
      const prevDate = new Date(prevTime * 1000);
      if (currDate.getDate() !== prevDate.getDate() || 
          currDate.getMonth() !== prevDate.getMonth() || 
          currDate.getFullYear() !== prevDate.getFullYear()) {
        this.timestampShowFlag = true;
        return calculateTimestamp(currTime);
      }
      
      return '';
    }
  },
  created() {
    this.lastValues = '';
  }
}
</script>
<style lang="scss" scoped>

.message-timestamp {
  width: 100%;
  margin: 15px 0;
  color: #BBBBBB;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
</style>