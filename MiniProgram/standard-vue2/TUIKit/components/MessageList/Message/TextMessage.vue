<template>
    <view class="bubble" :class="{ 'bubble-me': message && message.flow === 'out' }">
        <text class="text" :style="{ wordBreak: shouldBreakWord ? 'break-all' : 'normal' }">
            {{ message && message.payload && message.payload.text }}
        </text>
    </view>
</template>

<script lang="ts">
// @ts-nocheck
export default {
    props: {
        message: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        shouldBreakWord() {
            return this.message && this.message.payload && this.message.payload.text && this.message.payload.text.length > 50;
        }
    }
}
</script>

<style lang="scss" scoped>
@import './Message.module.scss';
</style>