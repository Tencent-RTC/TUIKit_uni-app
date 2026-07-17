<template>
    <div class="panel-box">
        <div class="panel-item" @click="handleClick">
            <image class="panel-icon" :src="PhotoPickerIcon"></image>
        </div>
        <text class="panel-text">图片</text>
    </div>
</template>

<script lang="ts">
// @ts-nocheck
import { useMessageInputState } from '../../../states/MessageInputState';
import PhotoPickerIcon from '../../../assets/chat/photo-picker.svg'
import { MessageContentType } from '../../../constants/chat'
const { sendMessage } = useMessageInputState();

export default {
    emits: ['closePanel'],
    data() {
        return {
            PhotoPickerIcon: PhotoPickerIcon
        }
    },
    methods: {
        handleClick() {
            uni.chooseMedia({
                count: 1,
                mediaType: ['image', 'video'],
                sizeType: ['original', 'compressed'],
                sourceType: ['album'],
                success: (res) => {
                    this.$emit('closePanel');
                    if (res.type === MessageContentType.IMAGE) {
                        sendMessage({
                            type: MessageContentType.IMAGE,
                            content: res
                        });
                    }
                    if (res.type === MessageContentType.VIDEO) {
                        sendMessage({
                            type: MessageContentType.VIDEO,
                            content: res
                        });
                    }
                },
            });
        }
    }
}
</script>

<style lang="scss" scoped>
@import './AttachmentPicker.module.scss';
</style>