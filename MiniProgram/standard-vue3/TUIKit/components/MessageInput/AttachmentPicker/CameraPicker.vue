<template>
    <div class="panel-box">
        <div class="panel-item" @click="handleClick">
            <image class="panel-icon" :src="CameraPickerIcon"></image>
        </div>
        <text class="panel-text">拍照</text>
    </div>
</template>

<script lang="ts" setup>
import { useMessageInputState } from '../../../index';
import CameraPickerIcon from '../../../assets/chat/camera-picker.svg'
import { MessageContentType } from '../../../constants/chat'

const { sendMessage } = useMessageInputState();
const emit = defineEmits(['closePanel']);

const handleClick = () => {
    uni.chooseMedia({
        count: 1,
        mediaType: ['image', 'video'],
        sizeType: ['original', 'compressed'],
        sourceType: ['camera'],
        camera: 'back',
        success: function (res: any) {
            emit('closePanel');
            if (res.type === MessageContentType.IMAGE) {
                sendMessage({
                    type: MessageContentType.IMAGE,
                    content: res
                })
            }
            if (res.type === MessageContentType.VIDEO) {
                sendMessage({
                    type: MessageContentType.VIDEO,
                    content: res
                })
            }
        },
        fail: function (err: any) {
            console.error('chooseMedia failed:', err);
        }
    });
}
</script>

<style lang="scss" scoped>
@import './AttachmentPicker.module.scss';
</style>