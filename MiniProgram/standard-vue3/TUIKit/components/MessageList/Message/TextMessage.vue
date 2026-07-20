<template>
    <view class="bubble" :class="{ 'bubble-me': message?.flow === 'out' }">
        <text class="text" :style="{ wordBreak: shouldBreakWord ? 'break-all' : 'normal' }">
            {{ message.payload.text }}
        </text>
    </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
    message: {
        type: Object,
    },
})

const shouldBreakWord = computed(() => {
    return props.message?.payload?.text?.length > 50
})

</script>

<style lang="scss" scoped>
@import './Message.module.scss';
</style>