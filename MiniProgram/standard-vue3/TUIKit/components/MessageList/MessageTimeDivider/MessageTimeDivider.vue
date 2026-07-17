<template>
  <div
    v-if="timestampShowFlag"
    class="message-timestamp"
  >
    {{ timestampShowContent }}
  </div>
</template>
<script setup lang="ts">
import { toRefs, ref, watch } from 'vue';
import { calculateTimestamp } from '../../../utils/time';

const props = defineProps({
  currTime: {
    type: Number,
    default: 0,
  },
  prevTime: {
    type: Number,
    default: 0,
  },
});
const { currTime, prevTime } = toRefs(props);
const timestampShowFlag = ref(false);
const timestampShowContent = ref('');

const handleItemTime = (currTime: number, prevTime: number) => {
  timestampShowFlag.value = false;
  
  if (currTime <= 0) return '';
  
  const minDiffToShow = 5 * 60;
  
  // 第一条消息必显示
  if (!prevTime || prevTime <= 0) {
    timestampShowFlag.value = true;
    return calculateTimestamp(currTime);
  }
  
  // 计算时间差(秒)
  const diff = currTime - prevTime;
  
  // 超过5分钟显示
  if (diff >= minDiffToShow) {
    timestampShowFlag.value = true;
    return calculateTimestamp(currTime);
  }
  
  // 跨天必显示(即使间隔<5分钟)
  const currDate = new Date(currTime * 1000);
  const prevDate = new Date(prevTime * 1000);
  if (currDate.getDate() !== prevDate.getDate() || 
      currDate.getMonth() !== prevDate.getMonth() || 
      currDate.getFullYear() !== prevDate.getFullYear()) {
    timestampShowFlag.value = true;
    return calculateTimestamp(currTime);
  }
  
  return '';
};

watch(
  () => [currTime.value, prevTime.value],
  (newVal: any, oldVal: any) => {
    if (newVal?.toString() === oldVal?.toString()) {
      return;
    } else {
      timestampShowContent.value = handleItemTime(
        currTime.value,
        prevTime.value,
      );
    }
  },
  {
    immediate: true,
  },
);
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
